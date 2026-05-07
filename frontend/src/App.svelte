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
			return JSON.parse(atob(parts[1]));
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

<div class="app-shell">
	{#if currentPage === 'login' || !usuarioId}
		<Login on:login={handleLogin} />
	{:else if currentPage === 'dashboard'}
		<Dashboard {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
	{:else if currentPage === 'actividades'}
		<Actividades {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
	{:else if currentPage === 'hitos'}
		<Hitos {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
	{:else if currentPage === 'perfil'}
		<Perfil {usuarioId} on:logout={handleLogout} on:navigate={(e) => navigate(e.detail)} />
	{/if}
</div>
