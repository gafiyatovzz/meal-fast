import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../../ui/Modal/Modal'

describe('Modal', () => {
  it('не рендерит ничего если open=false', () => {
    render(<Modal open={false} onClose={() => {}} title="Test"><p>Content</p></Modal>)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('рендерит заголовок и children если open=true', () => {
    render(<Modal open={true} onClose={() => {}} title="Мой Modal"><p>Содержимое</p></Modal>)
    expect(screen.getByText('Мой Modal')).toBeInTheDocument()
    expect(screen.getByText('Содержимое')).toBeInTheDocument()
  })

  it('вызывает onClose при клике по оверлею', () => {
    const onClose = jest.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose} title="T"><p>C</p></Modal>
    )
    // Кликаем по оверлею (первый div)
    fireEvent.click(container.firstChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('НЕ вызывает onClose при клике внутри модала', () => {
    const onClose = jest.fn()
    render(<Modal open={true} onClose={onClose} title="T"><p>Content</p></Modal>)
    fireEvent.click(screen.getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('рендерит сложные children', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Settings">
        <input placeholder="Имя" />
        <button>Сохранить</button>
      </Modal>
    )
    expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
  })
})
