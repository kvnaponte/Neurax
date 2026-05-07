// Profile screen.

function ProfileScreen({ user, onLevels, onLogout }) {
  const lv = levelFor(user.xp);
  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 26, color: T.text, marginBottom: 18 }}>Perfil</div>

      <Card padding={18} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar level={lv.n} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Kevin Aponte</div>
            <div style={{ fontSize: 12, color: T.textDim }}>kvnaponte6@gmail.com</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '3px 10px', borderRadius: 999, background: `${lv.color}25`, border: `1px solid ${lv.color}50`, color: lv.color, fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: lv.color }} /> Nivel {lv.n} · {lv.name}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
          <Stat label="XP Total" value={user.xp} />
          <Stat label="Actividades" value="23" />
          <Stat label="Mejor racha" value="12d" />
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row icon={<IconShield stroke={T.purple} />} label="Tu Progreso" sub={`Nivel ${lv.n} · ${lv.name}`} onClick={onLevels} />
        <Row icon={<IconTrophy stroke={T.gold} />} label="Logros desbloqueados" sub="4 de 9" />
        <Row icon={<IconBell stroke={T.blue} />} label="Notificaciones" sub="Activadas" />
        <Row icon={<IconUser stroke={T.pink} />} label="Cuenta y privacidad" />
        <Row icon={<IconBolt stroke={T.green} />} label="Sincronizar dispositivos" />
        <Row icon={<IconX stroke={T.red} />} label="Cerrar sesión" onClick={onLogout} danger />
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: T.textMute, marginTop: 22, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>
        IMBATIBLE v1.0.4
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: `1px solid ${T.border}` }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 18, color: T.gold }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textDim }}>{label}</div>
    </div>
  );
}

function Row({ icon, label, sub, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      background: 'rgba(20,21,46,0.5)', border: `1px solid ${T.border}`,
      borderRadius: 12, cursor: 'pointer', width: '100%', textAlign: 'left',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? T.red : T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{sub}</div>}
      </div>
      <IconChevron size={16} stroke={T.textMute} />
    </button>
  );
}

window.ProfileScreen = ProfileScreen;
