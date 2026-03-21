'use client'
import { Button } from '../../ui'
import styles from './DateNav.module.less'

interface DateNavProps {
  date: string
  onChange: (date: string) => void
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const today = () => new Date().toISOString().slice(0, 10)

export function DateNav({ date, onChange }: DateNavProps) {
  const isToday = date === today()
  const label = new Date(date + 'T12:00:00').toLocaleDateString('ru', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

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
