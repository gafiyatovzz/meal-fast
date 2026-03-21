'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Tracker from './tracker'
import AuthForm from './auth'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <AuthForm />
  return <Tracker session={session} />
}
