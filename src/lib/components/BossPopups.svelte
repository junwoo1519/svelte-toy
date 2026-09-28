<script lang="ts">
	import { gameStore } from '$lib/state/gameStore.svelte';

	const popups = $derived(gameStore.engine.popups);

	function closePopup(id: string) {
		gameStore.engine.closePopup(id);
	}
</script>


{#each popups as popup (popup.id)}
	<div
		class="popup-window absolute z-50 select-none font-sans rounded-xl overflow-hidden border-2 border-rose-500/90 bg-slate-950/95 shadow-[0_0_30px_rgba(244,63,94,0.45)] flex flex-col"
		style="left: {popup.x}px; top: {popup.y}px; width: {popup.width}px; min-height: {popup.height}px;"
	>
		<!-- Tactical Alert Title Bar -->
		<div class="flex items-center justify-between px-3 py-1.5 bg-rose-950 border-b border-rose-800 text-rose-200 font-bold text-xs">
			<div class="flex items-center gap-2 truncate">
				<span class="animate-pulse">⚠️</span>
				<span class="truncate font-black tracking-wide text-xs">{popup.title}</span>
			</div>
			<button
				onclick={() => closePopup(popup.id)}
				class="w-5 h-5 flex items-center justify-center rounded bg-rose-900/80 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
			>
				✕
			</button>
		</div>

		<!-- Body (Comfortable Padding) -->
		<div class="p-3.5 bg-slate-900 text-white text-xs flex flex-col justify-between flex-1 gap-2.5">
			<div class="flex items-center gap-2.5">
				<span class="text-2xl filter drop-shadow">🛑</span>
				<div class="flex items-center gap-1.5 flex-wrap">
					<span class="text-[11px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700 text-rose-300 font-bold">[악성 침투]</span>
					<span class="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">[차단: X]</span>
				</div>
			</div>

			<div class="flex justify-end">
				<button
					onclick={() => closePopup(popup.id)}
					class="game-btn game-btn-danger text-xs px-3.5 py-1 font-bold"
				>
					✕ 닫기
				</button>
			</div>
		</div>
	</div>
{/each}

<style>
	.popup-window {
		backdrop-filter: blur(8px);
	}
</style>
