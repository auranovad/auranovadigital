import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TENANT } from '@/lib/tenant';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null); setOk(null);
    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        console.error('[Login] error:', error.message);
        setErr(error.message);
      } else {
        setOk(isSignUp ? 'Cuenta creada. Revisa tu email.' : 'Sesión iniciada.');
        if (!isSignUp) navigate(`/t/${DEFAULT_TENANT}/admin`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error inesperado';
      console.error('[Login] exception:', msg);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-1">
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {isSignUp ? 'Regístrate para empezar' : 'Ingresa con tu cuenta'}
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

          <button
            className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Cargando…' : (isSignUp ? 'Crear cuenta' : 'Entrar')}
          </button>
        </form>

        <button
          className="w-full text-sm mt-3 underline"
          onClick={()=>setIsSignUp(!isSignUp)}
        >
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}
