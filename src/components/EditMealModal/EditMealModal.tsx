'use client'
import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '../../ui'
import type { Meal } from '../../types'
import styles from './EditMealModal.module.less'

interface EditMealModalProps {
  meal: Meal | null
  token: string
  onClose: () => void
  onSaved: (updated: Meal) => void
}

export function EditMealModal({ meal, token, onClose, onSaved }: EditMealModalProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (meal) { setName(meal.name); setAmount(''); setError(null) }
  }, [meal])

  async function save() {
    if (!meal || saving || !name.trim()) return
    setSaving(true); setError(null)
    const query = amount.trim() ? `${name.trim()}, ${amount.trim()}` : name.trim()
    try {
      const cr = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, imageBase64: null, imageType: null }),
      })
      if (!cr.ok) throw new Error(await cr.text())
      const recalc = await cr.json()
      if (recalc.error) throw new Error(recalc.error)

      const pr = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: meal.id,
          name: recalc.name ?? name.trim(),
          cal: +recalc.cal,
          p: +recalc.p,
          f: +recalc.f,
          c: +recalc.c,
        }),
      })
      if (!pr.ok) throw new Error(await pr.text())
      const updated = await pr.json()
      onSaved(updated)
      onClose()
    } catch (e) { setError((e as Error).message) }
    setSaving(false)
  }

  return (
    <Modal open={!!meal} onClose={onClose} title="Редактировать">
      <div className={styles.fields}>
        <Input
          label="Название"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Гречка с курицей"
        />
        <Input
          label="Количество / вес / объём"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="300г, 2 порции, 500мл…"
        />
      </div>

      {meal && (
        <div className={styles.current}>
          <span>Сейчас: {Math.round(meal.cal)} ккал</span>
          <span>Б {Math.round(meal.p)}г</span>
          <span>Ж {Math.round(meal.f)}г</span>
          <span>У {Math.round(meal.c)}г</span>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Отмена</Button>
        <Button variant="primary" onClick={save} disabled={saving || !name.trim()}>
          {saving ? 'Пересчитываю…' : 'Сохранить'}
        </Button>
      </div>
    </Modal>
  )
}
