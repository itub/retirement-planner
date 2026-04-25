import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useMobile } from '../hooks/useMediaQuery';

const NAV = [
  { to: '/dashboard',   label: 'Overview',    icon: '⬡' },
  { to: '/accounts',    label: 'Accounts',    icon: '◈' },
  { to: '/plan',        label: 'My Plan',     icon: '◉' },
  { to: '/simulation',  label: 'Simulation',  icon: '◍' },
  { to: '/withdrawals', label: 'Withdrawals', icon: '↓' },
];

function EggLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <ellipse cx="28" cy="32" rx="20" ry="23" fill="#f26419"/>
      <ellipse cx="28" cy="30" rx="14" ry="17" fill="#f7934c" opacity="0.45"/>
      <ellipse cx="22" cy="22" rx="5" ry="4" fill="rgba(255,255,255,0.18)" transform="rotate(-20 22 22)"/>
    </svg>
  );
}

function MobileNav({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); onClose(); };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,86,0.55)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 50,
        background: 'linear-gradient(180deg, #0f2d56 0%, #1a4f8a 100%)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>

        <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EggLogo size={28} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'white', fontWeight: 600 }}>NestEgg</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', padding: '0 4px', lineHeight: 1, fontFamily: 'var(--font-body)' }}>×</button>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              fontSize: '14px', fontWeight: isActive ? '600' : '400',
              background: isActive ? 'rgba(242,100,25,0.22)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--orange)' : '3px solid transparent',
              textDecoration: 'none',
            })}>
              <span style={{ fontSize: '16px', opacity: 0.8 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--orange)' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white' }}>{user?.name?.[0]}</div>
            }
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

function MobileHeader({ onMenuOpen }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'linear-gradient(90deg, #0f2d56, #1a4f8a)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 54, flexShrink: 0,
      boxShadow: '0 2px 10px rgba(15,45,86,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <EggLogo size={24} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'white', fontWeight: 600 }}>NestEgg</span>
      </div>
      <button
        onClick={onMenuOpen}
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '7px 10px', cursor: 'pointer', color: 'white', display: 'flex', flexDirection: 'column', gap: 4 }}
        aria-label="Open menu"
      >
        <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
        <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
        <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
      </button>
    </header>
  );
}

/* Bottom tab bar for mobile */
function BottomNav() {
  const SHORT = [
    { to: '/dashboard',  label: 'Home',   icon: '⬡' },
    { to: '/accounts',   label: 'Accts',  icon: '◈' },
    { to: '/plan',       label: 'Plan',   icon: '◉' },
    { to: '/simulation', label: 'Sim',    icon: '◍' },
    { to: '/withdrawals',label: 'Draw',   icon: '↓' },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      background: 'white', borderTop: '1px solid var(--border)',
      display: 'flex', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {SHORT.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 4px 6px', textDecoration: 'none',
          color: isActive ? 'var(--orange)' : 'var(--muted)',
          borderTop: isActive ? '2px solid var(--orange)' : '2px solid transparent',
          fontSize: '10px', fontWeight: isActive ? '600' : '400',
          gap: 2,
        })}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
        {drawerOpen && <MobileNav onClose={() => setDrawerOpen(false)} />}
        <main style={{ flex: 1, padding: '20px 16px 80px', overflowX: 'hidden' }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 228, flexShrink: 0,
        background: 'linear-gradient(180deg, #0f2d56 0%, #1a4f8a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EggLogo size={32} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'white', fontWeight: 600, lineHeight: 1 }}>NestEgg</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Retirement Planner</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11, padding: '11px 24px',
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              fontSize: '13.5px', fontWeight: isActive ? '600' : '400',
              background: isActive ? 'rgba(242,100,25,0.22)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--orange)' : '3px solid transparent',
              textDecoration: 'none', transition: 'all 0.13s',
            })}>
              <span style={{ fontSize: '15px', opacity: 0.85 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--orange)' }} />
              : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white' }}>{user?.name?.[0]}</div>
            }
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px', fontSize: '12px', fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.13s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '44px 52px', maxWidth: 1100, overflowX: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}
