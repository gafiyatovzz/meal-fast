import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StatsModal } from '../../components/StatsModal/StatsModal'

const mockFetch = jest.fn()
global.fetch = mockFetch

const goals = { cal: 2000, p: 150, f: 70, c: 200 }

const statsData = [
  { date: '2025-01-09', cal: 1800, p: 130, f: 60, c: 180 },
  { date: '2025-01-10', cal: 2100, p: 160, f: 75, c: 210 },
  { date: '2025-01-11', cal: 0,    p: 0,   f: 0,  c: 0 },
  { date: '2025-01-12', cal: 1950, p: 145, f: 68, c: 195 },
  { date: '2025-01-13', cal: 2200, p: 170, f: 80, c: 220 },
  { date: '2025-01-14', cal: 1700, p: 120, f: 55, c: 175 },
  { date: '2025-01-15', cal: 2000, p: 150, f: 70, c: 200 },
]

function makeProps(overrides = {}) {
  return {
    open: true,
    onClose: jest.fn(),
    token: 'test-token',
    goals,
    ...overrides,
  }
}

describe('StatsModal', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ json: async () => statsData })
  })

  it('не рендерит ничего если open=false', () => {
    render(<StatsModal {...makeProps({ open: false })} />)
    expect(screen.queryByText('Динамика')).not.toBeInTheDocument()
  })

  it('отображает заголовок "Динамика"', () => {
    render(<StatsModal {...makeProps()} />)
    expect(screen.getByText('Динамика')).toBeInTheDocument()
  })

  it('загружает статистику при открытии', async () => {
    render(<StatsModal {...makeProps()} />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch.mock.calls[0][0]).toContain('/api/stats')
  })

  it('отображает кнопки периодов 7/14/30 дн', () => {
    render(<StatsModal {...makeProps()} />)
    expect(screen.getByRole('button', { name: '7 дн' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14 дн' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 дн' })).toBeInTheDocument()
  })

  it('переключает период при клике на кнопку', async () => {
    render(<StatsModal {...makeProps()} />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: '14 дн' }))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(mockFetch.mock.calls[1][0]).toContain('days=14')
  })

  it('отображает средние значения при наличии данных', async () => {
    render(<StatsModal {...makeProps()} />)
    await waitFor(() => expect(screen.getByText(/ккал/)).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText(/ср. за день/)).toBeInTheDocument()
  })

  it('отображает "нет данных" если все дни нулевые', async () => {
    const emptyData = Array(7).fill({ date: '2025-01-01', cal: 0, p: 0, f: 0, c: 0 })
    mockFetch.mockResolvedValue({ json: async () => emptyData })
    render(<StatsModal {...makeProps()} />)
    await waitFor(() => expect(screen.getByText('нет данных за период')).toBeInTheDocument())
  })

  it('показывает "загружаю…" пока идёт запрос', () => {
    // Никогда не резолвим промис
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<StatsModal {...makeProps()} />)
    expect(screen.getByText('загружаю…')).toBeInTheDocument()
  })

  it('передаёт Authorization header при запросе', async () => {
    render(<StatsModal {...makeProps()} />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const call = mockFetch.mock.calls[0]
    expect(call[1]?.headers?.Authorization).toBe('Bearer test-token')
  })

  it('вызывает onClose при клике "Закрыть"', () => {
    const onClose = jest.fn()
    render(<StatsModal {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('не загружает данные если open=false', () => {
    mockFetch.mockReset()
    render(<StatsModal {...makeProps({ open: false })} />)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
