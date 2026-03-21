'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

const s = {
  wrap: { background: '#0e0e0e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360 },
  logo: { fontSize: 22, fontWeight: 900, color: '#c8f562', letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontSize: 12, color: '#555', marginBottom: 28 },
  label: { display: 'block', fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', color: '#f0f0f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
  btn: { width: '100%', background: '#c8f562', color: '#000', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  toggle: { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#555' },
  toggleLink: { color: '#c8f562', cursor: 'pointer', marginLeft: 4 },
  err: { background: '#1a0f0f', border: '1px solid #5a2020', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f08080', marginBottom: 14 },
  ok: { background: '#0f1a0f', border: '1px solid #2a5a2a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#80c880', marginBottom: 14 },
}

export default function AuthForm() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>ем и расту</div>
        <div style={s.sub}>{mode === 'login' ? 'Войди, чтобы продолжить' : 'Создай аккаунт'}</div>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          <label style={s.label}>Пароль</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="минимум 6 символов"
            required
            minLength={6}
          />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={s.toggle}>
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <span style={s.toggleLink} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}>
            {mode === 'login' ? ' Зарегистрироваться' : ' Войти'}
          </span>
        </div>
      </div>
    </div>
  )
}
