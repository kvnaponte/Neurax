<script lang="ts">
	export let racha: number = 0;
	export let mejor: number | null = null;

	$: actual = racha;
	$: best = mejor ?? Math.max(racha, 0);
	$: msg = racha === 0 ? '¡Comienza hoy!' : racha < 7 ? '¡Sigue así!' : racha < 14 ? '¡Imparable!' : '¡Leyenda!';
</script>

<div class="streak-row">
	<div class="streak-card">
		<header><span class="ember" aria-hidden="true">🔥</span><span class="title">RACHA ACTUAL</span></header>
		<div class="value gradient-gold">{actual}<span class="unit">días</span></div>
		<p class="msg">{msg}</p>
	</div>
	<div class="streak-card best">
		<header><span class="trophy" aria-hidden="true">🏆</span><span class="title">MEJOR RACHA</span></header>
		<div class="value gradient-violet">{best}<span class="unit">días</span></div>
		<p class="msg">¡Tu récord!</p>
	</div>
</div>

<style>
	.streak-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.streak-card {
		background: linear-gradient(180deg, #1f1747, #15102e);
		border: 1px solid var(--border);
		border-radius: 18px;
		padding: 0.95rem 1rem 1rem;
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.4rem;
	}
	.ember { font-size: 1rem; animation: ember-flicker 1.6s ease-in-out infinite; }
	.trophy { font-size: 1rem; }
	.title {
		font-size: 0.65rem;
		letter-spacing: 0.14em;
		font-weight: 700;
		color: var(--text-3);
	}
	.value {
		font-family: 'Cinzel', serif;
		font-size: 1.7rem;
		font-weight: 800;
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
	}
	.unit {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-2);
		-webkit-text-fill-color: var(--text-2);
	}
	.msg {
		font-size: 0.72rem;
		color: var(--text-3);
		margin-top: 0.2rem;
	}
</style>
