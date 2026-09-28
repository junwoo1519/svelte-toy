<script lang="ts">
	import { gameStore } from '$lib/state/gameStore.svelte';

	const isGameOver = $derived(gameStore.isGameOver);
	const isGameWon = $derived(gameStore.isGameWon);
	const reason = $derived(gameStore.gameOverReason);

	function restart(mode?: 'SOLO' | 'AI_COOP') {
		gameStore.restart(mode);
	}
</script>

{#if isGameOver}
	<div class="modal-backdrop select-none font-sans">
		<div class="game-modal modal-dialog shadow-2xl text-white flex flex-col" style="max-width: 440px;">
			<!-- Header -->
			<div class="game-header flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
				<div class="flex items-center gap-2">
					<span class="text-base">{isGameWon ? '🏆' : '💀'}</span>
					<span class="font-black text-xs tracking-wider {isGameWon ? 'text-yellow-400' : 'text-rose-400'}">
						{isGameWon ? 'VICTORY' : 'OVERLOAD'}
					</span>
				</div>
				<button class="game-close-btn" onclick={() => restart()}>✕</button>
			</div>

			<!-- Dialog Body (Comfortable Padding & Inset Cards) -->
			<div class="p-5 bg-slate-900 flex flex-col gap-3.5">
				<div class="flex items-center gap-3">
					<div class="text-3xl filter drop-shadow">
						{isGameWon ? '🏆' : '💀'}
					</div>
					<div>
						<h3 class="text-sm font-black {isGameWon ? 'text-yellow-400' : 'text-rose-400'}">
							{isGameWon ? '방어 성공 (CLEAR)' : '방어 실패 (CRASH)'}
						</h3>
						<p class="text-[11px] text-slate-400 mt-0.5">
							{isGameWon ? '80R 전장 수호 완료' : '100마리 허용 한계 초과'}
						</p>
					</div>
				</div>

				<!-- Stats Inset (3-Column Grid with Inset Cards) -->
				<div class="grid grid-cols-3 gap-2.5 text-xs font-mono text-center">
					<div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
						<span class="text-[10px] text-slate-400 font-bold">🏁 라운드</span>
						<span class="text-sm font-black text-cyan-400 mt-1">R.{gameStore.currentRound}/{gameStore.engine.stats.maxRound}</span>
					</div>
					<div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
						<span class="text-[10px] text-slate-400 font-bold">👾 소환수</span>
						<span class="text-sm font-black text-yellow-400 mt-1">{gameStore.engine.p1.summonCount}</span>
					</div>
					<div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
						<span class="text-[10px] text-slate-400 font-bold">💾 잔여 RAM</span>
						<span class="text-sm font-black text-emerald-400 mt-1">{Math.round(gameStore.engine.p1.gold)}B</span>
					</div>
				</div>

				<!-- Buttons (Compact & Comfortable) -->
				<div class="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800">
					<button
						onclick={() => restart()}
						class="game-btn game-btn-primary text-xs px-4 py-2 font-bold"
					>
						🔄 재도전
					</button>
					<button
						onclick={() => gameStore.openModeSelect()}
						class="game-btn text-xs px-4 py-2 font-bold"
					>
						🏠 모드선택
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
