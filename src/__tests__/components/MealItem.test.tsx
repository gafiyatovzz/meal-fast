import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MealItem } from '../../components/MealItem/MealItem'
import type { Meal } from '../../types'

const baseMeal: Meal = {
  id: 'meal-1',
  name: 'Гречка с курицей',
  cal: 450,
  p: 35,
  f: 12,
  c: 55,
  meal_date: '2025-01-15',
  created_at: '2025-01-15T12:00:00Z',
  user_id: 'user-1',
}

describe('MealItem', () => {
  it('отображает название блюда', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText('Гречка с курицей')).toBeInTheDocument()
  })

  it('отображает калории числом', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('отображает единицу "ккал"', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText(/ккал/)).toBeInTheDocument()
  })

  it('отображает белки', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText(/Б.*35.*г|Б 35г/)).toBeInTheDocument()
  })

  it('отображает жиры', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText(/Ж.*12.*г|Ж 12г/)).toBeInTheDocument()
  })

  it('отображает углеводы', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.getByText(/У.*55.*г|У 55г/)).toBeInTheDocument()
  })

  it('округляет дробные калории', () => {
    const meal = { ...baseMeal, cal: 449.6 }
    render(<MealItem meal={meal} onRemove={() => {}} />)
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('вызывает onRemove с id при клике на кнопку удаления', () => {
    const onRemove = jest.fn()
    render(<MealItem meal={baseMeal} onRemove={onRemove} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onRemove).toHaveBeenCalledWith('meal-1')
  })

  it('отображает кнопку редактирования если onEdit передан', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} onEdit={() => {}} />)
    expect(screen.getByTitle('Редактировать')).toBeInTheDocument()
  })

  it('не отображает кнопку редактирования если onEdit не передан', () => {
    render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(screen.queryByTitle('Редактировать')).not.toBeInTheDocument()
  })

  it('вызывает onEdit при клике на кнопку редактирования', () => {
    const onEdit = jest.fn()
    render(<MealItem meal={baseMeal} onRemove={() => {}} onEdit={onEdit} />)
    fireEvent.click(screen.getByTitle('Редактировать'))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('не рендерит изображение если thumb не передан', () => {
    const { container } = render(<MealItem meal={baseMeal} onRemove={() => {}} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('рендерит изображение если thumb передан', () => {
    const meal = { ...baseMeal, thumb: 'http://example.com/photo.jpg' }
    const { container } = render(<MealItem meal={meal} onRemove={() => {}} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('http://example.com/photo.jpg')
  })

  it('открывает lightbox при клике на изображение (появляется второй img)', () => {
    const meal = { ...baseMeal, thumb: 'http://example.com/photo.jpg' }
    const { container } = render(<MealItem meal={meal} onRemove={() => {}} />)
    const img = container.querySelector('img')!
    fireEvent.click(img)
    const allImages = container.querySelectorAll('img')
    expect(allImages.length).toBe(2)
  })

  it('закрывает lightbox при клике по нему', () => {
    const meal = { ...baseMeal, thumb: 'http://example.com/photo.jpg' }
    const { container } = render(<MealItem meal={meal} onRemove={() => {}} />)
    // Открываем lightbox
    fireEvent.click(container.querySelector('img')!)
    expect(container.querySelectorAll('img')).toHaveLength(2)

    // Закрываем — находим последний div (lightbox overlay) и кликаем
    // Lightbox — последний child основного контейнера item
    const itemDiv = container.querySelector('div')!
    const allDivs = itemDiv.querySelectorAll('div')
    const lightboxDiv = allDivs[allDivs.length - 1]
    fireEvent.click(lightboxDiv)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })
})
