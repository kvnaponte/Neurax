<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { actividadesAPI, usuariosAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';
	import ActividadForm from '$lib/components/ActividadForm.svelte';

	export let usuarioId: number;
	
	const dispatch = createEventDispatcher();
	
	let usuario: any = null;
	let actividades: any[] = [];
	let isLoading: boolean = true;
	let error: string | null = null;
	let showForm: boolean = false;
	let dias: number = 7;

	function handleLogout() {
		dispatch('logout');
	}

	function navigate(page: string) {
		dispatch('navigate', page);
	}

	async function loadActividades() {
		try {
			isLoading = true;
			const [userResponse, response] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				actividadesAPI.obtener(usuarioId, dias)
			]);
			usuario = userResponse.data || userResponse;
			actividades = response.data || response;
		} catch (err: any) {
			console.error('Error al cargar actividades:', err);
			error = err.message || 'Error al cargar actividades';
			if (err.message.includes('sesión inválida') || err.message.includes('no encontrado')) {
				localStorage.removeItem('access_token');
				localStorage.removeItem('usuario_id');
				dispatch('logout');
				return;
			}
		} finally {
			isLoading = false;
		}
	}

	function handleActividadRegistered() {
		showForm = false;
		loadActividades();
	}

	onMount(() => {
		loadActividades();
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getActivityIcon(tipo: string): string {
		const icons: Record<string, string> = {
			sueño: '😴',
			ejercicio: '💪',
			estudio: '📚',
			trabajo: '💼',
			transporte: '🚗',
			musica: '🎵'
		};
		return icons[tipo] || '📌';
	}

	function getActivityColor(tipo: string): string {
		const colors: Record<string, string> = {
			sueño: '#06b6d4',
			ejercicio: '#10b981',
			estudio: '#6366f1',
			trabajo: '#f59e0b',
			transporte: '#8b5cf6',
			musica: '#ec4899'
		};
		return colors[tipo] || '#94a3b8';
	}
</script>

<div class="actividades-page">
	<Navbar
		{usuario}
		on:logout={handleLogout}
		on:navigate={(e) => navigate(e.detail)}
	/>

	<main class="main-content">
		<div class="container">
			<div class="header">
				<h1>Mis Actividades</h1>
				<button class="btn btn-primary" on:click={() => (showForm = !showForm)}>
					{showForm ? '✕ Cerrar' : '+ Nueva'}
				</button>
			</div>

			{#if showForm}
				<div class="form-container">
					<ActividadForm
						{usuarioId}
						on:success={handleActividadRegistered}
					/>
				</div>
			{/if}

			<div class="filters">
				<label>
					Últimos
					<select bind:value={dias} on:change={loadActividades}>
						<option value="7">7 días</option>
						<option value="14">14 días</option>
						<option value="30">30 días</option>
						<option value="90">90 días</option>
					</select>
				</label>
			</div>

			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando actividades...</p>
				</div>
			{:else if error}
				<div class="error-message">
					{error}
				</div>
			{:else if actividades.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📭</div>
					<h2>Sin actividades</h2>
					<p>Comienza a registrar actividades para ver tu historial</p>
					<button class="btn btn-primary" on:click={() => (showForm = true)}>
						Registrar actividad
					</button>
				</div>
			{:else}
				<div class="actividades-list">
					{#each actividades as actividad}
						<div
							class="actividad-item"
							style="border-left-color: {getActivityColor(actividad.tipo)}"
						>
							<div class="actividad-icon">
								{getActivityIcon(actividad.tipo)}
							</div>
							<div class="actividad-content">
								<div class="actividad-header">
									<h3>{actividad.tipo.charAt(0).toUpperCase() + actividad.tipo.slice(1)}</h3>
									<span class="xp-badge">{actividad.xp_generado} XP</span>
								</div>
								<p class="actividad-duration">
									⏱️ {actividad.duracion_minutos} minutos
								</p>
								{#if actividad.descripcion}
									<p class="actividad-descripcion">{actividad.descripcion}</p>
								{/if}
								<p class="actividad-fecha">
									{formatDate(actividad.timestamp)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.actividades-page {
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
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		margin: 0;
	}

	.form-container {
		background-color: var(--color-surface);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.filters label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.filters select {
		padding: 0.5rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-surface-hover);
		color: var(--color-text);
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.loading,
	.error-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
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
		border-radius: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background-color: var(--color-surface);
		border-radius: 1rem;
		border: 2px dashed var(--color-surface-hover);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h2 {
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
	}

	.actividades-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.actividad-item {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--color-surface);
		border-radius: 0.75rem;
		border-left: 4px solid;
		transition: var(--transition);
	}

	.actividad-item:hover {
		transform: translateX(4px);
		box-shadow: var(--shadow-md);
	}

	.actividad-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.actividad-content {
		flex: 1;
		min-width: 0;
	}

	.actividad-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.actividad-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.xp-badge {
		background-color: rgba(99, 102, 241, 0.2);
		color: var(--color-primary);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.actividad-duration {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0.25rem 0;
	}

	.actividad-descripcion {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0.5rem 0;
		font-style: italic;
	}

	.actividad-fecha {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0 0;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.header button {
			width: 100%;
		}
	}
</style>
