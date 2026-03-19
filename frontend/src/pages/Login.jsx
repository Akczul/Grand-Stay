// ============================================================
// Login - Diseño de lujo 5 estrellas + validación en tiempo real (RNF-F05)
// Sesión expirada: detecta ?expired=1 y muestra mensaje de aviso
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, Mail, Lock, User, Eye, EyeOff, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import useFormValidation from '../hooks/useFormValidation.js';
import { getErrorMessage } from '../utils/errorHelpers.js';

// ── Validation rules ──────────────────────────────────────
const loginRules = {
  email:    v => !v ? 'El email es obligatorio.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Ingrese un email válido.' : '',
  password: v => !v ? 'La contraseña es obligatoria.' : v.length < 6 ? 'Mínimo 6 caracteres.' : '',
};

const registerRules = {
  nombre:   v => !v?.trim() ? 'El nombre es obligatorio.' : v.trim().length < 3 ? 'Mínimo 3 caracteres.' : '',
  email:    v => !v ? 'El email es obligatorio.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Ingrese un email válido.' : '',
  password: v => !v ? 'La contraseña es obligatoria.' : v.length < 6 ? 'Mínimo 6 caracteres.' : '',
};

// ── Input component ────────────────────────────────────────
const FormField = ({ label, icon: Icon, error, touched, ...props }) => {
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = props.type === 'password';

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: 'var(--gold)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
            <Icon size={15} />
          </span>
        )}
        <input
          {...props}
          type={isPwd && showPwd ? 'text' : props.type}
          className={`input-field ${Icon ? 'pl-9' : ''} ${isPwd ? 'pr-10' : ''} ${error && touched ? 'input-error' : ''}`}
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShowPwd(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-subtle)' }}
          >
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && touched && <p className="error-msg">{error}</p>}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────
const Login = () => {
  const [isLogin, setIsLogin]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const { toast } = useUI();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Detect session-expired redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1' || location.state?.sessionExpired) {
      toast.warning('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }
  }, []);

  // Form state for login
  const loginForm = useFormValidation(
    { email: '', password: '' },
    loginRules
  );

  // Form state for register
  const registerForm = useFormValidation(
    { nombre: '', email: '', password: '' },
    registerRules
  );

  const activeForm = isLogin ? loginForm : registerForm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeForm.validateAll()) return;
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(loginForm.values.email, loginForm.values.password);
        navigate('/dashboard', { replace: true });
      } else {
        await register(
          registerForm.values.nombre,
          registerForm.values.email,
          registerForm.values.password
        );
        toast.success('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setIsLogin(true);
        loginForm.resetForm({ email: registerForm.values.email, password: '' });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    loginForm.resetForm();
    registerForm.resetForm();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0a14 0%, #12101e 50%, #080810 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Decorative rings */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {[320, 480, 640].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full"
              style={{
                width: size, height: size,
                border: `1px solid rgba(201,160,71,${0.12 - i * 0.03})`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-12">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#c9a047,#d4af37)',
                boxShadow: '0 0 60px rgba(201,160,71,0.35)',
              }}
            >
              <Crown size={36} color="#0a0a14" />
            </div>
          </div>

          <h1
            className="font-serif text-5xl font-light tracking-wider mb-3"
            style={{ color: 'var(--gold-light)' }}
          >
            Grand-Stay
          </h1>
          <div className="gold-divider text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
            Luxury Hotel
          </div>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '24px auto 0' }}>
            Reservas, facturación, limpieza y más desde un solo lugar.
          </p>

          {/* Features */}
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {['Reservas en tiempo real', 'Control de habitaciones', 'Facturación automática', 'Reportes avanzados'].map(feat => (
              <div key={feat} className="flex items-start gap-2">
                <Star size={12} style={{ color: 'var(--gold)', marginTop: 3, flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Crown size={22} style={{ color: 'var(--gold)' }} />
              <span className="font-serif text-3xl font-light" style={{ color: 'var(--gold-light)' }}>Grand-Stay</span>
            </div>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Luxury Hotel
            </p>
          </div>

          {/* Card */}
          <div className="card animate-slide-up">
            <div className="mb-7">
              <h2 className="font-serif text-3xl font-light" style={{ color: 'var(--text-primary)' }}>
                {isLogin ? 'Bienvenido' : 'Crear cuenta'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {isLogin ? 'Inicie sesión para continuar' : 'Complete los datos para registrarse'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Register-only fields */}
              {!isLogin && (
                <FormField
                  label="Nombre completo"
                  icon={User}
                  type="text"
                  name="nombre"
                  placeholder="Ej. Ana García"
                  value={registerForm.values.nombre}
                  onChange={registerForm.handleChange}
                  onBlur={registerForm.handleBlur}
                  error={registerForm.errors.nombre}
                  touched={registerForm.touched.nombre}
                  autoComplete="name"
                />
              )}

              <FormField
                label="Correo electrónico"
                icon={Mail}
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                value={activeForm.values.email}
                onChange={activeForm.handleChange}
                onBlur={activeForm.handleBlur}
                error={activeForm.errors.email}
                touched={activeForm.touched.email}
                autoComplete="email"
              />

              <FormField
                label="Contraseña"
                icon={Lock}
                type="password"
                name="password"
                placeholder="••••••••"
                value={activeForm.values.password}
                onChange={activeForm.handleChange}
                onBlur={activeForm.handleBlur}
                error={activeForm.errors.password}
                touched={activeForm.touched.password}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />

              {/* Submit button – disabled while loading (RNF-F05) */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
                style={{ height: 46 }}
              >
                {submitting
                  ? <div className="h-4 w-4 rounded-full animate-spin" style={{ border: '2px solid #0a0a14', borderTopColor: 'transparent' }} />
                  : <>
                      {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                      <ChevronRight size={15} />
                    </>
                }
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              </span>
              <button
                onClick={switchMode}
                className="text-sm ml-1 font-medium transition-all hover:underline"
                style={{ color: 'var(--gold)' }}
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-subtle)' }}>
            © 2026 Grand-Stay · Derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
