'use client'
import { useState } from 'react'
import { Modal, Button, Input } from '../../ui'
import styles from './TeamModal.module.less'

interface TeamMember {
  user_id: string
  display_name: string
  joined_at: string
}

export interface TeamData {
  id: string
  name: string
  invite_code: string
  members: TeamMember[]
}

interface TeamModalProps {
  open: boolean
  onClose: () => void
  token: string
  team: TeamData | null
  onTeamChange: (team: TeamData | null) => void
}

export function TeamModal({ open, onClose, token, team, onTeamChange }: TeamModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [teamName, setTeamName]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function handleCreate() {
    if (!displayName.trim()) { setError('Введи своё имя'); return }
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/team', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ name: teamName.trim() || 'Команда', display_name: displayName.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Ошибка')
      onTeamChange(data)
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  async function handleJoin() {
    if (!inviteCode.trim()) { setError('Введи код приглашения'); return }
    if (!displayName.trim()) { setError('Введи своё имя'); return }
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/team/join', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ invite_code: inviteCode.trim(), display_name: displayName.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Ошибка')
      onTeamChange(data)
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  async function handleLeave() {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/team/leave', { method: 'DELETE', headers: h })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? 'Ошибка') }
      onTeamChange(null)
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleClose() {
    setError(null)
    setTeamName(''); setDisplayName(''); setInviteCode('')
    onClose()
  }

  // ── Manage view (уже в команде) ─────────────────────────────────────────
  if (team) {
    return (
      <Modal open={open} onClose={handleClose} title="🏆 Команда">
        <div className={styles.teamName}>{team.name}</div>

        <div className={styles.inviteSection}>
          <div className={styles.inviteLabel}>Invite-код</div>
          <div className={styles.codeRow}>
            <span className={styles.code}>{team.invite_code}</span>
            <Button variant="secondary" onClick={() => copyCode(team.invite_code)}>
              {copied ? '✓ Скопировано' : 'Скопировать'}
            </Button>
          </div>
          <div className={styles.inviteHint}>Отправь этот код другу, чтобы он присоединился</div>
        </div>

        <div className={styles.membersLabel}>Участники</div>
        <div className={styles.membersList}>
          {team.members.map(m => (
            <div key={m.user_id} className={styles.memberRow}>
              <span className={styles.memberName}>{m.display_name}</span>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleClose}>Закрыть</Button>
          <Button variant="ghost" onClick={handleLeave} disabled={loading} className={styles.leaveBtn}>
            Покинуть команду
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Create / Join view ─────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={handleClose} title="🏆 Команда">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`}
          onClick={() => { setTab('create'); setError(null) }}
        >
          Создать
        </button>
        <button
          className={`${styles.tab} ${tab === 'join' ? styles.tabActive : ''}`}
          onClick={() => { setTab('join'); setError(null) }}
        >
          Вступить
        </button>
      </div>

      {tab === 'create' && (
        <div className={styles.form}>
          <label className={styles.label}>Название команды</label>
          <Input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Братья"
          />
          <label className={styles.label}>Твоё имя</label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Например: Саша"
          />
          {error && <div className={styles.error}>{error}</div>}
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Создаю…' : 'Создать команду'}
          </Button>
        </div>
      )}

      {tab === 'join' && (
        <div className={styles.form}>
          <label className={styles.label}>Код приглашения</label>
          <Input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="Например: a3f7c2d1"
          />
          <label className={styles.label}>Твоё имя</label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Например: Дима"
          />
          {error && <div className={styles.error}>{error}</div>}
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? 'Вступаю…' : 'Вступить'}
          </Button>
        </div>
      )}
    </Modal>
  )
}
