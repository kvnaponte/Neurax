<script lang="ts">
	import { onMount } from 'svelte';
	import { usuariosAPI, estadisticasAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';

	export let usuarioId: number;
	let usuario: any = null;
	let estadisticas: any = null;
	let isLoading: boolean = true;
	let error: string | null = null;

	function handleLogout() {
		dispatchEvent(new CustomEvent('logout'));
	}

	function navigate(page: string) {
		dispatchEvent(new CustomEvent('navigate', { detail: page }));
	}

	async function loadData() {
		try {
			isLoading = true;
			const userResponse = await usuariosAPI.obtener(usuarioId);
			const statsResponse = await estadisticasAPI.obtener(usuarioId);

			usuario = userResponse.data;
			estadisticas = statsResponse.data;
		} catch (err: any) {
			error = err.message || 'Error al cargar perfil';
		} finally {
			isLoading = false;
		}
	}

	async function handleDesactivar() {
		if (!confirm('¿Estás seguro de que deseas desactivar tu cuenta?')) return;

		try {
			await usuariosAPI.desactivar(usuarioId);
			localStorage.removeItem('usuarioId');
			handleLogout();
		} catch (err: any) {
			error = err.response?.data?.detail || 'Error al desactivar cuenta';
		}
	}

	onMount(() => {
		loadData();
	});

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Nunca';
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getNivelName(nivel: number): string {
		const nombres: Record<number, string> = {
			1: 'Superviviente 1',
			2: 'Superviviente 2',
			3: 'Ejecutor 3',
			4: 'Ejecutor 4',
			5: 'Imbatible 5',
			6: 'Imbatible 6'
		};
		return nombres[nivel] || 'Desconocido';
	}
</script>

<div class="perfil-page">
	<Navbar
		{usuario}
		on:logout={handleLogout}
		on:navigate={(e) => navigate(e.detail)}
	/>

	<main class="main-content">
		<div class="container">
			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando perfil...</p>
				</div>
			{:else if error}
				<div class="error-message">
					{error}
				</div>
			{:else if usuario}
				<div class="header">
					<h1>Mi Perfil</h1>
				</div>

				<div class="perfil-grid">
					<div class="profile-card card">
						<div class="profile-header">
							<div class="avatar">
								{usuario.nombre.charAt(0).toUpperCase()}
							</div>
							<div class="profile-info">
								<h2>{usuario.nombre}</h2>
								<p class="email">{usuario.email}</p>
								<p class="nivel-badge">
									{getNivelName(usuario.nivel)}
								</p>
							</div>
						</div>
					</div>

					<div class="stats-card card">
						<h3>Estadísticas</h3>
						<div class="stat-row">
							<span class="stat-label">XP Total</span>
							<span class="stat-value">{usuario.xp_total}</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Nivel Actual</span>
							<span class="stat-value">{usuario.nivel}/6</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Racha de Días</span>
							<span class="stat-value">{usuario.racha_dias} 🔥</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Última Actividad</span>
							<span class="stat-value">{formatDate(usuario.última_actividad)}</span>
						</div>
					</div>
				</div>

				{#if estadisticas}
					<div class="details-card card">
						<h3>Detalles</h3>
						<div class="detail-group">
							<span class="detail-label">XP Acumulado</span>
							<span class="detail-value">{estadisticas.xp_total}</span>
						</div>
						<div class="detail-group">
							<span class="detail-label">Nivel</span>
							<span class="detail-value">{estadisticas.nivel}</span>
						</div>
						<div class="detail-group">
							<span class="detail-label">Racha Actual</span>
							<span class="detail-value">{estadisticas.racha} días</span>
						</div>
					</div>
				{/if}

				<div class="actions">
					<button class="btn btn-secondary">
						📊 Descargar Datos
					</button>
					<button class="btn btn-danger" on:click={handleDesactivar}>
						⛔ Desactivar Cuenta
					</button>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.perfil-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--color-bg);
	}

	.main-content {
		flex: 1;
		padding: 2rem 0;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		margin: 0;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
	}

	.spinner {
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
		padding: 1.5rem;
		border-radius: 0.75rem;
		text-align: center;
	}

	.perfil-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.profile-card {
		text-align: center;
	}

	.profile-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
	}

	.profile-info h2 {
		margin: 0 0 0.25rem 0;
		font-size: 1.5rem;
	}

	.email {
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
	}

	.nivel-badge {
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
		margin: 0;
	}

	.stats-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stats-card h3 {
		margin: 0;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background-color: var(--color-bg);
		border-radius: 0.5rem;
	}

	.stat-label {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.stat-value {
		color: var(--color-primary);
		font-size: 1.1rem;
		font-weight: 700;
	}

	.details-card {
		margin-bottom: 2rem;
	}

	.details-card h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.1rem;
	}

	.detail-group {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--color-surface-hover);
	}

	.detail-group:last-child {
		border-bottom: none;
	}

	.detail-label {
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	.detail-value {
		color: var(--color-text);
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		transition: var(--transition);
	}

	.btn-secondary {
		background-color: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-surface-hover);
	}

	.btn-secondary:hover {
		background-color: var(--color-surface-hover);
	}

	.btn-danger {
		background-color: var(--color-error);
		color: white;
	}

	.btn-danger:hover {
		background-color: #dc2626;
	}

	@media (max-width: 768px) {
		.header h1 {
			font-size: 1.5rem;
		}

		.perfil-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
		}

		.actions button {
			width: 100%;
		}
	}
</style>
