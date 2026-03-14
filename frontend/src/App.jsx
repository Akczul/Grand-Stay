// ============================================================
// App.jsx - Rutas principales de la aplicación
// Rutas protegidas con React Router v6 según rol
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Rooms from './pages/Rooms.jsx';
import Reservations from './pages/Reservations.jsx';
import Consumptions from './pages/Consumptions.jsx';
import Billing from './pages/Billing.jsx';
import Cleaning from './pages/Cleaning.jsx';
import Reports from './pages/Reports.jsx';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Cargando Grand-Stay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}

      <main className={isAuthenticated ? 'max-w-7xl mx-auto px-4 py-6' : ''}>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />

          {/* Dashboard - Todos los roles */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['Administrador', 'Recepcionista', 'Limpieza', 'Huesped']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Habitaciones - Admin y Recepcionista */}
          <Route path="/rooms" element={
            <ProtectedRoute roles={['Administrador', 'Recepcionista']}>
              <Rooms />
            </ProtectedRoute>
          } />

          {/* Reservaciones - Admin, Recepcionista y Huésped */}
          <Route path="/reservations" element={
            <ProtectedRoute roles={['Administrador', 'Recepcionista', 'Huesped']}>
              <Reservations />
            </ProtectedRoute>
          } />

          {/* Consumos - Admin y Recepcionista */}
          <Route path="/consumptions" element={
            <ProtectedRoute roles={['Administrador', 'Recepcionista']}>
              <Consumptions />
            </ProtectedRoute>
          } />

          {/* Facturación - Admin y Recepcionista */}
          <Route path="/billing" element={
            <ProtectedRoute roles={['Administrador', 'Recepcionista']}>
              <Billing />
            </ProtectedRoute>
          } />

          {/* Limpieza - Admin y personal de Limpieza */}
          <Route path="/cleaning" element={
            <ProtectedRoute roles={['Administrador', 'Limpieza']}>
              <Cleaning />
            </ProtectedRoute>
          } />

          {/* Reportes - Solo Administrador */}
          <Route path="/reports" element={
            <ProtectedRoute roles={['Administrador']}>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Redirigir raíz */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
