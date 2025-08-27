import { useAuth } from '@/contexts/AuthContext';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';

export default function Admin() {
  const { user, signOut } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Admin · {slug}</h1>
      <p>Usuario: {user?.email}</p>
      <div className="flex gap-3">
        <Link to="/" className="underline">Volver al inicio</Link>
        <button onClick={handleLogout} className="underline text-red-600">Cerrar sesión</button>
      </div>
    </div>
  );
}
