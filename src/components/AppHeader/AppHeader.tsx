'use client'
import { supabase } from '../../lib/supabase'
import { Button } from '../../ui'
import styles from './AppHeader.module.less'

interface AppHeaderProps {
  onSettings: () => void
  onStats: () => void
}

export function AppHeader({ onSettings, onStats }: AppHeaderProps) {
  const dateStr = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.logo}>Meal Fix</div>
        <div className={styles.date}>{dateStr}</div>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onStats}>📊</Button>
        <Button variant="ghost" onClick={onSettings}>⚙ цели</Button>
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>выйти</Button>
      </div>
    </header>
  )
}
