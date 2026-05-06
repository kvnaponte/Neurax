<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { hitosAPI, usuariosAPI } from '$lib/services/api';
	import Navbar from '$lib/components/Navbar.svelte';

	export let usuarioId: number;
	
	const dispatch = createEventDispatcher();
	
	let usuario: any = null;
	let hitos: any[] = [];
	let isLoading: boolean = true;
	let error: string | null = null;
	let showForm: boolean = false;
	let formData: any = { tipo: 'energia', valor_xp: 10, descripcion: '' };
	let isSubmitting: boolean = false;

	function handleLogout() {
		dispatch('logout');
	}

	function navigate(page: string) {
		dispatch('navigate', page);
	}

	async function loadHitos() {
		try {
			isLoading = true;
			const [userResponse, response] = await Promise.all([
				usuariosAPI.obtener(usuarioId),
				hitosAPI.obtener(usuarioId)
			]);
			usuario = userResponse.data || userResponse;
			hitos = response.data || response;
		} catch (err: any) {
			console.error('Error al cargar hitos:', err);
			error = err.message || 'Error al cargar hitos';
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

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		try {
			await hitosAPI.registrar(
				usuarioId,
				formData.tipo,
				formData.valor_xp,
				formData.descripcion
			);
			formData = { tipo: 'energia', valor_xp: 10, descripcion: '' };
			showForm = false;
			loadHitos();
		} catch (err: any) {
			error = err.response?.data?.detail || 'Error al registrar hito';
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		loadHitos();
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	function getHitoIcon(tipo: string): string {
		const icons: Record<string, string> = {
			energia: '⚡',
			disciplina: '🎯',
			enfoque: '🧠',
			penalizacion: '⚠️'
		};
		return icons[tipo] || '🏆';
	}

	function getHitoColor(tipo: string): string {
		const colors: Record<string, string> = {
			energia: '#f59e0b',
			disciplina: '#10b981',
			enfoque: '#06b6d4',
			penalizacion: '#ef4444'
		};
		return colors[tipo] || '#6366f1';
	}
</script>

<div class="hitos-page">
	<Navbar
		{usuario}
		currentPage="hitos"
		on:logout={handleLogout}
		on:navigate={(e) => navigate(e.detail)}
	/>

	<main class="main-content">
		<div class="container">
			<div class="header">
				<h1>Mis Hitos 🏆</h1>
				<button class="btn btn-primary" on:click={() => (showForm = !showForm)}>
					{showForm ? '✕ Cerrar' : '+ Nuevo Hito'}
				</button>
			</div>

			{#if showForm}
				<form on:submit={handleSubmit} class="hito-form card">
					<div class="form-group">
						<label for="tipo">Tipo de Hito</label>
						<select
							id="tipo"
							bind:value={formData.tipo}
							disabled={isSubmitting}
						>
							<option value="energia">⚡ Energía</option>
							<option value="disciplina">🎯 Disciplina</option>
							<option value="enfoque">🧠 Enfoque</option>
							<option value="penalizacion">⚠️ Penalización</option>
						</select>
					</div>

					<div class="form-group">
						<label for="valor_xp">XP</label>
						<input
							id="valor_xp"
							type="number"
							min="1"
							max="100"
							bind:value={formData.valor_xp}
							disabled={isSubmitting}
						/>
					</div>

					<div class="form-group">
						<label for="descripcion">Descripción (opcional)</label>
						<textarea
							id="descripcion"
							placeholder="Detalles del hito..."
							bind:value={formData.descripcion}
							disabled={isSubmitting}
							rows="3"
						></textarea>
					</div>

					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Registrando...' : 'Registrar Hito'}
					</button>
				</form>
			{/if}

			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>Cargando hitos...</p>
				</div>
			{:else if error}
				<div class="error-message">
					{error}
				</div>
			{:else if hitos.length === 0}
				<div class="empty-state">
					<div class="empty-icon">🎪</div>
					<h2>Sin hitos registrados</h2>
					<p>Crea hitos especiales para celebrar tus logros</p>
				</div>
			{:else}
				<div class="hitos-grid">
					{#each hitos as hito}
						<div
							class="hito-card card"
							style="border-top-color: {getHitoColor(hito.tipo)}"
						>
							<div class="hito-icon">
								{getHitoIcon(hito.tipo)}
							</div>
							<h3 class="hito-tipo">
								{hito.tipo.charAt(0).toUpperCase() + hito.tipo.slice(1)}
							</h3>
							<div class="hito-xp">{hito.valor_xp} XP</div>
							{#if hito.descripcion}
								<p class="hito-descripcion">{hito.descripcion}</p>
							{/if}
							<p class="hito-fecha">
								{formatDate(hito.timestamp)}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.hitos-page {
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
		max-width: 1000px;
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

	.hito-form {
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		background-color: var(--color-bg);
		border: 1px solid var(--color-surface-hover);
		color: var(--color-text);
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

	.hitos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.hito-card {
		text-align: center;
		border-top: 4px solid;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.hito-icon {
		font-size: 2.5rem;
	}

	.hito-tipo {
		font-size: 1.1rem;
		margin: 0;
		font-weight: 700;
	}

	.hito-xp {
		background-color: rgba(99, 102, 241, 0.2);
		color: var(--color-primary);
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.hito-descripcion {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
		font-style: italic;
	}

	.hito-fecha {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin: 0;
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

		.hitos-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}
</style>
