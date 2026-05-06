<script lang="ts">
import { actividadesAPI } from '$lib/services/api';

export let usuarioId: number;

const dispatch = new EventTarget();

let tipo: string = 'energia';
let valor_xp: number = 10;
let descripcion: string = '';
let isSubmitting: boolean = false;
let error: string | null = null;

async function handleSubmit(e: Event) {
e.preventDefault();
isSubmitting = true;
error = null;

try {
await actividadesAPI.registrar(usuarioId, {
tipo,
valor_xp,
descripcion
});

dispatch.dispatchEvent(new CustomEvent('success'));
tipo = 'energia';
valor_xp = 10;
descripcion = '';
} catch (err: any) {
error = err.response?.data?.detail || 'Error al registrar actividad';
} finally {
isSubmitting = false;
}
}
</script>

<form on:submit={handleSubmit} class="actividad-form">
{#if error}
<div class="error-message">{error}</div>
{/if}

<div class="form-group">
<label for="tipo">Tipo de Actividad</label>
<select id="tipo" bind:value={tipo} disabled={isSubmitting}>
<option value="energia">⚡ Energía</option>
<option value="disciplina">🎯 Disciplina</option>
<option value="enfoque">🧠 Enfoque</option>
</select>
</div>

<div class="form-group">
<label for="valor_xp">XP</label>
<input
id="valor_xp"
type="number"
min="1"
max="100"
bind:value={valor_xp}
disabled={isSubmitting}
/>
</div>

<div class="form-group">
<label for="descripcion">Descripción (opcional)</label>
<textarea
id="descripcion"
placeholder="Detalles de la actividad..."
bind:value={descripcion}
disabled={isSubmitting}
rows="3"
></textarea>
</div>

<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
{isSubmitting ? 'Registrando...' : 'Registrar Actividad'}
</button>
</form>

<style>
.actividad-form {
display: flex;
flex-direction: column;
gap: 1.5rem;
}

.error-message {
background-color: rgba(239, 68, 68, 0.1);
border: 1px solid var(--color-error);
color: var(--color-error);
padding: 1rem;
border-radius: 0.5rem;
font-size: 0.875rem;
}

.form-group {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.form-group label {
font-weight: 600;
font-size: 0.875rem;
color: var(--color-text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
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

.btn {
padding: 0.75rem 1.5rem;
border: none;
border-radius: 0.5rem;
cursor: pointer;
font-weight: 600;
transition: all 0.2s ease;
}

.btn-primary {
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
color: white;
}

.btn-primary:hover:not(:disabled) {
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
opacity: 0.6;
cursor: not-allowed;
}
</style>
