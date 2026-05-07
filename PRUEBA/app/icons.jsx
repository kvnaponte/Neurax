// SVG icons used across the app. Stroke-based, gold/purple themed.

const Icon = ({ d, size = 24, stroke = 'currentColor', fill = 'none', sw = 1.8, children, vb = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const IconHome     = (p) => <Icon {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Icon>;
const IconList     = (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" fill="currentColor" /><circle cx="3.5" cy="12" r="1.2" fill="currentColor" /><circle cx="3.5" cy="18" r="1.2" fill="currentColor" /></Icon>;
const IconStats    = (p) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>;
const IconTrophy   = (p) => <Icon {...p}><path d="M8 4h8v4a4 4 0 11-8 0V4z" /><path d="M4 5h4v3a2 2 0 01-4 0V5zM16 5h4v3a2 2 0 01-4 0V5z" /><path d="M9 13v3M15 13v3M7 20h10M10 16h4v4h-4z" /></Icon>;
const IconUser     = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></Icon>;
const IconBell     = (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0v5l2 3H4l2-3V8z" /><path d="M10 19a2 2 0 004 0" /></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>;
const IconShare    = (p) => <Icon {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11l8-4M8 13l8 4" /></Icon>;
const IconArrow    = (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const IconBack     = (p) => <Icon {...p}><path d="M19 12H5M11 19l-7-7 7-7" /></Icon>;
const IconChevron  = (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
const IconPlus     = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
const IconCheck    = (p) => <Icon {...p}><path d="M5 12l5 5L20 7" /></Icon>;
const IconX        = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
const IconLock     = (p) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></Icon>;
const IconFlame    = (p) => <Icon {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 .5 2 1.5 2 2 1-1-2 0-5 1-7z" /></Icon>;
const IconBolt     = (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Icon>;
const IconShield   = (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></Icon>;
const IconCrown    = (p) => <Icon {...p}><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" /></Icon>;
const IconSword    = (p) => <Icon {...p}><path d="M14 4h6v6L8 22l-3-3L14 4z" /><path d="M5 16l3 3M14 9l1 1" /></Icon>;
const IconSeed     = (p) => <Icon {...p}><path d="M12 3c5 0 8 4 8 9-5 0-8-3-8-9z" /><path d="M12 3c-5 0-8 4-8 9 5 0 8-3 8-9z" /><path d="M12 12v9" /></Icon>;
const IconMoon     = (p) => <Icon {...p}><path d="M20 14A8 8 0 1110 4a6 6 0 0010 10z" /></Icon>;
const IconRun      = (p) => <Icon {...p}><circle cx="14" cy="4" r="2" /><path d="M5 21l3-6 4 1 1-5-3-2-4 3M13 14l3 2v5M9 9l-3 1" /></Icon>;
const IconBook     = (p) => <Icon {...p}><path d="M4 5a3 3 0 013-3h13v18H7a3 3 0 00-3 3V5z" /><path d="M4 5a3 3 0 003 3h13" /></Icon>;
const IconBriefcase= (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></Icon>;
const IconMusic    = (p) => <Icon {...p}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></Icon>;
const IconBus      = (p) => <Icon {...p}><rect x="4" y="3" width="16" height="14" rx="2" /><path d="M4 11h16M8 17v3M16 17v3" /><circle cx="8" cy="14" r="1" fill="currentColor" /><circle cx="16" cy="14" r="1" fill="currentColor" /></Icon>;
const IconDumbbell = (p) => <Icon {...p}><path d="M2 12h2M20 12h2M6 8v8M18 8v8M9 6v12M15 6v12M9 12h6" /></Icon>;
const IconSun      = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></Icon>;
const IconSparkle  = (p) => <Icon {...p}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></Icon>;
const IconEye      = (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconGoogle   = (p) => <Icon {...p} sw={0}><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-1 2.4-2 3.1v2.6h3.3c2-1.8 3-4.6 3-7.5z" /><path fill="#fff" opacity=".7" d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H2.9v2.6A10 10 0 0012 22z" /></Icon>;

Object.assign(window, {
  Icon, IconHome, IconList, IconStats, IconTrophy, IconUser, IconBell, IconCalendar,
  IconShare, IconArrow, IconBack, IconChevron, IconPlus, IconCheck, IconX, IconLock,
  IconFlame, IconBolt, IconShield, IconCrown, IconSword, IconSeed,
  IconMoon, IconRun, IconBook, IconBriefcase, IconMusic, IconBus, IconDumbbell, IconSun,
  IconSparkle, IconEye, IconGoogle,
});
