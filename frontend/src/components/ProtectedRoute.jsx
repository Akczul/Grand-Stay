// ============================================================
// ProtectedRoute - Componente para proteger rutas según rol
// Redirige a login si no está autenticado
// Muestra error si no tiene el rol adecuado
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          <p className="text-sm text-gray-400 mt-2">Roles requeridos: {roles.join(', ')}</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
