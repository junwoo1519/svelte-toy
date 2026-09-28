<script lang="ts">
	import { gameStore } from '$lib/state/gameStore.svelte';
	import { UNITS_MASTER, TIER_CONFIG, TIER_UNITS } from '$lib/data/units';
	import { BOSSES_MASTER } from '$lib/data/bosses';

	let activeTab = $state<number | 'boss'>(1);

	const BOSS_LIST = [
		{ round: 10, icon: '📨', theme: '#38bdf8', desc: '[악성 팝업 난사] 화면을 가리는 가짜 팝업창 + 아군 전 유닛 사거리 -20% 시야 방해.' },
		{ round: 20, icon: '🐴', theme: '#f59e0b', desc: '[트로이 침투 & 쉴드] 아군 1기를 스파이로 감염(공격불능+주변오염) & 최대 체력 비례 방어막 충전.' },
		{ round: 30, icon: '🔒', theme: '#a855f7', desc: '[인질 암호화] 필드 최고 티어 핵심 딜러 1기를 자물쇠로 잠가 5초간 동결.' },
		{ round: 40, icon: '🌐', theme: '#ef4444', desc: '[디도스 트래픽] 전 아군 공속 -30% 렉 & 공격 시 25% 확률로 패킷 유실(Miss).' },
		{ round: 50, icon: '💀', theme: '#3b82f6', desc: '[메모리 덤프 BSOD] 10초마다 2기 강제종료(SEC 보안 50% 저항) & 15초 포맷 카운트다운.' },
		{ round: 60, icon: '☢️', theme: '#ef4444', desc: '[하드웨어 과열] 공격 12회마다 2초간 강제 냉각 셧다운 & 몹 이속 +80% 과열.' },
		{ round: 70, icon: '⛏️', theme: '#eab308', desc: '[불법 채굴 잠식] 전력 강탈로 공속 -25% 저하 & 공격 시 8% 확률로 1 Byte 채굴 강탈.' },
		{ round: 80, icon: '⏳', theme: '#dc2626', desc: '[타임 패러독스] 투사체 속도 -50% 감속 & 공격 쿨타임 주기 무작위 왜곡 & 3단 페이즈!' }
	];
</script>

{#if gameStore.isGuideOpen}
	<div class="modal-backdrop select-none font-sans">
		<div class="game-modal modal-dialog max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-white shadow-2xl" style="max-width: 780px;">
			<!-- Modal Header -->
			<div class="game-header flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800">
				<div class="flex items-center gap-2">
					<span class="text-base">📖</span>
					<span class="font-bold text-sm tracking-wide text-cyan-300">CURSOR CODEX - [유닛 & 80R 보스 도감]</span>
				</div>
				<button onclick={() => (gameStore.isGuideOpen = false)} class="game-close-btn" title="닫기">
					✕
				</button>
			</div>

			<!-- Tab Bar -->
			<div class="flex items-center gap-1.5 px-4 pt-3 pb-2 bg-slate-950/95 border-b border-slate-800 flex-wrap">
				{#each [1, 2, 3, 4] as tier}
					<button
						onclick={() => (activeTab = tier)}
						class="game-btn text-xs px-3 py-1 font-bold {activeTab === tier
							? 'game-btn-primary'
							: 'text-slate-300'}"
					>
						★ {tier}티어 ({TIER_CONFIG[tier as 1|2|3|4].name})
					</button>
				{/each}
				<button
					onclick={() => (activeTab = 5)}
					class="game-btn text-xs px-3 py-1 font-bold {activeTab === 5
						? 'game-btn-danger'
						: 'text-rose-400 border-rose-900/60'}"
				>
					🚨 5티어 (히든 신화)
				</button>
				<button
					onclick={() => (activeTab = 'boss')}
					class="game-btn text-xs px-3 py-1 font-bold {activeTab === 'boss'
						? 'bg-amber-600 text-white border-amber-400'
						: 'text-amber-400 border-amber-900/60'}"
				>
					👑 80R 보스 레이드
				</button>
			</div>

			<!-- Tab Content Inset -->
			<div class="flex-1 p-4 overflow-y-auto bg-slate-950/70 m-2 rounded-xl border border-slate-800">
				{#if activeTab === 'boss'}
					<!-- Boss Grid (2 Columns) -->
					<div class="grid grid-cols-2 gap-3.5">
						{#each BOSS_LIST as bInfo}
							{@const boss = BOSSES_MASTER[bInfo.round]}
							{#if boss}
								<div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
									<div>
										<div class="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
											<div class="flex items-center gap-2">
												<span class="text-xl">{bInfo.icon}</span>
												<div>
													<span class="font-bold text-xs text-cyan-300">R{boss.round}: {boss.name}</span>
												</div>
											</div>
											<span class="text-[10px] px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 rounded font-bold font-mono">
												+{boss.rewardGold} Byte
											</span>
										</div>

										<div class="grid grid-cols-2 gap-2 text-[11px] mb-2 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono">
											<div class="text-rose-400 font-bold p-1 bg-rose-950/40 rounded text-center">
												❤️ {boss.maxHp.toLocaleString()}
											</div>
											<div class="text-sky-400 font-bold p-1 bg-sky-950/40 rounded text-center">
												🛡️ {boss.defense}
											</div>
										</div>

										<div class="text-[11px] text-slate-300 bg-slate-950/60 border border-amber-800/40 rounded-lg p-2.5 leading-relaxed">
											<span class="font-bold text-amber-400">💡 기믹:</span> {bInfo.desc}
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					{#if activeTab === 5}
						<div class="mb-3 p-3 bg-rose-950/50 border border-rose-700/80 text-xs text-rose-200 rounded-xl flex flex-col gap-1.5 shadow-sm">
							<div class="flex items-center justify-between border-b border-rose-800/60 pb-1.5">
								<span class="font-bold text-rose-300">🔑 5대 히든 신화(Mythic) 각성 도전 레시피:</span>
								<span class="text-[10px] text-yellow-400 font-bold">각성 성공 40% (실패 시 1기 유지 + 120B 환급)</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-200 pt-1">
								<div>• [휠 오브 데스] × 2 ➔ <b class="text-cyan-300">[블랙홀 스피너]</b></div>
								<div>• [매직 완드] × 2 ➔ <b class="text-purple-300">[양자 지우개]</b></div>
								<div>• [관리자 포인터] × 2 ➔ <b class="text-emerald-300">[루트 슈퍼유저 (SUDO)]</b></div>
								<div>• [개발자 콘솔] × 2 ➔ <b class="text-yellow-300">[치트 엔진]</b></div>
								<div class="col-span-2 text-rose-400 font-bold">• [마스터 단축키] × 2 ➔ [Ctrl + Alt + Del]</div>
							</div>
						</div>
					{/if}

					<!-- Unit Cards Grid (2 Columns) -->
					<div class="grid grid-cols-2 gap-3.5">
						{#each TIER_UNITS[activeTab as 1|2|3|4|5] || [] as unitId}
							{@const unit = UNITS_MASTER[unitId]}
							{#if unit}
								<div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between {unit.tier === 5 ? 'ring-1 ring-rose-500/70 bg-slate-900' : ''}">
									<div>
										<div class="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
											<div class="flex items-center gap-2">
												<div
													class="w-6 h-6 flex items-center justify-center font-bold text-xs rounded border shadow-sm"
													style="background-color: {TIER_CONFIG[unit.tier].bgBadge}; color: {TIER_CONFIG[unit.tier].color}; border-color: {TIER_CONFIG[unit.tier].color};"
												>
													T{unit.tier}
												</div>
												<span class="font-bold text-xs {unit.tier === 5 ? 'text-rose-400' : 'text-white'}">{unit.name}</span>
											</div>
											<span class="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded font-mono">
												+{TIER_CONFIG[unit.tier].refund}B
											</span>
										</div>

										<div class="grid grid-cols-3 gap-2 text-[11px] mb-2 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono">
											<div class="text-rose-300 bg-rose-950/60 border border-rose-800/60 p-1.5 rounded text-center font-bold">
												⚔️ {unit.damage}
											</div>
											<div class="text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-1.5 rounded text-center font-bold">
												⚡ {unit.attackSpeed}s
											</div>
											<div class="text-sky-300 bg-sky-950/60 border border-sky-800/60 p-1.5 rounded text-center font-bold">
												🎯 {unit.range >= 9000 ? '전체' : unit.range}
											</div>
										</div>

										{#if unit.skill}
											<div class="text-[11px] text-slate-300 bg-slate-950/60 border border-purple-800/40 rounded-lg p-2 leading-relaxed">
												<span class="font-bold text-purple-400">스킬:</span>
												{unit.skill.description}
											</div>
										{/if}
									</div>

									<div class="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
										공격 유형: {unit.attackType}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-3 px-4 bg-slate-950/95 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
				<span class="text-[11px] font-mono">💡 <b>합성 룰</b>: 동일 유닛 드래그 시 100% 확정 상위 티어 합성 (🌟 1~2% 희귀 확률로 +2단계 퀀텀 점프 대성공!)</span>
				<button onclick={() => (gameStore.isGuideOpen = false)} class="game-btn game-btn-primary text-xs px-4 py-1.5 font-bold">
					확인
				</button>
			</div>
		</div>
	</div>
{/if}
