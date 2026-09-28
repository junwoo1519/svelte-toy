<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/state/gameStore.svelte';
	import { TIER_CONFIG } from '$lib/data/units';

	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (gameStore.isGuideOpen || gameStore.engine.stats.isGameOver) return;

			if (e.code === 'Space') {
				// Prevent page scroll and summon for active local player
				e.preventDefault();
				const isLocalP2 = gameStore.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2';
				if (isLocalP2) {
					if (gameStore.canSummonP2) gameStore.summonP2();
				} else {
					if (gameStore.canSummonP1) gameStore.summonP1();
				}
			} else if (e.code === 'KeyU' || (e.shiftKey && e.code === 'Space')) {
				// Overclock Upgrade
				e.preventDefault();
				const isLocalP2 = gameStore.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2';
				if (isLocalP2) {
					if (gameStore.canUpgradeGachaP2) gameStore.upgradeGachaP2();
				} else {
					if (gameStore.canUpgradeGachaP1) gameStore.upgradeGachaP1();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

</script>

<footer class="game-control-deck flex items-center justify-between px-5 bg-slate-950/95 border-t border-slate-800/90 select-none font-sans gap-5" style="height: 64px; min-height: 64px; max-height: 64px; box-sizing: border-box;">
	<!-- Left & Center: Unit Properties Inspector & Guidance Panel (Fixed Height, No Line Wrapping) -->
	<div class="flex-1 min-w-0">
		{#if gameStore.selectedUnit}
			{@const unit = gameStore.selectedUnit}
			<div class="flex flex-col justify-between px-3.5 py-1.5 bg-slate-900/90 border border-slate-800/90 text-xs rounded-xl shadow-md overflow-hidden" style="height: 48px; box-sizing: border-box;">
				<!-- Row 1: Unit Identification, Affinities, and Stats (Strict Single Line) -->
				<div class="flex items-center gap-2 font-mono whitespace-nowrap overflow-hidden flex-nowrap h-[20px]">
					<!-- Tier Icon Badge -->
					<div
						class="w-5 h-5 flex-shrink-0 flex items-center justify-center font-black text-xs rounded border shadow-sm"
						style="background-color: {TIER_CONFIG[unit.tier].bgBadge}; color: {TIER_CONFIG[unit.tier].color}; border-color: {TIER_CONFIG[unit.tier].color};"
					>
						T{unit.tier}
					</div>

					<span class="font-black text-xs text-white tracking-wide flex-shrink-0">{unit.name}</span>
					
					<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold flex-shrink-0">
						{TIER_CONFIG[unit.tier].name}
					</span>

					<!-- Attribute Badge (3-Way Affinity) -->
					{#if unit.attribute}
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 flex-shrink-0 {
							unit.attribute === 'BIT'
								? 'bg-sky-950/80 border-sky-600/70 text-sky-300'
								: unit.attribute === 'SEC'
									? 'bg-purple-950/80 border-purple-600/70 text-purple-300'
									: 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
						}">
							{unit.attribute === 'BIT' ? '💻 BIT(연산)' : unit.attribute === 'SEC' ? '🔒 SEC(보안)' : '🌐 NET(전송)'}
						</span>
					{/if}

					<!-- Combat Archetype Badge -->
					{#if unit.archetype}
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold border bg-slate-800/90 border-slate-600/80 text-slate-200 flex items-center gap-1 flex-shrink-0">
							{unit.archetype === 'RAPID' ? '⚡ 속공' : unit.archetype === 'AOE' ? '💥 광역' : unit.archetype === 'HEAVY' ? '🎯 저격' : '🛡️ 지원'}
						</span>
					{/if}

					<!-- Stat Chips (Single Line, Never Wraps) -->
					<div class="flex items-center gap-1.5 flex-shrink-0">
						<span class="text-[11px] px-2 py-0.5 rounded bg-rose-950/70 border border-rose-700/80 text-rose-300 font-bold flex items-center gap-1">
							⚔️ {unit.damage}
						</span>

						<span class="text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 font-bold flex items-center gap-1">
							⏱️ {unit.attackSpeed}s
						</span>

						<span class="text-[11px] px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/80 text-sky-300 font-bold flex items-center gap-1">
							🎯 {unit.range >= 9000 ? '전역' : unit.range}
						</span>
					</div>

					<span class="text-[11px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/80 text-amber-300 font-bold ml-auto flex items-center gap-1 flex-shrink-0">
						💰 +{TIER_CONFIG[unit.tier].refund}B
					</span>
				</div>

				<!-- Row 2: Skill Description or Passive Note (Strict Single Line with Ellipsis) -->
				<div class="h-[20px] flex items-center whitespace-nowrap overflow-hidden flex-nowrap">
					{#if unit.skill}
						<div class="w-full text-[11px] font-sans text-slate-300 bg-slate-950/85 border border-purple-800/40 px-2.5 py-0.5 rounded flex items-center gap-2 overflow-hidden flex-nowrap" title="{unit.skill.description || unit.skill.type}">
							<span class="font-bold text-purple-400 flex-shrink-0 text-[10px]">✨ {unit.skill.type}</span>
							<span class="text-slate-600 flex-shrink-0 text-[10px]">|</span>
							<span class="truncate text-slate-300 text-[11px] leading-tight">{unit.skill.description || unit.skill.type}</span>
						</div>
					{:else}
						<div class="w-full text-[10px] font-sans text-slate-400 bg-slate-950/50 border border-slate-800/50 px-2.5 py-0.5 rounded flex items-center gap-2 overflow-hidden flex-nowrap">
							<span class="text-slate-400 text-[10px] truncate">기본 단일 공격 전담 유닛 (특수 패시브 스킬 없음)</span>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col justify-between px-3.5 py-1.5 bg-slate-900/60 border border-slate-800/80 text-xs font-mono rounded-xl shadow-sm overflow-hidden" style="height: 48px; box-sizing: border-box;">
				<!-- Row 1: Selection Prompt -->
				<div class="flex items-center gap-2.5 whitespace-nowrap overflow-hidden flex-nowrap h-[20px]">
					<span class="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold text-[10px] flex items-center gap-1 flex-shrink-0">
						<span>🎯</span>
						<span>커서 선택</span>
					</span>
					<span class="text-[11px] text-slate-300 truncate">필드의 커서를 클릭하면 3각 속성, 아키타입, 스킬 및 상세 스펙을 확인할 수 있습니다.</span>
				</div>
				<!-- Row 2: Tactical Tips -->
				<div class="h-[20px] flex items-center whitespace-nowrap overflow-hidden flex-nowrap">
					<div class="w-full text-[10px] font-sans text-slate-400 bg-slate-950/50 border border-slate-800/50 px-2.5 py-0.5 rounded flex items-center gap-2 overflow-hidden flex-nowrap">
						<span class="text-yellow-400 font-bold flex-shrink-0 text-[10px]">★ TIP</span>
						<span class="text-slate-600 flex-shrink-0 text-[10px]">|</span>
						<span class="truncate text-[10px] text-slate-400">동일 유닛 드래그: 100% 확정 합성 / 유닛 더블클릭: 보스방 워프 배치 (최대 5기)</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Right: Keycap Guide (Strict Single Line, Fixed Height) -->
	<div class="flex items-center gap-2 flex-shrink-0 font-mono text-xs whitespace-nowrap">
		<span class="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-2.5 py-1.5 text-slate-300 rounded-lg shadow-sm">
			<span class="px-1.5 py-0.5 bg-slate-800 text-yellow-300 rounded font-black text-[10px]">Space</span>
			<span class="text-slate-300 text-[11px] font-sans font-bold">소환</span>
		</span>
		<span class="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-2.5 py-1.5 text-slate-300 rounded-lg shadow-sm">
			<span class="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded font-black text-[10px]">U</span>
			<span class="text-slate-300 text-[11px] font-sans font-bold">강화</span>
		</span>
		<span class="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-2.5 py-1.5 text-slate-300 rounded-lg shadow-sm">
			<span class="px-1.5 py-0.5 bg-slate-800 text-sky-400 rounded font-black text-[10px]">Drag</span>
			<span class="text-slate-300 text-[11px] font-sans font-bold">합성</span>
		</span>
		<span class="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-2.5 py-1.5 text-slate-300 rounded-lg shadow-sm">
			<span class="px-1.5 py-0.5 bg-slate-800 text-purple-400 rounded font-black text-[10px]">2x</span>
			<span class="text-slate-300 text-[11px] font-sans font-bold">워프</span>
		</span>
	</div>
</footer>

<style>
	.game-control-deck {
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
		height: 64px;
		max-height: 64px;
		min-height: 64px;
		box-sizing: border-box;
		overflow: hidden;
	}
	.flex-shrink-0 {
		flex-shrink: 0;
	}
</style>
