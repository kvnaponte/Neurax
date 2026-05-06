<script lang="ts">
	export let usuario: any = null;

	function navigateTo(page: string) {
		dispatchEvent(new CustomEvent('navigate', { detail: page }));
	}

	function handleLogout() {
		dispatchEvent(new CustomEvent('logout'));
	}
</script>

<nav class="navbar">
	<div class="navbar-content">
		<div class="navbar-brand">
			<span class="logo">🎯</span>
			<span class="app-name">LevelUp Life</span>
		</div>

		<div class="navbar-menu">
			<button 
				class="nav-btn" 
				class:active={false}
				on:click={() => navigateTo('dashboard')}
			>
				📊 Dashboard
			</button>
			<button 
				class="nav-btn" 
				class:active={false}
				on:click={() => navigateTo('actividades')}
			>
				✅ Actividades
			</button>
			<button 
				class="nav-btn" 
				class:active={false}
				on:click={() => navigateTo('hitos')}
			>
				🏆 Hitos
			</button>
			<button 
				class="nav-btn" 
				class:active={false}
				on:click={() => navigateTo('perfil')}
			>
				👤 Perfil
			</button>
		</div>

		<div class="navbar-user">
			{#if usuario}
				<span class="user-name">{usuario.nombre}</span>
				<span class="user-level">Nivel {usuario.nivel}</span>
			{/if}
			<button class="btn-logout" on:click={handleLogout}>
				🚪 Salir
			</button>
		</div>
	</div>
</nav>

<style>
	.navbar {
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-surface-hover);
		padding: 0.75rem 1.5rem;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: var(--shadow-md);
	}

	.navbar-content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo {
		font-size: 1.5rem;
	}

	.app-name {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.navbar-menu {
		display: flex;
		gap: 0.5rem;
	}

	.nav-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: var(--transition);
	}

	.nav-btn:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	.nav-btn.active {
		background-color: var(--color-primary);
		color: white;
	}

	.navbar-user {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		font-weight: 600;
		color: var(--color-text);
	}

	.user-level {
		font-size: 0.75rem;
		background-color: rgba(99, 102, 241, 0.2);
		color: var(--color-primary);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-weight: 700;
	}

	.btn-logout {
		padding: 0.5rem 1rem;
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: var(--transition);
	}

	.btn-logout:hover {
		background-color: var(--color-error);
		color: white;
	}

	@media (max-width: 768px) {
		.navbar-content {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.navbar-menu {
			order: 3;
			width: 100%;
			justify-content: center;
		}

		.nav-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}
	}
</style>
