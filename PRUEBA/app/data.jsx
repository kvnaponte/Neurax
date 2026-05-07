// Static data tables and helpers.

const LEVELS = [
  { n: 1, name: 'Superviviente', min: 0,    max: 99,   color: '#34d399', accent: '#10b981', desc: 'Inicio del camino' },
  { n: 2, name: 'Aprendiz',      min: 100,  max: 249,  color: '#fb923c', accent: '#f97316', desc: 'Primeros pasos' },
  { n: 3, name: 'Guerrero',      min: 250,  max: 499,  color: '#a855f7', accent: '#7c3aed', desc: 'En camino hacia la grandeza' },
  { n: 4, name: 'Veterano',      min: 500,  max: 999,  color: '#60a5fa', accent: '#3b82f6', desc: 'Consistencia probada' },
  { n: 5, name: 'Campeón',       min: 1000, max: 1999, color: '#f472b6', accent: '#ec4899', desc: 'Dominio absoluto' },
  { n: 6, name: 'Imbatible',     min: 2000, max: 9999, color: '#fbbf24', accent: '#f59e0b', desc: '¡La leyenda eres tú!' },
];

const ACTIVITY_TYPES = [
  { id: 'sleep',     label: 'Sueño',       icon: 'IconMoon',      color: '#818cf8', bg: 'rgba(129,140,248,0.15)', xpRate: 10, unit: 'h', requirement: '7-9h óptimas' },
  { id: 'exercise',  label: 'Ejercicio',   icon: 'IconRun',       color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  xpRate: 1.5,unit: 'min', requirement: 'Mín. 30 min' },
  { id: 'study',     label: 'Estudio',     icon: 'IconBook',      color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  xpRate: 1,  unit: 'min', requirement: 'Sin mínimo' },
  { id: 'work',      label: 'Trabajo',     icon: 'IconBriefcase', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  xpRate: 0.5,unit: 'min', requirement: 'Sin mínimo' },
  { id: 'transport', label: 'Transporte',  icon: 'IconBus',       color: '#34d399', bg: 'rgba(52,211,153,0.15)',  xpRate: 0.2,unit: 'min', requirement: 'Reducido' },
  { id: 'music',     label: 'Música',      icon: 'IconMusic',     color: '#f472b6', bg: 'rgba(244,114,182,0.15)', xpRate: 0.25,unit: 'min', requirement: 'Máx. 2h/día' },
  { id: 'meditate',  label: 'Meditación',  icon: 'IconSparkle',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  xpRate: 2,  unit: 'min', requirement: 'Bonus' },
  { id: 'sun',       label: 'Sol matutino',icon: 'IconSun',       color: '#fcd34d', bg: 'rgba(252,211,77,0.15)',  xpRate: 1.5,unit: 'min', requirement: 'Antes 8 AM' },
];

const TODAY_ACTIVITIES = [
  { id: 1, type: 'sleep',    time: '22:30 – 06:30', duration: '8h 0m',  xp: 80, done: true },
  { id: 2, type: 'exercise', time: '07:00 – 07:45', duration: '45 min', xp: 65, done: true },
  { id: 3, type: 'study',    time: '09:00 – 10:30', duration: '90 min', xp: 90, done: true },
  { id: 4, type: 'work',     time: '11:00 – 14:00', duration: '3h 0m',  xp: 90, done: false, current: true },
  { id: 5, type: 'music',    time: '20:00 – 21:00', duration: '60 min', xp: 15, done: false },
];

const ACHIEVEMENTS = [
  { id: 'consistent', title: 'Consistencia Diaria', desc: 'Completa actividades 5 días consecutivos', icon: 'IconFlame', color: '#fb923c', xp: 100, unlocked: true, featured: true },
  { id: 'first',      title: 'Primer Paso',         desc: 'Registra tu primera actividad',           icon: 'IconBolt',  color: '#a855f7', xp: 25,  unlocked: true },
  { id: 'morning',    title: 'Madrugador',          desc: 'Registra actividad antes de las 8 AM',     icon: 'IconSun',   color: '#fbbf24', xp: 50,  unlocked: true },
  { id: 'study10',    title: 'Estudioso',           desc: 'Estudia 10 horas en total',                icon: 'IconBook',  color: '#a855f7', xp: 75,  unlocked: true },
  { id: 'gym7',       title: 'Guerrero del Gym',    desc: 'Ejercítate 7 días seguidos',               icon: 'IconDumbbell', color: '#a855f7', progress: 5, total: 7 },
  { id: 'work20',     title: 'Trabajador',          desc: 'Trabaja 20 horas en total',                icon: 'IconBriefcase', color: '#fbbf24', progress: 12, total: 20 },
  { id: 'marathon',   title: 'Maratonista',         desc: 'Registra 50 actividades',                  icon: 'IconCrown',  color: '#fbbf24', progress: 23, total: 50 },
  { id: 'sleep7',     title: 'Bien Descansado',     desc: 'Duerme 7+ horas durante 5 días',           icon: 'IconMoon',  color: '#818cf8', progress: 3, total: 5 },
  { id: 'meditate',   title: 'Mente Clara',         desc: 'Medita 10 días',                           icon: 'IconSparkle', color: '#fbbf24', progress: 2, total: 10 },
];

const WEEK_BARS = [
  { day: 'L', xp: 45 }, { day: 'M', xp: 62 }, { day: 'X', xp: 38 },
  { day: 'J', xp: 71 }, { day: 'V', xp: 54 }, { day: 'S', xp: 23 }, { day: 'D', xp: 27 },
];

const DISTRIBUTION = [
  { label: 'Físicas',    pct: 35, color: '#a855f7' },
  { label: 'Económicas', pct: 30, color: '#60a5fa' },
  { label: 'Rutinas',    pct: 20, color: '#fbbf24' },
  { label: 'Otras',      pct: 15, color: '#34d399' },
];

function levelFor(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function activityType(id) {
  return ACTIVITY_TYPES.find(a => a.id === id) || ACTIVITY_TYPES[0];
}

Object.assign(window, {
  LEVELS, ACTIVITY_TYPES, TODAY_ACTIVITIES, ACHIEVEMENTS, WEEK_BARS, DISTRIBUTION,
  levelFor, activityType,
});
