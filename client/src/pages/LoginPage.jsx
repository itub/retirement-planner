export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2d56 0%, #1a4f8a 60%, #2d72c8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: 480, height: 480, borderRadius: '50%',
        background: 'rgba(242,100,25,0.12)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-60px',
        width: 320, height: 320, borderRadius: '50%',
        background: 'rgba(242,100,25,0.08)', pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px', position: 'relative' }}>
        {/* Egg + wordmark */}
        <div style={{ marginBottom: 36 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 14 }}>
            <ellipse cx="28" cy="32" rx="20" ry="23" fill="#f26419"/>
            <ellipse cx="28" cy="30" rx="14" ry="17" fill="#f7934c" opacity="0.45"/>
            <ellipse cx="22" cy="22" rx="5" ry="4" fill="rgba(255,255,255,0.18)" transform="rotate(-20 22 22)"/>
          </svg>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'white', letterSpacing: '-0.01em', lineHeight: 1 }}>NestEgg</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>Retirement Planner</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          borderRadius: 18, padding: '40px 36px',
        }}>
          <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', marginBottom: 10, fontSize: '1.6rem', fontWeight: 600 }}>
            Plan your future
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '14px', marginBottom: 32, lineHeight: 1.75 }}>
            Monte Carlo simulations, tax-smart withdrawals, and social security modeling — all in one place.
          </p>

          <a href={`${import.meta.env.VITE_API_URL || ''}/auth/google`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'white', color: '#222',
            borderRadius: 10, padding: '14px 24px',
            fontWeight: 600, fontSize: '14px', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.32)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.7 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.7l6.2 5.2C40.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </a>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 28 }}>
            {['Monte Carlo', 'Roth Conversion', 'RMDs', 'Social Security', 'Tax-Smart'].map(f => (
              <span key={f} style={{
                background: 'rgba(242,100,25,0.18)', color: 'rgba(255,255,255,0.75)',
                borderRadius: 99, padding: '4px 12px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em',
              }}>{f}</span>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '12px', marginTop: 24 }}>
          Your financial data is encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
