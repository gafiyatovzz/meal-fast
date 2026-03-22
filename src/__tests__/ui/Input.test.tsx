import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../../ui/Input/Input'

describe('Input', () => {
  it('рендерит input элемент', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('отображает label', () => {
    render(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('не рендерит label если не передан', () => {
    render(<Input placeholder="Введите текст" />)
    expect(screen.queryByRole('label')).not.toBeInTheDocument()
  })

  it('вызывает onChange при вводе', () => {
    const onChange = jest.fn()
    render(<Input onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('отображает placeholder', () => {
    render(<Input placeholder="Введите данные" />)
    expect(screen.getByPlaceholderText('Введите данные')).toBeInTheDocument()
  })

  it('пробрасывает type=password', () => {
    render(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')
  })

  it('пробрасывает value', () => {
    render(<Input value="hello" onChange={() => {}} />)
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
  })

  it('пробрасывает disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
