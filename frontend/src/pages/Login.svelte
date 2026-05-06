<script lang="ts">
	import { authAPI } from '$lib/services/api';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let nombre: string = '';
	let email: string = '';
	let password: string = '';
	let isLoading: boolean = false;
	let error: string | null = null;
	let isLogin: boolean = true;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		try {
			let response;
			if (isLogin) {
				response = await authAPI.login(email, password);
			} else {
				response = await authAPI.register(nombre, email, password);
			}

			if (!response.access_token) {
				throw new Error(response.detail || 'Error al procesar la solicitud');
			}

			const { access_token, usuario_id } = response;
			localStorage.setItem('access_token', access_token);
			localStorage.setItem('usuario_id', usuario_id.toString());

			dispatch('login', { usuarioId: usuario_id });
		} catch (err: any) {
			error = err.message || 'Error al procesar la solicitud';
		} finally {
			isLoading = false;
		}
	}

	function toggleMode() {
		isLogin = !isLogin;
		error = null;
		nombre = '';
		email = '';
		password = '';
	}
</script>

<div class="login-container">
	<div class="login-box">
		<div class="logo-section">
			<h1 class="logo">⚔️</h1>
			<h2>Sistema Imbatible</h2>
			<p>RPG de la vida real para optimizar tu productividad</p>
		</div>

		<form on:submit={handleSubmit} class="login-form">
			{#if !isLogin}
				<div class="form-group">
					<label for="nombre">Nombre</label>
					<input
						id="nombre"
						type="text"
						placeholder="Tu nombre completo"
						bind:value={nombre}
						required={!isLogin}
						disabled={isLoading}
					/>
				</div>
			{/if}

			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					placeholder="tu@email.com"
					bind:value={email}
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-group">
				<label for="password">Contraseña</label>
				<input
					id="password"
					type="password"
					placeholder="Tu contraseña segura"
					bind:value={password}
					required
					disabled={isLoading}
				/>
			</div>

			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}

			<button type="submit" class="btn btn-primary btn-lg" disabled={isLoading}>
				{#if isLoading}
					<span class="spinner"></span>
					{isLogin ? 'Iniciando sesión...' : 'Registrando...'}
				{:else}
					{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
				{/if}
			</button>

			<button type="button" class="btn-toggle" on:click={toggleMode} disabled={isLoading}>
				{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
			</button>
		</form>

		<div class="stats-preview">
			<div class="stat">
				<span class="stat-value">6</span>
				<span class="stat-label">Niveles</span>
			</div>
			<div class="stat">
				<span class="stat-value">∞</span>
				<span class="stat-label">XP Posible</span>
			</div>
			<div class="stat">
				<span class="stat-value">7</span>
				<span class="stat-label">Actividades</span>
			</div>
		</div>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(135deg, var(--color-bg) 0%, #1e1b4b 100%);
		padding: 1rem;
	}

	.login-box {
		background-color: var(--color-surface);
		border-radius: 1rem;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--color-surface-hover);
	}

	.logo-section {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.logo-section h2 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.logo-section p {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.login-form {
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
		color: var(--color-text);
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		background-color: var(--color-bg);
		border: 1px solid var(--color-surface-hover);
		color: var(--color-text);
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: var(--transition);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.form-group input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.stats-preview {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-surface-hover);
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-toggle {
		width: 100%;
		padding: 0.75rem;
		margin-top: 1rem;
		background-color: transparent;
		border: 1px solid var(--color-surface-hover);
		color: var(--color-text-secondary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: var(--transition);
	}

	.btn-toggle:hover:not(:disabled) {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.btn-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
