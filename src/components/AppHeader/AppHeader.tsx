'use client'
import { supabase } from '../../lib/supabase'
import { Button } from '../../ui'
import styles from './AppHeader.module.less'

interface AppHeaderProps {
  onSettings: () => void
  onStats: () => void
  onTeam: () => void
  streak: number
}

export function AppHeader({ onSettings, onStats, onTeam, streak }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>Meal Fix</div>
        <div className={styles.streak}>🔥 {Math.max(1, streak)}</div>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onTeam}>🏆</Button>
        <Button variant="ghost" onClick={onStats}>📊</Button>
        <Button variant="ghost" onClick={onSettings}>⚙ цели</Button>
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>выйти</Button>
      </div>
    </header>
  )
}
