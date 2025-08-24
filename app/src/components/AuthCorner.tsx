import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCorner() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <div className="fixed right-4 top-4 z-50">
      {!authed ? (
        <Link to="/login" className="px-3 py-1.5 rounded-md bg-black text-white hover:opacity-90">
          Iniciar sesión
        </Link>
      ) : (
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
          className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      )}
    </div>
  )
}
