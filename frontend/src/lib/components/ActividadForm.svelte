<script lang="ts">
	import { actividadesAPI } from '$lib/services/api';
	import { createEventDispatcher } from 'svelte';

	export let usuarioId: number;
	const dispatch = createEventDispatcher();

	const TIPOS = [
		{ value: 'sueño', label: 'Sueño', icon: '🌙', color: '#38bdf8' },
		{ value: 'ejercicio', label: 'Ejercicio', icon: '🏃', color: '#22c55e' },
		{ value: 'estudio', label: 'Estudio', icon: '📚', color: '#a78bfa' },
		{ value: 'trabajo', label: 'Trabajo', icon: '💼', color: '#f4c542' },
		{ value: 'transporte', label: 'Transporte', icon: '🚌', color: '#fb923c' },
		{ value: 'musica', label: 'Música', icon: '🎵', color: '#d946ef' }
	];

	let tipo: string = 'estudio';
	let duracion_minutos: number = 30;
	let descripcion: string = '';
	let isSubmitting = false;
	let error: string | null = null;

	$: estimatedXP = Math.round(duracion_minutos * (tipo === 'sueño' ? 1.6 : tipo === 'ejercicio' ? 1.4 : tipo === 'estudio' ? 1 : tipo === 'trabajo' ? 0.5 : tipo === 'transporte' ? 0.2 : 0.25));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = null;
		try {
			await actividadesAPI.registrar(usuarioId, {
				tipo,
				duracion_minutos,
				descripcion,
				timestamp: new Date().toISOString()
			});
			tipo = 'estudio';
			duracion_minutos = 30;
			descripcion = '';
			dispatch('success');
		} catch (err: any) {
			error = err?.message || 'Error al registrar actividad';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form on:submit={handleSubmit} class="form">
	{#if error}<div class="error-message">{error}</div>{/if}

	<div class="field">
		<span class="label">Tipo de actividad</span>
		<div class="tipo-grid">
			{#each TIPOS as t}
				<button
					type="button"
					class="tipo-chip"
					class:active={tipo === t.value}
					style="--c:{t.color}"
					on:click={() => (tipo = t.value)}
				>
					<span class="ti">{t.icon}</span>
					<span class="tl">{t.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="field">
		<div class="row-between">
			<span class="label">Duración</span>
			<span class="duration text-mono">{duracion_minutos} min</span>
		</div>
		<input type="range" min="5" max="480" step="5" bind:value={duracion_minutos} class="slider" />
	</div>

	<div class="field">
		<span class="label">Descripción (opcional)</span>
		<textarea bind:value={descripcion} rows="2" placeholder="Detalles…" disabled={isSubmitting}></textarea>
	</div>

	<div class="xp-preview">
		<span class="xp-glow">+{estimatedXP} XP</span>
		<span class="xp-note">estimados</span>
	</div>

	<button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
		{isSubmitting ? 'Registrando…' : '⚔️ Registrar Actividad'}
	</button>
</form>

<style>
	.form { display: flex; flex-direction: column; gap: 1.1rem; }
	.field { display: flex; flex-direction: column; gap: 0.5rem; }
	.label {
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		font-weight: 700;
		color: var(--text-3);
		text-transform: uppercase;
	}
	.row-between { display: flex; justify-content: space-between; align-items: baseline; }
	.duration { color: var(--gold); font-weight: 700; }

	.tipo-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.tipo-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.7rem 0.4rem;
		background: rgba(7, 6, 15, 0.5);
		border: 1px solid var(--border);
		border-radius: 12px;
		font-family: inherit;
		color: var(--text-2);
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition);
	}
	.tipo-chip .ti { font-size: 1.4rem; }
	.tipo-chip:hover { border-color: var(--c); color: var(--c); }
	.tipo-chip.active {
		border-color: var(--c);
		background: color-mix(in oklch, var(--c) 18%, transparent);
		color: var(--text);
		box-shadow: 0 0 16px color-mix(in oklch, var(--c) 35%, transparent);
	}

	.slider {
		appearance: none;
		-webkit-appearance: none;
		width: 100%;
		height: 8px;
		background: rgba(7,6,15,0.6);
		border-radius: 999px;
		outline: none;
		padding: 0;
		border: 1px solid var(--border);
	}
	.slider::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 22px; height: 22px;
		border-radius: 50%;
		background: linear-gradient(135deg, #fde68a, #f4c542 50%, #b88a14);
		border: 2px solid #1a1538;
		cursor: pointer;
		box-shadow: 0 0 14px rgba(244, 197, 66, 0.6);
	}
	.slider::-moz-range-thumb {
		width: 22px; height: 22px; border-radius: 50%;
		background: linear-gradient(135deg, #fde68a, #f4c542 50%, #b88a14);
		border: 2px solid #1a1538; cursor: pointer;
	}

	.xp-preview {
		display: flex; align-items: baseline; justify-content: center; gap: 0.5rem;
		padding: 0.85rem;
		background: linear-gradient(135deg, rgba(244,197,66,0.10), rgba(124,58,237,0.10));
		border: 1px solid var(--border-strong);
		border-radius: 14px;
	}
	.xp-glow {
		font-family: 'Cinzel', serif;
		font-size: 1.7rem;
		font-weight: 800;
		background: linear-gradient(135deg, #fde68a, #f4c542 50%, #f97316);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 0 20px rgba(244,197,66,0.4);
	}
	.xp-note { color: var(--text-3); font-size: 0.78rem; }
</style>
