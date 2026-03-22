'use client'
import { Button } from '../../ui'
import { today, addDays, formatDateLong } from '../../lib/date'
import styles from './DateNav.module.less'

interface DateNavProps {
  date: string
  onChange: (date: string) => void
}

export function DateNav({ date, onChange }: DateNavProps) {
  const isToday = date === today()
  const label = formatDateLong(date)

  return (
    <div className={styles.nav}>
      <Button variant="icon" onClick={() => onChange(addDays(date, -1))}>←</Button>
      <div className={styles.center}>
        <span className={styles.label}>{label}</span>
        {!isToday && (
          <button className={styles.todayBtn} onClick={() => onChange(today())}>
            сегодня
          </button>
        )}
      </div>
      <Button variant="icon" onClick={() => onChange(addDays(date, 1))} disabled={isToday}>→</Button>
    </div>
  )
}
