<script lang="ts">
	import { gameStore } from '$lib/state/gameStore.svelte';
	import { multiplayer } from '$lib/network/MultiplayerManager';
	import type { GameMode } from '$lib/types/game';

	let chosenMode = $state<GameMode>('SOLO');
	let joinInputCode = $state('');
	let isJoiningMode = $state(false);

	function handleStart() {
		if (chosenMode === 'ONLINE_COOP') {
			gameStore.startOnlineHost();
		} else {
			gameStore.startGame(chosenMode);
		}
	}

	function handleJoinSubmit() {
		const code = joinInputCode.replace('#', '').trim();
		if (code.length >= 4) {
			gameStore.joinOnlineGuest(code);
		}
	}

	function handleCancelLobby() {
		multiplayer.disconnect();
		gameStore.isWaitingForGuest = false;
		isJoiningMode = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!gameStore.isModeSelectOpen) return;
		if (e.key === 'Enter' && !gameStore.isWaitingForGuest) {
			if (isJoiningMode) {
				handleJoinSubmit();
			} else if (chosenMode !== 'ONLINE_COOP') {
				handleStart();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if gameStore.isModeSelectOpen}
	<div class="modal-backdrop select-none">
		<div class="game-modal shadow-2xl text-white flex flex-col modal-container">
			<!-- 1. Header Bar (No Mouse Icon) -->
			<div class="game-header flex items-center justify-between px-5 py-3 bg-slate-950/95 border-b border-slate-800/90">
				<div class="flex items-center gap-2.5">
					<div class="flex items-center gap-1.5">
						<span class="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
							CURSOR DEFENSE
						</span>
						<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
							v3.6.0
						</span>
					</div>
				</div>
				{#if gameStore.engine.stats.currentRound > 1 || !gameStore.engine.stats.isGameOver}
					<button onclick={() => (gameStore.isModeSelectOpen = false)} class="game-close-btn" title="닫기">
						✕
					</button>
				{/if}
			</div>

			<!-- 2. Dialog Body -->
			<div class="p-4 bg-slate-900 flex flex-col gap-3">
				<!-- Title Banner (Compact) -->
				<div class="flex items-center justify-between pb-1 border-b border-slate-800">
					<h2 class="text-base font-black tracking-tight text-white flex items-center gap-2">
						<span>모드 선택</span>
					</h2>
					<span class="text-[11px] font-mono text-cyan-400 font-bold">80R DEFENSE</span>
				</div>

				{#if gameStore.isWaitingForGuest}
					<!-- Waiting Lobby for Host -->
					<div class="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
						<div class="relative flex items-center justify-center">
							<span class="text-3xl animate-bounce">📡</span>
							<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
						</div>
						<div>
							<h3 class="text-sm font-bold text-cyan-300">2P 접속 대기 중</h3>
							<p class="text-[11px] text-slate-400 mt-0.5">아래 4자리 방 코드를 공유하세요</p>
						</div>

						<!-- Room Code Card -->
						<div class="p-3 px-5 bg-slate-900 border border-cyan-500/30 rounded-xl flex flex-col items-center min-w-[200px] shadow-[0_0_20px_rgba(6,182,212,0.15)]">
							<span class="text-[9px] text-sky-400 font-bold tracking-wider uppercase">Room Code</span>
							<span class="text-2xl font-black font-mono text-yellow-400 tracking-widest mt-0.5">
								{gameStore.netRoomId ? `#${gameStore.netRoomId}` : '생성 중...'}
							</span>
							{#if gameStore.netRoomId}
								<button
									onclick={() => navigator.clipboard.writeText(gameStore.netRoomId || '')}
									class="game-btn text-[11px] px-3 py-1 font-bold mt-2 flex items-center gap-1.5"
								>
									<span>📋</span>
									<span>코드 복사</span>
								</button>
							{/if}
						</div>

						<div class="text-[11px] text-slate-400 flex items-center gap-1.5">
							<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
							<span>서버 온라인</span>
						</div>

						{#if gameStore.netError}
							<div class="text-[11px] text-rose-400 bg-rose-950/60 p-2 border border-rose-700 rounded-lg w-full font-bold">
								⚠️ {gameStore.netError}
							</div>
						{/if}

						<button onclick={handleCancelLobby} class="game-btn text-xs px-4 py-1.5 font-bold">
							대기 취소
						</button>
					</div>
				{:else if isJoiningMode}
					<!-- Guest Room Code Input Form -->
					<div class="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
						<div class="flex items-center gap-2.5">
							<div class="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-lg">
								🤝
							</div>
							<div>
								<h3 class="text-xs font-bold text-sky-300">2인 멀티 방 참가</h3>
								<p class="text-[11px] text-slate-400">방장의 4자리 코드를 입력하세요</p>
							</div>
						</div>

						<div class="flex items-center gap-2 my-1">
							<span class="font-bold text-xs text-slate-300 flex-shrink-0">방 코드:</span>
							<input
								type="text"
								bind:value={joinInputCode}
								placeholder="9801"
								maxlength="6"
								class="px-3 py-1.5 font-mono text-lg font-black text-center w-32 uppercase tracking-widest bg-slate-900 border-2 border-slate-700 rounded-lg text-yellow-400 focus:outline-none focus:border-cyan-400"
								onkeydown={(e) => e.key === 'Enter' && handleJoinSubmit()}
							/>
							<button
								onclick={handleJoinSubmit}
								disabled={joinInputCode.trim().length < 4}
								class="game-btn game-btn-primary text-xs px-4 py-2 font-bold flex-1"
							>
								입장
							</button>
						</div>

						{#if gameStore.netError}
							<div class="text-[11px] text-rose-400 bg-rose-950/60 p-2 border border-rose-700 rounded-lg font-bold">
								⚠️ {gameStore.netError}
							</div>
						{/if}

						<div class="flex justify-end pt-1.5 border-t border-slate-800">
							<button onclick={() => { isJoiningMode = false; gameStore.netError = null; }} class="game-btn text-[11px] px-3 py-1 font-bold">
								‹ 뒤로가기
							</button>
						</div>
					</div>
				{:else}
					<!-- 3 Interactive Mode Selection Cards (Guaranteed 3-Column Grid) -->
					<div class="grid grid-cols-3 gap-3">
						<!-- Card 1: 1인 솔로 (Solo) -->
						<button
							type="button"
							class="mode-card {chosenMode === 'SOLO' ? 'selected-solo' : ''}"
							onclick={() => (chosenMode = 'SOLO')}
						>
							<div class="flex items-center justify-between w-full px-0.5">
								<span class="text-[10px] px-2 py-0.5 rounded-full font-bold {chosenMode === 'SOLO' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
									1P SOLO
								</span>
								{#if chosenMode === 'SOLO'}
									<span class="text-[11px] text-cyan-400 font-bold">✓</span>
								{/if}
							</div>

							<div class="icon-bubble {chosenMode === 'SOLO' ? 'icon-bubble-solo' : ''}">
								<span class="text-2xl">👤</span>
							</div>

							<div class="text-center">
								<h3 class="font-black text-xs text-white">1인 솔로</h3>
							</div>

							<div class="w-full pt-1.5 border-t border-slate-800 flex flex-col gap-1">
								<span class="tag-chip">[100마리 한계]</span>
								<span class="tag-chip">[단독 라인]</span>
								<span class="tag-chip">[확정 합성]</span>
							</div>
						</button>

						<!-- Card 2: AI 협동 (AI Co-op) -->
						<button
							type="button"
							class="mode-card {chosenMode === 'AI_COOP' ? 'selected-ai' : ''}"
							onclick={() => (chosenMode = 'AI_COOP')}
						>
							<div class="flex items-center justify-between w-full px-0.5">
								<span class="text-[10px] px-2 py-0.5 rounded-full font-bold {chosenMode === 'AI_COOP' ? 'bg-purple-950 text-purple-300 border border-purple-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
									AI CO-OP
								</span>
								{#if chosenMode === 'AI_COOP'}
									<span class="text-[11px] text-purple-400 font-bold">✓</span>
								{/if}
							</div>

							<div class="icon-bubble {chosenMode === 'AI_COOP' ? 'icon-bubble-ai' : ''}">
								<span class="text-2xl">🤖</span>
							</div>

							<div class="text-center">
								<h3 class="font-black text-xs text-white">AI 협동</h3>
							</div>

							<div class="w-full pt-1.5 border-t border-slate-800 flex flex-col gap-1">
								<span class="tag-chip">[200마리 한계]</span>
								<span class="tag-chip">[협동 라인]</span>
								<span class="tag-chip">[AI 지원]</span>
							</div>
						</button>

						<!-- Card 3: 2인 온라인 (Online 2P) -->
						<button
							type="button"
							class="mode-card {chosenMode === 'ONLINE_COOP' ? 'selected-online' : ''}"
							onclick={() => (chosenMode = 'ONLINE_COOP')}
						>
							<div class="flex items-center justify-between w-full px-0.5">
								<span class="text-[10px] px-2 py-0.5 rounded-full font-bold {chosenMode === 'ONLINE_COOP' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
									2P ONLINE
								</span>
								{#if chosenMode === 'ONLINE_COOP'}
									<span class="text-[11px] text-emerald-400 font-bold">✓</span>
								{/if}
							</div>

							<div class="icon-bubble {chosenMode === 'ONLINE_COOP' ? 'icon-bubble-online' : ''}">
								<span class="text-2xl">🌐</span>
							</div>

							<div class="text-center">
								<h3 class="font-black text-xs text-white">2P 멀티</h3>
							</div>

							<div class="w-full pt-1.5 border-t border-slate-800 flex flex-col gap-1">
								<span class="tag-chip">[실시간 동기]</span>
								<span class="tag-chip">[코드 입장]</span>
								<span class="tag-chip">[2인 협동]</span>
							</div>
						</button>
					</div>

					<!-- Dynamic Feature Description Box (Compact, Padding Secured) -->
					<div class="p-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
						{#if chosenMode === 'SOLO'}
							<span class="text-sm flex-shrink-0">🛡️</span>
							<span class="font-medium text-[11px] text-slate-300">
								<b>[1P 솔로]</b> 100마리 한계 • 단독 80R 방어선 수호
							</span>
						{:else if chosenMode === 'AI_COOP'}
							<span class="text-sm flex-shrink-0">🤖</span>
							<span class="font-medium text-[11px] text-slate-300">
								<b>[AI 협동]</b> 200마리 한계 • AI 파트너 동시 수호
							</span>
						{:else}
							<span class="text-sm flex-shrink-0">🌐</span>
							<span class="font-medium text-[11px] text-slate-300">
								<b>[2P 멀티]</b> 실시간 WebSocket 동기화 • 2인 협공
							</span>
						{/if}
					</div>

					<!-- Action Footer Buttons (Compact) -->
					<div class="flex items-center justify-between pt-2 border-t border-slate-800">
						{#if chosenMode === 'ONLINE_COOP'}
							<button
								onclick={() => { isJoiningMode = true; gameStore.netError = null; }}
								class="game-btn text-xs px-3.5 py-2 font-bold flex items-center gap-1.5"
							>
								<span>🤝</span>
								<span>방 참가</span>
							</button>
							<button
								onclick={handleStart}
								class="game-btn game-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
							>
								<span>🏠</span>
								<span>방 생성</span>
							</button>
						{:else if chosenMode === 'AI_COOP'}
							<div class="flex items-center gap-1.5 text-xs text-slate-400">
								<span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
								<span class="text-[11px] font-mono">READY</span>
							</div>
							<button
								onclick={handleStart}
								class="game-btn game-btn-primary text-xs px-5 py-2 font-black flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
							>
								<span>▶ 시작</span>
								<span class="text-[9px] px-1 bg-black/40 rounded text-yellow-300 font-mono">Enter</span>
							</button>
						{:else}
							<div class="flex items-center gap-1.5 text-xs text-slate-400">
								<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
								<span class="text-[11px] font-mono">READY</span>
							</div>
							<button
								onclick={handleStart}
								class="game-btn game-btn-primary text-xs px-5 py-2 font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(14,165,233,0.35)]"
							>
								<span>▶ 시작</span>
								<span class="text-[9px] px-1 bg-black/40 rounded text-yellow-300 font-mono">Enter</span>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-container {
		width: 580px;
		max-width: 95vw;
		margin: auto;
		border-radius: 16px;
		box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(14, 165, 233, 0.15);
	}

	.mode-card {
		display: flex !important;
		flex-direction: column !important;
		align-items: center !important;
		justify-content: flex-start !important;
		padding: 10px 8px !important;
		gap: 6px !important;
		border: 1px solid rgba(51, 65, 85, 0.7) !important;
		border-radius: 12px !important;
		background: rgba(15, 23, 42, 0.8) !important;
		cursor: pointer;
		transition: all 0.15s ease-out;
		text-align: center;
		outline: none;
		position: relative;
	}

	.mode-card:hover {
		background: rgba(30, 41, 59, 0.95) !important;
		border-color: rgba(56, 189, 248, 0.4) !important;
		transform: translateY(-2px);
	}

	.selected-solo {
		background: rgba(8, 47, 73, 0.45) !important;
		border-color: #38bdf8 !important;
		box-shadow: 0 0 16px rgba(56, 189, 248, 0.25), inset 0 0 10px rgba(56, 189, 248, 0.05);
		transform: translateY(-2px);
	}

	.selected-ai {
		background: rgba(59, 7, 100, 0.45) !important;
		border-color: #c084fc !important;
		box-shadow: 0 0 16px rgba(192, 132, 252, 0.25), inset 0 0 10px rgba(192, 132, 252, 0.05);
		transform: translateY(-2px);
	}

	.selected-online {
		background: rgba(6, 78, 59, 0.45) !important;
		border-color: #34d399 !important;
		box-shadow: 0 0 16px rgba(52, 211, 153, 0.25), inset 0 0 10px rgba(52, 211, 153, 0.05);
		transform: translateY(-2px);
	}

	.icon-bubble {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(30, 41, 59, 0.6);
		border: 1px solid rgba(71, 85, 105, 0.5);
		transition: all 0.15s ease;
	}

	.icon-bubble-solo {
		background: rgba(8, 47, 73, 0.8);
		border-color: #38bdf8;
		box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
	}

	.icon-bubble-ai {
		background: rgba(59, 7, 100, 0.8);
		border-color: #c084fc;
		box-shadow: 0 0 10px rgba(192, 132, 252, 0.35);
	}

	.icon-bubble-online {
		background: rgba(6, 78, 59, 0.8);
		border-color: #34d399;
		box-shadow: 0 0 10px rgba(52, 211, 153, 0.35);
	}

	.tag-chip {
		display: block;
		text-align: center;
		padding: 2.5px 4px;
		font-size: 10px;
		font-weight: 700;
		border-radius: 5px;
		background: rgba(2, 6, 23, 0.7);
		border: 1px solid rgba(51, 65, 85, 0.5);
		color: #cbd5e1;
		line-height: 1.2;
	}
</style>
