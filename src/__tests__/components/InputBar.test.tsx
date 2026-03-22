import React, { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputBar } from '../../components/InputBar/InputBar'

function makeProps(overrides = {}) {
  return {
    text: '',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    onPhoto: jest.fn(),
    photo: null,
    onRemovePhoto: jest.fn(),
    hints: [],
    allHints: [],
    onHintClick: jest.fn(),
    onMoreHints: jest.fn(),
    disabled: false,
    textareaRef: createRef<HTMLTextAreaElement>(),
    onBarcode: jest.fn(),
    ...overrides,
  }
}

describe('InputBar', () => {
  it('рендерит textarea с плейсхолдером', () => {
    render(<InputBar {...makeProps()} />)
    expect(screen.getByPlaceholderText('Что съел? Пиши или фоткай…')).toBeInTheDocument()
  })

  it('отображает текущее значение text в textarea', () => {
    render(<InputBar {...makeProps({ text: 'Овсянка' })} />)
    expect(screen.getByDisplayValue('Овсянка')).toBeInTheDocument()
  })

  it('вызывает onChange при вводе текста', async () => {
    const onChange = jest.fn()
    render(<InputBar {...makeProps({ onChange })} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'а')
    expect(onChange).toHaveBeenCalled()
  })

  it('кнопка отправки disabled если text пустой и нет фото', () => {
    render(<InputBar {...makeProps({ text: '' })} />)
    expect(screen.getByLabelText('Отправить')).toBeDisabled()
  })

  it('кнопка отправки активна если есть текст', () => {
    render(<InputBar {...makeProps({ text: 'Суп' })} />)
    expect(screen.getByLabelText('Отправить')).not.toBeDisabled()
  })

  it('кнопка отправки активна если есть фото (текст пустой)', () => {
    const photo = { base64: 'abc', type: 'image/jpeg', url: 'blob:1' }
    render(<InputBar {...makeProps({ text: '', photo })} />)
    expect(screen.getByLabelText('Отправить')).not.toBeDisabled()
  })

  it('кнопка отправки disabled если disabled=true', () => {
    render(<InputBar {...makeProps({ text: 'Суп', disabled: true })} />)
    expect(screen.getByLabelText('Отправить')).toBeDisabled()
  })

  it('вызывает onSubmit при клике на кнопку отправки', () => {
    const onSubmit = jest.fn()
    render(<InputBar {...makeProps({ text: 'Суп', onSubmit })} />)
    fireEvent.click(screen.getByLabelText('Отправить'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('вызывает onSubmit при нажатии Enter в textarea', async () => {
    const onSubmit = jest.fn()
    render(<InputBar {...makeProps({ text: 'Суп', onSubmit })} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, '{Enter}')
    expect(onSubmit).toHaveBeenCalled()
  })

  it('НЕ вызывает onSubmit при нажатии Shift+Enter', async () => {
    const onSubmit = jest.fn()
    render(<InputBar {...makeProps({ text: 'Суп', onSubmit })} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, '{Shift>}{Enter}{/Shift}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('отображает подсказки как chips', () => {
    render(<InputBar {...makeProps({ hints: ['Гречка', 'Курица', 'Яйцо'] })} />)
    expect(screen.getByText('Гречка')).toBeInTheDocument()
    expect(screen.getByText('Курица')).toBeInTheDocument()
    expect(screen.getByText('Яйцо')).toBeInTheDocument()
  })

  it('вызывает onHintClick при клике на подсказку', () => {
    const onHintClick = jest.fn()
    render(<InputBar {...makeProps({ hints: ['Гречка'], onHintClick })} />)
    fireEvent.click(screen.getByText('Гречка'))
    expect(onHintClick).toHaveBeenCalledWith('Гречка')
  })

  it('отображает кнопку "ещё →" если allHints.length > 9', () => {
    const allHints = new Array(10).fill(0).map((_, i) => `Блюдо ${i}`)
    render(<InputBar {...makeProps({ hints: ['Гречка'], allHints })} />)
    expect(screen.getByText('ещё →')).toBeInTheDocument()
  })

  it('НЕ отображает кнопку "ещё →" если allHints.length <= 9', () => {
    const allHints = ['Гречка', 'Курица']
    render(<InputBar {...makeProps({ hints: allHints, allHints })} />)
    expect(screen.queryByText('ещё →')).not.toBeInTheDocument()
  })

  it('вызывает onMoreHints при клике на "ещё →"', () => {
    const onMoreHints = jest.fn()
    const allHints = new Array(10).fill(0).map((_, i) => `Блюдо ${i}`)
    render(<InputBar {...makeProps({ hints: [], allHints, onMoreHints })} />)
    fireEvent.click(screen.getByText('ещё →'))
    expect(onMoreHints).toHaveBeenCalledTimes(1)
  })

  it('отображает превью фото (img элемент)', () => {
    const photo = { base64: 'abc', type: 'image/jpeg', url: 'blob:fake-url' }
    const { container } = render(<InputBar {...makeProps({ photo })} />)
    const img = container.querySelector('img[src="blob:fake-url"]')
    expect(img).not.toBeNull()
  })

  it('отображает кнопку удаления фото рядом с превью', () => {
    const photo = { base64: 'abc', type: 'image/jpeg', url: 'blob:fake-url' }
    const { container } = render(<InputBar {...makeProps({ photo })} />)
    // Находим все кнопки ✕ (скрытый input не имеет ✕, только кнопка удаления фото)
    const delButtons = Array.from(container.querySelectorAll('button')).filter(
      b => b.textContent === '✕'
    )
    expect(delButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('вызывает onRemovePhoto при клике на кнопку удаления фото', () => {
    const onRemovePhoto = jest.fn()
    const photo = { base64: 'abc', type: 'image/jpeg', url: 'blob:fake-url' }
    const { container } = render(<InputBar {...makeProps({ photo, onRemovePhoto })} />)
    const delBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent === '✕'
    ) as HTMLElement
    fireEvent.click(delBtn)
    expect(onRemovePhoto).toHaveBeenCalledTimes(1)
  })

  it('вызывает onBarcode при клике на кнопку штрих-кода', () => {
    const onBarcode = jest.fn()
    render(<InputBar {...makeProps({ onBarcode })} />)
    fireEvent.click(screen.getByLabelText('Сканировать штрих-код'))
    expect(onBarcode).toHaveBeenCalledTimes(1)
  })

  it('кнопка штрих-кода disabled если disabled=true', () => {
    render(<InputBar {...makeProps({ disabled: true })} />)
    expect(screen.getByLabelText('Сканировать штрих-код')).toBeDisabled()
  })
})
