import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert } from '../../ui/Alert/Alert'

describe('Alert', () => {
  it('отображает сообщение', () => {
    render(<Alert message="Произошла ошибка" />)
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
  })

  it('не рендерит кнопку dismiss если onDismiss не передан', () => {
    render(<Alert message="Ошибка" />)
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('рендерит кнопку dismiss если onDismiss передан', () => {
    render(<Alert message="Ошибка" onDismiss={() => {}} />)
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('вызывает onDismiss при клике на ✕', () => {
    const onDismiss = jest.fn()
    render(<Alert message="Ошибка" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('рендерит длинное сообщение', () => {
    const msg = 'Очень длинное сообщение '.repeat(10).trim()
    render(<Alert message={msg} />)
    expect(screen.getByText(msg)).toBeInTheDocument()
  })
})
