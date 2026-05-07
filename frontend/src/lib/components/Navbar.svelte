<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let usuario: any = null;
	export let currentPage: string = 'dashboard';

	const dispatch = createEventDispatcher();
	const tabs = [
		{ id: 'dashboard', label: 'Inicio' },
		{ id: 'actividades', label: 'Actividades' },
		{ id: 'estadisticas', label: 'Stats' },
		{ id: 'hitos', label: 'Logros' },
		{ id: 'perfil', label: 'Perfil' }
	];
	function go(id: string) {
		if (id === 'estadisticas') id = 'dashboard';
		dispatch('navigate', id);
	}
</script>

<nav class="bottom-nav" aria-label="Navegación principal">
	<div class="nav-inner">
		{#each tabs as tab}
			{@const active = currentPage === tab.id || (tab.id === 'estadisticas' && currentPage === 'estadisticas')}
			<button class="nav-btn" class:active on:click={() => go(tab.id)}>
				<span class="nav-icon" aria-hidden="true">
					{#if tab.id === 'dashboard'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" stroke-linejoin="round"/></svg>
					{:else if tab.id === 'actividades'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h2l2-6 4 12 2-8 2 4h2" stroke-linejoin="round" stroke-linecap="round"/></svg>
					{:else if tab.id === 'estadisticas'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/></svg>
					{:else if tab.id === 'hitos'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4h8v5a4 4 0 0 1-8 0zM5 5h3v3a3 3 0 0 1-3-3zM19 5h-3v3a3 3 0 0 0 3-3zM10 14h4v3h2v3H8v-3h2z" stroke-linejoin="round"/></svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke-linecap="round"/></svg>
					{/if}
				</span>
				<span class="nav-label">{tab.label}</span>
				{#if active}<span class="nav-indicator"></span>{/if}
			</button>
		{/each}
	</div>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: 0;
		width: 100%;
		max-width: var(--app-max);
		z-index: 50;
		padding: 8px 10px 14px;
		background: linear-gradient(180deg, rgba(13, 10, 31, 0) 0%, rgba(7, 6, 15, 0.95) 35%);
		pointer-events: none;
	}
	.nav-inner {
		pointer-events: auto;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		background: rgba(21, 16, 46, 0.92);
		backdrop-filter: blur(16px);
		border: 1px solid var(--border);
		border-radius: 22px;
		padding: 8px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(168, 134, 255, 0.05) inset;
	}
	.nav-btn {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 4px;
		background: transparent;
		border: none;
		color: var(--text-3);
		font-family: inherit;
		font-size: 0.68rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 14px;
		transition: var(--transition);
	}
	.nav-icon {
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
	}
	.nav-icon :global(svg) { width: 22px; height: 22px; }
	.nav-btn.active {
		color: var(--gold);
	}
	.nav-btn.active .nav-icon {
		filter: drop-shadow(0 0 8px rgba(244, 197, 66, 0.6));
	}
	.nav-indicator {
		position: absolute;
		top: 2px;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 3px;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--gold), var(--ember));
		box-shadow: 0 0 10px rgba(244, 197, 66, 0.7);
	}
	.nav-label { letter-spacing: 0.02em; }
</style>
