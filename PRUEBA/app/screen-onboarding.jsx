// Onboarding splash — sistema imbatible reveal.

function OnboardingScreen({ onContinue }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 30%, #1a0d3d 0%, #07061a 60%, #04050f 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <StarField density={50} />
      {/* glow orb */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 60%)',
        filter: 'blur(20px)',
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', position: 'relative', zIndex: 1 }}>
        {/* Big shield emblem */}
        <div style={{ marginBottom: 32, animation: 'fadeUp 0.8s ease-out' }}>
          <svg width="160" height="180" viewBox="0 0 160 180">
            <defs>
              <linearGradient id="hero-shield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="hero-gem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            {/* sword */}
            <path d="M80 6 L86 60 L80 70 L74 60 Z" fill="url(#hero-shield)" stroke="#92400e" strokeWidth="1" />
            <rect x="68" y="58" width="24" height="4" fill="#92400e" />
            {/* shield body */}
            <path d="M30 50 L80 40 L130 50 L130 110 Q130 145 80 165 Q30 145 30 110 Z" fill="url(#hero-shield)" stroke="#92400e" strokeWidth="2" />
            {/* shield inner border */}
            <path d="M40 60 L80 52 L120 60 L120 108 Q120 138 80 154 Q40 138 40 108 Z" fill="none" stroke="rgba(146,64,14,0.6)" strokeWidth="1.5" />
            {/* gem */}
            <polygon points="80,80 100,100 80,124 60,100" fill="url(#hero-gem)" stroke="#fde68a" strokeWidth="1.5" />
            <polygon points="80,80 100,100 80,108 60,100" fill="rgba(255,255,255,0.25)" />
            {/* wings */}
            <path d="M30 50 Q10 60 8 80 Q24 70 30 70 Z" fill="url(#hero-shield)" />
            <path d="M130 50 Q150 60 152 80 Q136 70 130 70 Z" fill="url(#hero-shield)" />
          </svg>
        </div>

        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: 6,
          color: T.gold, opacity: 0.85, marginBottom: 4,
          animation: 'fadeUp 1s ease-out 0.2s backwards',
        }}>SISTEMA</div>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 44,
          background: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 50%, #b45309 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 2, lineHeight: 1, marginBottom: 18,
          textShadow: '0 4px 30px rgba(251,191,36,0.4)',
          animation: 'fadeUp 1s ease-out 0.3s backwards',
        }}>IMBATIBLE</div>

        <div style={{
          color: T.text, fontSize: 16, textAlign: 'center', maxWidth: 280,
          opacity: 0.85, lineHeight: 1.45, marginBottom: 40,
          animation: 'fadeUp 1s ease-out 0.5s backwards',
        }}>Convierte tu vida diaria<br />en una aventura épica</div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 36, animation: 'fadeUp 1s ease-out 0.7s backwards' }}>
          {[
            { icon: <IconBolt color={T.purple} stroke={T.purpleSoft} />, label: 'Gana XP', color: T.purple },
            { icon: <IconFlame color={T.orange} stroke="#fb923c" />, label: 'Rachas', color: T.orange },
            { icon: <IconArrow stroke="#60a5fa" />, label: 'Sube', color: T.blue },
            { icon: <IconTrophy stroke={T.gold} />, label: 'Logros', color: T.gold },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: `linear-gradient(160deg, ${p.color}30, ${p.color}10)`,
                border: `1px solid ${p.color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.color,
              }}>{p.icon}</div>
              <div style={{ fontSize: 11, color: T.textDim }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 28px 36px', position: 'relative', zIndex: 1, animation: 'fadeUp 1s ease-out 0.9s backwards' }}>
        <PrimaryButton onClick={onContinue} icon={<IconSword size={18} stroke="#fff" />}>
          Comenzar mi aventura
        </PrimaryButton>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: T.textMute, fontFamily: 'Cinzel, serif', letterSpacing: 1.5 }}>
          ¡TÚ ELIGES TU LEYENDA!
        </div>
      </div>
    </div>
  );
}

window.OnboardingScreen = OnboardingScreen;
