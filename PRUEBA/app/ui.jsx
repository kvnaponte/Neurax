// Imbatible — shared UI primitives. Dark fantasy / RPG aesthetic.
// Color tokens injected globally via <style> in index.html.

const T = window.T_TOKENS = {
  bg:        '#070818',
  bgDeep:    '#04050f',
  panel:     '#11122a',
  panel2:    '#1a1c3a',
  border:    'rgba(168, 132, 251, 0.15)',
  borderStrong: 'rgba(168, 132, 251, 0.35)',
  text:      '#f5f3ff',
  textDim:   '#a5a3c4',
  textMute:  '#6b6a8a',
  purple:    '#a855f7',
  purpleDeep:'#7c3aed',
  purpleSoft:'#c084fc',
  gold:      '#fbbf24',
  goldDeep:  '#f59e0b',
  green:     '#34d399',
  red:       '#f87171',
  orange:    '#fb923c',
  blue:      '#60a5fa',
  pink:      '#f472b6',
};

// Hex / rune corner ornaments — gives the RPG card its personality.
const RuneCorner = ({ size = 16, color = T.gold, opacity = 0.7, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ opacity, ...style }}>
    <path d="M2 2 L6 2 L6 3 L3 3 L3 6 L2 6 Z" fill={color} />
    <circle cx="2.5" cy="2.5" r="0.8" fill={color} />
  </svg>
);

// Card — base panel with subtle gradient + inner border highlight.
function Card({ children, style, glow, gold, padding = 16, ...rest }) {
  const borderColor = gold ? 'rgba(251, 191, 36, 0.35)' : T.border;
  const bg = gold
    ? 'linear-gradient(160deg, rgba(251,191,36,0.08), rgba(124,58,237,0.04))'
    : 'linear-gradient(160deg, rgba(168,132,251,0.06), rgba(20,21,46,0.4))';
  return (
    <div {...rest} style={{
      position: 'relative',
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: 16,
      padding,
      boxShadow: glow
        ? `0 0 30px rgba(168, 132, 251, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)`
        : `inset 0 1px 0 rgba(255,255,255,0.04)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Hex badge — large level shield.
function HexBadge({ level, size = 76, glow = true }) {
  const lv = LEVELS[level - 1];
  const id = `hex-${level}-${size}`;
  const points = '50,4 92,28 92,72 50,96 8,72 8,28';
  return (
    <div style={{ position: 'relative', width: size, height: size, filter: glow ? `drop-shadow(0 0 12px ${lv.color}66)` : 'none' }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor={lv.color} />
            <stop offset="100%" stopColor={lv.accent} />
          </linearGradient>
          <linearGradient id={id + '-rim'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>
        <polygon points={points} fill={`url(#${id})`} stroke={`url(#${id}-rim)`} strokeWidth="2" />
        <polygon points="50,12 84,32 84,68 50,88 16,68 16,32" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <text x="50" y="62" textAnchor="middle" fontSize="38" fontFamily="Cinzel, serif" fontWeight="700" fill="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>{level}</text>
      </svg>
    </div>
  );
}

// Round XP pill (top-right of dashboard).
function XPChip({ xp }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(124,58,237,0.15))',
      border: '1px solid rgba(168,85,247,0.4)',
      borderRadius: 999, padding: '6px 12px 6px 8px',
      boxShadow: '0 0 20px rgba(168,85,247,0.2)',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700, color: '#fff',
      }}>XP</div>
      <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 15, color: T.gold, letterSpacing: 0.5 }}>{xp.toLocaleString()}</span>
    </div>
  );
}

// XP progress bar with shimmer.
function XPBar({ value, max, height = 8, glow = true }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{
      height, borderRadius: height / 2, background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(168,85,247,0.2)', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
        borderRadius: height / 2,
        boxShadow: glow ? '0 0 8px rgba(168,85,247,0.6)' : 'none',
        transition: 'width 0.6s cubic-bezier(.2,.7,.2,1)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          animation: 'shimmer 2.5s linear infinite',
        }} />
      </div>
    </div>
  );
}

// Section header — label with rune flourish.
function SectionLabel({ children, accent = T.purpleSoft, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{
        fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2.5, fontWeight: 600,
        color: accent, textTransform: 'uppercase',
      }}>{children}</div>
      {right}
    </div>
  );
}

// Primary action button — purple → violet with gold edge glow.
function PrimaryButton({ children, icon, onClick, full = true, glow = true, style }) {
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '14px 20px',
      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      border: '1px solid rgba(251,191,36,0.4)',
      borderRadius: 14,
      color: '#fff', fontWeight: 600, fontSize: 15,
      fontFamily: 'Inter, system-ui, sans-serif',
      cursor: 'pointer',
      boxShadow: glow ? '0 4px 20px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
      transition: 'transform 0.15s, box-shadow 0.15s',
      ...style,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon}{children}
    </button>
  );
}

function GhostButton({ children, icon, onClick, full = true, style }) {
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '12px 18px',
      background: 'transparent',
      border: '1px dashed rgba(168,132,251,0.35)',
      borderRadius: 14,
      color: T.textDim, fontWeight: 500, fontSize: 14,
      fontFamily: 'Inter, system-ui, sans-serif',
      cursor: 'pointer',
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// Floating XP particle that animates upward when activity registered.
function XPBurst({ xp, x, y, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 50,
      animation: 'xpFloat 1.5s ease-out forwards',
      fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 22,
      color: T.gold, textShadow: '0 0 12px rgba(251,191,36,0.8), 0 0 4px rgba(168,85,247,0.6)',
    }}>+{xp} XP</div>
  );
}

// Avatar — silhouette with hex frame & level badge.
function Avatar({ level = 3, size = 56, withRing = true }) {
  const lv = LEVELS[level - 1];
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: '50%',
      background: `conic-gradient(from 90deg, ${lv.color}, ${lv.accent}, ${lv.color})`,
      padding: withRing ? 2 : 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 35%, #2a1f4a, #0a0a1a)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {/* warrior silhouette */}
        <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id={`av-${level}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lv.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={lv.accent} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* head */}
          <ellipse cx="30" cy="22" rx="9" ry="10" fill={`url(#av-${level})`} />
          {/* shoulders / cloak */}
          <path d="M10 60 Q10 38 22 32 L38 32 Q50 38 50 60 Z" fill={`url(#av-${level})`} />
          {/* helm rim */}
          <path d="M21 18 Q30 14 39 18 L37 22 L23 22 Z" fill={lv.accent} opacity="0.6" />
          {/* eye glow */}
          <ellipse cx="27" cy="22" rx="1" ry="1.5" fill={T.gold} opacity="0.9" />
          <ellipse cx="33" cy="22" rx="1" ry="1.5" fill={T.gold} opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

// Animated star background — sparse, slow.
function StarField({ density = 30 }) {
  const stars = React.useMemo(() =>
    Array.from({ length: density }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 1.4 + 0.3,
      o: Math.random() * 0.6 + 0.2,
      d: Math.random() * 4 + 2,
    })), [density]);
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o}>
          <animate attributeName="opacity" values={`${s.o};${s.o * 0.2};${s.o}`} dur={`${s.d}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

Object.assign(window, {
  T, RuneCorner, Card, HexBadge, XPChip, XPBar, SectionLabel,
  PrimaryButton, GhostButton, XPBurst, Avatar, StarField,
});
