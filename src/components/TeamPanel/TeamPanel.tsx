'use client'
import { MemberCard } from './MemberCard'
import type { MemberProgress } from './MemberCard'
import styles from './TeamPanel.module.less'

interface TeamPanelProps {
  members: MemberProgress[]
  loading: boolean
}

export function TeamPanel({ members, loading }: TeamPanelProps) {
  if (loading) return null

  const self   = members.find(m => m.is_self)
  const others = members.filter(m => !m.is_self)

  const selfScore  = self?.score  ?? 0
  const otherScore = others[0]?.score ?? 0

  const hint =
    others.length === 0   ? 'Пригласи друга — покажи ему invite-код в настройках команды 🏆' :
    selfScore > otherScore ? 'Ты впереди сегодня! 💪' :
    selfScore < otherScore ? 'Догоняй! 🔥' :
    'Вы идёте наравне 👊'

  return (
    <div className={styles.panel}>
      <div className={styles.title}>🏆 Команда</div>
      <div className={styles.cards}>
        {self && (
          <MemberCard
            member={self}
            isWinning={selfScore >= otherScore && others.length > 0}
          />
        )}
        {others.map(m => (
          <MemberCard
            key={m.user_id}
            member={m}
            isWinning={m.score > selfScore}
          />
        ))}
      </div>
      <div className={styles.hint}>{hint}</div>
    </div>
  )
}
