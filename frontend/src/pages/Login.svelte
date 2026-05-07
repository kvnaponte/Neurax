<script lang="ts">
	import { authAPI } from '$lib/services/api';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let nombre = '';
	let email = '';
	let password = '';
	let isLoading = false;
	let error: string | null = null;
	let isLogin = true;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;
		try {
			const response = isLogin
				? await authAPI.login(email, password)
				: await authAPI.register(nombre, email, password);
			if (!response.access_token) throw new Error(response.detail || 'Error');
			localStorage.setItem('access_token', response.access_token);
			localStorage.setItem('usuario_id', response.usuario_id.toString());
			dispatch('login', { usuarioId: response.usuario_id });
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
	}
</script>

<div class="login-page">
	<div class="bg-stars" aria-hidden="true">
		{#each Array(40) as _, i}
			<span class="star" style="left:{(i * 137) % 100}%; top:{(i * 73) % 100}%; animation-delay:{i * 0.15}s"></span>
		{/each}
	</div>

	<div class="hero">
		<div class="shield" aria-hidden="true">
			<svg viewBox="0 0 120 140" width="118" height="138">
				<defs>
					<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#fde68a"/>
						<stop offset="55%" stop-color="#f4c542"/>
						<stop offset="100%" stop-color="#8a6810"/>
					</linearGradient>
					<linearGradient id="sgi" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#7c3aed"/>
						<stop offset="100%" stop-color="#3b1880"/>
					</linearGradient>
				</defs>
				<path d="M60 6 L108 22 L102 84 Q102 116 60 134 Q18 116 18 84 L12 22 Z" fill="url(#sg)" stroke="#b88a14" stroke-width="2"/>
				<path d="M60 16 L96 28 L92 82 Q92 108 60 122 Q28 108 28 82 L24 28 Z" fill="url(#sgi)"/>
				<polygon points="60,40 78,68 60,96 42,68" fill="#fde68a" opacity="0.95"/>
				<polygon points="60,52 70,68 60,84 50,68" fill="#7c3aed"/>
			</svg>
		</div>
		<h1 class="title font-display">SISTEMA<br/><span class="big gradient-gold">IMBATIBLE</span></h1>
		<p class="tag">Convierte tu vida diaria en una aventura épica</p>
	</div>

	<form on:submit={handleSubmit} class="form">
		{#if !isLogin}
			<label class="field">
				<span>Nombre</span>
				<input type="text" placeholder="Tu nombre de héroe" bind:value={nombre} required disabled={isLoading} />
			</label>
		{/if}
		<label class="field">
			<span>Email</span>
			<input type="email" placeholder="tu@email.com" bind:value={email} required disabled={isLoading} />
		</label>
		<label class="field">
			<span>Contraseña</span>
			<input type="password" placeholder="••••••••" bind:value={password} required disabled={isLoading} />
		</label>

		{#if error}<div class="error-message">{error}</div>{/if}

		<button type="submit" class="btn btn-primary btn-lg" disabled={isLoading}>
			{#if isLoading}
				<span class="spinner small"></span>
				{isLogin ? 'Entrando…' : 'Creando…'}
			{:else}
				{isLogin ? '⚔️ Iniciar Aventura' : '✨ Crear Héroe'}
			{/if}
		</button>

		<button type="button" class="toggle" on:click={toggleMode} disabled={isLoading}>
			{isLogin ? '¿Eres nuevo? Crea tu héroe' : '¿Ya tienes cuenta? Entra'}
		</button>
	</form>

	<div class="features">
		<div class="feat"><span class="dot v"></span><strong>6</strong> Niveles de progreso</div>
		<div class="feat"><span class="dot g"></span><strong>13</strong> Tipos de actividad</div>
		<div class="feat"><span class="dot e"></span><strong>∞</strong> XP por ganar</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		padding: 2rem 1.25rem 2.5rem;
		position: relative;
		overflow: hidden;
		background:
			radial-gradient(800px 500px at 50% 0%, rgba(124, 58, 237, 0.4), transparent 70%),
			radial-gradient(600px 400px at 80% 100%, rgba(217, 70, 239, 0.18), transparent 65%),
			linear-gradient(180deg, #0d0a1f 0%, #07060f 100%);
	}
	.bg-stars { position: absolute; inset: 0; pointer-events: none; }
	.star {
		position: absolute;
		width: 2px; height: 2px;
		border-radius: 50%;
		background: #fff;
		opacity: 0.5;
		animation: twinkle 3s ease-in-out infinite;
	}
	@keyframes twinkle { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
	.hero { text-align: center; position: relative; padding-top: 1rem; }
	.shield { display: inline-block; filter: drop-shadow(0 0 26px rgba(244, 197, 66, 0.55)); animation: float 3.5s ease-in-out infinite; }
	.title { margin-top: 1rem; font-size: 1.4rem; font-weight: 700; line-height: 1.1; color: var(--text-2); }
	.title .big { font-size: 2.4rem; font-weight: 900; letter-spacing: 0.06em; display: inline-block; margin-top: 0.25rem; }
	.tag { color: var(--text-2); font-size: 0.92rem; margin-top: 0.75rem; }

	.form {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		position: relative;
	}
	.field { display: flex; flex-direction: column; gap: 0.35rem; }
	.field span {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-3);
	}
	.toggle {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-2);
		padding: 0.7rem;
		border-radius: 12px;
		font-family: inherit;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.toggle:hover { color: var(--gold); border-color: var(--border-strong); }
	.spinner.small { width: 1rem; height: 1rem; border-width: 2px; }

	.features {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 1rem;
		border-radius: 16px;
		background: rgba(21, 16, 46, 0.5);
		border: 1px solid var(--border);
	}
	.feat {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.82rem;
		color: var(--text-2);
	}
	.feat strong { color: var(--gold); font-family: 'Cinzel', serif; min-width: 1.5rem; }
	.dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
	.dot.v { background: var(--violet-2); color: var(--violet-2); }
	.dot.g { background: var(--gold); color: var(--gold); }
	.dot.e { background: var(--ember); color: var(--ember); }
</style>
