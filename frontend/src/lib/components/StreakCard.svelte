<script lang="ts">
export let racha: number = 0;

function getStreakMessage(racha: number): string {
if (racha === 0) return '¡Comienza tu racha!';
if (racha < 3) return '¡Sigue así!';
if (racha < 7) return '¡Excelente progreso!';
if (racha < 14) return '¡Eres imparable!';
return '¡LEYENDA!';
}

function getStreakColor(racha: number): string {
if (racha < 3) return 'var(--color-text-secondary)';
if (racha < 7) return 'var(--color-warning)';
if (racha < 14) return 'var(--color-primary)';
return 'var(--color-accent)';
}
</script>

<div class="streak-card">
<div class="streak-header">
<h3>Racha de Fuego 🔥</h3>
</div>

<div class="streak-content">
<div 
class="streak-number" 
style="color: {getStreakColor(racha)}"
>
{racha}
</div>
<p class="streak-label">días consecutivos</p>

<div class="streak-message">
{getStreakMessage(racha)}
</div>

<div class="streak-milestones">
<div class="milestone" class:active={racha >= 3}>
<span class="milestone-icon">🎯</span>
<span class="milestone-label">3 días</span>
</div>
<div class="milestone" class:active={racha >= 7}>
<span class="milestone-icon">⭐</span>
<span class="milestone-label">7 días</span>
</div>
<div class="milestone" class:active={racha >= 14}>
<span class="milestone-icon">🏆</span>
<span class="milestone-label">14 días</span>
</div>
<div class="milestone" class:active={racha >= 30}>
<span class="milestone-icon">👑</span>
<span class="milestone-label">30 días</span>
</div>
</div>
</div>
</div>

<style>
.streak-card {
background-color: var(--color-surface);
border-radius: 1rem;
padding: 1.5rem;
box-shadow: var(--shadow-md);
}

.streak-header {
margin-bottom: 1.5rem;
}

.streak-header h3 {
margin: 0;
font-size: 1.1rem;
}

.streak-content {
display: flex;
flex-direction: column;
align-items: center;
gap: 1rem;
}

.streak-number {
font-size: 4rem;
font-weight: 700;
transition: color 0.3s ease;
}

.streak-label {
color: var(--color-text-secondary);
font-size: 0.875rem;
margin: 0;
}

.streak-message {
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
font-weight: 700;
font-size: 1rem;
}

.streak-milestones {
display: flex;
gap: 1rem;
width: 100%;
justify-content: space-around;
margin-top: 1rem;
padding-top: 1rem;
border-top: 1px solid var(--color-surface-hover);
}

.milestone {
display: flex;
flex-direction: column;
align-items: center;
gap: 0.25rem;
opacity: 0.3;
transition: all 0.3s ease;
}

.milestone.active {
opacity: 1;
transform: scale(1.1);
}

.milestone-icon {
font-size: 1.5rem;
filter: grayscale(1);
transition: filter 0.3s ease;
}

.milestone.active .milestone-icon {
filter: grayscale(0);
}

.milestone-label {
font-size: 0.625rem;
color: var(--color-text-secondary);
font-weight: 600;
}

@media (max-width: 768px) {
.streak-number {
font-size: 3rem;
}

.streak-milestones {
gap: 0.5rem;
}

.milestone-icon {
font-size: 1.25rem;
}

.milestone-label {
font-size: 0.5rem;
}
}
</style>
