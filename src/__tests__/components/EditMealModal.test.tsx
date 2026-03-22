import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditMealModal } from '../../components/EditMealModal/EditMealModal'
import type { Meal } from '../../types'

const mockFetch = jest.fn()
global.fetch = mockFetch

const meal: Meal = {
  id: 'meal-1',
  name: 'Гречка',
  cal: 350,
  p: 12,
  f: 8,
  c: 65,
  meal_date: '2025-01-15',
  created_at: '2025-01-15T12:00:00Z',
  user_id: 'user-1',
}

function makeProps(overrides = {}) {
  return {
    meal,
    token: 'test-token',
    onClose: jest.fn(),
    onSaved: jest.fn(),
    ...overrides,
  }
}

describe('EditMealModal', () => {
  beforeEach(() => mockFetch.mockReset())

  it('не рендерит ничего если meal=null', () => {
    render(<EditMealModal meal={null} token="tok" onClose={() => {}} onSaved={() => {}} />)
    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument()
  })

  it('отображает заголовок "Редактировать"', () => {
    render(<EditMealModal {...makeProps()} />)
    expect(screen.getByText('Редактировать')).toBeInTheDocument()
  })

  it('предзаполняет поле названия из meal.name', () => {
    render(<EditMealModal {...makeProps()} />)
    expect(screen.getByDisplayValue('Гречка')).toBeInTheDocument()
  })

  it('отображает текущие КБЖУ из meal', () => {
    render(<EditMealModal {...makeProps()} />)
    expect(screen.getByText(/350 ккал/)).toBeInTheDocument()
    expect(screen.getByText(/Б 12г/)).toBeInTheDocument()
    expect(screen.getByText(/Ж 8г/)).toBeInTheDocument()
    expect(screen.getByText(/У 65г/)).toBeInTheDocument()
  })

  it('отображает поле количества/веса', () => {
    render(<EditMealModal {...makeProps()} />)
    expect(screen.getByPlaceholderText('300г, 2 порции, 500мл…')).toBeInTheDocument()
  })

  it('кнопка Сохранить disabled если название пустое', () => {
    render(<EditMealModal {...makeProps()} />)
    fireEvent.change(screen.getByDisplayValue('Гречка'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('кнопка Сохранить активна если есть название', () => {
    render(<EditMealModal {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Сохранить' })).not.toBeDisabled()
  })

  it('вызывает onClose при клике Отмена', () => {
    const onClose = jest.fn()
    render(<EditMealModal {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('выполняет пересчёт и сохранение при клике Сохранить', async () => {
    const recalcResult = { name: 'Гречка варёная', cal: 320, p: 11, f: 7, c: 60 }
    const updatedMeal = { ...meal, ...recalcResult }

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => recalcResult })  // /api/claude
      .mockResolvedValueOnce({ ok: true, json: async () => updatedMeal })   // /api/meals PATCH

    const onSaved = jest.fn()
    const onClose = jest.fn()
    render(<EditMealModal {...makeProps({ onSaved, onClose })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    // Кнопка переходит в состояние загрузки
    await waitFor(() => expect(screen.getByText('Пересчитываю…')).toBeInTheDocument())

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(updatedMeal)
      expect(onClose).toHaveBeenCalledTimes(1)
    }, { timeout: 5000 })
  })

  it('отображает ошибку если /api/claude вернул ошибку', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'Не могу распознать' }) })

    render(<EditMealModal {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(screen.getByText('Не могу распознать')).toBeInTheDocument())
  })

  it('отображает ошибку если fetch упал', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<EditMealModal {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
  })

  it('включает количество в запрос к claude если указано', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Гречка', cal: 200, p: 8, f: 4, c: 40 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...meal }) })

    render(<EditMealModal {...makeProps()} />)
    fireEvent.change(screen.getByPlaceholderText('300г, 2 порции, 500мл…'), { target: { value: '200г' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    const claudeCall = mockFetch.mock.calls[0]
    const body = JSON.parse(claudeCall[1].body)
    expect(body.text).toContain('200г')
    expect(body.text).toContain('Гречка')
  })
})
