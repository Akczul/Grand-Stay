import { useNavigate } from 'react-router-dom';
import {
  Crown, BedDouble, Utensils, Wifi, Car, Star,
  Waves, Sparkles, Clock, Phone, Mail, MapPin,
  ChevronDown, ArrowRight, Shield,
} from 'lucide-react';

// ── Data ───────────────────────────────────────────────────
const ROOMS = [
  {
    tipo: 'Sencilla',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
    desc: 'Espacio íntimo y elegante, ideal para el viajero que valora el confort en su forma más pura.',
    precio: 'Desde $360.000 COP',
    features: ['Cama Queen', 'Vista al jardín', 'Baño privado'],
    badge: null,
  },
  {
    tipo: 'Doble',
    img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
    desc: 'Amplitud y sofisticación. Perfecta para parejas que desean una experiencia memorable.',
    precio: 'Desde $600.000 COP',
    features: ['2 camas dobles', 'Terraza privada', 'Bañera'],
    badge: 'Más popular',
  },
  {
    tipo: 'Suite',
    img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    desc: 'El culmen del lujo. Un mundo aparte donde cada detalle está pensado para impresionar.',
    precio: 'Desde $1.200.000 COP',
    features: ['Sala de estar', 'Vista panorámica', 'Servicio a la habitación 24h'],
    badge: 'Premium',
  },
  {
    tipo: 'Penthouse',
    img: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
    desc: 'Exclusividad absoluta. La cima del hotel reservada para quienes exigen lo mejor.',
    precio: 'Desde $2.000.000 COP',
    features: ['Terraza privada', 'Jacuzzi exterior', 'Mayordomo personal'],
    badge: 'Exclusivo',
  },
];

const SERVICES = [
  { icon: Utensils, title: 'Restaurante Gourmet',  desc: 'Cocina de autor con ingredientes locales y carta de vinos de más de 200 etiquetas.' },
  { icon: Waves,    title: 'Spa & Wellness',       desc: 'Tratamientos exclusivos, piscina climatizada y zona de relajación de 1.200 m².' },
  { icon: Wifi,     title: 'Conectividad Total',   desc: 'Fibra óptica en cada habitación y salas de trabajo equipadas de última generación.' },
  { icon: Car,      title: 'Transporte Privado',   desc: 'Traslados desde el aeropuerto y servicio de valet parking disponible las 24 horas.' },
  { icon: Clock,    title: 'Concierge 24/7',        desc: 'Nuestro equipo está disponible en cualquier momento para hacer tu estadía perfecta.' },
  { icon: Shield,   title: 'Seguridad Discreta',   desc: 'Sistema de seguridad de última generación que garantiza tu privacidad y tranquilidad.' },
];

const STATS = [
  { value: '150+', label: 'Habitaciones' },
  { value: '4.9',  label: 'Valoración' },
  { value: '15+',  label: 'Años de experiencia' },
  { value: '98%',  label: 'Huéspedes satisfechos' },
];

// ── Component ──────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4"
        style={{ background: 'rgba(7,7,13,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <Crown size={20} style={{ color: 'var(--gold)' }} />
          <span className="font-serif text-xl tracking-wide" style={{ color: 'var(--gold-light)' }}>Grand-Stay</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          <a href="#habitaciones" className="hover:text-gold-300 transition-colors">Habitaciones</a>
          <a href="#servicios"    className="hover:text-gold-300 transition-colors">Servicios</a>
          <a href="#contacto"     className="hover:text-gold-300 transition-colors">Contacto</a>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-gold text-sm py-2 px-5"
        >
          Iniciar Sesión
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center text-center px-6 overflow-hidden pt-24">
        {/* Background image + overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(7,7,13,0.55) 0%, rgba(7,7,13,0.68) 55%, rgba(7,7,13,0.97) 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,160,71,0.08) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-4xl animate-fade-in flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: 'var(--gold)' }} />
            <Crown size={22} style={{ color: 'var(--gold)' }} />
            <div className="h-px w-16" style={{ background: 'var(--gold)' }} />
          </div>

          <h1 className="font-serif mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: 'var(--text-primary)' }}>
            Donde el lujo<br />
            <span style={{ color: 'var(--gold-light)' }}>se convierte en hogar</span>
          </h1>

          <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}>
            Grand-Stay es más que un hotel. Es una experiencia diseñada para quienes aprecian
            lo extraordinario: servicio impecable, espacios únicos y momentos que perduran.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#habitaciones" className="btn-gold flex items-center gap-2 text-base px-8 py-3.5">
              Ver Habitaciones <ArrowRight size={18} />
            </a>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost flex items-center gap-2 text-base px-8 py-3.5"
            >
              Reservar <Crown size={16} />
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <a href="#habitaciones"
          className="flex flex-col items-center gap-2 animate-bounce pb-10 mt-8"
          style={{ color: 'var(--text-muted)' }}>
          <span className="text-xs uppercase tracking-widest">Descubrir</span>
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="font-serif text-4xl font-light mb-1" style={{ color: 'var(--gold)' }}>{s.value}</p>
              <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROOMS ── */}
      <section id="habitaciones" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12" style={{ background: 'var(--gold)' }} />
              <BedDouble size={18} style={{ color: 'var(--gold)' }} />
              <div className="h-px w-12" style={{ background: 'var(--gold)' }} />
            </div>
            <h2 className="font-serif text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Catalogo de Habitaciones</h2>
            <p style={{ color: 'var(--text-muted)' }} className="max-w-xl mx-auto">
              Cada espacio ha sido concebido con una atención obsesiva al detalle,
              combinando materiales nobles con tecnología moderna.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROOMS.map(room => (
              <div key={room.tipo}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Room photo */}
                <div className="relative h-44 overflow-hidden">
                  <img src={room.img} alt={room.tipo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(12,12,24,0.85) 0%, transparent 55%)' }} />
                  {room.badge && (
                    <span className="badge badge-gold absolute top-3 right-3">{room.badge}</span>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>{room.tipo}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{room.desc}</p>

                  <ul className="space-y-1.5 mb-5">
                    {room.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Star size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="font-bold" style={{ color: 'var(--gold-light)' }}>{room.precio}</span>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-xs flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      Reservar <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="servicios" className="relative" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {/* Background image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(7,7,13,0.90)' }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12" style={{ background: 'var(--gold)' }} />
              <Sparkles size={18} style={{ color: 'var(--gold)' }} />
              <div className="h-px w-12" style={{ background: 'var(--gold)' }} />
            </div>
            <h2 className="font-serif text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Servicios & Prestaciones</h2>
            <p style={{ color: 'var(--text-muted)' }} className="max-w-xl mx-auto">
              Una oferta integral pensada para que nunca tengas que salir del hotel,
              a menos que sea por pura elección.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(svc => {
              const Icon = svc.icon;
              return (
                <div key={svc.title}
                  className="flex gap-4 p-6 rounded-2xl transition-all duration-300"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(201,160,71,0.10)', border: '1px solid rgba(201,160,71,0.2)' }}>
                    <Icon size={20} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{svc.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{svc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(7,7,13,0.80)' }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,160,71,0.10) 0%, transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <Crown size={32} className="mx-auto mb-6" style={{ color: 'var(--gold)' }} />
          <h2 className="font-serif text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
            ¿Listo para vivir la experiencia?
          </h2>
          <p className="mb-10" style={{ color: 'var(--text-muted)' }}>
            Reserva tu habitación en minutos y comienza a disfrutar
            del estándar Grand-Stay desde el primer momento.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-gold text-base px-10 py-4 flex items-center gap-2 mx-auto"
          >
            Reservar Ahora <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER / CONTACT ── */}
      <footer id="contacto"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} style={{ color: 'var(--gold)' }} />
              <span className="font-serif text-lg" style={{ color: 'var(--gold-light)' }}>Grand-Stay</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Donde cada detalle cuenta y cada estancia se convierte en un recuerdo imborrable.
            </p>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} style={{ color: 'var(--gold)' }} fill="currentColor" />
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--gold)' }}>Navegación</p>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li><a href="#habitaciones" className="hover:text-gold-300 transition-colors">Habitaciones</a></li>
              <li><a href="#servicios"    className="hover:text-gold-300 transition-colors">Servicios</a></li>
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-gold-300 transition-colors">
                  Portal de Gestión
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--gold)' }}>Contacto</p>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li className="flex items-center gap-2">
                <Phone size={14} style={{ color: 'var(--gold)' }} />
                314 7322016
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} style={{ color: 'var(--gold)' }} />
                reservas@grandstay.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} style={{ color: 'var(--gold)' }} />
                Barrio Av. Colombia, Mocoa, Putumayo
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t text-center py-5 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Grand-Stay. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
