// ============================================================
// Navbar - Barra de navegación principal
// Muestra opciones según el rol del usuario autenticado
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definir enlaces de navegación según rol
  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', roles: ['Administrador', 'Recepcionista', 'Limpieza', 'Huesped'] },
    { to: '/rooms', label: 'Habitaciones', roles: ['Administrador', 'Recepcionista'] },
    { to: '/reservations', label: 'Reservaciones', roles: ['Administrador', 'Recepcionista', 'Huesped'] },
    { to: '/consumptions', label: 'Consumos', roles: ['Administrador', 'Recepcionista'] },
    { to: '/billing', label: 'Facturación', roles: ['Administrador', 'Recepcionista'] },
    { to: '/cleaning', label: 'Limpieza', roles: ['Administrador', 'Limpieza'] },
    { to: '/reports', label: 'Reportes', roles: ['Administrador'] },
  ];

  return (
    <nav className="bg-primary-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-hotel-gold">Grand-Stay</span>
          </Link>

          {/* Links de navegación */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks
              .filter(link => hasRole(...link.roles))
              .map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-300">Hola, </span>
              <span className="font-semibold">{user?.nombre}</span>
              <span className="ml-2 bg-hotel-gold text-primary-900 px-2 py-0.5 rounded-full text-xs font-bold">
                {user?.rol}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
