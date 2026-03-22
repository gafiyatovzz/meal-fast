import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from '../../components/SettingsModal/SettingsModal'
import type { ApiKeysState, ApiKeysSet } from '../../components/SettingsModal/SettingsModal'

const goals = { cal: 2000, p: 150, f: 70, c: 200 }
const anthro = { weight: '75', height: '180', age: '30', gender: 'м' as const }
const keysSet: ApiKeysSet = { anthropic: false, openai: false, gemini: false }
const tmpKeys: ApiKeysState = { anthropic: '', openai: '', gemini: '', provider: 'anthropic' }

function makeProps(overrides = {}) {
  return {
    open: true,
    onClose: jest.fn(),
    goals,
    onGoalsChange: jest.fn(),
    anthro,
    onAnthroChange: jest.fn(),
    keysSet,
    tmpKeys,
    onKeysChange: jest.fn(),
    onSave: jest.fn(),
    ...overrides,
  }
}

describe('SettingsModal', () => {
  it('не рендерит ничего если open=false', () => {
    render(<SettingsModal {...makeProps({ open: false })} />)
    expect(screen.queryByText('Настройки')).not.toBeInTheDocument()
  })

  it('отображает заголовок "Настройки"', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('Настройки')).toBeInTheDocument()
  })

  it('отображает секцию целей питания', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('Цели питания')).toBeInTheDocument()
  })

  it('отображает поля калорий, белков, жиров, углеводов', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByLabelText('Калории в день')).toBeInTheDocument()
    expect(screen.getByLabelText('Белки (г)')).toBeInTheDocument()
    expect(screen.getByLabelText('Жиры (г)')).toBeInTheDocument()
    expect(screen.getByLabelText('Углеводы (г)')).toBeInTheDocument()
  })

  it('поле калорий содержит текущее значение', () => {
    render(<SettingsModal {...makeProps()} />)
    const calInput = screen.getByLabelText('Калории в день')
    expect(calInput).toHaveValue(2000)
  })

  it('вызывает onGoalsChange при изменении калорий', () => {
    const onGoalsChange = jest.fn()
    render(<SettingsModal {...makeProps({ onGoalsChange })} />)
    fireEvent.change(screen.getByLabelText('Калории в день'), { target: { value: '2200' } })
    expect(onGoalsChange).toHaveBeenCalledWith({ ...goals, cal: 2200 })
  })

  it('отображает секцию антропометрии', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('Антропометрия')).toBeInTheDocument()
  })

  it('отображает поля веса, роста, возраста', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByLabelText('Вес (кг)')).toBeInTheDocument()
    expect(screen.getByLabelText('Рост (см)')).toBeInTheDocument()
    expect(screen.getByLabelText('Возраст')).toBeInTheDocument()
  })

  it('поле веса содержит текущее значение', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByLabelText('Вес (кг)')).toHaveValue(75)
  })

  it('отображает переключатель пола (♂ муж / ♀ жен)', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('♂ муж')).toBeInTheDocument()
    expect(screen.getByText('♀ жен')).toBeInTheDocument()
  })

  it('вызывает onAnthroChange при смене пола', () => {
    const onAnthroChange = jest.fn()
    render(<SettingsModal {...makeProps({ onAnthroChange })} />)
    fireEvent.click(screen.getByText('♀ жен'))
    expect(onAnthroChange).toHaveBeenCalledWith({ ...anthro, gender: 'ж' })
  })

  it('отображает секцию AI провайдера', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('AI провайдер')).toBeInTheDocument()
  })

  it('отображает табы провайдеров', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByText('Claude (Anthropic)')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Google Gemini')).toBeInTheDocument()
  })

  it('переключает провайдера при клике на таб', () => {
    const onKeysChange = jest.fn()
    render(<SettingsModal {...makeProps({ onKeysChange })} />)
    fireEvent.click(screen.getByText('OpenAI'))
    expect(onKeysChange).toHaveBeenCalledWith({ ...tmpKeys, provider: 'openai' })
  })

  it('отображает кнопки Отмена и Сохранить', () => {
    render(<SettingsModal {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
  })

  it('вызывает onClose при клике Отмена', () => {
    const onClose = jest.fn()
    render(<SettingsModal {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('вызывает onSave при клике Сохранить', () => {
    const onSave = jest.fn()
    render(<SettingsModal {...makeProps({ onSave })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('показывает кнопку удаления ключа если ключ установлен', () => {
    const keys: ApiKeysSet = { anthropic: true, openai: false, gemini: false }
    render(<SettingsModal {...makeProps({ keysSet: keys })} />)
    expect(screen.getByText('✕ удалить ключ')).toBeInTheDocument()
  })

  it('показывает кнопку "отменить удаление" если ключ помечен на удаление (null)', () => {
    const tmp: ApiKeysState = { anthropic: null, openai: '', gemini: '', provider: 'anthropic' }
    render(<SettingsModal {...makeProps({ tmpKeys: tmp })} />)
    expect(screen.getByText('↩ отменить удаление')).toBeInTheDocument()
  })

  it('поле API ключа disabled если ключ помечен на удаление', () => {
    const tmp: ApiKeysState = { anthropic: null, openai: '', gemini: '', provider: 'anthropic' }
    render(<SettingsModal {...makeProps({ tmpKeys: tmp })} />)
    expect(screen.getByLabelText('API ключ')).toBeDisabled()
  })
})
