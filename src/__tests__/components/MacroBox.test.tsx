import React from 'react'
import { render, screen } from '@testing-library/react'
import { MacroBox } from '../../components/MacroBox/MacroBox'

describe('MacroBox', () => {
  it('отображает label', () => {
    render(<MacroBox label="Белки" value={80} goal={150} color="#7eb8f7" />)
    expect(screen.getByText('Белки')).toBeInTheDocument()
  })

  it('отображает значение (округлённое)', () => {
    render(<MacroBox label="Белки" value={80.6} goal={150} color="#7eb8f7" />)
    expect(screen.getByText('81')).toBeInTheDocument()
  })

  it('отображает цель в формате "из Xг"', () => {
    render(<MacroBox label="Жиры" value={40} goal={80} color="#f7c97e" />)
    expect(screen.getByText('из 80г')).toBeInTheDocument()
  })

  it('отображает 0 при нулевом значении', () => {
    render(<MacroBox label="Б" value={0} goal={100} color="red" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('прогресс-бар с нулевой целью не падает', () => {
    expect(() =>
      render(<MacroBox label="Б" value={10} goal={0} color="red" />)
    ).not.toThrow()
  })

  it('рендерит все 4 области', () => {
    const { container } = render(<MacroBox label="Углеводы" value={120} goal={200} color="#b07ef7" />)
    // Значение, цель, label, прогресс-бар
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('из 200г')).toBeInTheDocument()
    expect(screen.getByText('Углеводы')).toBeInTheDocument()
    expect(container.querySelector('[style]')).toBeInTheDocument()
  })
})
