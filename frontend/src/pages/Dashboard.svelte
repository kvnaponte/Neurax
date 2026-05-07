<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { usuariosAPI, estadisticasAPI, actividadesAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';
	import XPCard from '$lib/components/XPCard.svelte';
	import StreakCard from '$lib/components/StreakCard.svelte';
	import ActividadForm from '$lib/components/ActividadForm.svelte';

	export let usuarioId: number;
	const dispatch = createEventDispatcher();

	let usuario: any = null;
	let estadisticas: any = null;
	let actividadesHoy: any[] = [];
	let isLoading = true;
	let error: string | null = null;
	let showForm = false;
	let showXpBurst = false;
	let lastXp = 0;

	function handleLogout() { dispatch('logout'); }
	function navigate(p: string) { dispatch('navigate', p); }

	async function loadData() {
		try {
			isLoading = true;
			const [u, s, a] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				estadisticasAPI.obtener(usuarioId).catch(() => null),
				actividadesAPI.obtener(usuarioId, 1).catch(() => ({ data: [] }))
			]);
			usuario = u.data || u;
			estadisticas = s ? (s.data || s) : null;
			const list = (a?.data || a || []) as any[];
			const today = new Date().toDateString();
			actividadesHoy = list.filter(x => new Date(x.timestamp || x.fecha).toDateString() === today);
		} catch (err: any) {
			error = err.message || 'Error';
			if ((err.message || '').includes('sesión inválida') || (err.message || '').includes('no encontrado')) {
				localStorage.clear();
				dispatch('logout');
			}
		} finally {
			isLoading = false;
		}
	}

	function onActividadOk() {
		showForm = false;
		const prev = usuario?.xp_total || 0;
		loadData().then(() => {
			const now = usuario?.xp_total || 0;
			lastXp = now - prev;
			if (lastXp > 0) {
				showXpBurst = true;
				setTimeout(() => (showXpBurst = false), 1800);
			}
		});
	}

	function getActIcon(t: string): string {
		const m: Record<string, string> = {
			'sueño': '🌙', sueno: '🌙',
			ejercicio: '🏃',
			estudio: '📚',
			trabajo: '💼',
			transporte: '🚌',
			musica: '🎵', 'música': '🎵'
		};
		return m[t?.toLowerCase()] || '⚡';
	}
	function getActColor(t: string): string {
		const m: Record<string, string> = {
			'sueño': '#38bdf8', sueno: '#38bdf8',
			ejercicio: '#22c55e',
			estudio: '#a78bfa',
			trabajo: '#f4c542',
			transporte: '#fb923c',
			musica: '#d946ef', 'música': '#d946ef'
		};
		return m[t?.toLowerCase()] || '#a78bfa';
	}

	onMount(loadData);
</script>

<div class="page">
	{#if isLoading}
		<div class="center-screen"><div class="spinner"></div><p>Cargando tu aventura…</p></div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if usuario}
		<header class="dash-header">
			<div class="user">
				<div class="avatar" aria-hidden="true">
					<svg viewBox="0 0 60 60" width="48" height="48"><defs><linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><circle cx="30" cy="30" r="29" fill="url(#av)" stroke="#f4c542" stroke-width="2"/><circle cx="30" cy="24" r="9" fill="#1a1538"/><path d="M12 52c2-10 10-14 18-14s16 4 18 14" fill="#1a1538"/></svg>
				</div>
				<div>
					<h1 class="hello">{usuario.nombre}</h1>
					<p class="role">⚔️ {usuario.nivel >= 5 ? 'Imbatible' : usuario.nivel >= 3 ? 'Guerrero' : usuario.nivel >= 2 ? 'Aprendiz' : 'Superviviente'}</p>
				</div>
			</div>
			<div class="header-actions">
				<button class="xp-pill" type="button">
					<span class="diamond">◆</span><span class="num">{usuario.xp_total}</span>
				</button>
				<button class="logout-pill" on:click={handleLogout} aria-label="Salir">⏻</button>
			</div>
		</header>

		<XPCard xpTotal={usuario.xp_total} nivel={usuario.nivel} racha={usuario.racha_dias} />

		<div class="streak-section">
			<StreakCard racha={usuario.racha_dias} mejor={estadisticas?.mejor_racha} />
		</div>

		<section class="today">
			<div class="row-between">
				<h2 class="section-title">ACTIVIDAD DE HOY</h2>
				<span class="hint text-mono">{actividadesHoy.length} registros</span>
			</div>
			<div class="today-row">
				{#each Array(5) as _, i}
					{@const a = actividadesHoy[i]}
					<div class="dot-step" class:done={!!a} style={a ? `--c:${getActColor(a.tipo)}` : ''}>
						{#if a}<span class="dot-icon">{getActIcon(a.tipo)}</span>{:else}<span class="dot-empty"></span>{/if}
					</div>
				{/each}
			</div>
		</section>

		<button class="btn btn-primary btn-lg full" on:click={() => (showForm = !showForm)}>
			{showForm ? '✕  Cerrar' : '+  Registrar Actividad'}
		</button>

		{#if showForm}
			<div class="form-wrap">
				<ActividadForm {usuarioId} on:success={onActividadOk} />
			</div>
		{/if}

		<section class="weekly">
			<div class="row-between">
				<h2 class="section-title">RESUMEN SEMANAL</h2>
				<button class="link" on:click={() => navigate('actividades')}>Ver más ›</button>
			</div>
			<div class="weekly-grid">
				<div class="mini">
					<div class="mini-icon" style="color:#a78bfa">◆</div>
					<div>
						<p class="mini-label">XP semana</p>
						<p class="mini-value">{estadisticas?.xp_semana ?? Math.min(usuario.xp_total, 320)}</p>
					</div>
				</div>
				<div class="mini">
					<div class="mini-icon" style="color:#f4c542">⊞</div>
					<div>
						<p class="mini-label">Actividades</p>
						<p class="mini-value">{estadisticas?.actividades_semana ?? actividadesHoy.length * 6}</p>
					</div>
				</div>
				<div class="mini">
					<div class="mini-icon" style="color:#fb923c">⚡</div>
					<div>
						<p class="mini-label">Promedio</p>
						<p class="mini-value">{(((estadisticas?.xp_semana ?? 320) / 7) || 0).toFixed(1)}</p>
					</div>
				</div>
			</div>
		</section>

		{#if showXpBurst}
			<div class="xp-burst" aria-live="polite">+{lastXp} XP</div>
		{/if}
	{/if}
</div>

<Navbar {usuario} currentPage="dashboard" on:navigate={(e) => navigate(e.detail)} on:logout={handleLogout} />

<style>
	.center-screen { display: grid; place-items: center; gap: 0.75rem; padding: 5rem 1rem; color: var(--text-2); }
	.dash-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 1.25rem;
	}
	.user { display: flex; align-items: center; gap: 0.75rem; }
	.avatar { filter: drop-shadow(0 0 12px rgba(124,58,237,0.5)); }
	.hello { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }
	.role { font-size: 0.78rem; color: var(--gold); margin-top: 0.1rem; font-weight: 600; }

	.header-actions { display: flex; align-items: center; gap: 0.5rem; }
	.xp-pill {
		display: inline-flex; align-items: center; gap: 0.4rem;
		padding: 0.5rem 0.85rem;
		background: linear-gradient(135deg, rgba(244,197,66,0.18), rgba(124,58,237,0.18));
		border: 1px solid var(--border-strong);
		color: var(--gold);
		border-radius: 999px;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: 0.95rem;
		cursor: pointer;
	}
	.diamond { color: var(--gold); }
	.logout-pill {
		width: 36px; height: 36px;
		display: grid; place-items: center;
		background: rgba(239, 68, 68, 0.10);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.streak-section { margin-top: 0.85rem; }

	.today { margin-top: 1.25rem; }
	.row-between { display: flex; justify-content: space-between; align-items: center; }
	.section-title {
		font-size: 0.72rem; letter-spacing: 0.16em; font-weight: 700; color: var(--text-3);
	}
	.hint { font-size: 0.75rem; color: var(--gold); }
	.today-row {
		margin-top: 0.7rem;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}
	.dot-step {
		aspect-ratio: 1;
		border-radius: 14px;
		background: rgba(7, 6, 15, 0.5);
		border: 1px dashed var(--border);
		display: grid; place-items: center;
		font-size: 1.25rem;
	}
	.dot-step.done {
		background: color-mix(in oklch, var(--c) 14%, transparent);
		border: 1px solid var(--c);
		box-shadow: 0 0 14px color-mix(in oklch, var(--c) 35%, transparent);
	}
	.dot-empty {
		width: 8px; height: 8px; border-radius: 50%;
		background: var(--border);
	}

	.btn.full { width: 100%; margin-top: 1rem; }
	.form-wrap {
		margin-top: 0.75rem;
		padding: 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 18px;
	}

	.weekly { margin-top: 1.5rem; }
	.weekly-grid {
		margin-top: 0.7rem;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
	}
	.mini {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 0.75rem;
		display: flex; align-items: center; gap: 0.55rem;
	}
	.mini-icon { font-size: 1.2rem; line-height: 1; }
	.mini-label { font-size: 0.65rem; color: var(--text-3); letter-spacing: 0.08em; }
	.mini-value { font-family: 'Cinzel', serif; font-weight: 700; font-size: 1rem; color: var(--text); }
	.link {
		background: transparent; border: none; color: var(--gold);
		font-family: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer;
	}

	.xp-burst {
		position: fixed;
		left: 50%; top: 30%;
		transform: translateX(-50%);
		font-family: 'Cinzel', serif;
		font-weight: 900;
		font-size: 3rem;
		background: linear-gradient(135deg, #fde68a, #f4c542 50%, #f97316);
		-webkit-background-clip: text; background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 0 30px rgba(244,197,66,0.7);
		pointer-events: none;
		z-index: 100;
		animation: xp-rise 1.6s ease-out forwards;
	}
</style>
