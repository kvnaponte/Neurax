// Levels / "Tu Progreso" screen.

function LevelsScreen({ user, onBack }) {
  const lv = levelFor(user.xp);

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
          background: 'rgba(0,0,0,0.3)', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}><IconBack size={18} /></button>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: 16, color: T.text }}>Tu Progreso</div>
        <button style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
          background: 'rgba(0,0,0,0.3)', color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}><IconShare size={16} /></button>
      </div>

      {/* Hero card */}
      <Card padding={18} style={{ marginBottom: 18, background: `linear-gradient(160deg, ${lv.color}25, rgba(20,21,46,0.6))`, borderColor: `${lv.color}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <HexBadge level={lv.n} size={68} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 26, color: lv.color }}>{lv.name}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2, lineHeight: 1.3 }}>{lv.desc}</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <XPBar value={user.xp - lv.min} max={lv.max - lv.min + 1} height={8} />
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: 'Cinzel, serif' }}>
            <span style={{ color: T.gold, fontWeight: 700 }}>{user.xp}</span> / {lv.max + 1} XP
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LEVELS.map(L => {
          const reached = user.xp >= L.min;
          const current = lv.n === L.n;
          return (
            <div key={L.n} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 14,
              background: current ? `linear-gradient(135deg, ${L.color}25, rgba(20,21,46,0.5))` : 'rgba(20,21,46,0.5)',
              border: `1px solid ${current ? L.color + '60' : T.border}`,
              borderRadius: 14,
              boxShadow: current ? `0 0 24px ${L.color}30` : 'none',
              opacity: reached ? 1 : 0.65,
            }}>
              <HexBadge level={L.n} size={42} glow={current} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 15, color: reached ? L.color : T.textDim }}>{L.name}</div>
                <div style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>{L.min} - {L.max === 9999 ? '∞' : L.max} XP</div>
              </div>
              {reached ? (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><IconCheck size={16} stroke="#fff" sw={3} /></div>
              ) : (
                <IconLock size={20} stroke={T.textMute} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.LevelsScreen = LevelsScreen;
