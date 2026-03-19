// ============================================================
// ProtectedRoute - Protección de rutas por autenticación y rol (RNF-F02)
// • Decodifica JWT localmente para detectar expiración sin round-trip
// • Redirige a /login con mensaje de sesión vencida si el token expiró
// • Muestra pantalla de acceso denegado si el rol no está autorizado
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { ShieldOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/** Decodifica el payload de un JWT sin librería externa */
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole, token, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-14 w-14 rounded-full animate-spin"
            style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Verificando acceso…</p>
        </div>
      </div>
    );
  }

  // Client-side JWT expiry check (RNF-F02)
  if (token) {
    const expiry = getTokenExpiry(token);
    if (expiry && Date.now() > expiry) {
      logout();
      return <Navigate to="/login" state={{ sessionExpired: true }} replace />;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--bg-page)' }}>
        <div className="card text-center max-w-md animate-fade-in">
          <div className="flex justify-center mb-5">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <ShieldOff size={28} style={{ color: '#f87171' }} />
            </div>
          </div>
          <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            Acceso <span style={{ color: '#f87171' }}>Denegado</span>
          </h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
            <Lock size={12} />
            <span>Rol requerido: {roles.join(' / ')}</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
