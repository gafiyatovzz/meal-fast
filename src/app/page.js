'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Tracker from './tracker'
import AuthForm from './auth'

export default function Home() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // initial load
  if (!session) return <AuthForm />
  return <Tracker session={session} />
}
