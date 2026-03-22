'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './auth.module.less'

type Mode = 'login' | 'signup' | 'reset' | 'update'

interface AuthFormProps {
  initialMode?: Mode
  onPasswordUpdated?: () => void
}

export default function AuthForm({ initialMode = 'login', onPasswordUpdated }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function signInWithGoogle() {
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'reset') {
      const redirectTo = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Письмо со ссылкой для сброса пароля отправлено на ' + email)
      }
    } else if (mode === 'update') {
      if (password !== confirm) {
        setError('Пароли не совпадают')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        onPasswordUpdated?.()
      }
    }

    setLoading(false)
  }

  if (mode === 'reset') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.logo}>Meal Fix</div>
          <div className={styles.sub}>Сброс пароля</div>

          {error && <div className={styles.err}>{error}</div>}
          {success && <div className={styles.ok}>{success}</div>}

          {!success && (
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
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? '…' : 'Отправить ссылку'}
              </button>
            </form>
          )}

          <div className={styles.toggle}>
            <span className={styles.toggleLink} onClick={() => switchMode('login')}>← Назад ко входу</span>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'update') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.logo}>Meal Fix</div>
          <div className={styles.sub}>Новый пароль</div>

          {error && <div className={styles.err}>{error}</div>}

          <form onSubmit={submit}>
            <label className={styles.label}>Новый пароль</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="минимум 6 символов"
              required
              minLength={6}
              autoFocus
            />
            <label className={styles.label}>Подтвердите пароль</label>
            <input
              className={styles.input}
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="повторите пароль"
              required
              minLength={6}
            />
            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? '…' : 'Сохранить пароль'}
            </button>
          </form>
        </div>
      </div>
    )
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
          {mode === 'login' && (
            <div className={styles.forgotRow}>
              <span className={styles.forgotLink} onClick={() => switchMode('reset')}>Забыли пароль?</span>
            </div>
          )}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.divider}>или</div>

        <button className={styles.googleBtn} type="button" onClick={signInWithGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Войти через Google
        </button>

        <div className={styles.toggle}>
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <span className={styles.toggleLink} onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? ' Зарегистрироваться' : ' Войти'}
          </span>
        </div>
      </div>
    </div>
  )
}
