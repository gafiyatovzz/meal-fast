import React from 'react'
import { render, screen } from '@testing-library/react'
import { TeamPanel } from '../../components/TeamPanel/TeamPanel'
import type { MemberProgress } from '../../components/TeamPanel/MemberCard'

const self: MemberProgress = {
  user_id: 'user-1',
  display_name: 'Иван',
  is_self: true,
  goals: { cal: 2000, p: 150, f: 70, c: 200 },
  totals: { cal: 1600, p: 120, f: 55, c: 160 },
  score: 80,
  streak: 3,
  logged_today: true,
}

const other: MemberProgress = {
  user_id: 'user-2',
  display_name: 'Мария',
  is_self: false,
  goals: { cal: 1800, p: 130, f: 60, c: 180 },
  totals: { cal: 1400, p: 100, f: 50, c: 140 },
  score: 75,
  streak: 5,
  logged_today: true,
}

describe('TeamPanel', () => {
  it('возвращает null если loading=true', () => {
    const { container } = render(<TeamPanel members={[self]} loading={true} />)
    expect(container.firstChild).toBeNull()
  })

  it('отображает заголовок "🏆 Команда"', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText('🏆 Команда')).toBeInTheDocument()
  })

  it('отображает карточку себя', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText('Иван (вы)')).toBeInTheDocument()
  })

  it('отображает карточку другого участника', () => {
    render(<TeamPanel members={[self, other]} loading={false} />)
    expect(screen.getByText('Мария')).toBeInTheDocument()
  })

  it('показывает подсказку "Пригласи друга" если нет других участников', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText(/Пригласи друга/)).toBeInTheDocument()
  })

  it('показывает "Ты впереди сегодня!" если self.score > other.score', () => {
    render(<TeamPanel members={[self, other]} loading={false} />)
    expect(screen.getByText(/Ты впереди сегодня/)).toBeInTheDocument()
  })

  it('показывает "Догоняй!" если self.score < other.score', () => {
    const behindSelf = { ...self, score: 60 }
    const aheadOther = { ...other, score: 90 }
    render(<TeamPanel members={[behindSelf, aheadOther]} loading={false} />)
    expect(screen.getByText(/Догоняй/)).toBeInTheDocument()
  })

  it('показывает "Вы идёте наравне" при равных очках', () => {
    const equalOther = { ...other, score: 80 }
    render(<TeamPanel members={[self, equalOther]} loading={false} />)
    expect(screen.getByText(/наравне/)).toBeInTheDocument()
  })

  it('рендерит несколько участников', () => {
    const other2 = { ...other, user_id: 'user-3', display_name: 'Алексей' }
    render(<TeamPanel members={[self, other, other2]} loading={false} />)
    expect(screen.getByText('Мария')).toBeInTheDocument()
    expect(screen.getByText('Алексей')).toBeInTheDocument()
  })
})

describe('MemberCard (через TeamPanel)', () => {
  it('отображает score в процентах', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('отображает streak с правильным словоформой "дня" для 3', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText(/3 дня/)).toBeInTheDocument()
  })

  it('отображает streak "дней" для 5', () => {
    const member = { ...self, streak: 5 }
    render(<TeamPanel members={[member]} loading={false} />)
    expect(screen.getByText(/5 дней/)).toBeInTheDocument()
  })

  it('отображает streak "день" для 1', () => {
    const member = { ...self, streak: 1 }
    render(<TeamPanel members={[member]} loading={false} />)
    expect(screen.getByText(/1 день/)).toBeInTheDocument()
  })

  it('показывает "ещё не записывал" для других участников без записей', () => {
    const noLog = { ...other, logged_today: false }
    render(<TeamPanel members={[self, noLog]} loading={false} />)
    expect(screen.getByText('ещё не записывал')).toBeInTheDocument()
  })

  it('НЕ показывает "ещё не записывал" для себя', () => {
    const noLogSelf = { ...self, logged_today: false }
    render(<TeamPanel members={[noLogSelf]} loading={false} />)
    expect(screen.queryByText('ещё не записывал')).not.toBeInTheDocument()
  })

  it('отображает белки, жиры, углеводы', () => {
    render(<TeamPanel members={[self]} loading={false} />)
    expect(screen.getByText(/Б/)).toBeInTheDocument()
    expect(screen.getByText(/Ж/)).toBeInTheDocument()
    expect(screen.getByText(/У/)).toBeInTheDocument()
  })
})
