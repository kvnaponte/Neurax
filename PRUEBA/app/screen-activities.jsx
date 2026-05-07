// Activities list screen — filter tabs + day groups.

function ActivitiesScreen({ user, onRegister }) {
  const [filter, setFilter] = React.useState('Todas');
  const filters = ['Todas', 'Físicas', 'Económicas', 'Rutinas'];

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 26, color: T.text }}>Actividades</div>
        <div style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)', color: T.purpleSoft,
        }}><IconCalendar size={18} /></div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 12, marginBottom: 18 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
            background: filter === f ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
            color: filter === f ? '#fff' : T.textDim,
            fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif',
            boxShadow: filter === f ? '0 4px 16px rgba(168,85,247,0.3)' : 'none',
          }}>{f}</button>
        ))}
      </div>

      {/* Day header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: 14, color: T.text }}>Hoy, 6 de mayo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.gold }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700 }}>3/5</span>
          <IconChevron size={14} stroke={T.gold} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {user.activities.map(a => <ActivityRow key={a.id} a={a} />)}
      </div>

      <div style={{ marginTop: 14 }}>
        <GhostButton onClick={onRegister} icon={<IconPlus size={16} stroke={T.textDim} />}>
          Agregar actividad
        </GhostButton>
      </div>

      {/* Yesterday summary */}
      <div style={{ marginTop: 24, marginBottom: 10, fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: 14, color: T.textDim }}>
        Ayer, 5 de mayo
      </div>
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>5 actividades completadas</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Día perfecto · Racha mantenida</div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
            color: T.green, fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13,
          }}>+285 XP</div>
        </div>
      </Card>
    </div>
  );
}

function ActivityRow({ a }) {
  const t = activityType(a.type);
  const Icn = window[t.icon];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      background: a.current ? `linear-gradient(135deg, ${t.bg}, rgba(20,21,46,0.4))` : 'rgba(20,21,46,0.5)',
      border: `1px solid ${a.current ? t.color + '50' : T.border}`,
      borderRadius: 14,
      boxShadow: a.current ? `0 0 20px ${t.color}30` : 'none',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: t.bg, border: `1px solid ${t.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: t.color,
      }}>
        <Icn size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{t.label}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: T.textMute }} />{a.time}
          </span>
          <span style={{ fontSize: 11, color: T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: T.textMute }} />{a.duration}
          </span>
        </div>
      </div>
      <div style={{
        fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14,
        color: a.done ? T.green : t.color,
      }}>+{a.xp} XP</div>
    </div>
  );
}

window.ActivitiesScreen = ActivitiesScreen;
