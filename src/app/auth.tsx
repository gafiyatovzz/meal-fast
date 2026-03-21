'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './auth.module.less'

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Meal Fix</div>
        <div className={styles.sub}>{mode === 'login' ? 'Войди, чтобы продолжить' : 'Создай аккаунт'}</div>

        {error && <div className={styles.err}>{error}</div>}

        <form onSubmit={submit}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          <label className={styles.label}>Пароль</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="минимум 6 символов"
            required
            minLength={6}
          />
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.toggle}>
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <span className={styles.toggleLink} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}>
            {mode === 'login' ? ' Зарегистрироваться' : ' Войти'}
          </span>
        </div>
      </div>
    </div>
  )
}
