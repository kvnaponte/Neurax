// Bottom navigation bar.

function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'home',    label: 'Inicio',       icon: IconHome },
    { id: 'acts',    label: 'Actividades',  icon: IconList },
    { id: 'stats',   label: 'Estadísticas', icon: IconStats },
    { id: 'achv',    label: 'Logros',       icon: IconTrophy },
    { id: 'profile', label: 'Perfil',       icon: IconUser },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 24,
      background: 'linear-gradient(180deg, rgba(7,8,24,0.6), rgba(7,8,24,0.95))',
      backdropFilter: 'blur(14px)',
      borderTop: `1px solid ${T.border}`,
      padding: '8px 6px 6px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 10,
    }}>
      {tabs.map(t => {
        const Icn = t.icon;
        const sel = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
            color: sel ? window.T_TOKENS.purpleSoft : window.T_TOKENS.textMute,
          }}>
            <div style={{
              width: 36, height: 28, borderRadius: 14,
              background: sel ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(124,58,237,0.15))' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: sel ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
            }}>
              <Icn size={20} sw={sel ? 2.2 : 1.8} />
            </div>
            <span style={{ fontSize: 10, fontWeight: sel ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

window.BottomNav = BottomNav;
