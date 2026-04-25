import { useState, useEffect } from 'react';
import api from '../lib/api';

const SS_AGES = [62, 63, 64, 65, 66, 67, 68, 69, 70];

function Section({ title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--orange-light)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--charcoal)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SliderField({ label, name, value, min, max, step, format, hint, onChange }) {
  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--orange)' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range" name={name} min={min} max={max} step={step}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', height: 6, appearance: 'none', background: `linear-gradient(to right, var(--orange) 0%, var(--orange) ${((value - min) / (max - min)) * 100}%, var(--border) ${((value - min) / (max - min)) * 100}%, var(--border) 100%)`,
          borderRadius: 99, outline: 'none', cursor: 'pointer', border: 'none', padding: 0,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>
        <span>{format(min)}</span>
        {hint && <span style={{ color: 'var(--blue)', fontStyle: 'italic' }}>{hint}</span>}
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

const pct = (v) => `${(Number(v) * 100).toFixed(1)}%`;

export default function PlanPage() {
  const [form, setForm] = useState({
    current_age: 40, current_income: '', retirement_age: 65,
    has_spouse: false,
    spouse_current_age: '', spouse_current_income: '', spouse_retirement_age: 65,
    annual_retirement_budget: 80000,
    real_estate_equity: 0, plan_to_sell_real_estate: false, real_estate_sale_age: '',
    ss_draw_age: 67, ss_monthly_estimate: 0,
    spouse_ss_draw_age: 67, spouse_ss_monthly_estimate: 0,
    inflation_rate: 0.03,
    income_growth_rate: 0.02,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/plan').then(r => {
      if (r.data) setForm(f => ({ ...f, ...r.data }));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setSaved(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/plan', form);
      setSaved(true);
    } finally { setSaving(false); }
  };

  if (!loaded) return <div style={{ color: 'var(--muted)', padding: '60px 0', textAlign: 'center' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 740 }}>
      <div className="page-header">
        <h1>My Plan</h1>
        <p>Configure your retirement inputs. All dollar amounts are in today's dollars — inflation adjusts them automatically.</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* You */}
        <Section title="About You">
          <div className="grid-3">
            <div className="field">
              <label className="label">Current Age</label>
              <input name="current_age" type="number" min="18" max="80" value={form.current_age} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="label">Annual Income ($)</label>
              <input name="current_income" type="number" min="0" value={form.current_income} onChange={handleChange} placeholder="120000" required />
            </div>
            <div className="field">
              <label className="label">Retirement Age</label>
              <input name="retirement_age" type="number" min="50" max="80" value={form.retirement_age} onChange={handleChange} required />
            </div>
          </div>
        </Section>

        {/* Spouse */}
        <Section title="Spouse / Partner">
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              <input type="checkbox" name="has_spouse" checked={form.has_spouse} onChange={handleChange} style={{ width: 'auto', accentColor: 'var(--orange)' }} />
              Include a spouse or partner
            </label>
          </div>
          {form.has_spouse && (
            <div className="grid-3">
              <div className="field">
                <label className="label">Spouse Age</label>
                <input name="spouse_current_age" type="number" min="18" max="80" value={form.spouse_current_age} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Spouse Income ($)</label>
                <input name="spouse_current_income" type="number" min="0" value={form.spouse_current_income} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Spouse Retirement Age</label>
                <input name="spouse_retirement_age" type="number" min="50" max="80" value={form.spouse_retirement_age} onChange={handleChange} />
              </div>
            </div>
          )}
        </Section>

        {/* Budget */}
        <Section title="Retirement Budget" subtitle="Enter in today's dollars — the simulation grows this by your inflation assumption each year.">
          <div className="field" style={{ maxWidth: 300 }}>
            <label className="label">Annual Spending in Retirement ($)</label>
            <input name="annual_retirement_budget" type="number" min="0" value={form.annual_retirement_budget} onChange={handleChange} required />
          </div>
        </Section>

        {/* Economic Assumptions — NEW */}
        <Section title="Economic Assumptions" subtitle="These drive how the simulation adjusts for purchasing power and salary growth over time.">
          <div className="grid-2">
            <SliderField
              label="Inflation Rate"
              name="inflation_rate"
              value={Number(form.inflation_rate)}
              min={0.01} max={0.08} step={0.001}
              format={pct}
              hint="Fed target: 2.0%"
              onChange={handleChange}
            />
            <SliderField
              label="Income Growth Rate"
              name="income_growth_rate"
              value={Number(form.income_growth_rate)}
              min={0.00} max={0.08} step={0.001}
              format={pct}
              hint="Historical avg: ~2%"
              onChange={handleChange}
            />
          </div>

          {/* Context cards */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            {[
              { label: 'Conservative', inf: '2.0%', inc: '1.5%', desc: 'Low inflation, slow wage growth' },
              { label: 'Base Case',    inf: '3.0%', inc: '2.0%', desc: 'Historical US averages' },
              { label: 'Elevated',     inf: '4.5%', inc: '3.0%', desc: '1970s-style stagflation scenario' },
            ].map(({ label, inf, inc, desc }) => (
              <button
                key={label} type="button"
                onClick={() => {
                  setForm(f => ({ ...f, inflation_rate: parseFloat(inf) / 100, income_growth_rate: parseFloat(inc) / 100 }));
                  setSaved(false);
                }}
                style={{
                  background: 'var(--bg)', border: '1.5px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left', flex: '1 1 160px',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = '#fff8f5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 500 }}>Inflation {inf} · Income {inc}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Real estate */}
        <Section title="Real Estate">
          <div className="grid-2">
            <div className="field">
              <label className="label">Home Equity ($)</label>
              <input name="real_estate_equity" type="number" min="0" value={form.real_estate_equity} onChange={handleChange} placeholder="0" />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px', fontWeight: 500, marginBottom: 20 }}>
                <input type="checkbox" name="plan_to_sell_real_estate" checked={form.plan_to_sell_real_estate} onChange={handleChange} style={{ width: 'auto', accentColor: 'var(--orange)' }} />
                Plan to sell and add equity to portfolio
              </label>
            </div>
          </div>
          {form.plan_to_sell_real_estate && (
            <div className="field" style={{ maxWidth: 200 }}>
              <label className="label">Planned Sale Age</label>
              <input name="real_estate_sale_age" type="number" min="50" max="100" value={form.real_estate_sale_age} onChange={handleChange} />
            </div>
          )}
        </Section>

        {/* Social Security */}
        <Section title="Social Security" subtitle="Find your estimated monthly benefit at ssa.gov/myaccount — enter the amount at your full retirement age (67).">
          <div className="grid-2">
            <div className="field">
              <label className="label">Your Monthly Estimate ($)</label>
              <input name="ss_monthly_estimate" type="number" min="0" value={form.ss_monthly_estimate} onChange={handleChange} placeholder="2400" />
            </div>
            <div className="field">
              <label className="label">Age to Start Drawing</label>
              <select name="ss_draw_age" value={form.ss_draw_age} onChange={handleChange}>
                {SS_AGES.map(a => (
                  <option key={a} value={a}>{a}{a === 62 ? ' — earliest (-30%)' : a === 67 ? ' — full retirement age' : a === 70 ? ' — maximum (+24%)' : ''}</option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 5 }}>
                Each year before 67 reduces benefit ~6–8%. Each year after 67 adds ~8%.
              </div>
            </div>
          </div>
          {form.has_spouse && (
            <div className="grid-2" style={{ marginTop: 8 }}>
              <div className="field">
                <label className="label">Spouse Monthly Estimate ($)</label>
                <input name="spouse_ss_monthly_estimate" type="number" min="0" value={form.spouse_ss_monthly_estimate} onChange={handleChange} placeholder="1800" />
              </div>
              <div className="field">
                <label className="label">Spouse Draw Age</label>
                <select name="spouse_ss_draw_age" value={form.spouse_ss_draw_age} onChange={handleChange}>
                  {SS_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}
        </Section>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 40 }}>
          <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: 130, padding: '12px 24px' }}>
            {saving ? 'Saving…' : 'Save Plan'}
          </button>
          {saved && (
            <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#1a7a4a"/><path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
