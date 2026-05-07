// Stats screen — donut + bars + distribution.

function StatsScreen({ user }) {
  const [period, setPeriod] = React.useState('Esta semana');
  const [animPct, setAnimPct] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setAnimPct(1), 100);
    return () => clearTimeout(t);
  }, []);

  const totalThisWeek = 320;
  const maxBar = Math.max(...WEEK_BARS.map(b => b.xp));

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 26, color: T.text }}>Estadísticas</div>
        <button style={{
          padding: '8px 12px', borderRadius: 10,
          background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`,
          color: T.text, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer',
        }}>{period} <IconChevron size={12} stroke={T.textDim} /></button>
      </div>

      {/* Big donut chart */}
      <Card padding={20} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="donut-purple" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
              <linearGradient id="donut-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
              <linearGradient id="donut-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient>
              <linearGradient id="donut-green" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
            </defs>
            {(() => {
              let acc = 0;
              const cx = 100, cy = 100, r = 78, sw = 22;
              return DISTRIBUTION.map((d, i) => {
                const start = acc; acc += d.pct * animPct;
                const end = acc;
                const a1 = (start / 100) * Math.PI * 2 - Math.PI / 2;
                const a2 = (end / 100) * Math.PI * 2 - Math.PI / 2;
                const large = end - start > 50 ? 1 : 0;
                const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
                const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
                const grad = ['donut-purple', 'donut-blue', 'donut-gold', 'donut-green'][i];
                if (end - start < 0.1) return null;
                return <path key={i}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                  stroke={`url(#${grad})`} strokeWidth={sw} fill="none" strokeLinecap="round"
                  style={{ transition: 'all 0.8s cubic-bezier(.2,.7,.2,1)' }}
                />;
              });
            })()}
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 1.5, fontFamily: 'Cinzel, serif', fontWeight: 600 }}>XP TOTAL</div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 38,
              background: 'linear-gradient(180deg, #fde68a, #fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{totalThisWeek}</div>
            <div style={{
              padding: '2px 8px', borderRadius: 999, marginTop: 4,
              background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
              color: T.green, fontSize: 10, fontWeight: 700,
            }}>+18% vs semana pasada</div>
          </div>
        </div>
      </Card>

      {/* 3 mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Card padding={12}>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>Días activos</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 22, color: T.text }}>6/7</div>
        </Card>
        <Card padding={12}>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>Actividades</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 22, color: T.text }}>18</div>
        </Card>
        <Card padding={12}>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>XP promedio</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 22, color: T.text }}>53.3</div>
        </Card>
      </div>

      {/* Weekly bars */}
      <Card padding={16} style={{ marginBottom: 14 }}>
        <SectionLabel>XP por día</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 4 }}>
          {WEEK_BARS.map((b, i) => {
            const h = (b.xp / maxBar) * 100 * animPct;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${h}%`,
                    background: i === 4 ? 'linear-gradient(180deg, #fbbf24, #f59e0b)' : 'linear-gradient(180deg, #a855f7, #7c3aed)',
                    borderRadius: 6,
                    boxShadow: i === 4 ? '0 0 12px rgba(251,191,36,0.5)' : '0 0 8px rgba(168,85,247,0.3)',
                    transition: 'height 0.8s cubic-bezier(.2,.7,.2,1)',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: i === 4 ? T.gold : T.textDim, fontWeight: 600 }}>{b.day}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Distribution */}
      <Card padding={16}>
        <SectionLabel>Distribución por tipo</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {(() => {
              let acc = 0;
              const cx = 50, cy = 50, r = 36;
              return DISTRIBUTION.map((d, i) => {
                const start = acc; acc += d.pct * animPct; const end = acc;
                const a1 = (start / 100) * Math.PI * 2 - Math.PI / 2;
                const a2 = (end / 100) * Math.PI * 2 - Math.PI / 2;
                const large = end - start > 50 ? 1 : 0;
                const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
                const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
                if (end - start < 0.1) return null;
                return <path key={i}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={d.color}
                  style={{ transition: 'all 0.8s cubic-bezier(.2,.7,.2,1)' }}
                />;
              });
            })()}
            <circle cx="50" cy="50" r="18" fill="#11122a" />
          </svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISTRIBUTION.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ flex: 1, fontSize: 13, color: T.textDim }}>{d.label}</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, color: T.text }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

window.StatsScreen = StatsScreen;
