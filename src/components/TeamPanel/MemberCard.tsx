'use client'
import { ProgressBar } from '../../ui'
import type { Goals } from '../../types'
import styles from './TeamPanel.module.less'

export interface MemberProgress {
  user_id: string
  display_name: string
  is_self: boolean
  goals: Goals
  totals: Goals
  score: number
  streak: number
  logged_today: boolean
}

interface MemberCardProps {
  member: MemberProgress
  isWinning: boolean
}

function streakEmoji(streak: number): string {
  if (streak === 0) return '🩶'
  if (streak < 7)   return '🔥'
  return '🔥'
}

function streakClass(streak: number): string {
  if (streak === 0) return styles.streakGrey
  if (streak < 7)   return styles.streakOrange
  return styles.streakGold
}

export function MemberCard({ member, isWinning }: MemberCardProps) {
  const { display_name, is_self, goals, totals, score, streak, logged_today } = member

  return (
    <div className={`${styles.card} ${isWinning ? styles.cardWinning : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.name}>{display_name}{is_self ? ' (вы)' : ''}</span>
        <span className={`${styles.streak} ${streakClass(streak)}`}>
          {streakEmoji(streak)} {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
        </span>
      </div>

      {!logged_today && !is_self && (
        <div className={styles.noLog}>ещё не записывал</div>
      )}

      <div className={styles.scoreRow}>
        <span className={styles.scoreNum}>{score}%</span>
      </div>

      <ProgressBar
        pct={score}
        gradient={isWinning ? 'linear-gradient(90deg,#c8f562,#a8e040)' : 'linear-gradient(90deg,#555,#444)'}
        height={5}
      />

      <div className={styles.macros}>
        <span className={styles.macro} style={{ color: '#7eb8f7' }}>
          Б {Math.round(totals.p)}<span className={styles.macroGoal}>/{goals.p}</span>
        </span>
        <span className={styles.macro} style={{ color: '#f7c97e' }}>
          Ж {Math.round(totals.f)}<span className={styles.macroGoal}>/{goals.f}</span>
        </span>
        <span className={styles.macro} style={{ color: '#b07ef7' }}>
          У {Math.round(totals.c)}<span className={styles.macroGoal}>/{goals.c}</span>
        </span>
      </div>
    </div>
  )
}
