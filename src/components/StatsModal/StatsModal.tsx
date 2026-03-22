'use client'
import { useState, useEffect } from 'react'
import { Modal, Button } from '../../ui'
import type { Goals } from '../../types'
import { today, formatDateShort } from '../../lib/date'
import styles from './StatsModal.module.less'

interface DayStat { date: string; cal: number; p: number; f: number; c: number }

interface StatsModalProps {
  open: boolean
  onClose: () => void
  token: string
  goals: Goals
}

const PERIODS: Array<7 | 14 | 30> = [7, 14, 30]


function LineChart({ data, color, goal, height = 80 }: {
  data: number[]; color: string; goal?: number; height?: number
}) {
  const W = 280, H = height
  if (data.every(v => v === 0)) return <div className={styles.noData}>—</div>
  const max = Math.max(...data, goal ?? 0) * 1.1 || 1
  const pts = data.map((v, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * W : W / 2,
    y: H - (v / max) * H,
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${W} ${H} L 0 ${H} Z`
  const gId = `g${color.replace('#', '')}`
  const goalY = goal ? H - (goal / max) * H : null
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.chart}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {goalY !== null && (
        <line x1={0} y1={goalY.toFixed(1)} x2={W} y2={goalY.toFixed(1)}
          stroke={color} strokeOpacity="0.35" strokeDasharray="4 4" strokeWidth="1" />
      )}
      <path d={areaD} fill={`url(#${gId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) =>
        data[i] > 0 ? <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill={color} /> : null
      )}
    </svg>
  )
}

const MACROS = [
  { k: 'p' as const, label: 'Белки', color: '#7eb8f7', gk: 'p' as const },
  { k: 'f' as const, label: 'Жиры',  color: '#f7c97e', gk: 'f' as const },
  { k: 'c' as const, label: 'Углев', color: '#b07ef7', gk: 'c' as const },
]

export function StatsModal({ open, onClose, token, goals }: StatsModalProps) {
  const [period, setPeriod] = useState<7 | 14 | 30>(7)
  const [stats, setStats] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/stats?days=${period}&today=${today()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setStats(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, period, token])

  const daysWithData = stats.filter(d => d.cal > 0)
  const avg = daysWithData.length > 0 ? {
    cal: Math.round(daysWithData.reduce((a, d) => a + d.cal, 0) / daysWithData.length),
    p:   Math.round(daysWithData.reduce((a, d) => a + d.p, 0)   / daysWithData.length),
    f:   Math.round(daysWithData.reduce((a, d) => a + d.f, 0)   / daysWithData.length),
    c:   Math.round(daysWithData.reduce((a, d) => a + d.c, 0)   / daysWithData.length),
  } : null

  const showAllLabels = period <= 7
  const n = stats.length
  const xLabels = showAllLabels
    ? stats.map(d => formatDateShort(d.date))
    : [formatDateShort(stats[0]?.date ?? ''), formatDateShort(stats[Math.floor(n / 2)]?.date ?? ''), formatDateShort(stats[n - 1]?.date ?? '')]

  return (
    <Modal open={open} onClose={onClose} title="Динамика">
      <div className={styles.periods}>
        {PERIODS.map(p => (
          <Button key={p} variant="ghost" active={period === p} onClick={() => setPeriod(p)}>
            {p} дн
          </Button>
        ))}
      </div>

      {loading && <div className={styles.hint}>загружаю…</div>}
      {!loading && daysWithData.length === 0 && <div className={styles.hint}>нет данных за период</div>}

      {!loading && daysWithData.length > 0 && (
        <>
          {avg && (
            <div className={styles.avgRow}>
              <div className={styles.avgItem}>
                <span className={styles.avgLabel}>ср. за день</span>
                <span className={styles.avgVal}>{avg.cal} ккал</span>
              </div>
              {MACROS.map(({ k, label, color }) => (
                <div key={k} className={styles.avgItem}>
                  <span className={styles.avgLabel}>{label}</span>
                  <span className={styles.avgVal} style={{ color }}>{avg[k]}г</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Калории</div>
            <LineChart data={stats.map(d => d.cal)} color="#c8f562" goal={goals.cal} />
            <div className={styles.xLabels}>
              {showAllLabels
                ? xLabels.map((l, i) => <span key={i}>{l}</span>)
                : <><span>{xLabels[0]}</span><span>{xLabels[1]}</span><span>{xLabels[2]}</span></>
              }
            </div>
          </div>

          <div className={styles.macroRow}>
            {MACROS.map(({ k, label, color, gk }) => (
              <div key={k} className={styles.macroChart}>
                <div className={styles.macroLabel} style={{ color }}>{label}</div>
                <LineChart data={stats.map(d => d[k])} color={color} goal={goals[gk]} height={50} />
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="secondary" className={styles.close} onClick={onClose}>Закрыть</Button>
    </Modal>
  )
}
