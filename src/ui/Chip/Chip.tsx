'use client'
import styles from './Chip.module.less'
import clsx from 'clsx'

interface ChipProps {
  label: string
  onClick: () => void
  highlight?: boolean
}

export function Chip({ label, onClick, highlight }: ChipProps) {
  return (
    <div className={clsx(styles.chip, highlight && styles.highlight)} onClick={onClick}>
      {label}
    </div>
  )
}
