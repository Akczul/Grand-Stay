// ============================================================
// Toast - Notificaciones auto-descartables (RNF-F03)
// Cada toast desaparece luego de 5 segundos o con cierre manual
// ============================================================

import { useUI } from '../context/UIContext.jsx';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: { bar: '#4ade80', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  text: '#4ade80' },
  error:   { bar: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  text: '#f87171' },
  warning: { bar: '#fbbf24', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)',  text: '#fbbf24' },
  info:    { bar: '#c9a047', bg: 'rgba(201,160,71,0.10)', border: 'rgba(201,160,71,0.35)', text: '#e8d49c' },
};

const ToastItem = ({ toast, onRemove }) => {
  const style = STYLES[toast.type] || STYLES.info;
  const Icon = ICONS[toast.type] || Info;

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 shadow-2xl animate-slide-right"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        backdropFilter: 'blur(10px)',
        minWidth: '300px',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold progress bar at top */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: style.bar,
          animation: 'shrinkBar 5s linear forwards',
        }}
      />
      <Icon size={18} style={{ color: style.text, flexShrink: 0, marginTop: 1 }} />
      <span className="text-sm flex-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes shrinkBar {
          from { transform: scaleX(1); transform-origin: left; }
          to   { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>
    </div>
  );
};

const Toast = () => {
  const { toasts, removeToast } = useUI();
  if (!toasts.length) return null;

  return (
    <div
      style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999 }}
      className="flex flex-col gap-3"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default Toast;
