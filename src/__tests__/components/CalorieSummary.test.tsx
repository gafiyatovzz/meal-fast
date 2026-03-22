import React from 'react'
import { render, screen } from '@testing-library/react'
import { CalorieSummary } from '../../components/CalorieSummary/CalorieSummary'

const goals = { cal: 2000, p: 150, f: 70, c: 200 }

describe('CalorieSummary', () => {
  it('отображает текущие калории (округлённые)', () => {
    render(<CalorieSummary totals={{ cal: 1234.7, p: 80, f: 40, c: 100 }} goals={goals} />)
    expect(screen.getByText('1235')).toBeInTheDocument()
  })

  it('отображает цель калорий', () => {
    render(<CalorieSummary totals={{ cal: 500, p: 30, f: 20, c: 50 }} goals={goals} />)
    expect(screen.getByText('2000')).toBeInTheDocument()
  })

  it('отображает слово "ккал"', () => {
    render(<CalorieSummary totals={{ cal: 500, p: 30, f: 20, c: 50 }} goals={goals} />)
    expect(screen.getByText(/ккал/)).toBeInTheDocument()
  })

  it('отображает все три макро: Белки, Жиры, Углеводы', () => {
    render(<CalorieSummary totals={{ cal: 500, p: 80, f: 40, c: 100 }} goals={goals} />)
    expect(screen.getByText('Белки')).toBeInTheDocument()
    expect(screen.getByText('Жиры')).toBeInTheDocument()
    expect(screen.getByText('Углеводы')).toBeInTheDocument()
  })

  it('отображает значения каждого макро', () => {
    render(<CalorieSummary totals={{ cal: 500, p: 80, f: 40, c: 120 }} goals={goals} />)
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('рендерит нулевые значения без ошибок', () => {
    expect(() =>
      render(<CalorieSummary totals={{ cal: 0, p: 0, f: 0, c: 0 }} goals={goals} />)
    ).not.toThrow()
  })

  it('отображает текст "из" для каждого макро', () => {
    render(<CalorieSummary totals={{ cal: 500, p: 80, f: 40, c: 120 }} goals={goals} />)
    const texts = screen.getAllByText(/из/)
    expect(texts.length).toBeGreaterThanOrEqual(3)
  })
})
