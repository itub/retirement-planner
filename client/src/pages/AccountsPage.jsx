import { useState, useEffect } from 'react';
import api from '../lib/api';

const TYPES = [
  { value: '401k', label: '401(k)' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'savings', label: 'Savings / Cash' },
  { value: 'pension', label: 'Pension' },
];

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

const EMPTY = {
  name: '', account_type: '401k', current_balance: '',
  annual_contribution: '', employer_match_pct: '',
  employer_match_limit_pct: '', owner: 'primary',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/accounts').then(r => setAccounts(r.data));
  useEffect(() => { load(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/accounts/${editing}`, form);
      } else {
        await api.post('/accounts', form);
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (acct) => {
    setForm({
      name: acct.name,
      account_type: acct.account_type,
      current_balance: acct.current_balance,
      annual_contribution: acct.annual_contribution,
      employer_match_pct: acct.employer_match_pct,
      employer_match_limit_pct: acct.employer_match_limit_pct,
      owner: acct.owner,
    });
    setEditing(acct.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    await api.delete(`/accounts/${id}`);
    load();
  };

  const handleCancel = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Accounts</h1>
          <p>Add all your retirement and investment accounts.</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Account</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 32, borderTop: '3px solid var(--gold)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24 }}>{editing ? 'Edit Account' : 'New Account'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="field">
                <label className="label">Account Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fidelity 401k" required />
              </div>
              <div className="field">
                <label className="label">Account Type</label>
                <select name="account_type" value={form.account_type} onChange={handleChange}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Current Balance ($)</label>
                <input name="current_balance" type="number" min="0" value={form.current_balance} onChange={handleChange} placeholder="250000" required />
              </div>
              <div className="field">
                <label className="label">Annual Contribution ($)</label>
                <input name="annual_contribution" type="number" min="0" value={form.annual_contribution} onChange={handleChange} placeholder="23000" />
              </div>
              <div className="field">
                <label className="label">Employer Match (%)</label>
                <input name="employer_match_pct" type="number" min="0" max="100" value={form.employer_match_pct} onChange={handleChange} placeholder="50" />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>e.g. 50 = employer matches 50¢ per $1</div>
              </div>
              <div className="field">
                <label className="label">Match Limit (% of salary)</label>
                <input name="employer_match_limit_pct" type="number" min="0" max="100" value={form.employer_match_limit_pct} onChange={handleChange} placeholder="6" />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>e.g. 6 = match applies up to 6% of salary</div>
              </div>
              <div className="field">
                <label className="label">Owner</label>
                <select name="owner" value={form.owner} onChange={handleChange}>
                  <option value="primary">Primary</option>
                  <option value="spouse">Spouse</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Account' : 'Add Account'}</button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⬡</div>
          <p>No accounts yet. Add your first account to get started.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
              Total: <strong>{fmt(totalBalance)}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {accounts.map(acct => (
              <div key={acct.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className={`chip chip-${acct.account_type.replace('_', '')}`}>{typeLabel(acct.account_type)}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '15px' }}>{acct.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                      {fmt(acct.annual_contribution)}/yr contribution
                      {acct.employer_match_pct > 0 && ` · ${acct.employer_match_pct}% employer match`}
                      {acct.owner === 'spouse' && ' · Spouse'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600 }}>{fmt(acct.current_balance)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>current balance</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ fontSize: '13px', padding: '7px 14px' }} onClick={() => handleEdit(acct)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(acct.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function typeLabel(type) {
  const map = { '401k': '401k', traditional_ira: 'IRA', roth_ira: 'Roth', brokerage: 'Brokerage', savings: 'Savings', pension: 'Pension' };
  return map[type] || type;
}
