import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from '../../ui/Chip/Chip'

describe('Chip', () => {
  it('отображает label', () => {
    render(<Chip label="Гречка" onClick={() => {}} />)
    expect(screen.getByText('Гречка')).toBeInTheDocument()
  })

  it('вызывает onClick при клике', () => {
    const onClick = jest.fn()
    render(<Chip label="Яйцо" onClick={onClick} />)
    fireEvent.click(screen.getByText('Яйцо'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('рендерит без highlight без ошибок', () => {
    expect(() => render(<Chip label="T" onClick={() => {}} />)).not.toThrow()
  })

  it('рендерит с highlight без ошибок', () => {
    expect(() => render(<Chip label="T" onClick={() => {}} highlight />)).not.toThrow()
  })

  it('не вызывает onClick если не кликнули', () => {
    const onClick = jest.fn()
    render(<Chip label="Курица" onClick={onClick} />)
    expect(onClick).not.toHaveBeenCalled()
  })
})
