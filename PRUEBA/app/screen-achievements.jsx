// Achievements screen — featured + grid.

function AchievementsScreen({ user }) {
  const [tab, setTab] = React.useState('Todos');
  const tabs = ['Todos', 'Desbloqueados', 'Progreso'];

  const list = ACHIEVEMENTS.filter(a => {
    if (tab === 'Desbloqueados') return a.unlocked;
    if (tab === 'Progreso') return !a.unlocked;
    return true;
  });
  const featured = ACHIEVEMENTS.find(a => a.featured);
  const grid = list.filter(a => !a.featured);

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 26, color: T.text, marginBottom: 16 }}>Logros</div>

      <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 12, marginBottom: 18 }}>
        {tabs.map(f => (
          <button key={f} onClick={() => setTab(f)} style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
            background: tab === f ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
            color: tab === f ? '#fff' : T.textDim,
            fontWeight: 600, fontSize: 12,
          }}>{f}</button>
        ))}
      </div>

      {tab !== 'Progreso' && featured && (
        <Card gold padding={16} style={{ marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -10, right: -10, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.3), transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <FeaturedBadge color={featured.color} icon={featured.icon} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'Cinzel, serif' }}>{featured.title}</div>
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{featured.desc}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                color: T.green, fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12,
              }}>+{featured.xp} XP</div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconCheck size={14} stroke="#fff" sw={3} /></div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {grid.map(a => <AchievementCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function FeaturedBadge({ color, icon }) {
  const Icn = window[icon];
  return (
    <div style={{ position: 'relative', width: 64, height: 72 }}>
      <svg viewBox="0 0 64 72" width="64" height="72">
        <defs>
          <linearGradient id={`feat-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <polygon points="32,2 60,18 60,54 32,70 4,54 4,18" fill={`url(#feat-${color})`} stroke={color} strokeWidth="2" />
        <polygon points="32,10 53,22 53,50 32,62 11,50 11,22" fill="rgba(0,0,0,0.3)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', filter: `drop-shadow(0 0 6px ${color})`,
      }}><Icn size={28} stroke="#fff" sw={2} /></div>
    </div>
  );
}

function AchievementCard({ a }) {
  const Icn = window[a.icon];
  const locked = !a.unlocked && !a.progress;
  const inProgress = !a.unlocked && a.progress != null;

  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(168,132,251,0.06), rgba(20,21,46,0.6))',
      border: `1px solid ${a.unlocked ? 'rgba(251,191,36,0.25)' : T.border}`,
      borderRadius: 14, padding: 12,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: locked ? 0.5 : 1, position: 'relative',
    }}>
      <div style={{ position: 'relative', width: 48, height: 54, marginTop: 2 }}>
        <svg viewBox="0 0 64 72" width="48" height="54">
          <defs>
            <linearGradient id={`ach-${a.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a.color} stopOpacity={a.unlocked ? 0.9 : 0.4} />
              <stop offset="100%" stopColor={a.color} stopOpacity={a.unlocked ? 0.5 : 0.2} />
            </linearGradient>
          </defs>
          <polygon points="32,2 60,18 60,54 32,70 4,54 4,18" fill={`url(#ach-${a.id})`} stroke={a.color} strokeOpacity={a.unlocked ? 0.8 : 0.4} strokeWidth="1.5" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: a.unlocked ? '#fff' : a.color, opacity: locked ? 0.4 : 1,
        }}>
          {locked ? <IconLock size={18} stroke={T.textMute} /> : <Icn size={20} stroke="#fff" sw={2} />}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, textAlign: 'center', lineHeight: 1.2, fontFamily: 'Cinzel, serif' }}>{a.title}</div>
      <div style={{ fontSize: 9, color: T.textMute, textAlign: 'center', lineHeight: 1.2, minHeight: 22 }}>{a.desc}</div>
      {inProgress && (
        <>
          <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(a.progress / a.total) * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${a.color}, ${a.color}cc)`,
              borderRadius: 2,
            }} />
          </div>
          <div style={{ fontSize: 10, color: a.color, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>{a.progress}/{a.total}</div>
        </>
      )}
    </div>
  );
}

window.AchievementsScreen = AchievementsScreen;
