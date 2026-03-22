import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../ui/Button/Button'

describe('Button', () => {
  it('рендерит children', () => {
    render(<Button>Нажми меня</Button>)
    expect(screen.getByRole('button', { name: 'Нажми меня' })).toBeInTheDocument()
  })

  it('вызывает onClick при клике', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('не вызывает onClick если disabled', () => {
    const onClick = jest.fn()
    render(<Button disabled onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('button имеет атрибут disabled если disabled=true', () => {
    render(<Button disabled>Text</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button не имеет атрибут disabled по умолчанию', () => {
    render(<Button>Text</Button>)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('пробрасывает type=submit', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('пробрасывает aria-label', () => {
    render(<Button aria-label="отправить">Send</Button>)
    expect(screen.getByRole('button', { name: 'отправить' })).toBeInTheDocument()
  })

  it('рендерит все варианты без ошибок', () => {
    const variants = ['primary', 'secondary', 'ghost', 'icon'] as const
    variants.forEach(variant => {
      expect(() => render(<Button variant={variant}>T</Button>)).not.toThrow()
    })
  })

  it('рендерит с active=true без ошибок', () => {
    expect(() => render(<Button active>T</Button>)).not.toThrow()
  })

  it('рендерит SVG children', () => {
    render(<Button variant="icon" aria-label="иконка"><svg><circle /></svg></Button>)
    expect(screen.getByLabelText('иконка')).toBeInTheDocument()
  })
})
