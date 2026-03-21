import styles from './ProgressBar.module.less'

interface ProgressBarProps {
  pct: number
  color?: string
  gradient?: string
  height?: number
}

export function ProgressBar({ pct, color, gradient, height = 6 }: ProgressBarProps) {
  const fill = gradient || color || '#c8f562'
  return (
    <div className={styles.track} style={{ height }}>
      <div
        className={styles.fill}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: fill }}
      />
    </div>
  )
}
