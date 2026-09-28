<script lang="ts">
	import TopHud from '$lib/components/TopHud.svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import BossPopups from '$lib/components/BossPopups.svelte';
	import UnitGuideModal from '$lib/components/UnitGuideModal.svelte';
	import GameOverModal from '$lib/components/GameOverModal.svelte';
	import ModeSelectModal from '$lib/components/ModeSelectModal.svelte';
</script>

<svelte:head>
	<title>🎯 CURSOR DEFENSE (v3.6.0) [80라운드 대확장 & 확정 합성 디펜스]</title>
</svelte:head>

<main class="game-screen flex items-center justify-center p-3 select-none">
	<!-- Modern Gaming Console Frame -->
	<div class="game-frame game-app-window">
		<!-- 1. Top Integrated Gaming HUD -->
		<TopHud />

		<!-- 2. Clean Canvas Playfield & Gimmick Overlays -->
		<div class="canvas-viewport relative">
			<GameCanvas />
			<BossPopups />
		</div>

		<!-- 3. Tactical Command Deck & Unit Inspector -->
		<ControlPanel />
	</div>

	<!-- Modals -->
	<ModeSelectModal />
	<UnitGuideModal />
	<GameOverModal />
</main>

<style>
	.game-screen {
		min-height: 100vh;
		width: 100vw;
		box-sizing: border-box;
	}

	.game-app-window {
		width: 100%;
		max-width: 1280px;
		margin: auto;
	}

	.canvas-viewport {
		width: 100%;
		background: #020617;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
