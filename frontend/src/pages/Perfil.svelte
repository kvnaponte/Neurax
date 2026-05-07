<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { usuariosAPI, estadisticasAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';

	export let usuarioId: number;
	const dispatch = createEventDispatcher();

	let usuario: any = null;
	let estadisticas: any = null;
	let isLoading = true;
	let error: string | null = null;

	const NIVELES = [
		{ n: 1, name: 'Superviviente', range: '0 – 99 XP', color: '#22c55e' },
		{ n: 2, name: 'Aprendiz', range: '100 – 249 XP', color: '#38bdf8' },
		{ n: 3, name: 'Guerrero', range: '250 – 499 XP', color: '#a78bfa' },
		{ n: 4, name: 'Veterano', range: '500 – 999 XP', color: '#f4c542' },
		{ n: 5, name: 'Campeón', range: '1000 – 1999 XP', color: '#fb923c' },
		{ n: 6, name: 'Imbatible', range: '2000+ XP', color: '#d946ef' }
	];

	function handleLogout() { dispatch('logout'); }
	function navigate(p: string) { dispatch('navigate', p); }

	async function load() {
		try {
			isLoading = true;
			const [u, s] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				estadisticasAPI.obtener(usuarioId).catch(() => null)
			]);
			usuario = u.data || u;
			estadisticas = s ? (s.data || s) : null;
		} catch (err: any) {
			error = err.message || 'Error';
			if ((err.message || '').includes('sesión inválida')) { localStorage.clear(); dispatch('logout'); }
		} finally {
			isLoading = false;
		}
	}

	async function desactivar() {
		if (!confirm('¿Desactivar cuenta? Esta acción no se puede deshacer.')) return;
		try {
			await usuariosAPI.desactivar(usuarioId);
			localStorage.clear();
			dispatch('logout');
		} catch (err: any) {
			error = err.message || 'Error al desactivar';
		}
	}

	$: nivelActual = usuario ? NIVELES.find(l => l.n === usuario.nivel) || NIVELES[0] : NIVELES[0];
	$: nextLevel = usuario ? NIVELES.find(l => l.n === usuario.nivel + 1) : null;

	onMount(load);
</script>

<div class="page">
	<header class="page-header">
		<button class="back" on:click={() => navigate('dashboard')} aria-label="Volver">‹</button>
		<h1 class="page-title">Tu Progreso</h1>
		<button class="back ghost" aria-label="Compartir">↗</button>
	</header>

	{#if isLoading}
		<div class="center-screen"><div class="spinner"></div></div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if usuario}
		<section class="hero" style="--c:{nivelActual.color}">
			<div class="hero-inner">
				<div class="hero-badge">
					<svg viewBox="0 0 80 90" width="68" height="76">
						<defs>
							<linearGradient id="hb" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#fde68a"/>
								<stop offset="100%" stop-color="#b88a14"/>
							</linearGradient>
						</defs>
						<polygon points="40,4 72,18 68,60 40,86 12,60 8,18" fill="{nivelActual.color}" stroke="url(#hb)" stroke-width="2.5"/>
						<text x="40" y="50" text-anchor="middle" font-family="Cinzel" font-weight="800" font-size="28" fill="#fde68a">{nivelActual.n}</text>
					</svg>
				</div>
				<div class="hero-text">
					<h2 class="hero-title font-display">{nivelActual.name}</h2>
					<p class="hero-sub">En camino hacia la grandeza</p>
				</div>
			</div>
			<div class="hero-bar">
				<span class="hero-num text-mono">{usuario.xp_total} / {nextLevel ? NIVELES.find(l => l.n === nextLevel.n)?.range.split(' – ')[0] || '?' : '∞'} XP</span>
				<div class="bar"><div class="bar-fill" style="width:{nextLevel ? Math.min(100, (usuario.xp_total / 500) * 100) : 100}%"></div></div>
			</div>
		</section>

		<section class="ladder">
			{#each NIVELES as l}
				{@const reached = usuario.nivel >= l.n}
				{@const current = usuario.nivel === l.n}
				<div class="rung" class:reached class:current style="--c:{l.color}">
					<div class="rung-num">
						<svg viewBox="0 0 40 44" width="36" height="40">
							<polygon points="20,2 36,10 36,30 20,42 4,30 4,10" fill={reached ? l.color : '#1a1538'} stroke={reached ? '#f4c542' : '#3a2f5f'} stroke-width="2"/>
							<text x="20" y="26" text-anchor="middle" font-family="Cinzel" font-weight="800" font-size="14" fill={reached ? '#fde68a' : '#7d6db0'}>{l.n}</text>
						</svg>
					</div>
					<div class="rung-body">
						<p class="rung-name">{l.name}</p>
						<p class="rung-range text-mono">{l.range}</p>
					</div>
					<div class="rung-state">
						{#if current}<span class="dot-live"></span>
						{:else if reached}<span class="check">✓</span>
						{:else}<span class="lock">🔒</span>{/if}
					</div>
				</div>
			{/each}
		</section>

		<section class="profile-meta">
			<div class="row">
				<span>Email</span><strong>{usuario.email}</strong>
			</div>
			<div class="row">
				<span>Racha actual</span><strong style="color:var(--ember)">{usuario.racha_dias} días 🔥</strong>
			</div>
			<div class="row">
				<span>XP total</span><strong style="color:var(--gold)">{usuario.xp_total}</strong>
			</div>
		</section>

		<div class="actions">
			<button class="btn btn-secondary" on:click={handleLogout}>⏻ Cerrar sesión</button>
			<button class="btn btn-danger" on:click={desactivar}>⛔ Desactivar cuenta</button>
		</div>
	{/if}
</div>

<Navbar {usuario} currentPage="perfil" on:navigate={(e) => navigate(e.detail)} on:logout={handleLogout} />

<style>
	.back {
		width: 36px; height: 36px;
		display: grid; place-items: center;
		background: var(--surface); border: 1px solid var(--border);
		color: var(--text); border-radius: 12px;
		font-size: 1.2rem; cursor: pointer;
	}
	.back.ghost { background: transparent; }
	.page-header { display: grid; grid-template-columns: 36px 1fr 36px; align-items: center; }
	.page-title { text-align: center; font-size: 1.05rem; font-weight: 700; }

	.center-screen { display: grid; place-items: center; padding: 4rem 1rem; }

	.hero {
		padding: 1.25rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--c) 22%, transparent), transparent 60%),
			linear-gradient(180deg, #1f1747, #15102e);
		border: 1px solid color-mix(in oklch, var(--c) 35%, transparent);
		border-radius: 20px;
		box-shadow: 0 0 30px color-mix(in oklch, var(--c) 18%, transparent);
	}
	.hero-inner { display: flex; gap: 0.85rem; align-items: center; }
	.hero-badge { filter: drop-shadow(0 0 14px color-mix(in oklch, var(--c) 50%, transparent)); }
	.hero-title { font-size: 1.4rem; font-weight: 800; }
	.hero-sub { font-size: 0.82rem; color: var(--text-2); margin-top: 0.15rem; }

	.hero-bar { margin-top: 0.85rem; }
	.hero-num {
		display: block; text-align: right;
		font-size: 0.78rem; color: var(--gold); font-weight: 700; margin-bottom: 0.35rem;
	}
	.bar {
		height: 8px;
		background: rgba(7,6,15,0.6);
		border-radius: 999px;
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--c), var(--gold));
		box-shadow: 0 0 12px var(--c);
		border-radius: 999px;
	}

	.ladder { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
	.rung {
		display: grid; grid-template-columns: 40px 1fr auto; gap: 0.85rem;
		align-items: center;
		padding: 0.7rem 0.85rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		opacity: 0.6;
	}
	.rung.reached { opacity: 1; }
	.rung.current {
		border-color: var(--c);
		background: linear-gradient(135deg, color-mix(in oklch, var(--c) 18%, transparent), var(--surface) 60%);
		box-shadow: 0 0 20px color-mix(in oklch, var(--c) 25%, transparent);
	}
	.rung-name { font-weight: 700; font-size: 0.92rem; }
	.rung-range { font-size: 0.72rem; color: var(--text-3); }
	.rung-state .dot-live {
		display: inline-block; width: 10px; height: 10px; border-radius: 50%;
		background: var(--c); box-shadow: 0 0 12px var(--c);
		animation: pulse-glow 1.6s ease-in-out infinite;
	}
	.check { color: var(--leaf); font-weight: 800; }
	.lock { opacity: 0.5; }

	.profile-meta {
		margin-top: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 0.4rem 0.85rem;
	}
	.profile-meta .row {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.88rem;
	}
	.profile-meta .row:last-child { border-bottom: none; }
	.profile-meta .row span { color: var(--text-3); }

	.actions { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
</style>
