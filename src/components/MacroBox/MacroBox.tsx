import { ProgressBar } from '../../ui'
import styles from './MacroBox.module.less'

interface MacroBoxProps {
  label: string
  value: number
  goal: number
  color: string
}

export function MacroBox({ label, value, goal, color }: MacroBoxProps) {
  const pct = goal > 0 ? (value / goal) * 100 : 0
  return (
    <div className={styles.box} style={{ borderTopColor: color }}>
      <div className={styles.value} style={{ color }}>{Math.round(value)}</div>
      <div className={styles.sub}>из {goal}г</div>
      <ProgressBar pct={pct} color={color} height={4} />
      <div className={styles.label}>{label}</div>
    </div>
  )
}
