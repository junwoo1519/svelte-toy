<script lang="ts">
	import { gameStore } from '$lib/state/gameStore.svelte';
	import { sound } from '$lib/engine/SoundManager';

	let isMuted = $state(false);

	function toggleMute() {
		isMuted = sound.toggleMute();
	}

	function toggleSpeed() {
		const current = gameStore.engine.stats.gameSpeed;
		gameStore.engine.stats.gameSpeed = current === 1 ? 2 : 1;
		gameStore.sync();
	}

	function togglePause() {
		gameStore.engine.stats.isPaused = !gameStore.engine.stats.isPaused;
		gameStore.sync();
	}
</script>

<header class="game-top-hud select-none font-sans flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
	<!-- Left: Compact Branding, Version & Status -->
	<div class="flex items-center gap-3">
		<!-- Game Branding -->
		<div class="flex items-center gap-2">
			<span class="text-base filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">🎯</span>
			<span class="font-black text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
				CURSOR DEFENSE
			</span>
			<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
				v3.6.0
			</span>
		</div>

		<div class="h-3.5 w-[1px] bg-slate-800 mx-1"></div>

		<!-- Status & Mode Badges (Comfortable Padding) -->
		<div class="flex items-center gap-2">
			{#if gameStore.engine.stats.gameMode === 'ONLINE_COOP'}
				<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-600/60 text-sky-300 text-xs font-mono font-bold">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
					<span>#{gameStore.netRoomId}</span>
					<span class="text-[9px] px-1 py-0.5 rounded bg-sky-900/80">{gameStore.netRole === 'p1' ? '1P' : '2P'}</span>
				</div>
			{:else if gameStore.engine.stats.gameMode === 'AI_COOP'}
				<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-600/60 text-purple-300 text-xs font-mono font-bold">
					<span>🤖 AI</span>
				</div>
			{:else}
				<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-bold">
					<span>👤 1P</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Right: Gaming Action Controls -->
	<div class="flex items-center gap-1.5">
		<button
			class="game-btn text-xs font-bold px-2.5 py-1.5"
			onclick={() => gameStore.openModeSelect()}
			title="모드 선택"
		>
			<span>🎮</span>
		</button>

		<button
			class="game-btn text-xs font-bold px-2.5 py-1.5"
			onclick={() => (gameStore.isGuideOpen = true)}
			title="유닛 도감"
		>
			<span>📖</span>
		</button>

		<button
			class="game-btn text-xs font-bold px-2.5 py-1.5"
			onclick={togglePause}
			title={gameStore.engine.stats.isPaused ? '재개' : '일시정지'}
		>
			<span>{gameStore.engine.stats.isPaused ? '▶' : '⏸'}</span>
		</button>

		<button
			class="game-btn text-xs font-bold px-2.5 py-1.5"
			onclick={toggleMute}
			title={isMuted ? '음소거 해제' : '음소거'}
		>
			<span>{isMuted ? '🔇' : '🔊'}</span>
		</button>

		<button
			class="game-btn text-xs font-bold px-2.5 py-1.5 {gameStore.gameSpeed === 2 ? 'game-btn-primary' : ''}"
			onclick={toggleSpeed}
			title="배속 조절"
		>
			<span>⚡ {gameStore.gameSpeed}x</span>
		</button>

		<button
			class="game-btn game-btn-danger text-xs font-bold px-2.5 py-1.5"
			onclick={() => gameStore.restart()}
			title="재시작"
		>
			<span>🔄</span>
		</button>
	</div>
</header>

<style>
	.game-top-hud {
		box-sizing: border-box;
		min-height: 44px;
	}
</style>
