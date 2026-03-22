import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppHeader } from '../../components/AppHeader/AppHeader'

// Мокируем supabase чтобы не обращаться к реальному клиенту
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
  },
}))

describe('AppHeader', () => {
  it('отображает логотип "Meal Fix"', () => {
    render(<AppHeader onSettings={() => {}} onStats={() => {}} onTeam={() => {}} />)
    expect(screen.getByText('Meal Fix')).toBeInTheDocument()
  })

  it('отображает текущую дату на русском', () => {
    render(<AppHeader onSettings={() => {}} onStats={() => {}} onTeam={() => {}} />)
    // Дата должна содержать название месяца на русском
    const dateEl = screen.getByText(
      /января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/i
    )
    expect(dateEl).toBeInTheDocument()
  })

  it('вызывает onStats при клике на кнопку статистики', () => {
    const onStats = jest.fn()
    render(<AppHeader onSettings={() => {}} onStats={onStats} onTeam={() => {}} />)
    fireEvent.click(screen.getByText('📊'))
    expect(onStats).toHaveBeenCalledTimes(1)
  })

  it('вызывает onSettings при клике на кнопку настроек', () => {
    const onSettings = jest.fn()
    render(<AppHeader onSettings={onSettings} onStats={() => {}} onTeam={() => {}} />)
    fireEvent.click(screen.getByText('⚙ цели'))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  it('отображает кнопку "выйти"', () => {
    render(<AppHeader onSettings={() => {}} onStats={() => {}} onTeam={() => {}} />)
    expect(screen.getByText('выйти')).toBeInTheDocument()
  })

  it('вызывает supabase.auth.signOut при клике "выйти"', async () => {
    const { supabase } = require('../../lib/supabase')
    render(<AppHeader onSettings={() => {}} onStats={() => {}} onTeam={() => {}} />)
    fireEvent.click(screen.getByText('выйти'))
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })
})
