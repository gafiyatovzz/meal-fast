import { Card, ProgressBar } from '../../ui'
import { MacroBox } from '../MacroBox/MacroBox'
import type { Goals } from '../../types'
import styles from './CalorieSummary.module.less'

const MACROS = [
  { k: 'p' as const, col: '#7eb8f7', label: 'Белки' },
  { k: 'f' as const, col: '#f7c97e', label: 'Жиры' },
  { k: 'c' as const, col: '#b07ef7', label: 'Углеводы' },
]

interface CalorieSummaryProps {
  totals: Goals
  goals: Goals
}

export function CalorieSummary({ totals, goals }: CalorieSummaryProps) {
  const calPct = (totals.cal / goals.cal) * 100
  return (
    <Card className={styles.card}>
      <div className={styles.calRow}>
        <div className={styles.calNow}>{Math.round(totals.cal)}</div>
        <div className={styles.calMeta}>
          из<strong className={styles.calGoal}>{goals.cal}</strong>ккал
        </div>
      </div>
      <ProgressBar pct={calPct} gradient="linear-gradient(90deg,#c8f562,#a8e040)" height={6} />
      <div className={styles.macros}>
        {MACROS.map(({ k, col, label }) => (
          <MacroBox key={k} label={label} value={totals[k]} goal={goals[k]} color={col} />
        ))}
      </div>
    </Card>
  )
}
