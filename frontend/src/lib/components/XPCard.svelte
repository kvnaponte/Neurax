<script lang="ts">
	export let xpTotal: number = 0;
	export let nivel: number = 1;
	export let racha: number = 0;

	const NIVELES = [
		{ n: 1, name: 'Superviviente', min: 0, max: 99 },
		{ n: 2, name: 'Aprendiz', min: 100, max: 249 },
		{ n: 3, name: 'Guerrero', min: 250, max: 499 },
		{ n: 4, name: 'Veterano', min: 500, max: 999 },
		{ n: 5, name: 'Campeón', min: 1000, max: 1999 },
		{ n: 6, name: 'Imbatible', min: 2000, max: 9999 }
	];

	$: info = NIVELES.find(l => l.n === nivel) || NIVELES[0];
	$: next = NIVELES.find(l => l.n === nivel + 1);
	$: progress = next ? Math.min(100, Math.max(0, ((xpTotal - info.min) / (info.max - info.min + 1)) * 100)) : 100;
</script>

<div class="xp-card">
	<div class="row top">
		<div>
			<p class="kicker">XP TOTAL</p>
			<h2 class="xp-number gradient-gold">{xpTotal}<span class="xp-unit">XP</span></h2>
			{#if next}
				<p class="next-info">Hasta nivel {next.n} ({next.name})</p>
			{:else}
				<p class="next-info">¡Eres Imbatible!</p>
			{/if}
		</div>

		<div class="crystal" aria-hidden="true">
			<svg viewBox="0 0 80 100" width="68" height="84">
				<defs>
					<linearGradient id="cryFill" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#c4b5fd"/>
						<stop offset="55%" stop-color="#7c3aed"/>
						<stop offset="100%" stop-color="#3b1880"/>
					</linearGradient>
					<linearGradient id="cryEdge" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#fde68a"/>
						<stop offset="100%" stop-color="#b88a14"/>
					</linearGradient>
				</defs>
				<polygon points="40,4 70,30 60,90 20,90 10,30" fill="url(#cryFill)" stroke="url(#cryEdge)" stroke-width="2.5"/>
				<polygon points="40,4 60,90 40,55 20,90" fill="rgba(255,255,255,0.18)"/>
				<polygon points="40,4 70,30 40,55 10,30" fill="rgba(255,255,255,0.08)"/>
				<text x="40" y="60" text-anchor="middle" font-family="Cinzel" font-weight="800" font-size="22" fill="#fde68a">{nivel}</text>
			</svg>
		</div>
	</div>

	<div class="bar-wrap">
		<div class="bar-meta">
			<span class="bar-label">{info.name}</span>
			<span class="bar-num text-mono">{xpTotal} / {next ? next.min : info.max} XP</span>
		</div>
		<div class="bar">
			<div class="bar-fill" style="width: {progress}%"></div>
		</div>
	</div>
</div>

<style>
	.xp-card {
		background:
			radial-gradient(120% 100% at 0% 0%, rgba(167, 139, 250, 0.20), transparent 50%),
			radial-gradient(120% 100% at 100% 100%, rgba(244, 197, 66, 0.10), transparent 55%),
			linear-gradient(180deg, #1f1747 0%, #15102e 100%);
		border: 1px solid rgba(168, 134, 255, 0.22);
		border-radius: 22px;
		padding: 1.25rem 1.25rem 1rem;
		box-shadow: var(--shadow-md), 0 0 0 1px rgba(244, 197, 66, 0.05) inset;
	}
	.row.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.kicker {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--text-3);
		margin-bottom: 0.35rem;
	}
	.xp-number {
		font-family: 'Cinzel', serif;
		font-weight: 800;
		font-size: 2.4rem;
		line-height: 1;
		letter-spacing: -0.01em;
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.xp-unit {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-2);
		-webkit-text-fill-color: var(--text-2);
	}
	.next-info {
		margin-top: 0.5rem;
		font-size: 0.82rem;
		color: var(--text-2);
	}
	.crystal {
		filter: drop-shadow(0 0 18px rgba(124, 58, 237, 0.6));
		animation: float 3s ease-in-out infinite;
	}
	.bar-wrap { margin-top: 1rem; }
	.bar-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.bar-label { color: var(--text-2); font-weight: 600; }
	.bar-num { color: var(--gold); font-weight: 700; }
	.bar {
		height: 10px;
		background: rgba(7, 6, 15, 0.6);
		border-radius: 999px;
		overflow: hidden;
		border: 1px solid rgba(168, 134, 255, 0.18);
	}
	.bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #fde68a, #f4c542 40%, #f97316 80%, #ef4444);
		border-radius: 999px;
		box-shadow: 0 0 12px rgba(244, 197, 66, 0.6);
		transition: width 0.6s ease;
	}
</style>
