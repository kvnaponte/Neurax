// Level up overlay — épico celebration.

function LevelUpOverlay({ level, onClose }) {
  const lv = LEVELS[level - 1];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: `radial-gradient(circle at 50% 40%, ${lv.color}40 0%, rgba(4,5,15,0.95) 60%)`,
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s',
    }} onClick={onClose}>
      <StarField density={40} />
      {/* light rays */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i}
            d={`M 200 400 L ${200 + Math.cos(i * Math.PI / 6) * 600} ${400 + Math.sin(i * Math.PI / 6) * 600}`}
            stroke={lv.color} strokeOpacity="0.15" strokeWidth="40"
            style={{ animation: `rayPulse 2.4s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </svg>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 24, animation: 'popIn 0.6s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14, letterSpacing: 4, color: T.gold, marginBottom: 8 }}>¡SUBISTE DE NIVEL!</div>
        <div style={{ marginBottom: 16, filter: `drop-shadow(0 0 30px ${lv.color})` }}>
          <HexBadge level={level} size={140} />
        </div>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 36,
          background: `linear-gradient(180deg, #fde68a, ${lv.color})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 1, marginBottom: 6,
        }}>{lv.name}</div>
        <div style={{ fontSize: 14, color: T.textDim, marginBottom: 24 }}>{lv.desc}</div>
        <div style={{ padding: '0 30px' }}>
          <PrimaryButton onClick={onClose} icon={<IconSword size={16} stroke="#fff" />}>
            Continuar la aventura
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

window.LevelUpOverlay = LevelUpOverlay;
