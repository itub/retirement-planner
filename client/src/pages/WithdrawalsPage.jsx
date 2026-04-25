import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import api from '../lib/api';
import { useMobile } from '../hooks/useMediaQuery';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};
const fmtFull = (n) => n != null ? '$' + Math.round(n).toLocaleString() : '—';

const BUCKET_COLORS = { taxable: '#2d72c8', taxDeferred: '#f26419', roth: '#1a7a4a' };

function InfoBox({ children }) {
  return (
    <div style={{ background: 'var(--blue-light)', border: '1px solid #b8d4f8', borderRadius: 8, padding: '13px 16px', fontSize: '13px', color: 'var(--blue)', lineHeight: 1.65, marginBottom: 24 }}>
      {children}
    </div>
  );
}

export default function WithdrawalsPage() {
  const isMobile = useMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/simulation/withdrawals')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Could not load withdrawal schedule. Make sure your plan and accounts are saved.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--muted)', padding: '60px 0', textAlign: 'center' }}>Loading…</div>;
  if (error) return (
    <div>
      <div className="page-header"><h1>Withdrawal Strategy</h1></div>
      <div style={{ background: '#fff0ee', border: '1px solid #fdd', borderRadius: 8, padding: '14px 18px', color: 'var(--danger)', fontSize: '14px' }}>{error}</div>
    </div>
  );

  const { schedule, lifeExpectancyAge } = data;
  const retirementRows = schedule.filter(r => r.phase === 'retirement');

  const areaData = retirementRows.map(r => ({
    age: r.age,
    Taxable: r.taxable,
    'Tax-Deferred': r.taxDeferred,
    'Roth': r.roth,
  }));

  const barData = retirementRows.map(r => ({
    age: r.age,
    'SS Income': r.ssIncome,
    'Portfolio': r.withdrawal,
    'RMD': r.rmd,
  }));

  const peakRMD = retirementRows.reduce((max, r) => r.rmd > max ? r.rmd : max, 0);
  const firstRMDRow = retirementRows.find(r => r.rmd > 0);

  const chartH = isMobile ? 200 : 300;
  const chartM = isMobile
    ? { top: 5, right: 8, left: 0, bottom: 14 }
    : { top: 5, right: 20, left: 20, bottom: 14 };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: isMobile ? '1.6rem' : '2rem' }}>Withdrawal Strategy</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: '14px' }}>Tax-efficient drawdown, RMDs, and inflation-adjusted income sources.</p>
      </div>

      <InfoBox>
        <strong>Withdrawal order:</strong>{' '}
        <span style={{ color: BUCKET_COLORS.taxable, fontWeight: 600 }}>Taxable first</span> →{' '}
        <span style={{ color: BUCKET_COLORS.taxDeferred, fontWeight: 600 }}>Tax-deferred</span> →{' '}
        <span style={{ color: BUCKET_COLORS.roth, fontWeight: 600 }}>Roth last</span> (tax-free, no RMDs). Budget is inflation-adjusted in today's dollars each year.
      </InfoBox>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ borderTop: '3px solid var(--orange)' }}>
          <div className="label">Life Expectancy</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 600, margin: '6px 0 2px' }}>Age {lifeExpectancyAge}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>SSA 2021 actuarial tables</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--blue-mid)' }}>
          <div className="label">First RMD</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 600, margin: '6px 0 2px' }}>
            {firstRMDRow ? `Age ${firstRMDRow.age}` : 'None'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{firstRMDRow ? fmtFull(firstRMDRow.rmd) + '/yr (projected)' : 'No tax-deferred accounts'}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="label">Peak Annual RMD</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 600, margin: '6px 0 2px' }}>{fmt(peakRMD)}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>forced withdrawal at peak</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">Portfolio Buckets Over Time</h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>Taxable depletes first, Roth grows longest.</p>
        <ResponsiveContainer width="100%" height={chartH}>
          <AreaChart data={areaData} margin={chartM}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -6, fontSize: 11 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={isMobile ? 50 : 72} />
            <Tooltip formatter={v => fmt(v)} labelFormatter={l => `Age ${l}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Taxable"      stackId="1" stroke={BUCKET_COLORS.taxable}     fill={BUCKET_COLORS.taxable}     fillOpacity={0.75} />
            <Area type="monotone" dataKey="Tax-Deferred" stackId="1" stroke={BUCKET_COLORS.taxDeferred}  fill={BUCKET_COLORS.taxDeferred}  fillOpacity={0.75} />
            <Area type="monotone" dataKey="Roth"         stackId="1" stroke={BUCKET_COLORS.roth}         fill={BUCKET_COLORS.roth}         fillOpacity={0.75} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">Annual Income Sources</h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>Social security offsets portfolio draws. RMDs are mandatory minimums.</p>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 260}>
          <BarChart data={barData} margin={chartM}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -6, fontSize: 11 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={isMobile ? 50 : 72} />
            <Tooltip formatter={v => fmtFull(v)} labelFormatter={l => `Age ${l}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="SS Income" stackId="a" fill="#1a4f8a" />
            <Bar dataKey="Portfolio" stackId="a" fill="#f26419" />
            <Bar dataKey="RMD" stackId="a" fill="#f7934c" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="section-title">Year-by-Year Schedule</h3>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Age','Taxable','Tax-Deferred','Roth','Total','Budget (inflated)','SS Income','RMD','Draw'].map(h => (
                  <th key={h} style={{ padding: '9px 11px', fontWeight: 600, color: 'var(--muted)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retirementRows.map((r, i) => (
                <tr key={r.age} style={{ background: i % 2 === 0 ? 'white' : 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 11px', fontWeight: 600 }}>{r.age}</td>
                  <td style={{ padding: '8px 11px', color: BUCKET_COLORS.taxable }}>{fmt(r.taxable)}</td>
                  <td style={{ padding: '8px 11px', color: BUCKET_COLORS.taxDeferred }}>{fmt(r.taxDeferred)}</td>
                  <td style={{ padding: '8px 11px', color: BUCKET_COLORS.roth }}>{fmt(r.roth)}</td>
                  <td style={{ padding: '8px 11px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(r.total)}</td>
                  <td style={{ padding: '8px 11px', color: 'var(--slate)' }}>{r.inflatedBudget ? fmt(r.inflatedBudget) : '—'}</td>
                  <td style={{ padding: '8px 11px', color: 'var(--blue)' }}>{fmt(r.ssIncome)}</td>
                  <td style={{ padding: '8px 11px', color: r.rmd > 0 ? 'var(--orange-dark)' : 'var(--muted)' }}>{r.rmd > 0 ? fmt(r.rmd) : '—'}</td>
                  <td style={{ padding: '8px 11px' }}>{fmt(r.withdrawal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
