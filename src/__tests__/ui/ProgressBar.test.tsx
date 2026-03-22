import React from 'react'
import { render } from '@testing-library/react'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'

function getFill(container: HTMLElement) {
  return container.querySelectorAll('div')[1] as HTMLElement
}

describe('ProgressBar', () => {
  it('рендерит без ошибок', () => {
    const { container } = render(<ProgressBar pct={50} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('устанавливает ширину fill в соответствии с pct', () => {
    const { container } = render(<ProgressBar pct={75} />)
    const fill = getFill(container)
    expect(fill.style.width).toBe('75%')
  })

  it('ограничивает ширину максимум 100%', () => {
    const { container } = render(<ProgressBar pct={150} />)
    expect(getFill(container).style.width).toBe('100%')
  })

  it('ограничивает ширину минимум 0%', () => {
    const { container } = render(<ProgressBar pct={-10} />)
    expect(getFill(container).style.width).toBe('0%')
  })

  it('устанавливает gradient если передан', () => {
    const gradient = 'linear-gradient(90deg,#c8f562,#a8e040)'
    const { container } = render(<ProgressBar pct={50} gradient={gradient} />)
    expect(getFill(container).style.background).toBe(gradient)
  })

  it('gradient имеет приоритет над color', () => {
    const gradient = 'linear-gradient(90deg,#c8f562,#a8e040)'
    const { container } = render(<ProgressBar pct={50} color="#ff0000" gradient={gradient} />)
    expect(getFill(container).style.background).toBe(gradient)
  })

  it('устанавливает color если gradient не передан', () => {
    const { container } = render(<ProgressBar pct={50} color="#ff0000" />)
    // jsdom конвертирует #ff0000 в rgb(255, 0, 0)
    expect(getFill(container).style.background).toBe('rgb(255, 0, 0)')
  })

  it('использует дефолтный цвет если ни color ни gradient не переданы', () => {
    const { container } = render(<ProgressBar pct={50} />)
    // jsdom конвертирует #c8f562 в rgb(200, 245, 98)
    expect(getFill(container).style.background).toBe('rgb(200, 245, 98)')
  })

  it('устанавливает высоту track', () => {
    const { container } = render(<ProgressBar pct={50} height={10} />)
    const track = container.firstChild as HTMLElement
    expect(track.style.height).toBe('10px')
  })

  it('использует дефолтную высоту 6px', () => {
    const { container } = render(<ProgressBar pct={50} />)
    const track = container.firstChild as HTMLElement
    expect(track.style.height).toBe('6px')
  })
})
