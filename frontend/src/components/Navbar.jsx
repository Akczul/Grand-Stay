// ============================================================
// Navbar - Barra de navegación de lujo (RNF-F01, RNF-F02)
// Menú hamburguesa en móvil, filtrado real por rol
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Crown, LayoutDashboard, BedDouble, CalendarDays, UtensilsCrossed,
  Receipt, Sparkles, BarChart2, LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard, roles: ['Administrador', 'Recepcionista', 'Limpieza', 'Huesped'] },
  { to: '/rooms',        label: 'Habitaciones',  icon: BedDouble,       roles: ['Administrador', 'Recepcionista'] },
  { to: '/reservations', label: 'Reservaciones', icon: CalendarDays,    roles: ['Administrador', 'Recepcionista', 'Huesped'] },
  { to: '/consumptions', label: 'Consumos',      icon: UtensilsCrossed, roles: ['Administrador', 'Recepcionista'] },
  { to: '/billing',      label: 'Facturación',   icon: Receipt,         roles: ['Administrador', 'Recepcionista'] },
  { to: '/cleaning',     label: 'Limpieza',      icon: Sparkles,        roles: ['Administrador', 'Limpieza'] },
  { to: '/reports',      label: 'Reportes',      icon: BarChart2,       roles: ['Administrador'] },
];

const ROL_BADGE = {
  Administrador:  { bg: 'rgba(201,160,71,0.15)',  color: '#e8d49c', border: 'rgba(201,160,71,0.4)' },
  Recepcionista:  { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd', border: 'rgba(59,130,246,0.35)' },
  Limpieza:       { bg: 'rgba(34,197,94,0.12)',   color: '#86efac', border: 'rgba(34,197,94,0.35)' },
  Huesped:        { bg: 'rgba(168,85,247,0.12)',  color: '#d8b4fe', border: 'rgba(168,85,247,0.35)' },
};

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = NAV_LINKS.filter(l => hasRole(...l.roles));
  const rolStyle = ROL_BADGE[user?.rol] || ROL_BADGE['Huesped'];

  const isActive = (to) => location.pathname === to;

  return (
    <header
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#c9a047,#d4af37)', color: '#0a0a14' }}
            >
              <Crown size={16} />
            </div>
            <div className="leading-none">
              <span
                className="font-serif font-semibold text-lg tracking-wide"
                style={{ color: 'var(--gold-light)' }}
              >
                Grand<span style={{ color: 'var(--gold)' }}>-Stay</span>
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: isActive(to) ? 'var(--gold)' : 'var(--text-muted)',
                  background: isActive(to) ? 'rgba(201,160,71,0.1)' : 'transparent',
                  borderBottom: isActive(to) ? '1px solid rgba(201,160,71,0.5)' : '1px solid transparent',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>

          {/* ── User + logout ── */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)' }}
              >
                <User size={14} style={{ color: 'var(--gold)' }} />
              </div>
              <div className="leading-none">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.nombre}
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: rolStyle.bg, color: rolStyle.color, border: `1px solid ${rolStyle.border}` }}
                >
                  {user?.rol}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>

          {/* ── Mobile menu toggle ── */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-slide-up"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 py-3 space-y-1">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive(to) ? 'var(--gold)' : 'var(--text-primary)',
                  background: isActive(to) ? 'rgba(201,160,71,0.1)' : 'transparent',
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={15} />
                  {label}
                </span>
                <ChevronRight size={13} style={{ color: 'var(--text-subtle)' }} />
              </Link>
            ))}
          </div>
          {/* User info mobile */}
          <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hover)' }}>
                <User size={14} style={{ color: 'var(--gold)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.nombre}</p>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: rolStyle.bg, color: rolStyle.color }}>
                  {user?.rol}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
