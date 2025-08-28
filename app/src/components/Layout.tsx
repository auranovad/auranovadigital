import { PropsWithChildren } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: PropsWithChildren) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">AuraNovaDigital</Link>
          <nav className="flex gap-4 items-center">
            <Link to="/">Inicio</Link>
            {user ? (
              <>
                <span className="text-sm text-gray-500">{user.email}</span>
                <button onClick={handleLogout} className="underline">Cerrar sesión</button>
              </>
            ) : (
              <Link to="/login">Iniciar sesión</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
