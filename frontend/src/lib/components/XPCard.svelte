<script lang="ts">
export let xpTotal: number = 0;
export let nivel: number = 1;
export let racha: number = 0;

function getNivelNombre(nivel: number): string {
if (nivel <= 2) return 'Superviviente';
if (nivel <= 4) return 'Ejecutor';
return 'Imbatible';
}
</script>

<div class="xp-card">
<div class="xp-header">
<h3>Progreso</h3>
<span class="nivel-badge">Nivel {nivel}</span>
</div>

<div class="xp-content">
<div class="xp-total">
<span class="xp-value">{xpTotal}</span>
<span class="xp-label">XP Total</span>
</div>

<div class="racha-info">
<span class="racha-icon">🔥</span>
<span class="racha-dias">{racha} días</span>
</div>

<div class="nivel-progreso">
<div class="progress-bar">
<div 
class="progress-fill" 
style="width: {(xpTotal % 100)}%"
></div>
</div>
<p class="nivel-nombre">{getNivelNombre(nivel)}</p>
</div>
</div>
</div>

<style>
.xp-card {
background-color: var(--color-surface);
border-radius: 1rem;
padding: 1.5rem;
box-shadow: var(--shadow-md);
}

.xp-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 1.5rem;
}

.xp-header h3 {
margin: 0;
font-size: 1.1rem;
}

.nivel-badge {
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
color: white;
padding: 0.25rem 0.75rem;
border-radius: 1rem;
font-size: 0.75rem;
font-weight: 700;
}

.xp-content {
display: flex;
flex-direction: column;
gap: 1.5rem;
}

.xp-total {
text-align: center;
}

.xp-value {
display: block;
font-size: 2.5rem;
font-weight: 700;
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
}

.xp-label {
display: block;
color: var(--color-text-secondary);
font-size: 0.875rem;
margin-top: 0.25rem;
}

.racha-info {
display: flex;
align-items: center;
justify-content: center;
gap: 0.5rem;
background-color: rgba(245, 158, 11, 0.1);
padding: 0.75rem;
border-radius: 0.5rem;
}

.racha-icon {
font-size: 1.5rem;
}

.racha-dias {
font-weight: 600;
color: var(--color-warning);
}

.nivel-progreso {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.progress-bar {
height: 0.5rem;
background-color: var(--color-bg);
border-radius: 1rem;
overflow: hidden;
}

.progress-fill {
height: 100%;
background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
transition: width 0.3s ease;
}

.nivel-nombre {
text-align: center;
font-size: 0.875rem;
color: var(--color-text-secondary);
margin: 0;
}
</style>
