// Main app — orchestrates screens, state, navigation, animations.

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "currentXP": 350
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [route, setRoute] = useState('onboarding'); // onboarding | login | main | levels
  const [tab, setTab] = useState('home');
  const [xp, setXP] = useState(tweaks.currentXP);
  const [activities, setActivities] = useState(TODAY_ACTIVITIES);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [bursts, setBursts] = useState([]);
  const [animatingXP, setAnimatingXP] = useState(false);

  // Sync tweak slider into live xp.
  useEffect(() => { setXP(tweaks.currentXP); }, [tweaks.currentXP]);

  const user = { xp, activities };

  function handleConfirmActivity(gained, typeId) {
    setRegisterOpen(false);
    const prevLv = levelFor(xp).n;
    const newXP = xp + gained;
    setXP(newXP);
    setTweak('currentXP', newXP);
    setAnimatingXP(true);
    setTimeout(() => setAnimatingXP(false), 1200);

    // burst from center
    const id = Date.now();
    setBursts(b => [...b, { id, xp: gained, x: 160, y: 220 }]);

    // mark a not-done activity of that type as done; if none, push new
    setActivities(prev => {
      const idx = prev.findIndex(a => a.type === typeId && !a.done);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], done: true, current: false, xp: gained };
        return copy;
      }
      return [...prev, {
        id: Date.now(), type: typeId, time: 'Ahora', duration: '—', xp: gained, done: true,
      }];
    });

    // detect level up
    const newLv = levelFor(newXP).n;
    if (newLv > prevLv) {
      setTimeout(() => setLevelUp(newLv), 800);
    }
  }

  function clearBurst(id) {
    setBursts(b => b.filter(x => x.id !== id));
  }

  let screen;
  if (route === 'main') {
    if (tab === 'home') screen = <DashboardScreen user={user} animatingXP={animatingXP} onRegister={() => setRegisterOpen(true)} onTab={setTab} />;
    else if (tab === 'acts') screen = <ActivitiesScreen user={user} onRegister={() => setRegisterOpen(true)} />;
    else if (tab === 'stats') screen = <StatsScreen user={user} />;
    else if (tab === 'achv') screen = <AchievementsScreen user={user} />;
    else if (tab === 'profile') screen = <ProfileScreen user={user} onLevels={() => setRoute('levels')} onLogout={() => setRoute('login')} />;
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#04050f', color: T.text, fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* ambient stars on app shell */}
      {(route === 'main' || route === 'levels') && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
          <StarField density={20} />
        </div>
      )}

      {route === 'onboarding' && <OnboardingScreen onContinue={() => setRoute('login')} />}
      {route === 'login' && <LoginScreen onLogin={() => setRoute('main')} />}
      {route === 'levels' && <LevelsScreen user={user} onBack={() => setRoute('main')} />}
      {route === 'main' && (
        <>
          <div style={{ position: 'absolute', inset: '0 0 0 0', overflow: 'auto' }}>
            {screen}
          </div>
          <BottomNav active={tab} onChange={setTab} />
        </>
      )}

      {bursts.map(b => <XPBurst key={b.id} {...b} onDone={() => clearBurst(b.id)} />)}
      {registerOpen && <RegisterModal onClose={() => setRegisterOpen(false)} onConfirm={handleConfirmActivity} />}
      {levelUp && <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Experiencia">
          <TweakSlider label="XP Actual" value={tweaks.currentXP} min={0} max={2400} step={10} unit=" XP"
            onChange={v => setTweak('currentXP', v)} />
        </TweakSection>
        <TweakSection label="Acciones">
          <TweakButton label="Registrar actividad" onClick={() => setRegisterOpen(true)} />
          <TweakButton label="Probar level up" onClick={() => setLevelUp(Math.min(6, levelFor(xp).n + 1))} secondary />
          <TweakButton label="Ir a Onboarding" onClick={() => setRoute('onboarding')} secondary />
          <TweakButton label="Ir a Login" onClick={() => setRoute('login')} secondary />
          <TweakButton label="Ver pantalla Niveles" onClick={() => setRoute('levels')} secondary />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <PhoneShell><App /></PhoneShell>
);
