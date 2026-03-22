'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Tracker from './tracker'
import AuthForm from './auth'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      } else if (event === 'USER_UPDATED') {
        setRecoveryMode(false)
      }
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (recoveryMode) return <AuthForm initialMode="update" onPasswordUpdated={() => setRecoveryMode(false)} />
  if (!session) return <AuthForm />
  return <Tracker session={session} />
}
