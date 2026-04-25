import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import api from '../lib/api';

const fmt = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

function StatCard({ label, value, sub, accentColor, icon }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${accentColor || 'var(--orange)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="label">{label}</div>
        {icon && <span style={{ fontSize: '20px', opacity: 0.35 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--charcoal)', margin: '6px 0 4px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function typeLabel(type) {
  return { '401k': '401k', traditional_ira: 'IRA', roth_ira: 'Roth', brokerage: 'Brokerage', savings: 'Savings', pension: 'Pension' }[type] || type;
}

function chipClass(type) {
  return `chip chip-${type === 'traditional_ira' ? 'traditionalira' : type === 'roth_ira' ? 'rothira' : type}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/plan').catch(() => ({ data: null })),
      api.get('/accounts').catch(() => ({ data: [] })),
    ]).then(([p, a]) => {
      setPlan(p.data);
      setAccounts(a.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (plan && accounts.length > 0) {
      api.get('/simulation/run').then(r => setSim(r.data)).catch(() => {});
    }
  }, [plan, accounts]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0);
  const yearsToRetirement = plan ? Number(plan.retirement_age) - Number(plan.current_age) : null;
  const isSetup = plan && accounts.length > 0;

  if (loading) return <div style={{ color: 'var(--muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]}</h1>
        <p>Here's a snapshot of your retirement plan.</p>
      </div>

      {!isSetup && (
        <div className="card" style={{ borderLeft: '4px solid var(--orange)', marginBottom: 32, background: '#fff8f5' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, color: 'var(--orange-dark)' }}>Get started in 3 steps</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 18, fontSize: '14px' }}>
            Add your accounts and fill in your plan to unlock your first simulation.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/accounts"><button className="btn-primary">1. Add accounts</button></Link>
            <Link to="/plan"><button className="btn-secondary">2. Set your plan</button></Link>
            <Link to="/simulation"><button className="btn-secondary">3. Run simulation</button></Link>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard label="Total Portfolio" value={fmt(totalBalance)} sub={`across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} accentColor="var(--orange)" icon="◈" />
        <StatCard label="Years to Retirement" value={yearsToRetirement ?? '—'} sub={plan ? `Retiring at age ${plan.retirement_age}` : 'Set your plan'} accentColor="var(--blue-mid)" icon="⬡" />
        <StatCard
          label="Confidence Score"
          value={sim ? `${sim.confidenceScore}%` : '—'}
          sub={sim ? confidenceLabel(sim.confidenceScore) : 'Run simulation first'}
          accentColor={sim ? confidenceColor(sim.confidenceScore) : 'var(--muted)'}
          icon="◍"
        />
      </div>

      {plan && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <StatCard label="Annual Budget (Retirement)" value={fmt(plan.annual_retirement_budget)} sub="target spending / year" accentColor="#7c5cbf" />
          <StatCard label="Real Estate Equity" value={fmt(plan.real_estate_equity)} sub={plan.plan_to_sell_real_estate ? `Selling at age ${plan.real_estate_sale_age}` : 'Not including in plan'} accentColor="var(--success)" />
        </div>
      )}

      {accounts.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="section-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Accounts</h3>
            <Link to="/accounts" style={{ fontSize: '13px', color: 'var(--orange-dark)', fontWeight: 500 }}>Manage →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {accounts.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={chipClass(a.account_type)}>{typeLabel(a.account_type)}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{a.name}</span>
                  {a.owner === 'spouse' && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>(spouse)</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem' }}>{fmt(a.current_balance)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--charcoal)' }}>
                Total: <strong>{fmt(totalBalance)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
function confidenceLabel(s) {
  return s >= 90 ? 'Excellent — very likely to succeed' : s >= 75 ? 'Good — on track' : s >= 60 ? 'Fair — consider adjustments' : 'At risk — review your plan';
}
function confidenceColor(s) {
  return s >= 90 ? 'var(--success)' : s >= 75 ? 'var(--orange)' : s >= 60 ? '#d97706' : 'var(--danger)';
}
