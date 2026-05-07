// Register Activity modal — bottom sheet.

function RegisterModal({ onClose, onConfirm }) {
  const [type, setType] = React.useState('study');
  const [duration, setDuration] = React.useState(60);

  const t = activityType(type);
  const xp = Math.round(duration * t.xpRate);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: 'rgba(4, 5, 15, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.2s',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'linear-gradient(180deg, #11122a, #07061a)',
        borderTop: `1px solid ${T.borderStrong}`,
        borderRadius: '20px 20px 0 0', padding: '14px 18px 24px',
        boxShadow: '0 -10px 40px rgba(168,85,247,0.2)',
        animation: 'slideUp 0.3s cubic-bezier(.2,.7,.2,1)',
        maxHeight: '85%', overflow: 'auto',
      }}>
        <div style={{ width: 44, height: 4, background: T.textMute, borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 20, color: T.text }}>Nueva Actividad</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.05)', color: T.textDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconX size={16} /></button>
        </div>

        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontFamily: 'Cinzel, serif', letterSpacing: 1.5, fontWeight: 600 }}>TIPO DE ACTIVIDAD</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {ACTIVITY_TYPES.map(a => {
            const Icn = window[a.icon];
            const sel = type === a.id;
            return (
              <button key={a.id} onClick={() => setType(a.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 4px', cursor: 'pointer',
                background: sel ? `linear-gradient(160deg, ${a.color}30, ${a.color}10)` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${sel ? a.color + '80' : T.border}`,
                borderRadius: 12,
                boxShadow: sel ? `0 0 14px ${a.color}50` : 'none',
              }}>
                <div style={{ color: a.color }}><Icn size={20} /></div>
                <div style={{ fontSize: 10, color: sel ? T.text : T.textDim, fontWeight: 600 }}>{a.label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontFamily: 'Cinzel, serif', letterSpacing: 1.5, fontWeight: 600 }}>DURACIÓN ({t.unit === 'h' ? 'HORAS' : 'MINUTOS'})</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 8 }}>
          <button onClick={() => setDuration(Math.max(5, duration - 15))} style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
            background: 'rgba(255,255,255,0.04)', color: T.text, cursor: 'pointer', fontSize: 18, fontWeight: 700,
          }}>−</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 38, color: t.color }}>{duration}</div>
            <div style={{ fontSize: 11, color: T.textDim }}>{t.unit === 'h' ? 'horas' : 'minutos'}</div>
          </div>
          <button onClick={() => setDuration(duration + 15)} style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
            background: 'rgba(255,255,255,0.04)', color: T.text, cursor: 'pointer', fontSize: 18, fontWeight: 700,
          }}>+</button>
        </div>
        <div style={{ fontSize: 11, color: T.textMute, marginBottom: 14, textAlign: 'center' }}>Requisito: {t.requirement}</div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 14, marginBottom: 18,
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(168,85,247,0.1))',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'Cinzel, serif', letterSpacing: 1.5, fontWeight: 600 }}>RECOMPENSA</div>
            <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>Por completar esta actividad</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ color: T.gold }}>+</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 32, color: T.gold, textShadow: '0 0 12px rgba(251,191,36,0.5)' }}>{xp}</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: T.gold }}>XP</span>
          </div>
        </div>

        <PrimaryButton onClick={() => onConfirm(xp, type)} icon={<IconSword size={16} stroke="#fff" />}>
          Registrar y ganar XP
        </PrimaryButton>
      </div>
    </div>
  );
}

window.RegisterModal = RegisterModal;
