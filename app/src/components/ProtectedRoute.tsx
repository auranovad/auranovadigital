import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthed(!!data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return
      setAuthed(!!session); setReady(true)
    })
    return () => { mounted = false; sub?.subscription.unsubscribe() }
  }, [])

  if (!ready) return <div className="p-6">Cargando…</div>
  return authed ? children : <Navigate to="/login" replace />
}
