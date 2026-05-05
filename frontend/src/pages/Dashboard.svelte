<script lang="ts">
	import { onMount } from 'svelte';
	import { usuariosAPI, estadisticasAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';
	import XPCard from '$lib/components/XPCard.svelte';
	import StreakCard from '$lib/components/StreakCard.svelte';
	import ActividadForm from '$lib/components/ActividadForm.svelte';

	export let usuarioId: number;

	let usuario = $state<any>(null);
	let estadisticas = $state<any>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showActividadForm = $state(false);

	function handleLogout() {
		this.dispatchEvent(new CustomEvent('logout'));
	}

	function navigate(page: string) {
		this.dispatchEvent(new CustomEvent('navigate', { detail: page }));
	}

	async function loadData() {
		try {
			isLoading = true;
			const userResponse = await usuariosAPI.obtener(usuarioId);
			const statsResponse = await estadisticasAPI.obtener(usuarioId);

			usuario = userResponse.data;
			estadisticas = statsResponse.data;
		} catch (err: any) {
			error = err.message || 'Error al cargar datos';
		} finally {
			isLoading = false;
		}
	}

	function handleActividadRegistered() {
		showActividadForm = false;
		loadData();
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="dashboard">
	<Navbar
		{usuario}
		on:logout={handleLogout}
		on:navigate={(e) => navigate(e.detail)}
	/>

	<main class="dashboard-main">
		<div class="container">
			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando tu aventura...</p>
				</div>
			{:else if error}
				<div class="error-message">
					{error}
				</div>
			{:else if usuario && estadisticas}
				<div class="header-section">
					<div class="welcome">
						<h1>¡Bienvenido de vuelta, {usuario.nombre}!</h1>
						<p>Sigue acumulando XP para alcanzar nuevos niveles</p>
					</div>
				</div>

				<div class="stats-grid">
					<XPCard
						xpTotal={usuario.xp_total}
						nivel={usuario.nivel}
						racha={usuario.racha_dias}
					/>
					<StreakCard racha={usuario.racha_dias} />
				</div>

				<div class="action-section">
					<h2>Registrar Actividad</h2>
					<button class="btn btn-primary" on:click={() => (showActividadForm = !showActividadForm)}>
						{showActividadForm ? '✕ Cerrar' : '+ Nueva Actividad'}
					</button>

					{#if showActividadForm}
						<div class="form-container">
							<ActividadForm
								{usuarioId}
								on:success={handleActividadRegistered}
							/>
						</div>
					{/if}
				</div>

				<div class="quick-links">
					<button class="quick-link-btn" on:click={() => navigate('actividades')}>
						<span class="icon">📊</span>
						<span>Ver Actividades</span>
					</button>
					<button class="quick-link-btn" on:click={() => navigate('hitos')}>
						<span class="icon">🏆</span>
						<span>Ver Hitos</span>
					</button>
					<button class="quick-link-btn" on:click={() => navigate('perfil')}>
						<span class="icon">👤</span>
						<span>Mi Perfil</span>
					</button>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--color-bg);
	}

	.dashboard-main {
		flex: 1;
		padding: 2rem 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.loading,
	.error-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		min-height: 400px;
	}

	.spinner {
		display: inline-block;
		width: 3rem;
		height: 3rem;
		border: 3px solid rgba(99, 102, 241, 0.2);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.header-section {
		margin-bottom: 2rem;
	}

	.welcome h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.welcome p {
		color: var(--color-text-secondary);
		font-size: 1.1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.action-section {
		background-color: var(--color-surface);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.action-section h2 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.form-container {
		margin-top: 1rem;
		padding: 1.5rem;
		background-color: var(--color-bg);
		border-radius: 0.75rem;
		border: 1px solid var(--color-surface-hover);
	}

	.quick-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.quick-link-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-surface-hover);
		border-radius: 0.75rem;
		color: var(--color-text);
		cursor: pointer;
		transition: var(--transition);
		font-weight: 600;
	}

	.quick-link-btn:hover {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		transform: translateY(-2px);
	}

	.icon {
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		.welcome h1 {
			font-size: 1.5rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
