import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateNav } from '../../components/DateNav/DateNav'

import { today, addDays } from '../../lib/date'

const TODAY = today()
const YESTERDAY = addDays(TODAY, -1)

describe('DateNav', () => {
  it('отображает кнопки навигации ← и →', () => {
    render(<DateNav date={TODAY} onChange={() => {}} />)
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  it('кнопка → отключена если выбрана сегодняшняя дата', () => {
    render(<DateNav date={TODAY} onChange={() => {}} />)
    const nextBtn = screen.getByText('→').closest('button')!
    expect(nextBtn).toBeDisabled()
  })

  it('кнопка → активна если выбрана прошлая дата', () => {
    render(<DateNav date={YESTERDAY} onChange={() => {}} />)
    const nextBtn = screen.getByText('→').closest('button')!
    expect(nextBtn).not.toBeDisabled()
  })

  it('кнопка "сегодня" не отображается если выбрана сегодняшняя дата', () => {
    render(<DateNav date={TODAY} onChange={() => {}} />)
    expect(screen.queryByText('сегодня')).not.toBeInTheDocument()
  })

  it('кнопка "сегодня" отображается если выбрана прошлая дата', () => {
    render(<DateNav date={YESTERDAY} onChange={() => {}} />)
    expect(screen.getByText('сегодня')).toBeInTheDocument()
  })

  it('вызывает onChange с датой -1 день при нажатии ←', () => {
    const onChange = jest.fn()
    render(<DateNav date={TODAY} onChange={onChange} />)
    fireEvent.click(screen.getByText('←'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(YESTERDAY)
  })

  it('вызывает onChange с датой +1 день при нажатии →', () => {
    const onChange = jest.fn()
    render(<DateNav date={YESTERDAY} onChange={onChange} />)
    fireEvent.click(screen.getByText('→'))
    expect(onChange).toHaveBeenCalledWith(TODAY)
  })

  it('вызывает onChange с сегодняшней датой при клике "сегодня"', () => {
    const onChange = jest.fn()
    render(<DateNav date={YESTERDAY} onChange={onChange} />)
    fireEvent.click(screen.getByText('сегодня'))
    expect(onChange).toHaveBeenCalledWith(TODAY)
  })

  it('отображает дату в читаемом формате на русском', () => {
    render(<DateNav date="2025-01-15" onChange={() => {}} />)
    // Должен содержать название дня недели и/или месяц на русском
    const label = screen.getByText(/января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/i)
    expect(label).toBeInTheDocument()
  })
})
