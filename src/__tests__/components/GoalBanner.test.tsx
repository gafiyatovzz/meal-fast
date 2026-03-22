import React from 'react'
import { render, screen } from '@testing-library/react'
import { GoalBanner } from '../../components/GoalBanner/GoalBanner'

const goals = { cal: 2000, p: 150, f: 70, c: 200 }

describe('GoalBanner', () => {
  it('отображает калории', () => {
    render(<GoalBanner goals={goals} />)
    expect(screen.getByText('2000 ккал')).toBeInTheDocument()
  })

  it('отображает белки', () => {
    render(<GoalBanner goals={goals} />)
    expect(screen.getByText('150г')).toBeInTheDocument()
  })

  it('отображает жиры', () => {
    render(<GoalBanner goals={goals} />)
    expect(screen.getByText('70г')).toBeInTheDocument()
  })

  it('отображает углеводы', () => {
    render(<GoalBanner goals={goals} />)
    expect(screen.getByText('200г')).toBeInTheDocument()
  })

  it('рендерит разделители ·', () => {
    const { container } = render(<GoalBanner goals={goals} />)
    expect(container.textContent).toContain('·')
  })

  it('отображает нулевые цели без ошибок', () => {
    expect(() =>
      render(<GoalBanner goals={{ cal: 0, p: 0, f: 0, c: 0 }} />)
    ).not.toThrow()
  })
})
