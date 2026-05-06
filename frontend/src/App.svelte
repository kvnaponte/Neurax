<script lang="ts">
	import { onMount } from 'svelte';
	import Login from './pages/Login.svelte';
	import Dashboard from './pages/Dashboard.svelte';
	import Actividades from './pages/Actividades.svelte';
	import Hitos from './pages/Hitos.svelte';
	import Perfil from './pages/Perfil.svelte';

	let currentPage: string = 'login';
	let usuarioId: number | null = null;

	function decodeToken(token: string): any {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;
			const payload = parts[1];
			const decoded = JSON.parse(atob(payload));
			return decoded;
		} catch {
			return null;
		}
	}

	onMount(() => {
		const token = localStorage.getItem('access_token');
		const stored = localStorage.getItem('usuario_id');
		
		if (token && stored) {
			const decoded = decodeToken(token);
			if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
				usuarioId = parseInt(stored);
				currentPage = 'dashboard';
			} else {
				localStorage.removeItem('access_token');
				localStorage.removeItem('usuario_id');
				currentPage = 'login';
			}
		} else {
			currentPage = 'login';
		}
	});

	function handleLogin(event: any) {
		usuarioId = event.detail.usuarioId;
		currentPage = 'dashboard';
	}

	function handleLogout() {
		usuarioId = null;
		localStorage.removeItem('access_token');
		localStorage.removeItem('usuario_id');
		currentPage = 'login';
	}

	function navigate(page: string) {
		currentPage = page;
	}
</script>

<div class="app-container">
	{#if currentPage === 'login'}
		<Login on:login={handleLogin} />
	{:else if usuarioId}
		{#if currentPage === 'dashboard'}
			<Dashboard {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
		{:else if currentPage === 'actividades'}
			<Actividades {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
		{:else if currentPage === 'hitos'}
			<Hitos {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
		{:else if currentPage === 'perfil'}
			<Perfil {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
		{/if}
	{:else}
		<Login on:login={handleLogin} />
	{/if}
</div>

<style global>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:root {
		--color-primary: #6366f1;
		--color-secondary: #8b5cf6;
		--color-accent: #ec4899;
		--color-bg: #0f172a;
		--color-surface: #1e293b;
		--color-text: #e2e8f0;
		--color-text-secondary: #94a3b8;
		--color-success: #10b981;
		--color-warning: #f59e0b;
		--color-error: #ef4444;
		--transition: all 0.3s ease;
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
			'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		background-color: var(--color-bg);
		color: var(--color-text);
		overflow-x: hidden;
	}

	.app-container {
		width: 100%;
		min-height: 100vh;
	}
</style>
