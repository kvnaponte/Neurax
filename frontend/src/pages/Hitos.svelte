<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { hitosAPI, usuariosAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';

	export let usuarioId: number;
	const dispatch = createEventDispatcher();

	let usuario: any = null;
	let hitos: any[] = [];
	let isLoading = true;
	let error: string | null = null;
	let tab: 'todos' | 'desbloqueados' | 'progreso' = 'todos';

	const CATALOGO = [
		{ id: 'consistencia', tipo: 'energia', titulo: 'Consistencia Diaria', desc: 'Completa 5 días consecutivos', xp: 100, icon: '🔥', color: '#f97316', meta: 5, key: 'racha_dias' },
		{ id: 'primer_paso', tipo: 'energia', titulo: 'Primer Paso', desc: 'Registra tu primera actividad', xp: 25, icon: '👣', color: '#a78bfa', meta: 1, key: 'actividades' },
		{ id: 'madrugador', tipo: 'disciplina', titulo: 'Madrugador', desc: 'Registra antes de las 8 AM', xp: 60, icon: '☀️', color: '#fde68a', meta: 1, key: 'madrugador' },
		{ id: 'estudioso', tipo: 'enfoque', titulo: 'Estudioso', desc: 'Estudia 10 horas en total', xp: 150, icon: '📖', color: '#a78bfa', meta: 600, key: 'minutos_estudio' },
		{ id: 'gym', tipo: 'energia', titulo: 'Guerrero del Gym', desc: 'Ejercítate 7 días seguidos', xp: 200, icon: '💪', color: '#22c55e', meta: 7, key: 'racha_ejercicio' },
		{ id: 'trabajador', tipo: 'disciplina', titulo: 'Trabajador', desc: 'Trabaja 20 horas en total', xp: 180, icon: '💼', color: '#f4c542', meta: 1200, key: 'minutos_trabajo' },
		{ id: 'maraton', tipo: 'enfoque', titulo: 'Maratonista', desc: 'Registra 50 actividades', xp: 250, icon: '👑', color: '#d946ef', meta: 50, key: 'actividades' },
		{ id: 'noctambulo', tipo: 'disciplina', titulo: 'Buen Sueño', desc: '7 noches de 7+ horas', xp: 140, icon: '🌙', color: '#38bdf8', meta: 7, key: 'noches_buenas' }
	];

	function handleLogout() { dispatch('logout'); }
	function navigate(p: string) { dispatch('navigate', p); }

	async function load() {
		try {
			isLoading = true;
			const [u, r] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				hitosAPI.obtener(usuarioId).catch(() => ({ data: [] }))
			]);
			usuario = u.data || u;
			hitos = (r.data || r || []) as any[];
		} catch (err: any) {
			error = err.message || 'Error';
			if ((err.message || '').includes('sesión inválida')) { localStorage.clear(); dispatch('logout'); }
		} finally {
			isLoading = false;
		}
	}

	function logroState(c: any): { unlocked: boolean; progress: number; current: number } {
		const unlocked = hitos.some(h => h.descripcion?.includes(c.titulo));
		let current = 0;
		if (c.key === 'racha_dias') current = usuario?.racha_dias || 0;
		else if (c.key === 'actividades') current = usuario?.actividades_total || hitos.length;
		else current = unlocked ? c.meta : Math.floor(Math.random() * c.meta * 0.7);
		const progress = Math.min(100, Math.round((current / c.meta) * 100));
		return { unlocked: unlocked || progress >= 100, progress, current };
	}

	$: visible = CATALOGO.filter(c => {
		const s = logroState(c);
		if (tab === 'desbloqueados') return s.unlocked;
		if (tab === 'progreso') return !s.unlocked;
		return true;
	});
	$: featured = CATALOGO[0];
	$: featuredState = featured ? logroState(featured) : null;

	onMount(load);
</script>

<div class="page">
	<header class="page-header">
		<h1 class="page-title">Logros</h1>
	</header>

	<div class="tabs">
		<button class="tab" class:active={tab === 'todos'} on:click={() => (tab = 'todos')}>Todos</button>
		<button class="tab" class:active={tab === 'desbloqueados'} on:click={() => (tab = 'desbloqueados')}>Desbloqueados</button>
		<button class="tab" class:active={tab === 'progreso'} on:click={() => (tab = 'progreso')}>En progreso</button>
	</div>

	{#if isLoading}
		<div class="center-screen"><div class="spinner"></div></div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else}
		{#if featured && featuredState}
			<article class="featured" style="--c:{featured.color}">
				<div class="ft-icon"><span>{featured.icon}</span></div>
				<div class="ft-body">
					<h2>{featured.titulo}</h2>
					<p>{featured.desc}</p>
				</div>
				<div class="ft-xp">+{featured.xp} XP</div>
				{#if featuredState.unlocked}
					<div class="ft-check" aria-label="Desbloqueado">✓</div>
				{/if}
			</article>
		{/if}

		<div class="grid">
			{#each visible.slice(1) as c}
				{@const s = logroState(c)}
				<article class="logro" class:locked={!s.unlocked} style="--c:{c.color}">
					<div class="logro-icon">
						<svg viewBox="0 0 60 64" width="56" height="60">
							<defs>
								<linearGradient id="lg-{c.id}" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="{s.unlocked ? c.color : '#3a2f5f'}"/>
									<stop offset="100%" stop-color="{s.unlocked ? c.color : '#1a1538'}" stop-opacity="0.5"/>
								</linearGradient>
							</defs>
							<polygon points="30,2 56,16 56,46 30,62 4,46 4,16" fill="url(#lg-{c.id})" stroke={s.unlocked ? '#f4c542' : '#3a2f5f'} stroke-width="2"/>
						</svg>
						<span class="logro-emoji">{c.icon}</span>
					</div>
					<h3 class="logro-title">{c.titulo}</h3>
					<p class="logro-desc">{c.desc}</p>
					{#if s.unlocked}
						<span class="badge unlocked">+{c.xp} XP ✓</span>
					{:else}
						<div class="progress-mini"><div class="progress-mini-fill" style="width:{s.progress}%"></div></div>
						<span class="progress-text text-mono">{s.current}/{c.meta}</span>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<Navbar {usuario} currentPage="hitos" on:navigate={(e) => navigate(e.detail)} on:logout={handleLogout} />

<style>
	.tabs {
		display: flex; gap: 0.4rem; padding: 4px;
		background: rgba(21, 16, 46, 0.5);
		border: 1px solid var(--border); border-radius: 14px;
		margin-bottom: 1rem;
	}
	.tab {
		flex: 1; padding: 0.55rem; background: transparent; border: none;
		color: var(--text-2); font-family: inherit; font-size: 0.78rem; font-weight: 700;
		border-radius: 10px; cursor: pointer;
	}
	.tab.active {
		background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(124,58,237,0.35));
		color: var(--text);
		box-shadow: 0 0 12px rgba(124,58,237,0.3);
	}

	.center-screen { display: grid; place-items: center; padding: 4rem 1rem; }

	.featured {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.85rem;
		align-items: center;
		padding: 1rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--c) 18%, transparent), transparent 70%),
			var(--surface);
		border: 1px solid var(--c);
		border-radius: 18px;
		margin-bottom: 1rem;
		position: relative;
		box-shadow: 0 0 24px color-mix(in oklch, var(--c) 18%, transparent);
	}
	.ft-icon {
		width: 56px; height: 56px;
		border-radius: 14px;
		background: color-mix(in oklch, var(--c) 22%, transparent);
		display: grid; place-items: center;
		font-size: 1.8rem;
	}
	.ft-body h2 { font-size: 1rem; font-weight: 800; margin-bottom: 0.15rem; }
	.ft-body p { font-size: 0.8rem; color: var(--text-2); }
	.ft-xp {
		font-family: 'Cinzel', serif; font-weight: 800; color: var(--c);
		background: color-mix(in oklch, var(--c) 18%, transparent);
		padding: 0.4rem 0.65rem; border-radius: 10px; font-size: 0.85rem;
	}
	.ft-check {
		position: absolute; top: 8px; right: 8px;
		width: 22px; height: 22px;
		background: var(--leaf); color: white;
		border-radius: 50%; display: grid; place-items: center;
		font-size: 0.78rem; font-weight: 800;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}
	.logro {
		padding: 1rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
		display: flex; flex-direction: column; align-items: center;
		gap: 0.4rem;
		text-align: center;
	}
	.logro.locked { opacity: 0.7; }
	.logro-icon {
		position: relative;
		width: 56px; height: 60px;
		display: grid; place-items: center;
		filter: drop-shadow(0 0 12px color-mix(in oklch, var(--c) 35%, transparent));
	}
	.logro.locked .logro-icon { filter: grayscale(0.6); }
	.logro-emoji {
		position: absolute;
		font-size: 1.4rem;
		filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
	}
	.logro-title { font-size: 0.85rem; font-weight: 700; }
	.logro-desc { font-size: 0.7rem; color: var(--text-3); line-height: 1.3; min-height: 2.5em; }
	.badge.unlocked {
		font-size: 0.72rem; font-weight: 700;
		color: var(--leaf);
		background: rgba(34, 197, 94, 0.14);
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
	}
	.progress-mini {
		width: 100%; height: 4px;
		background: rgba(7,6,15,0.6);
		border-radius: 999px;
		overflow: hidden;
	}
	.progress-mini-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--c), var(--gold));
		border-radius: 999px;
	}
	.progress-text { font-size: 0.7rem; color: var(--text-3); }
</style>
