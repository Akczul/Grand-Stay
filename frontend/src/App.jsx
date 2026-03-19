// ============================================================
// App.jsx - Rutas principales con React.lazy() (RNF-F04)
// Todos los módulos de páginas se cargan de forma diferida
// ============================================================

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Toast from './components/Toast.jsx';

// Lazy load de todas las páginas (RNF-F04)
const LandingPage  = lazy(() => import('./pages/LandingPage.jsx'));
const Login        = lazy(() => import('./pages/Login.jsx'));
const Dashboard    = lazy(() => import('./pages/Dashboard.jsx'));
const Rooms        = lazy(() => import('./pages/Rooms.jsx'));
const Reservations = lazy(() => import('./pages/Reservations.jsx'));
const Consumptions = lazy(() => import('./pages/Consumptions.jsx'));
const Billing      = lazy(() => import('./pages/Billing.jsx'));
const Cleaning     = lazy(() => import('./pages/Cleaning.jsx'));
const Reports      = lazy(() => import('./pages/Reports.jsx'));

// Fallback de carga elegante  
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div
        className="h-12 w-12 rounded-full animate-spin"
        style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }}
      />
      <p className="text-sm tracking-widest uppercase" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
        Grand&#8209;Stay
      </p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-5">
          <div
            className="h-16 w-16 rounded-full animate-spin"
            style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <div className="text-center">
            <p className="font-serif text-2xl font-light" style={{ color: 'var(--gold-light)' }}>Grand-Stay</p>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Notificaciones globales */}
      <Toast />

      {isAuthenticated && <Navbar />}

      <main className={isAuthenticated ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : 'w-full'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LandingPage />} />
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

            {/* Fallback */}
            <Route path="*" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
