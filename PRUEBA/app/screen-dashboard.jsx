// Dashboard / Home screen — main hero view.

function DashboardScreen({ user, onRegister, onTab, animatingXP }) {
  const lv = levelFor(user.xp);
  const next = LEVELS[Math.min(lv.n, LEVELS.length - 1)];
  const xpInLevel = user.xp - lv.min;
  const xpForLevel = lv.max - lv.min + 1;
  const todayDone = user.activities.filter(a => a.done).length;
  const todayTotal = user.activities.length;

  return (
    <div style={{ padding: '14px 16px 90px', position: 'relative' }}>
      {/* Header — avatar, name, notif, XP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Avatar level={lv.n} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Kevin Aponte</div>
          <div style={{ fontSize: 12, color: lv.color, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: lv.color, boxShadow: `0 0 8px ${lv.color}` }} />
            {lv.name}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', color: T.textDim,
          }}><IconBell size={18} /></div>
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: T.red, color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid ' + T.bg,
          }}>3</div>
        </div>
        <XPChip xp={user.xp} />
      </div>

      {/* XP TOTAL hero card */}
      <Card padding={18} style={{ marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.5 }}>
          <HexBadge level={lv.n} size={120} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: T.textDim, fontFamily: 'Cinzel, serif', fontWeight: 600 }}>XP TOTAL</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 42,
              background: 'linear-gradient(180deg, #fde68a, #fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              transition: 'all 0.4s', textShadow: animatingXP ? '0 0 30px rgba(251,191,36,0.8)' : 'none',
            }}>{user.xp.toLocaleString()}</div>
            <span style={{ color: T.gold, fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 700 }}>XP</span>
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14 }}>
            Hasta nivel {lv.n + 1} ({LEVELS[Math.min(lv.n, 5)].name})
          </div>
          <XPBar value={xpInLevel} max={xpForLevel} height={10} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: T.textDim }}>
            <span>{lv.min} XP</span>
            <span style={{ color: T.gold, fontWeight: 600 }}>{user.xp} / {lv.max + 1} XP</span>
          </div>
        </div>
      </Card>

      {/* Streak row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <StreakCard label="RACHA ACTUAL" value="5" unit="días" caption="¡Sigue así!" color={T.orange} icon={<IconFlame stroke={T.orange} />} />
        <StreakCard label="MEJOR RACHA" value="12" unit="días" caption="¡Tu récord!" color={T.gold} icon={<IconTrophy stroke={T.gold} />} />
      </div>

      {/* Today activities */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Actividad de Hoy</SectionLabel>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 12, marginTop: -6 }}>{todayDone}/{todayTotal} actividades registradas</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
          {user.activities.map((a, i) => {
            const t = activityType(a.type);
            const Icn = window[t.icon];
            return (
              <React.Fragment key={a.id}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: a.done ? `linear-gradient(135deg, ${T.green}, #10b981)` : a.current ? t.bg : 'rgba(0,0,0,0.4)',
                  border: a.done ? '2px solid #10b981' : a.current ? `2px solid ${t.color}` : `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.done ? '#fff' : a.current ? t.color : T.textMute,
                  flexShrink: 0,
                  boxShadow: a.current ? `0 0 12px ${t.color}80` : 'none',
                }}>
                  {a.done ? <IconCheck size={18} stroke="#fff" sw={2.4} /> : <Icn size={16} />}
                </div>
                {i < user.activities.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: a.done ? T.green : 'rgba(168,132,251,0.15)', margin: '0 4px', borderRadius: 1 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <PrimaryButton onClick={onRegister} icon={<IconPlus size={18} stroke="#fff" sw={2.4} />}>
        Registrar Actividad
      </PrimaryButton>

      {/* Weekly summary */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel right={<button onClick={() => onTab('stats')} style={{ background: 'none', border: 'none', color: T.purpleSoft, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>Ver más <IconChevron size={14} /></button>}>
          Resumen Semanal
        </SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <MiniStat icon={<IconBolt size={14} stroke={T.purple} />} label="XP esta semana" value="320" />
          <MiniStat icon={<IconCalendar size={14} stroke={T.blue} />} label="Actividades" value="18" />
          <MiniStat icon={<IconArrow size={14} stroke={T.gold} />} label="Promedio" value="2.6" />
        </div>
      </div>
    </div>
  );
}

function StreakCard({ label, value, unit, caption, color, icon }) {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ color }}>{icon}</div>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.textDim, fontWeight: 600, fontFamily: 'Cinzel, serif' }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 28, color }}>{value}</div>
        <div style={{ fontSize: 13, color: T.textDim }}>{unit}</div>
      </div>
      <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{caption}</div>
    </Card>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
        {icon}<span style={{ fontSize: 10, color: T.textDim }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 18, color: T.text }}>{value}</div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
