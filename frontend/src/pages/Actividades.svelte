<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { actividadesAPI, usuariosAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';
	import ActividadForm from '$lib/components/ActividadForm.svelte';

	export let usuarioId: number;
	const dispatch = createEventDispatcher();

	let usuario: any = null;
	let actividades: any[] = [];
	let isLoading = true;
	let error: string | null = null;
	let showForm = false;
	let dias = 7;
	let filter: string = 'todas';

	function handleLogout() { dispatch('logout'); }
	function navigate(p: string) { dispatch('navigate', p); }

	async function load() {
		try {
			isLoading = true;
			const [u, r] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				actividadesAPI.obtener(usuarioId, dias)
			]);
			usuario = u.data || u;
			actividades = (r.data || r) as any[];
		} catch (err: any) {
			error = err.message || 'Error al cargar actividades';
			if ((err.message || '').includes('sesión inválida')) { localStorage.clear(); dispatch('logout'); }
		} finally {
			isLoading = false;
		}
	}

	function onOk() { showForm = false; load(); }

	const FILTERS = [
		{ id: 'todas', label: 'Todas' },
		{ id: 'fisicas', label: 'Físicas', tipos: ['ejercicio'] },
		{ id: 'mentales', label: 'Mentales', tipos: ['estudio', 'trabajo'] },
		{ id: 'rutinas', label: 'Rutinas', tipos: ['sueño', 'transporte', 'musica', 'música'] }
	];
	$: filtered = filter === 'todas'
		? actividades
		: actividades.filter(a => (FILTERS.find(f => f.id === filter)?.tipos || []).includes((a.tipo || '').toLowerCase()));

	$: groupedByDay = (() => {
		const m: Record<string, any[]> = {};
		for (const a of filtered) {
			const d = new Date(a.timestamp || a.fecha);
			const key = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
			(m[key] ||= []).push(a);
		}
		return Object.entries(m);
	})();

	function getIcon(t: string): string {
		const m: Record<string, string> = { 'sueño': '🌙', sueno: '🌙', ejercicio: '🏃', estudio: '📚', trabajo: '💼', transporte: '🚌', musica: '🎵', 'música': '🎵' };
		return m[t?.toLowerCase()] || '⚡';
	}
	function getColor(t: string): string {
		const m: Record<string, string> = { 'sueño': '#38bdf8', sueno: '#38bdf8', ejercicio: '#22c55e', estudio: '#a78bfa', trabajo: '#f4c542', transporte: '#fb923c', musica: '#d946ef', 'música': '#d946ef' };
		return m[t?.toLowerCase()] || '#a78bfa';
	}
	function timeRange(a: any): string {
		const d = new Date(a.timestamp || a.fecha);
		const start = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
		const end = new Date(d.getTime() + (a.duracion_minutos || 0) * 60000)
			.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
		return `${start} – ${end}`;
	}

	onMount(load);
</script>

<div class="page">
	<header class="page-header">
		<h1 class="page-title">Actividades</h1>
		<button class="add-btn" on:click={() => (showForm = !showForm)} aria-label="Nueva actividad">
			{showForm ? '✕' : '+'}
		</button>
	</header>

	<div class="tabs">
		{#each FILTERS as f}
			<button class="tab" class:active={filter === f.id} on:click={() => (filter = f.id)}>{f.label}</button>
		{/each}
	</div>

	{#if showForm}
		<div class="form-wrap fade-in">
			<ActividadForm {usuarioId} on:success={onOk} />
		</div>
	{/if}

	{#if isLoading}
		<div class="center-screen"><div class="spinner"></div></div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if filtered.length === 0}
		<div class="empty">
			<div class="empty-icon">📜</div>
			<h2>Sin actividades</h2>
			<p>Comienza tu aventura registrando tu primera actividad</p>
			<button class="btn btn-primary" on:click={() => (showForm = true)}>+ Registrar</button>
		</div>
	{:else}
		{#each groupedByDay as [day, items]}
			<section class="day">
				<div class="day-head">
					<span class="day-name">{day}</span>
					<span class="day-count text-mono">{items.length}/5</span>
				</div>
				<div class="acts">
					{#each items as a}
						<article class="act" style="--c:{getColor(a.tipo)}">
							<div class="act-icon"><span>{getIcon(a.tipo)}</span></div>
							<div class="act-body">
								<div class="act-row">
									<h3 class="act-title">{a.tipo?.charAt(0).toUpperCase()}{a.tipo?.slice(1)}</h3>
									<span class="xp-tag">+{a.xp_generado || a.valor_xp || 0} XP</span>
								</div>
								<div class="act-meta">
									<span>⏱ {timeRange(a)}</span>
									<span>·</span>
									<span>{a.duracion_minutos || 0} min</span>
								</div>
								{#if a.descripcion}<p class="act-desc">{a.descripcion}</p>{/if}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/each}

		<div class="filters">
			<label>
				<span>Período</span>
				<select bind:value={dias} on:change={load}>
					<option value={7}>Últimos 7 días</option>
					<option value={14}>Últimos 14 días</option>
					<option value={30}>Últimos 30 días</option>
					<option value={90}>Últimos 90 días</option>
				</select>
			</label>
		</div>
	{/if}
</div>

<Navbar {usuario} currentPage="actividades" on:navigate={(e) => navigate(e.detail)} on:logout={handleLogout} />

<style>
	.add-btn {
		width: 40px; height: 40px;
		display: grid; place-items: center;
		background: linear-gradient(135deg, #fde68a, #f4c542 50%, #b88a14);
		color: #2a1a02;
		border: none;
		border-radius: 12px;
		font-size: 1.4rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 6px 16px rgba(244, 197, 66, 0.35);
	}
	.tabs {
		display: flex;
		gap: 0.4rem;
		padding: 4px;
		background: rgba(21, 16, 46, 0.5);
		border: 1px solid var(--border);
		border-radius: 14px;
		margin-bottom: 1rem;
		overflow-x: auto;
	}
	.tab {
		flex: 1;
		min-width: max-content;
		padding: 0.55rem 0.75rem;
		background: transparent;
		border: none;
		color: var(--text-2);
		font-family: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		border-radius: 10px;
		cursor: pointer;
	}
	.tab.active {
		background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(124,58,237,0.35));
		color: var(--text);
		box-shadow: 0 0 14px rgba(124,58,237,0.35);
	}
	.form-wrap {
		padding: 1rem; background: var(--surface); border: 1px solid var(--border);
		border-radius: 18px; margin-bottom: 1rem;
	}

	.center-screen { display: grid; place-items: center; padding: 4rem 1rem; }
	.empty {
		text-align: center; padding: 3rem 1rem;
		background: var(--surface); border: 1px dashed var(--border-strong);
		border-radius: 18px;
	}
	.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
	.empty h2 { font-family: 'Cinzel', serif; margin-bottom: 0.4rem; }
	.empty p { color: var(--text-2); margin-bottom: 1rem; font-size: 0.88rem; }

	.day { margin-bottom: 1.25rem; }
	.day-head {
		display: flex; justify-content: space-between; align-items: baseline;
		margin-bottom: 0.6rem;
	}
	.day-name {
		font-size: 0.78rem; color: var(--text); font-weight: 700;
		text-transform: capitalize;
	}
	.day-count { color: var(--gold); font-size: 0.78rem; font-weight: 700; }

	.acts { display: flex; flex-direction: column; gap: 0.55rem; }
	.act {
		display: flex; gap: 0.85rem;
		padding: 0.85rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--c);
		border-radius: 14px;
	}
	.act-icon {
		width: 44px; height: 44px;
		display: grid; place-items: center;
		background: color-mix(in oklch, var(--c) 18%, transparent);
		border-radius: 12px;
		font-size: 1.4rem;
		flex-shrink: 0;
	}
	.act-body { flex: 1; min-width: 0; }
	.act-row { display: flex; justify-content: space-between; align-items: center; }
	.act-title { font-size: 1rem; font-weight: 700; }
	.xp-tag {
		background: color-mix(in oklch, var(--c) 22%, transparent);
		color: var(--c);
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		font-weight: 700;
	}
	.act-meta {
		display: flex; gap: 0.4rem;
		color: var(--text-3); font-size: 0.78rem; margin-top: 0.2rem;
	}
	.act-desc {
		font-size: 0.82rem; color: var(--text-2); margin-top: 0.35rem;
	}

	.filters { margin-top: 1.5rem; }
	.filters label { display: flex; flex-direction: column; gap: 0.4rem; }
	.filters span { font-size: 0.7rem; letter-spacing: 0.14em; color: var(--text-3); font-weight: 700; }
</style>
