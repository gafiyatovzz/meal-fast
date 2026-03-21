'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Meal, Goals, Anthro } from '../types'
import { Alert, Loader } from '../ui'
import {
  AppHeader, GoalBanner, CalorieSummary,
  MealItem, InputBar, SettingsModal, HistoryModal,
  DateNav, StatsModal, EditMealModal,
} from '../components'
import type { ApiKeysState, ApiKeysSet } from '../components/SettingsModal/SettingsModal'
import styles from './tracker.module.less'

const DEFAULT_GOALS: Goals  = { cal: 2800, p: 150, f: 80, c: 300 }
const DEFAULT_ANTHRO: Anthro = { weight: '', height: '', age: '', gender: 'м' }
const DEFAULT_KEYS_SET: ApiKeysSet  = { anthropic: false, openai: false, gemini: false }
const DEFAULT_KEYS: ApiKeysState    = { anthropic: '', openai: '', gemini: '', provider: 'anthropic' }
const FALLBACK_HINTS = [
  'тарелка гречки с курой', 'омлет из 3 яиц с молоком',
  'творог 200г с бананом', 'протеиновый шейк 1 мерник',
  'кофе с молоком', 'бутерброд с колбасой',
]

interface PhotoState { base64: string; type: string; url: string }

const TODAY = () => new Date().toISOString().slice(0, 10)

export default function Tracker({ session }: { session: Session }) {
  const [selectedDate, setSelectedDate] = useState(TODAY())
  const [goals,    setGoals]    = useState<Goals>(DEFAULT_GOALS)
  const [tmpGoals, setTmpGoals] = useState<Goals>(DEFAULT_GOALS)
  const [anthro,    setAnthro]    = useState<Anthro>(DEFAULT_ANTHRO)
  const [tmpAnthro, setTmpAnthro] = useState<Anthro>(DEFAULT_ANTHRO)
  const [keysSet,  setKeysSet]  = useState<ApiKeysSet>(DEFAULT_KEYS_SET)
  const [tmpKeys,  setTmpKeys]  = useState<ApiKeysState>(DEFAULT_KEYS)
  const [meals,   setMeals]   = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [text,    setText]    = useState('')
  const [photo,   setPhoto]   = useState<PhotoState | null>(null)
  const [adding,  setAdding]  = useState(false)
  const [modal,   setModal]   = useState<'goals' | 'history' | 'stats' | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [hints,    setHints]    = useState<string[]>(FALLBACK_HINTS)
  const [allHints, setAllHints] = useState<string[]>([])
  const taRef = useRef<HTMLTextAreaElement>(null)
  const token = session.access_token

  const totals = meals.reduce(
    (a, m) => ({ cal: a.cal + m.cal, p: a.p + m.p, f: a.f + m.f, c: a.c + m.c }),
    { cal: 0, p: 0, f: 0, c: 0 }
  )

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` }
    fetch('/api/goals',  { headers: h }).then(r => r.json()).then(d => {
      if (d) setGoals({ cal: d.cal, p: d.p, f: d.f, c: d.c })
    }).catch(() => {})
    fetch('/api/anthro', { headers: h }).then(r => r.json()).then(d => {
      if (d) setAnthro({ weight: d.weight ?? '', height: d.height ?? '', age: d.age ?? '', gender: d.gender ?? 'м' })
    }).catch(() => {})
    fetch('/api/keys',   { headers: h }).then(r => r.json()).then(d => {
      if (d && !d.error) {
        setKeysSet({ anthropic: d.anthropic_set, openai: d.openai_set, gemini: d.gemini_set })
        setTmpKeys(prev => ({ ...prev, provider: d.provider ?? 'anthropic' }))
      }
    }).catch(() => {})
  }, [token])

  const fetchMeals = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/meals?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(await r.text())
      setMeals(await r.json())
    } catch (e) { setError('Ошибка загрузки: ' + (e as Error).message) }
    setLoading(false)
  }, [token, selectedDate])

  useEffect(() => { fetchMeals() }, [fetchMeals])

  useEffect(() => {
    if (!token) return
    const hour = new Date().getHours()
    fetch(`/api/hints?hour=${hour}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ hints: h }: { hints: string[] }) => {
        if (!h?.length) return
        setAllHints(h); setHints(h.slice(0, 9))
      })
      .catch(() => {})
  }, [token])

  function handlePhoto(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setPhoto({ base64: url.split(',')[1], type: file.type, url })
    }
    reader.readAsDataURL(file)
  }

  async function addMeal() {
    if (adding || (!text.trim() && !photo)) return
    const t = text.trim(); setText(''); setAdding(true)
    const sp = photo; setPhoto(null)
    try {
      const cr = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: t, imageBase64: sp?.base64 ?? null, imageType: sp?.type ?? null }),
      })
      if (!cr.ok) throw new Error(await cr.text())
      const meal = await cr.json()
      if (meal.error) throw new Error(meal.error)
      meal.cal = +meal.cal; meal.p = +meal.p; meal.f = +meal.f; meal.c = +meal.c
      if (sp) meal.thumb = sp.url
      const sr = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(meal),
      })
      if (!sr.ok) throw new Error(await sr.text())
      const saved = await sr.json()
      setMeals(prev => [saved, ...prev])
    } catch (e) { setError('Ошибка: ' + (e as Error).message) }
    setAdding(false)
  }

  async function removeMeal(id: string) {
    try {
      await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      setMeals(prev => prev.filter(m => m.id !== id))
    } catch (e) { setError('Ошибка удаления: ' + (e as Error).message) }
  }

  function mealUpdated(updated: Meal) {
    setMeals(prev => prev.map(m => m.id === updated.id ? updated : m))
  }

  function openSettings() {
    setTmpGoals({ ...goals })
    setTmpAnthro({ ...anthro })
    setTmpKeys(prev => ({ anthropic: '', openai: '', gemini: '', provider: prev.provider }))
    setModal('goals')
  }

  async function saveSettings() {
    const g: Goals = { cal: +tmpGoals.cal || 2800, p: +tmpGoals.p || 150, f: +tmpGoals.f || 80, c: +tmpGoals.c || 300 }
    const a: Anthro = { ...tmpAnthro }
    setGoals(g); setAnthro(a); setModal(null)

    const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    try {
      await Promise.all([
        fetch('/api/goals',  { method: 'POST', headers: authHeader, body: JSON.stringify(g) }),
        fetch('/api/anthro', { method: 'POST', headers: authHeader, body: JSON.stringify(a) }),
        fetch('/api/keys',   {
          method: 'POST', headers: authHeader,
          body: JSON.stringify({
            anthropic: tmpKeys.anthropic,
            openai:    tmpKeys.openai,
            gemini:    tmpKeys.gemini,
            provider:  tmpKeys.provider,
          }),
        }),
      ])
      // Refresh keys set status
      fetch('/api/keys', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d && !d.error) setKeysSet({ anthropic: d.anthropic_set, openai: d.openai_set, gemini: d.gemini_set })
        }).catch(() => {})
    } catch (e) { setError('Ошибка сохранения: ' + (e as Error).message) }
  }

  const isToday = selectedDate === TODAY()

  return (
    <div className={styles.app}>
      <AppHeader onSettings={openSettings} onStats={() => setModal('stats')} />

      {error && <Alert message={error} onDismiss={() => setError(null)} />}

      <DateNav date={selectedDate} onChange={setSelectedDate} />

      <GoalBanner goals={goals} />
      <CalorieSummary totals={totals} goals={goals} />

      <p className={styles.sectionTitle}>съедено{isToday ? ' сегодня' : ''}</p>

      {(adding || loading) && (
        <div className={styles.loadItem}>
          <Loader />
          <span className={styles.loadText}>
            {adding ? (photo ? '📷 Смотрю на фото…' : 'Считаю КБЖУ…') : 'Загружаю…'}
          </span>
        </div>
      )}

      {meals.length === 0 && !adding && !loading && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>{isToday ? '🍽️' : '📅'}</div>
          {isToday ? 'Напиши что съел или сфоткай — я посчитаю' : 'В этот день ничего не записано'}
        </div>
      )}

      {meals.map(m => (
        <MealItem key={m.id} meal={m} onRemove={removeMeal} onEdit={() => setEditingMeal(m)} />
      ))}

      {isToday && (
        <InputBar
          text={text}
          onChange={setText}
          onSubmit={addMeal}
          onPhoto={handlePhoto}
          photo={photo}
          onRemovePhoto={() => setPhoto(null)}
          hints={hints}
          allHints={allHints}
          onHintClick={hint => { setText(hint); taRef.current?.focus() }}
          onMoreHints={() => setModal('history')}
          disabled={adding}
          textareaRef={taRef}
        />
      )}

      <SettingsModal
        open={modal === 'goals'}
        onClose={() => setModal(null)}
        goals={tmpGoals}
        onGoalsChange={setTmpGoals}
        anthro={tmpAnthro}
        onAnthroChange={setTmpAnthro}
        keysSet={keysSet}
        tmpKeys={tmpKeys}
        onKeysChange={setTmpKeys}
        onSave={saveSettings}
      />

      <HistoryModal
        open={modal === 'history'}
        onClose={() => setModal(null)}
        hints={allHints}
        onSelect={hint => { setText(hint); taRef.current?.focus() }}
      />

      <StatsModal
        open={modal === 'stats'}
        onClose={() => setModal(null)}
        token={token}
        goals={goals}
      />

      <EditMealModal
        meal={editingMeal}
        token={token}
        onClose={() => setEditingMeal(null)}
        onSaved={mealUpdated}
      />
    </div>
  )
}
