// ============================================================
// Reportes - Schema Grand-Stay.sql (grandstay_db)
// Solo Administrador. Endpoints en /api/reports.
// ============================================================

import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Calendar,
  Sparkles, FileText, RefreshCw,
} from 'lucide-react';
import api from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';

const TABS = [
  { key: 'dashboard',  label: 'Dashboard',  icon: BarChart3 },
  { key: 'ocupacion',  label: 'Ocupación',  icon: Calendar },
  { key: 'ingresos',   label: 'Ingresos',   icon: TrendingUp },
  { key: 'servicios',  label: 'Servicios',  icon: Sparkles },
  { key: 'auditoria',  label: 'Auditoría',  icon: FileText },
];

const Reports = () => {
  const { toast } = useUI();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // filtros
  const now = new Date();
  const [mes, setMes]   = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const load = async () => {
    setLoading(true); setData(null);
    try {
      let url = '';
      const params = {};
      switch (tab) {
        case 'dashboard': url = '/api/reports/dashboard'; break;
        case 'ocupacion': url = '/api/reports/ocupacion'; params.mes = mes; params.anio = anio; break;
        case 'ingresos':  url = '/api/reports/ingresos';  params.mes = mes; params.anio = anio; break;
        case 'servicios': url = '/api/reports/servicios'; params.mes = mes; params.anio = anio; break;
        case 'auditoria': url = '/api/reports/auditoria'; break;
      }
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--gold)' }}>Reportes</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Indicadores y métricas operativas</p>
      </div>

      {/* Tabs */}
      <div className="card mb-6 p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                tab === key ? 'bg-yellow-500/15 text-yellow-300' : 'text-[var(--text-muted)]'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Period filters */}
      {(tab === 'ocupacion' || tab === 'ingresos' || tab === 'servicios') && (
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select value={mes} onChange={e => setMes(parseInt(e.target.value, 10))} className="input-field w-auto text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Mes {m}</option>)}
            </select>
            <input type="number" value={anio} onChange={e => setAnio(parseInt(e.target.value, 10))}
              className="input-field w-28 text-sm" />
            <button onClick={load} className="btn-gold text-sm py-2 px-4">
              <RefreshCw size={12} className="inline mr-1" /> Aplicar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }} />
        </div>
      )}

      {!loading && data && tab === 'dashboard'  && <DashboardView data={data} />}
      {!loading && data && tab === 'ocupacion'  && <SimpleTable rows={data} title="Ocupación" />}
      {!loading && data && tab === 'ingresos'   && <SimpleTable rows={data} title="Ingresos" moneyKeys={['total','subtotal','impuestos']} />}
      {!loading && data && tab === 'servicios'  && <SimpleTable rows={data} title="Servicios" moneyKeys={['total']} />}
      {!loading && data && tab === 'auditoria'  && <SimpleTable rows={data} title="Auditoría" />}
    </div>
  );
};

// ── Dashboard cards ──────────────────────────────────────
const DashboardView = ({ data }) => {
  const ocup = data.ocupacion_hoy || {};
  const stock = data.stock_critico || [];
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Users}      label="Check-ins hoy"  value={ocup.total_checkins_hoy ?? 0} />
        <KpiCard icon={DollarSign} label="Ingresos hoy"   value={`$${Number(ocup.ingresos_hoy ?? 0).toLocaleString('es-CO')}`} />
        <KpiCard icon={Calendar}   label="Reservas hoy"   value={data.reservas_hoy ?? 0} />
        <KpiCard icon={TrendingUp} label="Check-outs hoy" value={data.checkouts_hoy ?? 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-serif text-lg mb-3">Habitaciones por estado</h3>
          <div className="space-y-2">
            {(data.habitaciones_por_estado || []).map(r => (
              <div key={r.estado} className="flex justify-between text-sm">
                <span className="badge badge-neutral">{r.estado}</span>
                <span className="font-serif text-lg" style={{ color: 'var(--gold-light)' }}>{r.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-serif text-lg mb-3">Stock crítico</h3>
          {stock.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin alertas.</p>
          ) : (
            <div className="space-y-2">
              {stock.map(s => (
                <div key={s.id_insumo} className="flex justify-between text-sm">
                  <span>{s.nombre}</span>
                  <span style={{ color: '#f87171' }}>{s.stock_actual} / min {s.stock_minimo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const KpiCard = ({ icon: Icon, label, value }) => (
  <div className="card">
    <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--gold)' }}>
      <Icon size={13} />
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-serif text-3xl font-light" style={{ color: 'var(--text-primary)' }}>{value}</p>
  </div>
);

// ── Generic table ────────────────────────────────────────
const SimpleTable = ({ rows, title, moneyKeys = [] }) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin datos.</div>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="card overflow-x-auto p-0">
      <div className="px-4 pt-4 font-serif text-xl">{title}</div>
      <table className="luxury-table mt-3">
        <thead>
          <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {cols.map(c => {
                const v = r[c];
                const fmt = moneyKeys.includes(c) && v != null ? `$${Number(v).toLocaleString('es-CO')}` : v;
                return <td key={c} className="text-sm">{typeof v === 'object' ? JSON.stringify(v) : String(fmt ?? '—')}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
