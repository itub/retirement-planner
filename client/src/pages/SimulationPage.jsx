import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import api from '../lib/api';
import { useMobile } from '../hooks/useMediaQuery';

const fmt = (n) => {
  if (n == null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

function ConfidenceMeter({ score }) {
  const color = score >= 90 ? '#1a7a4a' : score >= 75 ? '#f26419' : score >= 60 ? '#d97706' : '#c0392b';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk';
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${color}` }}>
      <div className="label" style={{ marginBottom: 12 }}>Monte Carlo Confidence Score</div>
      <svg viewBox="0 0 120 120" width="140" height="140" style={{ margin: '0 auto 14px', display: 'block' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${circumference * score / 100} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="60" y="57" textAnchor="middle" fontSize="24" fontWeight="700" fill={color} fontFamily="Fraunces, serif">{score}%</text>
        <text x="60" y="74" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Sora, sans-serif">{label}</text>
      </svg>
      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.65 }}>
        <strong style={{ color }}>{score}%</strong> of 1,000 simulations don't run out of money by your estimated life expectancy.
      </p>
    </div>
  );
}

function GlidePath() {
  const phases = [
    { label: 'Pre-Retirement', stocks: 60, bonds: 40 },
    { label: 'Early Retirement', stocks: 40, bonds: 60 },
    { label: 'Age 75+', stocks: 20, bonds: 80 },
  ];
  return (
    <div className="card">
      <h3 className="section-title">Asset Allocation Glide Path</h3>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.65 }}>
        Rebalanced annually to the target weights. Shifts from growth to capital preservation as you age.
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {phases.map(({ label, stocks, bonds }) => (
          <div key={label} style={{ flex: '1 1 150px' }}>
            <div className="label" style={{ marginBottom: 8 }}>{label}</div>
            <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 7 }}>
              <div style={{ width: `${stocks}%`, background: 'var(--orange)' }} />
              <div style={{ width: `${bonds}%`, background: 'var(--blue-mid)' }} />
            </div>
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{stocks}% stocks</span>
              {' · '}
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{bonds}% bonds</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const isMobile = useMobile();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/simulation/run');
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Simulation failed. Make sure your plan and accounts are saved.');
    } finally { setLoading(false); }
  };

  const scenarioData = result
    ? result.scenarios.average.map((row, i) => ({
        age: row.age,
        Good: result.scenarios.good[i]?.value,
        Average: row.value,
        Poor: result.scenarios.poor[i]?.value,
      }))
    : [];

  const chartHeight = isMobile ? 220 : 320;
  const chartMargin = isMobile ? { top: 5, right: 8, left: 0, bottom: 14 } : { top: 5, right: 20, left: 20, bottom: 14 };

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.6rem' : '2rem' }}>Simulation</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: '14px' }}>Monte Carlo with inflation, annual rebalancing, and RMDs.</p>
        </div>
        <button className="btn-primary" onClick={run} disabled={loading} style={{ minWidth: 140, padding: '11px 20px' }}>
          {loading ? '⟳ Running…' : result ? '↺ Re-run' : '▶ Run Simulation'}
        </button>
      </div>

      {error && <div style={{ background: '#fff0ee', border: '1px solid #fdd', borderRadius: 8, padding: '14px 18px', marginBottom: 20, color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}

      {!result && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '64px 32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>◍</div>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 10 }}>Ready to run</h3>
          <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0 auto 24px', fontSize: '14px', lineHeight: 1.75 }}>
            1,000 simulations with randomized returns, your inflation assumption, annual rebalancing, and tax-efficient withdrawals.
          </p>
          <button className="btn-primary" onClick={run} style={{ padding: '12px 32px' }}>Run Simulation</button>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>Running 1,000 simulations…</div>
          <div className="progress-track" style={{ maxWidth: 280, margin: '0 auto' }}>
            <div className="progress-fill" style={{ width: '70%', background: 'var(--orange)', animation: 'slide 1.4s ease-in-out infinite' }} />
          </div>
          <style>{`@keyframes slide{from{transform:translateX(-120%)}to{transform:translateX(200%)}}`}</style>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <ConfidenceMeter score={result.confidenceScore} />
            <div className="card">
              <div className="label" style={{ marginBottom: 14 }}>Summary at Age {result.lifeExpectancyAge}</div>
              {[
                { label: 'Life Expectancy',      value: `Age ${result.lifeExpectancyAge}`, color: null },
                { label: 'Good Market',           value: fmt(result.scenarios.good.at(-1)?.value),    color: '#1a7a4a' },
                { label: 'Average Market',        value: fmt(result.scenarios.average.at(-1)?.value), color: 'var(--orange)' },
                { label: 'Poor Market',           value: fmt(result.scenarios.poor.at(-1)?.value),    color: 'var(--danger)' },
                { label: 'Median Monte Carlo',    value: fmt(result.monteCarlo.at(-1)?.p50),           color: 'var(--blue-mid)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--slate)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: color || 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Portfolio by Market Scenario</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 20 }}>Nominal returns minus your inflation rate. Annual rebalancing applied.</p>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={scenarioData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -6, fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={isMobile ? 52 : 68} />
                <Tooltip formatter={v => fmt(v)} labelFormatter={l => `Age ${l}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Good"    stroke="#1a7a4a" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="Average" stroke="#f26419" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Poor"    stroke="#c0392b" strokeWidth={2}   dot={false} strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="section-title">Monte Carlo Range (1,000 Simulations)</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 20 }}>Band = 10th–90th percentile. Center = median.</p>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={result.monteCarlo} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -6, fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={isMobile ? 52 : 68} />
                <Tooltip formatter={v => fmt(v)} labelFormatter={l => `Age ${l}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="p90" name="90th Pct" stroke="#b8d4f8" fill="#ddeeff" fillOpacity={0.6} strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="p50" name="Median"   stroke="#f26419" fill="transparent" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="p10" name="10th Pct" stroke="#f7934c" fill="white" fillOpacity={1} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <GlidePath />
        </div>
      )}
    </div>
  );
}
