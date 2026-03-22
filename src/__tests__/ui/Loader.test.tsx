import React from 'react'
import { render } from '@testing-library/react'
import { Loader } from '../../ui/Loader/Loader'

describe('Loader', () => {
  it('рендерит обёртку с 3 дочерними точками', () => {
    const { container } = render(<Loader />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children).toHaveLength(3)
  })

  it('у точек стоит анимационная задержка', () => {
    const { container } = render(<Loader />)
    const wrapper = container.firstChild as HTMLElement
    const dots = Array.from(wrapper.children) as HTMLElement[]
    expect(dots[0].style.animationDelay).toBe('0s')
    expect(dots[1].style.animationDelay).toBe('0.2s')
    expect(dots[2].style.animationDelay).toBe('0.4s')
  })

  it('рендерит без ошибок', () => {
    expect(() => render(<Loader />)).not.toThrow()
  })
})
