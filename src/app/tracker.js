'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const GOALS_KEY = 'nutrition_goals_v3'
const ANTHRO_KEY = 'nutrition_anthro_v1'
const DEFAULT_GOALS = { cal: 2800, p: 150, f: 80, c: 300 }
const DEFAULT_ANTHRO = { weight: '', height: '', age: '', gender: 'м' }

const FALLBACK_HINTS = [
  'тарелка гречки с курой',
  'омлет из 3 яиц с молоком',
  'творог 200г с бананом',
  'протеиновый шейк 1 мерник',
  'кофе с молоком',
  'бутерброд с колбасой',
]

const MACROS = [
  { k: 'p', col: '#7eb8f7', label: 'Белки' },
  { k: 'f', col: '#f7c97e', label: 'Жиры' },
  { k: 'c', col: '#b07ef7', label: 'Углеводы' },
]

function Dots() {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#c8f562',
          animation: `bnc 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
      <style>{`@keyframes bnc{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </div>
  )
}

export default function Tracker({ session }) {
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [anthro, setAnthro] = useState(DEFAULT_ANTHRO)
  const [tmpAnthro, setTmpAnthro] = useState(DEFAULT_ANTHRO)
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [adding, setAdding] = useState(false)
  const [modal, setModal] = useState(null)
  const [tmpGoals, setTmpGoals] = useState(DEFAULT_GOALS)
  const taRef = useRef()
  const fileRef = useRef()

  const token = session?.access_token
  const [hints, setHints] = useState(FALLBACK_HINTS)
  const [allHints, setAllHints] = useState([]) // full history for "ещё" modal

  const dateStr = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })
  const totals = meals.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.p, f: a.f + m.f, c: a.c + m.c }), { cal: 0, p: 0, f: 0, c: 0 })
  const calPct = Math.min(100, (totals.cal / goals.cal) * 100)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GOALS_KEY))
      if (saved) setGoals({ ...DEFAULT_GOALS, ...saved })
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem(ANTHRO_KEY))
      if (saved) setAnthro({ ...DEFAULT_ANTHRO, ...saved })
    } catch {}
  }, [])

  const fetchMeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/meals', { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(await r.text())
      setMeals(await r.json())
    } catch (e) {
      setError('Ошибка загрузки: ' + e.message)
    }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchMeals() }, [fetchMeals])

  useEffect(() => {
    if (!token) return
    const hour = new Date().getHours()
    fetch(`/api/hints?hour=${hour}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ hints: h }) => {
        if (!h || h.length === 0) return
        setAllHints(h)
        setHints(h.slice(0, 9)) // show top 9, 10th slot is "ещё"
      })
      .catch(() => {}) // silently fall back to defaults
  }, [token])

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target.result
      setPhoto({ base64: url.split(',')[1], type: file.type, url })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function addMeal() {
    if (adding || (!text.trim() && !photo)) return
    const t = text.trim()
    setText('')
    setAdding(true)
    const sp = photo
    setPhoto(null)

    try {
      // Step 1: get nutrition from Claude via our API route
      const claudeRes = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: t,
          imageBase64: sp?.base64 || null,
          imageType: sp?.type || null,
        })
      })
      if (!claudeRes.ok) throw new Error(await claudeRes.text())
      const meal = await claudeRes.json()
      if (meal.error) throw new Error(meal.error)

      meal.cal = +meal.cal; meal.p = +meal.p; meal.f = +meal.f; meal.c = +meal.c
      if (sp) meal.thumb = sp.url

      // Step 2: save to Supabase via our API route
      const saveRes = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(meal)
      })
      if (!saveRes.ok) throw new Error(await saveRes.text())
      const saved = await saveRes.json()
      setMeals(prev => [saved, ...prev])
    } catch (e) {
      setError('Ошибка: ' + e.message)
    }
    setAdding(false)
  }

  async function removeMeal(id) {
    try {
      await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
      })
      setMeals(prev => prev.filter(m => m.id !== id))
    } catch (e) {
      setError('Ошибка удаления: ' + e.message)
    }
  }

  function saveGoals() {
    const g = { cal: +tmpGoals.cal || 2800, p: +tmpGoals.p || 150, f: +tmpGoals.f || 80, c: +tmpGoals.c || 300 }
    setGoals(g)
    localStorage.setItem(GOALS_KEY, JSON.stringify(g))
    const a = { weight: tmpAnthro.weight, height: tmpAnthro.height, age: tmpAnthro.age, gender: tmpAnthro.gender }
    setAnthro(a)
    localStorage.setItem(ANTHRO_KEY, JSON.stringify(a))
    setModal(null)
  }

  const s = {
    app: { background: '#0e0e0e', color: '#f0f0f0', minHeight: '100vh', padding: '24px 16px 130px', maxWidth: 480, margin: '0 auto' },
    logo: { fontSize: 20, fontWeight: 700, color: '#c8f562', letterSpacing: -0.5, marginBottom: 2 },
    date: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    goalBanner: { background: '#161616', border: '1px solid #2a2a2a', borderLeft: '3px solid #c8f562', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#888' },
    summary: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 20, padding: 20, marginBottom: 20 },
    calNow: { fontSize: 48, fontWeight: 900, color: '#c8f562', lineHeight: 1 },
    calRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
    bar: { height: 6, background: '#2a2a2a', borderRadius: 99, overflow: 'hidden', marginBottom: 18 },
    fill: (pct, col) => ({ height: '100%', width: `${Math.min(100, pct)}%`, background: col, borderRadius: 99, transition: 'width .6s cubic-bezier(.34,1.56,.64,1)' }),
    macros: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
    macroBox: (col) => ({ background: '#1c1c1c', borderRadius: 12, padding: '10px 8px', textAlign: 'center', borderTop: `2px solid ${col}` }),
    macroVal: (col) => ({ fontSize: 18, fontWeight: 800, color: col, marginBottom: 2 }),
    macroSub: { fontSize: 10, color: '#555', marginBottom: 5 },
    macroLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
    macroBar: { height: 4, background: '#2a2a2a', borderRadius: 99, overflow: 'hidden' },
    sectionTitle: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 },
    mealItem: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', marginBottom: 8 },
    mealThumb: { width: 50, height: 50, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid #2a2a2a' },
    mealName: { fontSize: 14, fontWeight: 600, marginBottom: 4, paddingRight: 20 },
    mealMacros: { display: 'flex', gap: 8, fontSize: 11 },
    mealCal: { fontSize: 15, fontWeight: 800, color: '#c8f562', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' },
    mealDel: { position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: '50%', background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer' },
    empty: { textAlign: 'center', padding: '32px 16px', color: '#555', fontSize: 14, border: '1px dashed #2a2a2a', borderRadius: 14 },
    loadItem: { background: '#161616', border: '1px solid #c8f562', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.8, marginBottom: 8 },
    inputWrap: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px 24px', background: 'linear-gradient(to top,#0e0e0e 70%,transparent)' },
    hints: { display: 'flex', gap: 8, overflowX: 'scroll', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', touchAction: 'pan-x' },
    chip: { flexShrink: 0, background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#666', cursor: 'pointer', whiteSpace: 'nowrap' },
    previewWrap: { position: 'relative', marginBottom: 8 },
    previewImg: { width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid #c8f562' },
    previewDel: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.75)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' },
    inputBox: { display: 'flex', gap: 8, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 16, padding: '10px 12px', alignItems: 'center' },
    camBtn: (on) => ({ width: 40, height: 40, borderRadius: 12, background: on ? '#c8f562' : '#1c1c1c', border: `1px solid ${on ? '#c8f562' : '#2a2a2a'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: on ? '#000' : '#888' }),
    textarea: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0f0f0', fontFamily: 'inherit', fontSize: 15, resize: 'none', minHeight: 24, lineHeight: 1.5 },
    sendBtn: (dis) => ({ width: 40, height: 40, borderRadius: 12, background: dis ? '#2a2a2a' : '#c8f562', border: 'none', cursor: dis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    smallBtn: { background: 'none', border: '1px solid #2a2a2a', color: '#666', borderRadius: 8, padding: '6px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modal: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
    modalTitle: { fontSize: 16, fontWeight: 800, marginBottom: 20 },
    formLabel: { display: 'block', fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    formInput: { width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', color: '#f0f0f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    btnSave: { flex: 1, background: '#c8f562', color: '#000', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    btnCancel: { flex: 1, background: '#1c1c1c', color: '#666', border: '1px solid #2a2a2a', borderRadius: 12, padding: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    errBox: { background: '#1a0f0f', border: '1px solid #5a2020', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#f08080', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sectionDivider: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #2a2a2a' },
  }

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.logo}>ем и расту</div>
          <div style={s.date}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.smallBtn} onClick={() => { setTmpGoals({ ...goals }); setTmpAnthro({ ...anthro }); setModal('goals') }}>⚙ цели</button>
          <button style={s.smallBtn} onClick={() => supabase.auth.signOut()}>выйти</button>
        </div>
      </div>

      {error && (
        <div style={s.errBox}>
          <span>{error}</span>
          <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setError(null)}>✕</span>
        </div>
      )}

      {/* Goal banner */}
      <div style={s.goalBanner}>
        <span style={{ color: '#c8f562', fontWeight: 600 }}>{goals.cal} ккал</span>
        {' · '}Б <span style={{ color: '#7eb8f7' }}>{goals.p}г</span>
        {' · '}Ж <span style={{ color: '#f7c97e' }}>{goals.f}г</span>
        {' · '}У <span style={{ color: '#b07ef7' }}>{goals.c}г</span>
      </div>

      {/* Summary */}
      <div style={s.summary}>
        <div style={s.calRow}>
          <div style={s.calNow}>{Math.round(totals.cal)}</div>
          <div style={{ fontSize: 13, color: '#666', textAlign: 'right' }}>
            из<strong style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#f0f0f0' }}>{goals.cal}</strong>ккал
          </div>
        </div>
        <div style={s.bar}>
          <div style={s.fill(calPct, 'linear-gradient(90deg,#c8f562,#a8e040)')} />
        </div>
        <div style={s.macros}>
          {MACROS.map(({ k, col, label }) => {
            const val = totals[k], goal = goals[k]
            const pct = goal > 0 ? (val / goal) * 100 : 0
            return (
              <div key={k} style={s.macroBox(col)}>
                <div style={s.macroVal(col)}>{Math.round(val)}</div>
                <div style={s.macroSub}>из {goal}г</div>
                <div style={s.macroBar}><div style={s.fill(pct, col)} /></div>
                <div style={{ ...s.macroLabel, marginTop: 5 }}>{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Meals list */}
      <p style={s.sectionTitle}>съедено сегодня</p>

      {(adding || loading) && (
        <div style={s.loadItem}>
          <Dots />
          <span style={{ fontSize: 13, color: '#888' }}>
            {adding ? (photo ? '📷 Смотрю на фото…' : 'Считаю КБЖУ…') : 'Загружаю…'}
          </span>
        </div>
      )}

      {meals.length === 0 && !adding && !loading && (
        <div style={s.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🍽️</div>
          Напиши что съел или сфоткай — я посчитаю
        </div>
      )}

      {meals.map(m => (
        <div key={m.id} style={s.mealItem}>
          {m.thumb && <img src={m.thumb} style={s.mealThumb} alt="" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.mealName}>{m.name}</div>
            <div style={s.mealMacros}>
              <span style={{ color: '#7eb8f7' }}>Б {Math.round(m.p)}г</span>
              <span style={{ color: '#f7c97e' }}>Ж {Math.round(m.f)}г</span>
              <span style={{ color: '#b07ef7' }}>У {Math.round(m.c)}г</span>
            </div>
          </div>
          <div style={s.mealCal}>{Math.round(m.cal)}<span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}> ккал</span></div>
          <button style={s.mealDel} onClick={() => removeMeal(m.id)}>✕</button>
        </div>
      ))}

      {/* Input bar */}
      <div style={s.inputWrap}>
        <div style={s.hints}>
          {hints.map(name => (
            <div key={name} style={s.chip} onClick={() => { setText(name); taRef.current?.focus() }}>{name}</div>
          ))}
          {allHints.length > 9 && (
            <div style={{ ...s.chip, color: '#c8f562', borderColor: '#c8f56240' }} onClick={() => setModal('history')}>ещё →</div>
          )}
        </div>

        {photo && (
          <div style={s.previewWrap}>
            <img src={photo.url} style={s.previewImg} alt="" />
            <button style={s.previewDel} onClick={() => setPhoto(null)}>✕</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhoto} />

        <div style={s.inputBox}>
          <button style={s.camBtn(!!photo)} onClick={() => fileRef.current.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <textarea
            ref={taRef}
            style={s.textarea}
            placeholder="Что съел? Пиши или фоткай…"
            value={text}
            rows={1}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addMeal() } }}
          />
          <button style={s.sendBtn(adding || (!text.trim() && !photo))} onClick={addMeal} disabled={adding || (!text.trim() && !photo)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={adding ? '#666' : '#000'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* History modal */}
      {modal === 'history' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ ...s.modal, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...s.modalTitle, marginBottom: 12 }}>История блюд</div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {allHints.map(name => (
                <div key={name} style={{ padding: '10px 0', borderBottom: '1px solid #2a2a2a', fontSize: 14, color: '#ccc', cursor: 'pointer' }}
                  onClick={() => { setText(name); setModal(null); taRef.current?.focus() }}>
                  {name}
                </div>
              ))}
            </div>
            <button style={{ ...s.btnCancel, marginTop: 16 }} onClick={() => setModal(null)}>Закрыть</button>
          </div>
        </div>
      )}

      {/* Goals modal */}
      {modal === 'goals' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ ...s.modal, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={s.modalTitle}>Настройки</div>

            <div style={s.sectionDivider}>Цели питания</div>
            <label style={s.formLabel}>Калории в день</label>
            <input style={s.formInput} type="number" value={tmpGoals.cal} onChange={e => setTmpGoals(p => ({ ...p, cal: e.target.value }))} />
            <div style={s.formGrid}>
              <div>
                <label style={s.formLabel}>Белки (г)</label>
                <input style={s.formInput} type="number" value={tmpGoals.p} onChange={e => setTmpGoals(p => ({ ...p, p: e.target.value }))} />
              </div>
              <div>
                <label style={s.formLabel}>Жиры (г)</label>
                <input style={s.formInput} type="number" value={tmpGoals.f} onChange={e => setTmpGoals(p => ({ ...p, f: e.target.value }))} />
              </div>
            </div>
            <label style={s.formLabel}>Углеводы (г)</label>
            <input style={s.formInput} type="number" value={tmpGoals.c} onChange={e => setTmpGoals(p => ({ ...p, c: e.target.value }))} />

            <div style={{ ...s.sectionDivider, marginTop: 20 }}>Антропометрия</div>
            <div style={s.formGrid}>
              <div>
                <label style={s.formLabel}>Вес (кг)</label>
                <input style={s.formInput} type="number" value={tmpAnthro.weight} onChange={e => setTmpAnthro(p => ({ ...p, weight: e.target.value }))} placeholder="70" />
              </div>
              <div>
                <label style={s.formLabel}>Рост (см)</label>
                <input style={s.formInput} type="number" value={tmpAnthro.height} onChange={e => setTmpAnthro(p => ({ ...p, height: e.target.value }))} placeholder="175" />
              </div>
            </div>
            <div style={s.formGrid}>
              <div>
                <label style={s.formLabel}>Возраст</label>
                <input style={s.formInput} type="number" value={tmpAnthro.age} onChange={e => setTmpAnthro(p => ({ ...p, age: e.target.value }))} placeholder="25" />
              </div>
              <div>
                <label style={s.formLabel}>Пол</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['м', 'ж'].map(g => (
                    <button key={g} onClick={() => setTmpAnthro(p => ({ ...p, gender: g }))} style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid',
                      borderColor: tmpAnthro.gender === g ? '#c8f562' : '#2a2a2a',
                      background: tmpAnthro.gender === g ? 'rgba(200,245,98,.1)' : '#1c1c1c',
                      color: tmpAnthro.gender === g ? '#c8f562' : '#666',
                      fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', fontWeight: 600,
                    }}>{g === 'м' ? '♂ муж' : '♀ жен'}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={s.btnCancel} onClick={() => setModal(null)}>Отмена</button>
              <button style={s.btnSave} onClick={saveGoals}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
