import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryModal } from '../../components/HistoryModal/HistoryModal'

const hints = ['Гречка', 'Куриная грудка', 'Яйцо варёное', 'Овсянка']

describe('HistoryModal', () => {
  it('не рендерит ничего если open=false', () => {
    render(<HistoryModal open={false} onClose={() => {}} hints={hints} onSelect={() => {}} />)
    expect(screen.queryByText('История блюд')).not.toBeInTheDocument()
  })

  it('отображает заголовок "История блюд"', () => {
    render(<HistoryModal open={true} onClose={() => {}} hints={hints} onSelect={() => {}} />)
    expect(screen.getByText('История блюд')).toBeInTheDocument()
  })

  it('отображает все блюда из hints', () => {
    render(<HistoryModal open={true} onClose={() => {}} hints={hints} onSelect={() => {}} />)
    hints.forEach(name => expect(screen.getByText(name)).toBeInTheDocument())
  })

  it('вызывает onSelect и onClose при клике на блюдо', () => {
    const onSelect = jest.fn()
    const onClose = jest.fn()
    render(<HistoryModal open={true} onClose={onClose} hints={hints} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Гречка'))
    expect(onSelect).toHaveBeenCalledWith('Гречка')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('вызывает onClose при клике на кнопку "Закрыть"', () => {
    const onClose = jest.fn()
    render(<HistoryModal open={true} onClose={onClose} hints={hints} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('рендерит пустой список без ошибок', () => {
    expect(() =>
      render(<HistoryModal open={true} onClose={() => {}} hints={[]} onSelect={() => {}} />)
    ).not.toThrow()
  })

  it('не вызывает onSelect без клика', () => {
    const onSelect = jest.fn()
    render(<HistoryModal open={true} onClose={() => {}} hints={hints} onSelect={onSelect} />)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
