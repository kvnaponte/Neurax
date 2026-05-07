// Login screen — épico, dark.

function LoginScreen({ onLogin }) {
  const [mode, setMode] = React.useState('login'); // 'login' | 'register'
  const [email, setEmail] = React.useState('kevin@imbatible.app');
  const [password, setPassword] = React.useState('••••••••');
  const [name, setName] = React.useState('');

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'auto',
      background: 'radial-gradient(ellipse at 50% 0%, #1a0d3d 0%, #07061a 70%)',
      padding: '40px 28px',
    }}>
      <StarField density={25} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <svg width="60" height="68" viewBox="0 0 160 180">
            <defs>
              <linearGradient id="login-shield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" /><stop offset="60%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="login-gem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path d="M30 50 L80 40 L130 50 L130 110 Q130 145 80 165 Q30 145 30 110 Z" fill="url(#login-shield)" stroke="#92400e" strokeWidth="2" />
            <polygon points="80,80 100,100 80,124 60,100" fill="url(#login-gem)" stroke="#fde68a" strokeWidth="1.5" />
          </svg>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 22, letterSpacing: 2,
            background: 'linear-gradient(180deg, #fde68a, #b45309)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginTop: 10,
          }}>IMBATIBLE</div>
        </div>

        <Card padding={20} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 10, marginBottom: 18 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: mode === m ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
                color: mode === m ? '#fff' : T.textDim,
                fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif',
              }}>{m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button>
            ))}
          </div>

          {mode === 'register' && (
            <Field label="Nombre del héroe" value={name} onChange={setName} placeholder="Kevin Aponte" />
          )}
          <Field label="Email" value={email} onChange={setEmail} placeholder="tu@email.com" />
          <Field label="Contraseña" value={password} onChange={setPassword} type="password" />

          <div style={{ marginTop: 18 }}>
            <PrimaryButton onClick={onLogin} icon={<IconSword size={16} stroke="#fff" />}>
              {mode === 'login' ? 'Entrar al reino' : 'Iniciar aventura'}
            </PrimaryButton>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ color: T.textMute, fontSize: 11, letterSpacing: 1, fontFamily: 'Cinzel, serif' }}>O</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <button onClick={onLogin} style={{
            width: '100%', padding: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: T.text, fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
          }}>
            <IconGoogle size={18} stroke="#fff" />
            Continuar con Google
          </button>
        </Card>

        <div style={{ textAlign: 'center', fontSize: 12, color: T.textMute, marginTop: 8 }}>
          {mode === 'login' ? '¿Olvidaste tu contraseña?' : 'Al registrarte aceptas los términos'}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,132,251,0.2)',
          borderRadius: 10, color: T.text, fontSize: 15, outline: 'none',
          fontFamily: 'Inter, sans-serif',
        }}
      />
    </div>
  );
}

window.LoginScreen = LoginScreen;
