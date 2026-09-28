<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/state/gameStore.svelte';
	import { GameEngine } from '$lib/engine/GameEngine';
	import { UNITS_MASTER, GACHA_LEVEL_CONFIG } from '$lib/data/units';
	import { drawCursorUnit } from '$lib/engine/CursorRenderer';

	import { multiplayer } from '$lib/network/MultiplayerManager';

	let canvasEl: HTMLCanvasElement | null = null;
	let animFrameId: number | null = null;
	let lastTime = 0;
	let hoveredSlot: { player: 'p1' | 'p2'; index: number } | null = null;
	let syncFrame = 0;
	let mouseDownPos: { x: number; y: number } | null = null;
	let isDraggingActive = false;
	let isHoveringSellBtn = $state(false);
	let isHoveringSummonP1 = $state(false);
	let isHoveringSummonP2 = $state(false);
	let isHoveringUpgradeP1 = $state(false);
	let isHoveringUpgradeP2 = $state(false);

	onMount(() => {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		lastTime = performance.now();

		const loop = (time: number) => {
			try {
				const dt = Math.min((time - lastTime) / 1000, 0.1);
				lastTime = time;

				// Update Engine
				if (gameStore.engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2') {
					// Guest: client-side visual interpolation without running duplicate simulation
					gameStore.engine.updateClientVisuals(dt);
				} else {
					// Host or Solo/AI Co-op: authoritative game simulation
					gameStore.engine.update(dt);

					// Broadcast Snapshot if Host in Online Co-op (every 3 frames = ~20fps)
					if (gameStore.engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p1') {
						syncFrame++;
						if (syncFrame % 3 === 0) {
							multiplayer.sendGameSync(gameStore.engine.getSnapshot());
						}
					}
				}

				// Render
				render(ctx, time / 1000);
			} catch (err) {
				console.error('[GameCanvas Render/Update Error]:', err);
			}

			animFrameId = requestAnimationFrame(loop);
		};

		animFrameId = requestAnimationFrame(loop);

		return () => {
			if (animFrameId) cancelAnimationFrame(animFrameId);
		};
	});

	function render(ctx: CanvasRenderingContext2D, animTime: number) {
		const engine = gameStore.engine;

		// 1. Clear with Deep DOS/CRT Black
		ctx.fillStyle = '#050a14';
		ctx.fillRect(0, 0, GameEngine.WIDTH, GameEngine.HEIGHT);

		// 2. Draw PCB Circuit Grid & BIOS Bus Telemetry
		drawCircuitGrid(ctx, animTime);

		// 3. Draw Central Telemetry Display (Prominently placed directly above Boss Room)
		drawCentralTelemetry(ctx, engine, animTime);

		// 4. Draw Boss Chamber in Center
		drawBossChamber(ctx, engine, animTime);

		// 5. Draw 1P Memory Track & Sockets
		drawPlayerZone(ctx, engine.p1, 'SECTOR-1 [USER MEMORY BUS]', engine, animTime);

		// 6. Draw 2P Memory Track (if Co-op)
		if (engine.stats.gameMode !== 'SOLO') {
			drawPlayerZone(
				ctx,
				engine.p2,
				engine.p2.isAi ? 'SECTOR-2 [AI PARTNER BUS]' : 'SECTOR-2 [GUEST MEMORY BUS]',
				engine,
				animTime
			);
		} else {
			drawSoloInactiveZone(ctx);
		}

		// 7. Draw Projectiles & Lasers
		drawProjectiles(ctx, engine);

		// 8. Draw Particles & Sparkles
		drawParticles(ctx, engine, animTime);

		// 9. Draw Floating Damage Numbers
		drawFloatingTexts(ctx, engine);

		// 10. Draw Quick-Sell Floating Action Button (Visible when slot selected and NOT dragging)
		const sellBtnRect = getQuickSellButtonRect();
		if (sellBtnRect) {
			drawQuickSellButton(ctx, sellBtnRect, isHoveringSellBtn, animTime);
		}

		// 11. Draw Dragging Unit Ghost
		if (engine.draggingUnit && isDraggingActive) {
			const unitMaster = UNITS_MASTER[engine.draggingUnit.unit.unitId];
			if (unitMaster) {
				drawCursorUnit(
					ctx,
					engine.dragPos.x,
					engine.dragPos.y,
					unitMaster,
					false,
					false,
					animTime,
					1.0,
					0,
					-Math.PI * 0.75
				);

				// Draw Drag Range Indicator
				if (unitMaster.range < 9000) {
					ctx.beginPath();
					ctx.arc(engine.dragPos.x, engine.dragPos.y, unitMaster.range, 0, Math.PI * 2);
					ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
					ctx.setLineDash([4, 4]);
					ctx.stroke();
					ctx.setLineDash([]);
				}
			}
		}

		// 12. Draw Boss WARNING Entry Animation Banner
		if (engine.bossWarningTimer > 0) {
			drawBossWarningBanner(ctx, engine, animTime);
		}

		// 13. Draw Game Over Overlay
		if (engine.stats.isGameOver) {
			drawGameOverScreen(ctx, engine, animTime);
		}
	}

	function drawCircuitGrid(ctx: CanvasRenderingContext2D, animTime: number) {
		ctx.beginPath();
		ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
		ctx.lineWidth = 1;
		const gridSize = 40;

		for (let x = 0; x < GameEngine.WIDTH; x += gridSize) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, GameEngine.HEIGHT);
		}

		for (let y = 0; y < GameEngine.HEIGHT; y += gridSize) {
			ctx.moveTo(0, y);
			ctx.lineTo(GameEngine.WIDTH, y);
		}
		ctx.stroke();
	}

	// ----------------------------------------------------
	// 1. Central Telemetry Panel (Directly above Boss Room)
	// ----------------------------------------------------
	function drawCentralTelemetry(
		ctx: CanvasRenderingContext2D,
		engine: GameEngine,
		animTime: number
	) {
		const cx = GameEngine.BOSS_CENTER_X;
		const panelW = 320;
		const panelH = 68;
		const panelY = 48;

		// Modern Gaming Telemetry Header
		ctx.fillStyle = '#0a101d';
		ctx.fillRect(cx - panelW / 2, panelY, panelW, panelH);

		ctx.strokeStyle = engine.stats.isBossRound ? '#ef4444' : '#334155';
		ctx.lineWidth = 2;
		ctx.strokeRect(cx - panelW / 2, panelY, panelW, panelH);

		// Header Tab Line
		ctx.fillStyle = engine.stats.isBossRound ? '#7f1d1d' : '#1e293b';
		ctx.fillRect(cx - panelW / 2, panelY, panelW, 20);
		ctx.strokeStyle = '#475569';
		ctx.strokeRect(cx - panelW / 2, panelY, panelW, 20);

		ctx.font = 'bold 11px "Pretendard", sans-serif';
		ctx.fillStyle = engine.stats.isBossRound ? '#fca5a5' : '#94a3b8';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			engine.stats.isBossRound
				? '⚠️ EMERGENCY: BOSS THREAT IN PROGRESS ⚠️'
				: 'CURSOR DEFENSE TACTICAL TELEMETRY',
			cx,
			panelY + 10
		);

		// Row 1: Large Round Display
		ctx.textAlign = 'left';
		ctx.font = 'bold 16px "Pretendard", sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(`ROUND:`, cx - panelW / 2 + 14, panelY + 45);

		ctx.font = 'bold 20px "Pretendard", sans-serif';
		ctx.fillStyle = engine.stats.isBossRound ? '#ef4444' : '#38bdf8';
		ctx.fillText(`${engine.stats.currentRound}`, cx - panelW / 2 + 82, panelY + 44);

		ctx.font = 'bold 12px "Pretendard", sans-serif';
		ctx.fillStyle = '#64748b';
		ctx.fillText(`/ ${engine.stats.maxRound}`, cx - panelW / 2 + 112, panelY + 45);

		// Row 2: Digital Timer Countdown
		const timeLeft = Math.max(0, Math.ceil(engine.stats.roundTimeLeft));
		const isUrgent = timeLeft <= 10 || (engine.stats.isBossRound && timeLeft <= 15);

		ctx.textAlign = 'right';
		ctx.font = 'bold 13px "Pretendard", sans-serif';
		ctx.fillStyle = '#94a3b8';
		ctx.fillText(`남은 시간:`, cx + panelW / 2 - 68, panelY + 45);

		ctx.font = 'bold 20px "Pretendard", sans-serif';
		ctx.fillStyle = isUrgent ? (Math.floor(animTime * 4) % 2 === 0 ? '#ef4444' : '#fbbf24') : '#fbbf24';
		ctx.fillText(`${timeLeft}s`, cx + panelW / 2 - 14, panelY + 44);
	}

	// ----------------------------------------------------
	// 2. Central Boss Chamber (Cleaned with Huge Boss Avatar)
	// ----------------------------------------------------
	function drawBossChamber(
		ctx: CanvasRenderingContext2D,
		engine: GameEngine,
		animTime: number
	) {
		const bx = GameEngine.BOSS_CENTER_X;
		const by = GameEngine.BOSS_CENTER_Y + 25;
		const bw = 320;
		const bh = 420;

		// Room Background
		ctx.fillStyle = '#020617';
		ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);

		// Subtle Dark Containment Frame (Calm in normal rounds, red in boss rounds)
		drawChamberFrame(ctx, bx - bw / 2, by - bh / 2, bw, bh, engine.stats.isBossRound, animTime);

		// Chamber Top Title Plate
		ctx.fillStyle = engine.stats.isBossRound ? '#450a0a' : '#0a101d';
		ctx.fillRect(bx - bw / 2 + 4, by - bh / 2 + 4, bw - 8, 26);
		ctx.strokeStyle = engine.stats.isBossRound ? '#ef4444' : '#1e293b';
		ctx.lineWidth = 1.5;
		ctx.strokeRect(bx - bw / 2 + 4, by - bh / 2 + 4, bw - 8, 26);

		ctx.font = 'bold 11px "Pretendard", sans-serif';
		ctx.fillStyle = engine.stats.isBossRound ? '#f87171' : '#64748b';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			engine.stats.isBossRound
				? '🚨 [보스 격리 구역] 🚨'
				: '🔒 VIRUS QUARANTINE CORE',
			bx,
			by - bh / 2 + 18
		);

		// Boss Entity Display
		if (engine.boss) {
			const b = engine.boss;
			const bossCenterY = by - 25;

			// Rotating High-Tech Target Reticle
			ctx.save();
			ctx.translate(bx, bossCenterY);
			ctx.rotate(animTime * 1.5);
			ctx.beginPath();
			ctx.arc(0, 0, 80, 0, Math.PI * 2);
			ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
			ctx.lineWidth = 2;
			ctx.setLineDash([12, 8]);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.restore();

			// Boss Glowing Aura
			ctx.beginPath();
			ctx.arc(bx, bossCenterY, 70, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(239, 68, 68, ${0.18 + Math.sin(animTime * 6) * 0.1})`;
			ctx.fill();
			ctx.strokeStyle = '#ef4444';
			ctx.lineWidth = 2.5;
			ctx.stroke();

			// Huge Boss Sprite Avatar (96px)
			ctx.font = '96px "Pretendard", sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			const bossIcon =
				b.master.id === 'BOSS_10R'
					? '📨'
					: b.master.id === 'BOSS_20R'
						? '🐴'
						: b.master.id === 'BOSS_30R'
							? '🔒'
							: b.master.id === 'BOSS_40R'
								? '🌐'
								: b.master.id === 'BOSS_50R'
									? '💀'
									: b.master.id === 'BOSS_60R'
										? '☢️'
										: b.master.id === 'BOSS_70R'
											? '⛏️'
											: '⏳';
			ctx.fillText(bossIcon, bx, bossCenterY);

			// Boss Name Plate
			ctx.fillStyle = '#0f172a';
			ctx.fillRect(bx - 130, by + 75, 260, 28);
			ctx.strokeStyle = '#dc2626';
			ctx.lineWidth = 1.5;
			ctx.strokeRect(bx - 130, by + 75, 260, 28);

			ctx.font = 'bold 15px "Pretendard", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(b.master.name, bx, by + 89);

			// Boss HP & Shield Bar
			const barW = 260;
			const barH = 22;
			const hpPercent = Math.max(0, b.hp / b.maxHp);

			ctx.fillStyle = '#0b1120';
			ctx.fillRect(bx - barW / 2 - 2, by + 115, barW + 4, barH + 4);

			// Red HP Fill
			ctx.fillStyle = '#ef4444';
			ctx.fillRect(bx - barW / 2, by + 117, barW * hpPercent, barH);

			// Shield Fill
			if (b.shield > 0 && b.maxShield > 0) {
				const shieldPercent = Math.min(1, b.shield / b.maxShield);
				ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
				ctx.fillRect(bx - barW / 2, by + 117, barW * shieldPercent, barH);
			}

			// Modern sleek border
			ctx.strokeStyle = '#334155';
			ctx.lineWidth = 1.5;
			ctx.strokeRect(bx - barW / 2 - 2, by + 115, barW + 4, barH + 4);

			// HP Text Readout
			ctx.font = 'bold 13px "Pretendard", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(
				`${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()} HP`,
				bx,
				by + 128
			);

			// Draw energy arcs to boss when warped
			for (const s of engine.p1.slots) {
				if (s.unit?.isWarped) {
					const warpPos = engine.p1.warpSlots[s.index];
					if (warpPos) {
						ctx.beginPath();
						ctx.moveTo(warpPos.x, warpPos.y);
						ctx.lineTo(bx, bossCenterY);
						ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + Math.random() * 0.3})`;
						ctx.lineWidth = 2;
						ctx.stroke();
					}
				}
			}
			if (engine.stats.gameMode !== 'SOLO') {
				for (const s of engine.p2.slots) {
					if (s.unit?.isWarped) {
						const warpPos = engine.p2.warpSlots[s.index];
						if (warpPos) {
							ctx.beginPath();
							ctx.moveTo(warpPos.x, warpPos.y);
							ctx.lineTo(bx, bossCenterY);
							ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + Math.random() * 0.3})`;
							ctx.lineWidth = 2;
							ctx.stroke();
						}
					}
				}
			}
		} else {
			// Normal round standby: Clean dormant quarantine chamber
			ctx.save();
			ctx.translate(bx, by - 25);
			ctx.beginPath();
			ctx.arc(0, 0, 48, 0, Math.PI * 2);
			ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 6]);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.font = '28px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('🛡️', 0, -8);

			ctx.font = 'bold 11px "Pretendard", sans-serif';
			ctx.fillStyle = '#64748b';
			ctx.fillText('격리 챔버 대기중', 0, 22);
			ctx.restore();
		}

		// Draw Flank Warp Capacity Badges (Always visible so players can freely warp units anytime)
		const p1Warped = engine.p1.slots.filter((s) => s.unit?.isWarped).length;
		ctx.font = 'bold 11px "Pretendard", sans-serif';
		ctx.fillStyle = p1Warped >= 5 ? '#fef08a' : '#38bdf8';
		ctx.textAlign = 'left';
		ctx.fillText(`1P 전진배치: ${p1Warped}/5${p1Warped >= 5 ? ' (MAX)' : ''}`, bx - 145, by + 158);

		if (engine.stats.gameMode !== 'SOLO') {
			const p2Warped = engine.p2.slots.filter((s) => s.unit?.isWarped).length;
			ctx.fillStyle = p2Warped >= 5 ? '#fef08a' : '#c084fc';
			ctx.textAlign = 'right';
			ctx.fillText(`2P 전진배치: ${p2Warped}/5${p2Warped >= 5 ? ' (MAX)' : ''}`, bx + 145, by + 158);
		}

		// Tactical Double-Click Guide
		ctx.textAlign = 'center';
		ctx.font = 'bold 10px "Pretendard", sans-serif';
		ctx.fillStyle = '#fde047';
		ctx.fillText('💡 [유닛 더블클릭]: 보스방 투입 / 기지 복귀 (상시 자유 이동)', bx, by + 180);
	}

	// ----------------------------------------------------
	// 3. Dynamic Boss Entry "WARNING" Alert Banner
	// ----------------------------------------------------
	function drawBossWarningBanner(
		ctx: CanvasRenderingContext2D,
		engine: GameEngine,
		animTime: number
	) {
		const timer = engine.bossWarningTimer;
		const totalDuration = 3.2;
		const progress = Math.max(0, Math.min(1, 1 - timer / totalDuration));

		// Calculate alpha based on entrance, hold, and exit
		let alpha = 1.0;
		if (progress < 0.15) {
			alpha = progress / 0.15;
		} else if (progress > 0.8) {
			alpha = (1 - progress) / 0.2;
		}

		ctx.save();
		ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

		// Red Flashing Screen Perimeter Vignette
		const flashIntensity = Math.sin(animTime * 12) * 0.5 + 0.5;
		ctx.fillStyle = `rgba(239, 68, 68, ${0.15 * flashIntensity})`;
		ctx.fillRect(0, 0, GameEngine.WIDTH, GameEngine.HEIGHT);

		// Center Emergency Warning Banner (Sliding across the screen)
		const bannerH = 130;
		const bannerY = GameEngine.HEIGHT / 2 - bannerH / 2 - 20;

		// Black Backdrop
		ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
		ctx.fillRect(0, bannerY, GameEngine.WIDTH, bannerH);

		// Top & Bottom Yellow/Black Hazard Bands
		drawHazardStripFullWidth(ctx, bannerY, animTime);
		drawHazardStripFullWidth(ctx, bannerY + bannerH - 12, -animTime);

		// Red Neon Outline
		ctx.strokeStyle = '#ef4444';
		ctx.lineWidth = 3;
		ctx.strokeRect(0, bannerY, GameEngine.WIDTH, bannerH);

		// Pulsing Text
		const strobe = Math.floor(animTime * 6) % 2 === 0;

		ctx.font = 'bold 28px "Pretendard", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = strobe ? '#ff0000' : '#fbbf24';
		// Text Drop Shadow
		ctx.fillText(
			'⚠️ WARNING: BOSS INTRUSION DETECTED ⚠️',
			GameEngine.WIDTH / 2 + 2,
			bannerY + 45 + 2
		);
		ctx.fillStyle = '#ffffff';
		ctx.fillText(
			`⚠️ BOSS W${engine.stats.currentRound} INVASION`,
			GameEngine.WIDTH / 2,
			bannerY + 45
		);

		// Subtitle (Compact)
		ctx.font = 'bold 16px "Pretendard", sans-serif';
		ctx.fillStyle = '#38bdf8';
		ctx.fillText(
			`[ ${engine.bossWarningName} ] [더블클릭: 워프]`,
			GameEngine.WIDTH / 2,
			bannerY + 85
		);

		ctx.restore();
	}

	function drawHazardStripFullWidth(ctx: CanvasRenderingContext2D, y: number, animTime: number) {
		const h = 12;
		const stripeW = 24;
		const offset = (animTime * 40) % stripeW;

		ctx.fillStyle = '#eab308';
		ctx.fillRect(0, y, GameEngine.WIDTH, h);

		ctx.fillStyle = '#000000';
		for (let x = -stripeW + offset; x < GameEngine.WIDTH + stripeW; x += stripeW) {
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + stripeW / 2, y);
			ctx.lineTo(x, y + h);
			ctx.lineTo(x - stripeW / 2, y + h);
			ctx.closePath();
			ctx.fill();
		}
	}

	function drawChamberFrame(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number,
		isBossRound: boolean,
		animTime: number
	) {
		if (isBossRound) {
			// Emergency red glowing border during boss rounds
			ctx.strokeStyle = '#ef4444';
			ctx.lineWidth = 2.5;
			ctx.strokeRect(x, y, w, h);

			// Corner emergency brackets
			const cornerLen = 16;
			ctx.strokeStyle = '#f87171';
			ctx.lineWidth = 4;
			// Top-left
			ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
			// Top-right
			ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
			// Bottom-left
			ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
			// Bottom-right
			ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();
		} else {
			// Subtle, dark, unobtrusive containment frame during normal rounds (zero eye distraction!)
			ctx.strokeStyle = '#1e293b';
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, w, h);

			// Subtle corner accents
			const cornerLen = 12;
			ctx.strokeStyle = '#334155';
			ctx.lineWidth = 2.5;
			// Top-left
			ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
			// Top-right
			ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
			// Bottom-left
			ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
			// Bottom-right
			ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();
		}
	}

	// ----------------------------------------------------
	// 4. Player Zone (1P & 2P)
	// ----------------------------------------------------
	function drawPlayerZone(
		ctx: CanvasRenderingContext2D,
		player: any,
		label: string,
		engine: GameEngine,
		animTime: number
	) {
		const { trackCenterX: cx, trackCenterY: cy, trackRadius: R } = player;
		const count = player.monsters.length;
		const maxLimit = GameEngine.MAX_MONSTERS;
		const pct = Math.min(100, Math.round((count / maxLimit) * 100));
		const isCritical = count >= 80;

		const plateW = 280;
		const plateH = 58;
		const plateY = 44;

		// 1. Top Field Header Plate Background
		ctx.fillStyle = '#0a101d';
		ctx.fillRect(cx - plateW / 2, plateY, plateW, plateH);

		// Frame border (pulsing red when critical >= 80)
		const borderFlash = isCritical && Math.floor(animTime * 6) % 2 === 0;
		ctx.strokeStyle = borderFlash ? '#ef4444' : isCritical ? '#dc2626' : '#334155';
		ctx.lineWidth = isCritical ? 2 : 1.5;
		ctx.strokeRect(cx - plateW / 2, plateY, plateW, plateH);

		// Tier 1 (Top Header Tab): Sector Title
		ctx.fillStyle = '#1e293b';
		ctx.fillRect(cx - plateW / 2, plateY, plateW, 18);
		ctx.strokeStyle = '#334155';
		ctx.lineWidth = 1;
		ctx.strokeRect(cx - plateW / 2, plateY, plateW, 18);

		ctx.font = 'bold 10px "Pretendard", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#94a3b8';
		ctx.fillText(label, cx, plateY + 9);

		// Tier 2 (Middle Line): Clean Virus Counter & Percentage
		ctx.font = 'bold 13px "Pretendard", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const statusColor = isCritical
			? (borderFlash ? '#ff0000' : '#f87171')
			: pct >= 60
				? '#fbbf24'
				: '#4ade80';
		ctx.fillStyle = statusColor;
		ctx.fillText(`👾 ${count}/${maxLimit} (${pct}%)`, cx, plateY + 29);

		// Tier 3 (Bottom Line): 3D Inset LED Intrusion Gauge Bar
		const gaugeW = plateW - 24; // 256px
		const gaugeH = 10;
		const gaugeX = cx - gaugeW / 2;
		const gaugeY = plateY + 41;

		// Inset black trough
		ctx.fillStyle = '#000000';
		ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

		// Inset border
		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 1;
		ctx.strokeRect(gaugeX, gaugeY, gaugeW, gaugeH);

		// Gauge fill bar
		const fillW = Math.max(0, Math.min(gaugeW, (count / maxLimit) * gaugeW));
		if (fillW > 0) {
			const barColor = isCritical
				? (borderFlash ? '#ff0000' : '#ef4444')
				: pct >= 60
					? '#eab308'
					: '#22c55e';

			ctx.fillStyle = barColor;
			ctx.fillRect(gaugeX + 1, gaugeY + 1, fillW - 2, gaugeH - 2);

			// LED Glow aura
			ctx.save();
			ctx.fillStyle = barColor;
			ctx.globalAlpha = 0.25;
			ctx.fillRect(gaugeX, gaugeY, fillW, gaugeH);
			ctx.restore();

			// Segmented Tick Grid Overlay (10 Ticks)
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
			ctx.lineWidth = 1;
			for (let i = 1; i < 10; i++) {
				const tickX = gaugeX + (gaugeW / 10) * i;
				if (tickX < gaugeX + fillW) {
					ctx.beginPath();
					ctx.moveTo(tickX, gaugeY + 1);
					ctx.lineTo(tickX, gaugeY + gaugeH - 1);
					ctx.stroke();
				}
			}
		}

		// 2. Base Socket Connector Ring (Subtly linking the 12 sockets together)
		ctx.beginPath();
		ctx.arc(cx, cy, GameEngine.SLOT_RADIUS, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
		ctx.lineWidth = 18;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(cx, cy, GameEngine.SLOT_RADIUS, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// 3. Central Field Telemetry: RAM 보유량 & 소환 비용 (텍스트/숫자 위주, 판매 버튼과 여백 확보)
		const cost = engine.getSummonCost(player);
		const isP1 = player.id === 'p1';
		const isLocalP2 = gameStore.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2';
		const isInteractive = isP1 ? !isLocalP2 : isLocalP2;
		const canSummon = isP1 ? gameStore.canSummonP1 : gameStore.canSummonP2;
		const isHoveredSummon = isP1 ? isHoveringSummonP1 : isHoveringSummonP2;

		// Subtle Center Circular Tech Disc (Radius 70px)
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, 70, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(2, 6, 23, 0.76)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
		ctx.lineWidth = 1.2;
		ctx.setLineDash([4, 4]);
		ctx.stroke();
		ctx.setLineDash([]);

		if (!isP1 && gameStore.gameMode === 'SOLO') {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 12px "Pretendard", sans-serif';
			ctx.fillStyle = '#475569';
			ctx.fillText('2P 비활성', cx, cy - 12);
			ctx.font = 'bold 11px "Pretendard", sans-serif';
			ctx.fillStyle = '#334155';
			ctx.fillText('OFFLINE', cx, cy + 12);
		} else {
			// Top Header: RAM 보유량 & 소환기 레벨 (y = cy - 42)
			const gachaLvl = player.gachaLevel || 1;
			const gachaCfg = GACHA_LEVEL_CONFIG[gachaLvl] || GACHA_LEVEL_CONFIG[1];

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 9.5px "Pretendard", sans-serif';
			ctx.fillStyle = isP1 ? '#7dd3fc' : '#f0abfc';
			ctx.fillText(isP1 ? '💾 RAM' : '💾 2P', cx - 24, cy - 42);

			ctx.font = 'bold 9.5px "Pretendard", sans-serif';
			ctx.fillStyle = gachaLvl >= 10 ? '#fde047' : '#38bdf8';
			ctx.fillText(`Lv.${gachaLvl}${gachaLvl >= 10 ? ' MAX' : ''}`, cx + 28, cy - 42);

			// Middle Gold Readout (15px font) & Rates (y = cy - 25 ~ cy - 9)
			ctx.font = 'bold 15px "Pretendard", sans-serif';
			ctx.fillStyle = isP1 ? '#fef08a' : '#f5d0fe';
			ctx.fillText(`${player.gold.toLocaleString()}B`, cx, cy - 25);

			ctx.font = 'bold 8.5px "Pretendard", sans-serif';
			ctx.fillStyle = '#94a3b8';
			ctx.fillText(gachaCfg.shortRates, cx, cy - 9);

			// Middle Divider
			const hasSelectedUnitOnThisField = engine.selectedSlot?.player === player.id;
			if (!hasSelectedUnitOnThisField) {
				ctx.beginPath();
				ctx.moveTo(cx - 52, cy + 3);
				ctx.lineTo(cx + 52, cy + 3);
				ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			// Dual Capsule Action Buttons inside Center Hub
			// Left Capsule: [ 소환 (Space) ]
			const summonBtnRect = isP1 ? getSummonP1ButtonRect() : getSummonP2ButtonRect();
			const summonTitle = `➕ ${cost}B`;
			const summonSubtext = isInteractive ? '[Space]' : (isP1 ? '[1P]' : '[2P]');
			drawTacticalButton(
				ctx,
				summonBtnRect,
				summonTitle,
				summonSubtext,
				isHoveredSummon,
				canSummon,
				'#38bdf8'
			);

			// Right Capsule: [ 강화 (U) ]
			const upgradeBtnRect = isP1 ? getUpgradeP1ButtonRect() : getUpgradeP2ButtonRect();
			const upgradeCost = engine.getGachaUpgradeCost(player);
			const canUpgrade = isInteractive && upgradeCost !== null && player.gold >= upgradeCost;
			const isHoveredUpgrade = isP1 ? isHoveringUpgradeP1 : isHoveringUpgradeP2;

			const upgradeTitle = upgradeCost !== null ? `⚡ ${upgradeCost}B` : 'MAX';
			const upgradeSubtext = upgradeCost !== null ? (isInteractive ? '[ U ]' : '[강화]') : '[완료]';
			drawTacticalButton(
				ctx,
				upgradeBtnRect,
				upgradeTitle,
				upgradeSubtext,
				isHoveredUpgrade,
				upgradeCost !== null ? canUpgrade : true,
				upgradeCost !== null ? '#22c55e' : '#f59e0b'
			);
		}
		ctx.restore();

		// 4. 12 High-Visibility CPU/RAM Socket Slots
		for (const slot of player.slots) {
			const isHovered =
				hoveredSlot?.player === player.id && hoveredSlot?.index === slot.index;
			const isSelected =
				engine.selectedSlot?.player === player.id &&
				engine.selectedSlot?.index === slot.index;
			const unit = slot.unit;
			const master = unit ? UNITS_MASTER[unit.unitId] : null;

			// Socket Outer Ring (Radius 22)
			ctx.beginPath();
			ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
			ctx.fillStyle = isSelected
				? '#fef08a'
				: isHovered
					? 'rgba(56, 189, 248, 0.35)'
					: '#1e293b';
			ctx.fill();

			ctx.strokeStyle = isSelected
				? '#eab308'
				: isHovered
					? '#38bdf8'
					: master
						? master.themeColor
						: '#475569';
			ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
			ctx.stroke();

			// Recessed Pin Center (Radius 16)
			ctx.beginPath();
			ctx.arc(slot.x, slot.y, 16, 0, Math.PI * 2);
			ctx.fillStyle = master ? 'rgba(15, 23, 42, 0.92)' : '#0f172a';
			ctx.fill();

			// Draw Placed Unit
			if (unit && master) {
				const unitX = unit.isWarped ? player.warpSlots[slot.index].x : slot.x;
				const unitY = unit.isWarped ? player.warpSlots[slot.index].y : slot.y;

				const attackProgress = Math.max(0, Math.min(1, (unit.attackAnimTimer || 0) / 0.22));
				const targetAngle = unit.targetAngle !== undefined ? unit.targetAngle : -Math.PI * 0.75;

				// Calculate Spawn Animation Scale (Smooth ease-in to 1.0, no expansion > 1.0)
				let currentScale = unit.isWarped ? 0.65 : 1.0;
				const spawnTimer = unit.spawnAnimTimer || 0;
				if (spawnTimer > 0) {
					const maxTimer = master.tier === 4 ? 0.65 : 0.45;
					const p = Math.max(0, Math.min(1, 1 - spawnTimer / maxTimer)); // 0 -> 1
					const pop = Math.min(1.0, 0.5 + 0.5 * Math.sin(p * Math.PI * 0.5));
					currentScale *= pop;
				}

				drawCursorUnit(
					ctx,
					unitX,
					unitY,
					master,
					unit.isWarped,
					(unit.frozenDuration || 0) > 0,
					animTime,
					currentScale,
					attackProgress,
					targetAngle
				);

				// Status debuff badges (Trojan Spy, Overheat)
				if ((unit.trojanDuration || 0) > 0) {
					ctx.save();
					ctx.font = 'bold 9px "Pretendard", sans-serif';
					ctx.fillStyle = '#c084fc';
					ctx.textAlign = 'center';
					ctx.fillText('🕵️ SPY', unitX, unitY - 18);
					ctx.restore();
				} else if ((unit.overheatDuration || 0) > 0) {
					ctx.save();
					ctx.font = 'bold 9px "Pretendard", sans-serif';
					ctx.fillStyle = '#ef4444';
					ctx.textAlign = 'center';
					ctx.fillText('🔥 과열', unitX, unitY - 18);
					ctx.restore();
				}

				// Glowing Range Circle or Global Radar on Hover/Selection
				if (isSelected || isHovered) {
					if (master.range < 9000) {
						ctx.beginPath();
						ctx.arc(unitX, unitY, master.range, 0, Math.PI * 2);
						ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
						ctx.fill();
						ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
						ctx.lineWidth = 1.5;
						ctx.setLineDash([6, 6]);
						ctx.stroke();
						ctx.setLineDash([]);
					} else {
						// 🌐 Global Range Units (HIDDEN_BSOD_WHEEL, T4_WHEEL): Radar Scan Wave & Field Ring
						const scanR = (animTime * 140) % (player.trackRadius + 30);
						ctx.beginPath();
						ctx.arc(unitX, unitY, scanR, 0, Math.PI * 2);
						ctx.strokeStyle = `rgba(129, 140, 248, ${0.45 * (1 - scanR / (player.trackRadius + 30))})`;
						ctx.lineWidth = 1.8;
						ctx.setLineDash([4, 4]);
						ctx.stroke();
						ctx.setLineDash([]);

						ctx.beginPath();
						ctx.arc(player.trackCenterX, player.trackCenterY, player.trackRadius, 0, Math.PI * 2);
						ctx.fillStyle = 'rgba(129, 140, 248, 0.04)';
						ctx.fill();
						ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
						ctx.lineWidth = 1.8;
						ctx.setLineDash([8, 6]);
						ctx.stroke();
						ctx.setLineDash([]);
					}
				}

				// 🎯 Top-Layer Persistent Cyber Selection Reticle (Always on Top of attack auras & motions)
				if (isSelected) {
					ctx.save();
					ctx.translate(unitX, unitY);

					// 1. Pulsing Gold Focus Ring
					const selPulse = Math.sin(animTime * 6) * 1.5;
					const r = unit.isWarped ? 16 + selPulse : 24 + selPulse;
					ctx.beginPath();
					ctx.arc(0, 0, r, 0, Math.PI * 2);
					ctx.strokeStyle = '#fef08a';
					ctx.lineWidth = 2.2;
					ctx.setLineDash([6, 4]);
					ctx.stroke();
					ctx.setLineDash([]);

					// 2. 4 Precision High-Tech Corner Brackets
					const bDist = unit.isWarped ? 14 : 22;
					const bSize = unit.isWarped ? 4 : 6;
					ctx.strokeStyle = '#38bdf8';
					ctx.lineWidth = 2;

					// Top-Left
					ctx.beginPath();
					ctx.moveTo(-bDist, -bDist + bSize);
					ctx.lineTo(-bDist, -bDist);
					ctx.lineTo(-bDist + bSize, -bDist);
					ctx.stroke();

					// Top-Right
					ctx.beginPath();
					ctx.moveTo(bDist - bSize, -bDist);
					ctx.lineTo(bDist, -bDist);
					ctx.lineTo(bDist, -bDist + bSize);
					ctx.stroke();

					// Bottom-Left
					ctx.beginPath();
					ctx.moveTo(-bDist, bDist - bSize);
					ctx.lineTo(-bDist, bDist);
					ctx.lineTo(-bDist + bSize, bDist);
					ctx.stroke();

					// Bottom-Right
					ctx.beginPath();
					ctx.moveTo(bDist - bSize, bDist);
					ctx.lineTo(bDist, bDist);
					ctx.lineTo(bDist, bDist - bSize);
					ctx.stroke();

					ctx.restore();
				}
			}
		}

		// 4. Monsters on Track
		for (const m of player.monsters) {
			drawPixelMalware(ctx, m, animTime);
		}
	}

	function drawPixelMalware(ctx: CanvasRenderingContext2D, m: any, animTime: number) {
		const sz = m.size || 24;
		const tier = m.tier || 1;
		const bounce = Math.sin(animTime * 8 + (m.angle || 0) * 4) * 2.5;

		ctx.save();
		ctx.translate(m.x, m.y + bounce);

		// Soft colored glow aura
		ctx.beginPath();
		ctx.arc(0, 0, sz / 2 + 3, 0, Math.PI * 2);
		ctx.fillStyle = m.color;
		ctx.globalAlpha = 0.22;
		ctx.fill();
		ctx.globalAlpha = 1.0;

		// Character shape by tier (1~8)
		const charType = (tier - 1) % 8;
		switch (charType) {
			case 0:
				drawCuteJellyGhost(ctx, sz, m.color, animTime);
				break;
			case 1:
				drawCuteMiniRobot(ctx, sz, m.color, animTime);
				break;
			case 2:
				drawCuteHornedImp(ctx, sz, m.color, animTime);
				break;
			case 3:
				drawCuteCyberSpark(ctx, sz, m.color, animTime);
				break;
			case 4:
				drawCuteAlienUfo(ctx, sz, m.color, animTime);
				break;
			case 5:
				drawDarkWebSpider(ctx, sz, m.color, animTime);
				break;
			case 6:
				drawRansomPayload(ctx, sz, m.color, animTime);
				break;
			case 7:
				drawQuantumCrypto(ctx, sz, m.color, animTime);
				break;
			default:
				drawCuteJellyGhost(ctx, sz, m.color, animTime);
				break;
		}

		ctx.restore();

		// Beveled Retro HP Bar
		const hpBarW = 28;
		const hpBarH = 4.5;
		const hpPercent = Math.max(0, m.hp / m.maxHp);

		ctx.fillStyle = '#000000';
		ctx.fillRect(m.x - hpBarW / 2 - 1, m.y - sz / 2 - 10, hpBarW + 2, hpBarH + 2);

		ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
		ctx.fillRect(m.x - hpBarW / 2, m.y - sz / 2 - 9, hpBarW * hpPercent, hpBarH);

		// Debuff badges
		if (m.slowDuration > 0) {
			ctx.font = '10px sans-serif';
			ctx.fillText('❄️', m.x - 10, m.y - sz / 2 - 14);
		}
		if (m.armorDownDuration > 0) {
			ctx.font = '10px sans-serif';
			ctx.fillText('🛡️↓', m.x + 4, m.y - sz / 2 - 14);
		}
	}

	// 1. Cute Jelly Slime / Ghost 👾 (1~10R)
	function drawCuteJellyGhost(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2;
		const wave = Math.sin(animTime * 10) * 1.5;

		// Cute Dome & Wavy Skirt
		ctx.beginPath();
		ctx.arc(0, -2, r - 1, Math.PI, 0, false);
		ctx.lineTo(r - 1, r - 3 + wave);
		ctx.quadraticCurveTo(r * 0.5, r + wave, 0, r - 2 - wave);
		ctx.quadraticCurveTo(-r * 0.5, r + wave, -r + 1, r - 3 - wave);
		ctx.closePath();

		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Big cute anime eyes
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-r * 0.35, -2, 3.5, 0, Math.PI * 2);
		ctx.arc(r * 0.35, -2, 3.5, 0, Math.PI * 2);
		ctx.fill();

		// Black pupils looking forward
		ctx.fillStyle = '#0f172a';
		ctx.beginPath();
		ctx.arc(-r * 0.35 + 1, -2, 2, 0, Math.PI * 2);
		ctx.arc(r * 0.35 + 1, -2, 2, 0, Math.PI * 2);
		ctx.fill();

		// White sparkle reflection
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-r * 0.35 + 0.5, -3, 0.9, 0, Math.PI * 2);
		ctx.arc(r * 0.35 + 0.5, -3, 0.9, 0, Math.PI * 2);
		ctx.fill();

		// Cute pink rosy cheeks
		ctx.fillStyle = 'rgba(255, 107, 129, 0.7)';
		ctx.beginPath();
		ctx.arc(-r * 0.55, 3, 2, 0, Math.PI * 2);
		ctx.arc(r * 0.55, 3, 2, 0, Math.PI * 2);
		ctx.fill();
	}

	// 2. Cute Mini Robot Drone 🤖 (11~20R)
	function drawCuteMiniRobot(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2;

		// Antenna on top with blinking LED
		ctx.beginPath();
		ctx.moveTo(0, -r);
		ctx.lineTo(0, -r - 5);
		ctx.strokeStyle = '#64748b';
		ctx.lineWidth = 2;
		ctx.stroke();

		const blink = Math.sin(animTime * 12) > 0;
		ctx.beginPath();
		ctx.arc(0, -r - 6, 2.5, 0, Math.PI * 2);
		ctx.fillStyle = blink ? '#38bdf8' : '#eab308';
		ctx.fill();

		// Rounded TV Monitor Body
		const w = sz - 4;
		const h = sz - 6;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.roundRect(-w / 2, -h / 2, w, h, 5);
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Dark Visor Screen
		ctx.fillStyle = '#0f172a';
		ctx.beginPath();
		ctx.roundRect(-w / 2 + 2.5, -h / 2 + 2.5, w - 5, h - 5, 3);
		ctx.fill();

		// Digital Pixel Eyes
		ctx.fillStyle = '#38bdf8';
		ctx.fillRect(-w * 0.28, -2, 3, 4);
		ctx.fillRect(w * 0.28 - 3, -2, 3, 4);

		// Cute floating rocket boost flame below
		const flameY = h / 2 + 1;
		ctx.beginPath();
		ctx.moveTo(-3, flameY);
		ctx.lineTo(0, flameY + 4 + Math.sin(animTime * 20) * 2);
		ctx.lineTo(3, flameY);
		ctx.fillStyle = '#fbbf24';
		ctx.fill();
	}

	// 3. Cute Horned Imp Virus 😈 (21~30R)
	function drawCuteHornedImp(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2 - 2;

		// Mini Cute Horns
		ctx.fillStyle = '#f43f5e';
		ctx.beginPath();
		ctx.moveTo(-r * 0.6, -r * 0.6);
		ctx.lineTo(-r * 0.9, -r * 1.3);
		ctx.lineTo(-r * 0.2, -r * 0.9);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.2;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(r * 0.6, -r * 0.6);
		ctx.lineTo(r * 0.9, -r * 1.3);
		ctx.lineTo(r * 0.2, -r * 0.9);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		// Flapping Mini Bat Wings
		const wingAngle = Math.sin(animTime * 14) * 0.35;
		ctx.save();
		ctx.fillStyle = '#6b21a8';
		ctx.translate(-r * 0.7, 0);
		ctx.rotate(-wingAngle);
		ctx.beginPath();
		ctx.ellipse(-4, 0, 6, 3, -0.3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		ctx.save();
		ctx.fillStyle = '#6b21a8';
		ctx.translate(r * 0.7, 0);
		ctx.rotate(wingAngle);
		ctx.beginPath();
		ctx.ellipse(4, 0, 6, 3, 0.3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		// Round Chubby Body
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Cute Big Imp Eyes
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-r * 0.35, -1, 3.5, 0, Math.PI * 2);
		ctx.arc(r * 0.35, -1, 3.5, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#9333ea';
		ctx.beginPath();
		ctx.arc(-r * 0.35 + 1, -1, 2, 0, Math.PI * 2);
		ctx.arc(r * 0.35 + 1, -1, 2, 0, Math.PI * 2);
		ctx.fill();

		// Tiny cute fangs :3
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.moveTo(-2, 3); ctx.lineTo(-1, 5); ctx.lineTo(0, 3);
		ctx.moveTo(0, 3); ctx.lineTo(1, 5); ctx.lineTo(2, 3);
		ctx.fill();
	}

	// 4. Cute Cyber Spark Critter ⚡ (31~40R)
	function drawCuteCyberSpark(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2 - 2;

		// Rotating Cyber Spark Orbitals
		const orbitAngle = animTime * 4;
		ctx.fillStyle = '#fde047';
		for (let i = 0; i < 3; i++) {
			const a = orbitAngle + (i * Math.PI * 2) / 3;
			ctx.beginPath();
			ctx.arc(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), 1.8, 0, Math.PI * 2);
			ctx.fill();
		}

		// Star/Diamond Rounded Cyber Core
		ctx.save();
		ctx.rotate(Math.sin(animTime * 4) * 0.1);
		ctx.beginPath();
		ctx.moveTo(0, -r - 2);
		ctx.quadraticCurveTo(r * 0.4, -r * 0.4, r + 2, 0);
		ctx.quadraticCurveTo(r * 0.4, r * 0.4, 0, r + 2);
		ctx.quadraticCurveTo(-r * 0.4, r * 0.4, -r - 2, 0);
		ctx.quadraticCurveTo(-r * 0.4, -r * 0.4, 0, -r - 2);
		ctx.closePath();

		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Cute Big Anime Eyes
		ctx.fillStyle = '#0f172a';
		ctx.beginPath();
		ctx.arc(-r * 0.3, -1, 2.5, 0, Math.PI * 2);
		ctx.arc(r * 0.3, -1, 2.5, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-r * 0.3 - 0.5, -2, 1, 0, Math.PI * 2);
		ctx.arc(r * 0.3 - 0.5, -2, 1, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	// 5. Cute Alien UFO 🛸 (41~50R)
	function drawCuteAlienUfo(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2;

		// Glass Bubble Cockpit
		ctx.beginPath();
		ctx.arc(0, -4, r * 0.6, Math.PI, 0, false);
		ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
		ctx.fill();
		ctx.strokeStyle = '#38bdf8';
		ctx.lineWidth = 1.2;
		ctx.stroke();

		// Cute Little Alien inside Glass Cockpit
		ctx.fillStyle = '#22c55e';
		ctx.beginPath();
		ctx.arc(0, -4, 4, 0, Math.PI * 2);
		ctx.fill();
		// Alien antenna
		ctx.beginPath();
		ctx.moveTo(0, -8);
		ctx.lineTo(0, -11);
		ctx.strokeStyle = '#22c55e';
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(0, -11.5, 1.2, 0, Math.PI * 2);
		ctx.fillStyle = '#fde047';
		ctx.fill();

		// Alien Eyes
		ctx.fillStyle = '#000000';
		ctx.fillRect(-2, -5, 1.5, 1.5);
		ctx.fillRect(0.5, -5, 1.5, 1.5);

		// UFO Saucer Metallic Base
		ctx.beginPath();
		ctx.ellipse(0, 1, r, r * 0.4, 0, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// 3 Blinking Rainbow LED Lights on Saucer
		const ledColors = ['#ef4444', '#eab308', '#38bdf8'];
		for (let i = 0; i < 3; i++) {
			const xPos = (i - 1) * (r * 0.55);
			ctx.beginPath();
			ctx.arc(xPos, 1.5, 1.8, 0, Math.PI * 2);
			ctx.fillStyle = ledColors[(i + Math.floor(animTime * 4)) % 3];
			ctx.fill();
		}
	}

	// 6. Cute Dark Web Spider 🕷️ (51~60R)
	function drawDarkWebSpider(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2 - 2;

		// 6 Little Animated Spider Legs
		const legWiggle = Math.sin(animTime * 12) * 2;
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.6;
		ctx.lineCap = 'round';

		// Left legs
		for (let i = -1; i <= 1; i++) {
			ctx.beginPath();
			ctx.moveTo(-r * 0.5, i * 4);
			ctx.lineTo(-r - 3, i * 4 - 2 + (i % 2 === 0 ? legWiggle : -legWiggle));
			ctx.lineTo(-r - 6, i * 4 + 4 + (i % 2 === 0 ? legWiggle : -legWiggle));
			ctx.stroke();
		}
		// Right legs
		for (let i = -1; i <= 1; i++) {
			ctx.beginPath();
			ctx.moveTo(r * 0.5, i * 4);
			ctx.lineTo(r + 3, i * 4 - 2 + (i % 2 === 0 ? -legWiggle : legWiggle));
			ctx.lineTo(r + 6, i * 4 + 4 + (i % 2 === 0 ? -legWiggle : legWiggle));
			ctx.stroke();
		}

		// Chubby Spider Body
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Big Glistening Spider Eyes (4 eyes)
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-r * 0.35, -2, 3, 0, Math.PI * 2);
		ctx.arc(r * 0.35, -2, 3, 0, Math.PI * 2);
		ctx.arc(-r * 0.6, 2, 1.5, 0, Math.PI * 2);
		ctx.arc(r * 0.6, 2, 1.5, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#dc2626';
		ctx.beginPath();
		ctx.arc(-r * 0.35 + 0.5, -2, 1.8, 0, Math.PI * 2);
		ctx.arc(r * 0.35 + 0.5, -2, 1.8, 0, Math.PI * 2);
		ctx.fill();
	}

	// 7. Cute Ransom Payload Bomb 💣 (61~70R)
	function drawRansomPayload(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2 - 2;

		// Blinking Wick Fuse on top
		ctx.beginPath();
		ctx.moveTo(0, -r);
		ctx.quadraticCurveTo(4, -r - 4, 3, -r - 7);
		ctx.strokeStyle = '#78716c';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Sparking Fire on Fuse
		const spark = Math.sin(animTime * 16) > 0;
		ctx.beginPath();
		ctx.arc(3, -r - 7.5, spark ? 3 : 2, 0, Math.PI * 2);
		ctx.fillStyle = spark ? '#f59e0b' : '#ef4444';
		ctx.fill();

		// Round Bomb Shell
		ctx.beginPath();
		ctx.arc(0, 1, r, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#020617';
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Digital Blinking Skull / Timer Face
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 9px "Pretendard", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(Math.floor(animTime * 3) % 2 === 0 ? '☠️' : '00', 0, 2);
	}

	// 8. Cute Quantum Crypto Atom ⚛️ (71~80R)
	function drawQuantumCrypto(ctx: CanvasRenderingContext2D, sz: number, color: string, animTime: number) {
		const r = sz / 2 - 1;

		// Orbiting Quantum Electron Rings
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.2;
		ctx.globalAlpha = 0.7;

		for (let i = 0; i < 3; i++) {
			ctx.save();
			ctx.rotate(animTime * 2 + (i * Math.PI) / 3);
			ctx.beginPath();
			ctx.ellipse(0, 0, r + 4, r * 0.4, 0, 0, Math.PI * 2);
			ctx.stroke();

			// Electron particle
			const electronAngle = animTime * 5 + i * 2;
			ctx.beginPath();
			ctx.arc(Math.cos(electronAngle) * (r + 4), Math.sin(electronAngle) * (r * 0.4), 1.8, 0, Math.PI * 2);
			ctx.fillStyle = '#38bdf8';
			ctx.fill();
			ctx.restore();
		}
		ctx.restore();

		// Glowing Quantum Core
		ctx.beginPath();
		ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// Core Glistening Eye
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(-2, -1, 1.8, 0, Math.PI * 2);
		ctx.arc(2, -1, 1.8, 0, Math.PI * 2);
		ctx.fill();
	}

	function drawSoloInactiveZone(ctx: CanvasRenderingContext2D) {
		const cx = GameEngine.P2_CENTER_X;
		const plateW = 280;
		const plateH = 58;
		const plateY = 44;

		ctx.fillStyle = '#0a101d';
		ctx.fillRect(cx - plateW / 2, plateY, plateW, plateH);
		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 1.5;
		ctx.strokeRect(cx - plateW / 2, plateY, plateW, plateH);

		// Header tab
		ctx.fillStyle = '#0f172a';
		ctx.fillRect(cx - plateW / 2, plateY, plateW, 18);
		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 1;
		ctx.strokeRect(cx - plateW / 2, plateY, plateW, 18);

		ctx.font = 'bold 10px "Pretendard", sans-serif';
		ctx.fillStyle = '#475569';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('SECTOR-2 [OFFLINE]', cx, plateY + 9);

		ctx.font = 'bold 12px "Pretendard", sans-serif';
		ctx.fillStyle = '#334155';
		ctx.fillText('(솔로 모드 - 비활성화)', cx, plateY + 36);
	}

	function getSummonP1ButtonRect() {
		return { x: GameEngine.P1_CENTER_X - 60, y: GameEngine.P1_CENTER_Y + 10, w: 57, h: 38 };
	}

	function getSummonP2ButtonRect() {
		return { x: GameEngine.P2_CENTER_X - 60, y: GameEngine.P2_CENTER_Y + 10, w: 57, h: 38 };
	}

	function getUpgradeP1ButtonRect() {
		return { x: GameEngine.P1_CENTER_X + 3, y: GameEngine.P1_CENTER_Y + 10, w: 57, h: 38 };
	}

	function getUpgradeP2ButtonRect() {
		return { x: GameEngine.P2_CENTER_X + 3, y: GameEngine.P2_CENTER_Y + 10, w: 57, h: 38 };
	}

	function drawTacticalButton(
		ctx: CanvasRenderingContext2D,
		rect: { x: number; y: number; w: number; h: number },
		title: string,
		subtext: string,
		isHovered: boolean,
		isEnabled: boolean,
		accentColor: string
	) {
		const { x, y, w, h } = rect;
		ctx.save();

		// Background
		ctx.fillStyle = isEnabled
			? isHovered
				? 'rgba(15, 23, 42, 0.95)'
				: 'rgba(2, 6, 23, 0.88)'
			: 'rgba(15, 23, 42, 0.65)';
		ctx.fillRect(x, y, w, h);

		// Border
		ctx.strokeStyle = isEnabled
			? isHovered
				? '#fef08a'
				: accentColor
			: '#334155';
		ctx.lineWidth = isHovered ? 2 : 1.2;
		ctx.strokeRect(x, y, w, h);

		// Corner Accents on hover
		if (isEnabled && isHovered) {
			ctx.fillStyle = '#fef08a';
			ctx.fillRect(x - 1, y - 1, 3.5, 3.5);
			ctx.fillRect(x + w - 2.5, y - 1, 3.5, 3.5);
			ctx.fillRect(x - 1, y + h - 2.5, 3.5, 3.5);
			ctx.fillRect(x + w - 2.5, y + h - 2.5, 3.5, 3.5);
		}

		// Text
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Title
		ctx.font = 'bold 11px "Pretendard", sans-serif';
		ctx.fillStyle = isEnabled
			? isHovered
				? '#ffffff'
				: accentColor === '#22c55e'
					? '#86efac'
					: '#7dd3fc'
			: '#64748b';
		ctx.fillText(title, x + w / 2, y + 13);

		// Subtext
		ctx.font = 'bold 9px "Pretendard", sans-serif';
		ctx.fillStyle = isEnabled
			? isHovered
				? '#fde047'
				: accentColor
			: '#475569';
		ctx.fillText(subtext, x + w / 2, y + 27);

		ctx.restore();
	}

	function drawProjectiles(ctx: CanvasRenderingContext2D, engine: GameEngine) {
		for (const p of engine.projectiles) {
			ctx.save();
			ctx.translate(p.x, p.y);

			const angle = p.pierceAngle !== undefined ? p.pierceAngle : Math.atan2(p.targetY - p.y, p.targetX - p.x);
			ctx.rotate(angle);

			const uid = p.sourceUnitId;

			if (p.type === 'LINE_PIERCE') {
				if (uid === 'HIDDEN_CTRLALTDEL') {
					// 🚨 Tier 5 Mythic: Clean, crisp piercing beam (non-distracting)
					ctx.beginPath();
					ctx.moveTo(-20, 0);
					ctx.lineTo(35, 0);
					ctx.strokeStyle = '#FF0055';
					ctx.lineWidth = 4;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-20, 0);
					ctx.lineTo(35, 0);
					ctx.strokeStyle = '#FFAAC0';
					ctx.lineWidth = 1.5;
					ctx.stroke();
				} else {
					// ⚪ Tier 1: Clean Piercing Laser Ray
					ctx.beginPath();
					ctx.moveTo(-15, 0);
					ctx.lineTo(25, 0);
					ctx.strokeStyle = '#ffffff';
					ctx.lineWidth = 3;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-15, 0);
					ctx.lineTo(25, 0);
					ctx.strokeStyle = p.color;
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
				ctx.restore();
				continue;
			}

			// Characteristic Tier-Scaled Specific Projectiles
			switch (uid) {
				// ⚪ 1티어: 일반 (Simple & Crisp)
				case 'T1_ARROW': {
					ctx.fillStyle = p.isCrit ? '#fbbf24' : '#ffffff';
					ctx.beginPath();
					ctx.moveTo(6, 0);
					ctx.lineTo(-5, -3.5);
					ctx.lineTo(-2.5, 0);
					ctx.lineTo(-5, 3.5);
					ctx.closePath();
					ctx.fill();
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = 1;
					ctx.stroke();
					break;
				}

				case 'T1_IBEAM': {
					ctx.strokeStyle = '#38bdf8';
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(0, -6); ctx.lineTo(0, 6);
					ctx.stroke();
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(-1.5, -2, 3, 4);
					break;
				}

				case 'T1_CROSS': {
					ctx.strokeStyle = p.isCrit ? '#fbbf24' : '#ffffff';
					ctx.lineWidth = 1.8;
					ctx.beginPath();
					ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
					ctx.moveTo(0, -5); ctx.lineTo(0, 5);
					ctx.stroke();
					break;
				}

				case 'T1_HAND': {
					ctx.fillStyle = '#ffffff';
					ctx.beginPath();
					ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
					ctx.fill();
					ctx.strokeStyle = '#38bdf8';
					ctx.lineWidth = 1;
					ctx.stroke();
					break;
				}

				// 🔵 2티어: 고급 (Sharp & Distinct)
				case 'T2_AIM': {
					ctx.fillStyle = '#ef4444';
					ctx.fillRect(-8, -2, 16, 4);
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(-5, -1, 10, 2);
					break;
				}

				case 'T2_HOURGLASS': {
					ctx.fillStyle = '#38bdf8';
					ctx.beginPath();
					ctx.moveTo(6, 0); ctx.lineTo(0, -4.5); ctx.lineTo(-6, 0); ctx.lineTo(0, 4.5);
					ctx.closePath();
					ctx.fill();
					ctx.strokeStyle = '#ffffff';
					ctx.lineWidth = 1.2;
					ctx.stroke();
					break;
				}

				case 'T2_RESIZE': {
					ctx.strokeStyle = '#60a5fa';
					ctx.lineWidth = 2.2;
					ctx.beginPath();
					ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
					ctx.moveTo(0, -6); ctx.lineTo(0, 6);
					ctx.stroke();
					ctx.fillStyle = '#ffffff';
					ctx.fillRect(-2, -2, 4, 4);
					break;
				}

				case 'T2_LINK': {
					ctx.strokeStyle = '#06b6d4';
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(-3, 0, 4, 0, Math.PI * 2);
					ctx.arc(3, 0, 4, 0, Math.PI * 2);
					ctx.stroke();
					break;
				}

				case 'T2_SELECT': {
					ctx.strokeStyle = '#22d3ee';
					ctx.lineWidth = 1.5;
					ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
					ctx.strokeRect(-6, -4, 12, 8);
					ctx.fillRect(-6, -4, 12, 8);
					break;
				}

				// 🟣 3티어: 영웅 (Energized, Glowing & High-Tech)
				case 'T3_SNIPER': {
					// Hyper Plasma Railgun Lance (32px)
					ctx.beginPath();
					ctx.moveTo(-16, 0);
					ctx.lineTo(16, 0);
					ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
					ctx.lineWidth = 7;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-16, 0);
					ctx.lineTo(16, 0);
					ctx.strokeStyle = '#C084FC';
					ctx.lineWidth = 3.5;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-16, 0);
					ctx.lineTo(16, 0);
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 1.5;
					ctx.stroke();

					// Piercing Rail Tip
					ctx.fillStyle = '#FFFFFF';
					ctx.beginPath();
					ctx.arc(16, 0, 3, 0, Math.PI * 2);
					ctx.fill();
					break;
				}

				case 'T3_SPINNER': {
					// Swirling 3-Blade Plasma Vortex
					const rot = performance.now() * 0.015;
					ctx.fillStyle = '#A855F7';
					ctx.beginPath();
					ctx.arc(0, 0, 6, 0, Math.PI * 2);
					ctx.fill();

					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 1.8;
					for (let i = 0; i < 3; i++) {
						const a = rot + (i * Math.PI * 2) / 3;
						ctx.beginPath();
						ctx.moveTo(0, 0);
						ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
						ctx.stroke();
					}
					break;
				}

				case 'T3_DENIED': {
					// Crimson Neon 'X' Glaive
					const rot = performance.now() * 0.012;
					ctx.save();
					ctx.rotate(rot);
					ctx.strokeStyle = '#E879F9';
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
					ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
					ctx.stroke();
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 1.2;
					ctx.stroke();
					ctx.restore();
					break;
				}

				case 'T3_MULTIDRAG': {
					// Radiant Dual Laser Dart
					ctx.fillStyle = '#9333EA';
					ctx.beginPath();
					ctx.moveTo(10, 0);
					ctx.lineTo(-8, -6);
					ctx.lineTo(-4, 0);
					ctx.lineTo(-8, 6);
					ctx.closePath();
					ctx.fill();

					ctx.fillStyle = '#FFFFFF';
					ctx.beginPath();
					ctx.moveTo(7, 0);
					ctx.lineTo(-4, -2.5);
					ctx.lineTo(-1, 0);
					ctx.lineTo(-4, 2.5);
					ctx.closePath();
					ctx.fill();
					break;
				}

				case 'T3_MACRO': {
					// Radiant Magenta-Gold Command Glyph
					ctx.fillStyle = '#D946EF';
					ctx.beginPath();
					ctx.moveTo(8, 0); ctx.lineTo(0, -5); ctx.lineTo(-8, 0); ctx.lineTo(0, 5);
					ctx.closePath();
					ctx.fill();
					ctx.strokeStyle = '#FBBF24';
					ctx.lineWidth = 1.8;
					ctx.stroke();
					break;
				}

				// 🌈 4티어: 전설 (Magnificent, Multi-Layered & Spectacular)
				case 'T4_WHEEL': {
					// Chromatic Prismatic Solar Orb
					const t = performance.now() * 0.005;
					ctx.beginPath();
					ctx.arc(0, 0, 8, 0, Math.PI * 2);
					ctx.fillStyle = `hsl(${(t * 180) % 360}, 95%, 60%)`;
					ctx.fill();
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 2;
					ctx.stroke();

					// 4 Orbiting Stardust Sparks
					for (let i = 0; i < 4; i++) {
						const a = t * 4 + (i * Math.PI) / 2;
						ctx.fillStyle = '#FFFFFF';
						ctx.beginPath();
						ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 2, 0, Math.PI * 2);
						ctx.fill();
					}
					break;
				}

				case 'T4_MAGICWAND': {
					// Blazing Golden Stardust Comet
					ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
					ctx.beginPath();
					ctx.arc(0, 0, 10, 0, Math.PI * 2);
					ctx.fill();

					ctx.fillStyle = '#FBBF24';
					ctx.beginPath();
					for (let k = 0; k < 5; k++) {
						const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
						const aInner = a + Math.PI / 5;
						if (k === 0) ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
						else ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
						ctx.lineTo(Math.cos(aInner) * 3.5, Math.sin(aInner) * 3.5);
					}
					ctx.closePath();
					ctx.fill();
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 1.5;
					ctx.stroke();
					break;
				}

				case 'T4_ADMIN': {
					// Imperial Golden Buster Lance (32px)
					ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
					ctx.fillRect(-16, -5, 32, 10);

					ctx.fillStyle = '#F59E0B';
					ctx.fillRect(-14, -3.5, 28, 7);

					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect(-10, -1.8, 20, 3.6);

					ctx.strokeStyle = '#FDE047';
					ctx.lineWidth = 1.5;
					ctx.strokeRect(-14, -3.5, 28, 7);
					break;
				}

				case 'T4_CONSOLE': {
					// Neon Emerald Matrix Data Cube
					ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
					ctx.fillRect(-7, -7, 14, 14);

					ctx.fillStyle = '#10B981';
					ctx.fillRect(-5, -5, 10, 10);

					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 1.5;
					ctx.strokeRect(-5, -5, 10, 10);
					break;
				}

				// 🚨 5티어: 히든 신화 (Screen-Dominating Supernova FX)
				case 'HIDDEN_ROOT_ADMIN': {
					// Colossal Crimson & Gold Solar Lance (38px)
					ctx.beginPath();
					ctx.moveTo(-18, 0);
					ctx.lineTo(20, 0);
					ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
					ctx.lineWidth = 12;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-18, 0);
					ctx.lineTo(20, 0);
					ctx.strokeStyle = '#F59E0B';
					ctx.lineWidth = 6;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-18, 0);
					ctx.lineTo(20, 0);
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 2.5;
					ctx.stroke();

					// Orbiting Nuclear Stars
					const rot = performance.now() * 0.01;
					for (let i = 0; i < 3; i++) {
						const a = rot + (i * Math.PI * 2) / 3;
						ctx.fillStyle = '#FF0055';
						ctx.beginPath();
						ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 2.5, 0, Math.PI * 2);
						ctx.fill();
					}
					break;
				}

				case 'HIDDEN_QUANTUM_ERASER': {
					// Golden Quantum Disintegration Lance
					ctx.beginPath();
					ctx.moveTo(-15, 0); ctx.lineTo(18, 0);
					ctx.strokeStyle = '#FACC15';
					ctx.lineWidth = 5;
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(-15, 0); ctx.lineTo(18, 0);
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 2;
					ctx.stroke();

					// Quantum Ring
					ctx.strokeStyle = '#FDE047';
					ctx.lineWidth = 1.5;
					ctx.beginPath();
					ctx.arc(0, 0, 7, 0, Math.PI * 2);
					ctx.stroke();
					break;
				}

				default: {
					// High-Tech Cyber Bullet
					ctx.fillStyle = p.isCrit ? '#fbbf24' : p.color;
					ctx.fillRect(-4, -2.5, 8, 5);
					ctx.strokeStyle = '#ffffff';
					ctx.lineWidth = 1;
					ctx.strokeRect(-4, -2.5, 8, 5);
					break;
				}
			}

			ctx.restore();
		}
	}

	function drawParticles(ctx: CanvasRenderingContext2D, engine: GameEngine, animTime: number) {
		for (const pt of engine.particles) {
			const progress = 1 - pt.life / pt.maxLife; // 0 -> 1
			const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
			ctx.save();
			ctx.globalAlpha = alpha;

			if (pt.shape === 'line') {
				// ⚡ Full Screen Glowing Laser Beam (MULTI_CHAIN / Lasers)
				const endX = pt.targetX !== undefined ? pt.targetX : pt.vx;
				const endY = pt.targetY !== undefined ? pt.targetY : pt.vy;

				// Laser Outer Bloom Glow
				ctx.beginPath();
				ctx.moveTo(pt.x, pt.y);
				ctx.lineTo(endX, endY);
				ctx.strokeStyle = pt.color;
				ctx.globalAlpha = alpha * 0.4;
				ctx.lineWidth = Math.max(2, 12 * (1 - progress * 0.4));
				ctx.stroke();

				// Main beam body
				ctx.beginPath();
				ctx.moveTo(pt.x, pt.y);
				ctx.lineTo(endX, endY);
				ctx.strokeStyle = pt.color;
				ctx.globalAlpha = alpha * 0.9;
				ctx.lineWidth = Math.max(1, 5 * (1 - progress * 0.3));
				ctx.stroke();

				// Intense White Core
				ctx.globalAlpha = alpha;
				ctx.beginPath();
				ctx.moveTo(pt.x, pt.y);
				ctx.lineTo(endX, endY);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = Math.max(0.5, 2.0 * (1 - progress));
				ctx.stroke();

				// Source Muzzle Spark (Firmly anchored at cursor unit)
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, Math.max(1, 4 * (1 - progress)), 0, Math.PI * 2);
				ctx.fill();

				// Laser Target Spark
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.arc(endX, endY, Math.max(1, 4.5 * (1 - progress)), 0, Math.PI * 2);
				ctx.fill();
			} else if (pt.shape === 'shockwave') {
				// 💥 Expanding Chromatic Shockwave Ring
				const r = pt.size + progress * 65;
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
				ctx.strokeStyle = pt.color;
				ctx.lineWidth = Math.max(0.5, 4.5 * (1 - progress));
				ctx.stroke();

				ctx.beginPath();
				ctx.arc(pt.x, pt.y, r * 0.88, 0, Math.PI * 2);
				ctx.fillStyle = pt.color;
				ctx.globalAlpha = alpha * 0.18;
				ctx.fill();
			} else if (pt.shape === 'pixel_cube') {
				// 🧊 Tumbling 3D Quantum Pixel Cube (Quantum Eraser & Supernova)
				ctx.translate(pt.x, pt.y);
				ctx.rotate(animTime * 6 + progress * Math.PI);
				const sz = pt.size * (1 - progress * 0.5);

				ctx.fillStyle = pt.color;
				ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 1.2;
				ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
			} else if (pt.shape === 'glitch') {
				// 🛑 Digital Distortion Scanline Glitch (Ctrl+Alt+Del SIGKILL)
				ctx.fillStyle = pt.color;
				const w = pt.size * (1 + progress * 2);
				const h = 3;
				ctx.fillRect(pt.x - w / 2, pt.y - h / 2, w, h);
			} else if (pt.shape === 'ring') {
				// Expanding Neon Ring
				const currentRadius = pt.size + progress * 52;
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, currentRadius, 0, Math.PI * 2);
				ctx.strokeStyle = pt.color;
				ctx.lineWidth = Math.max(0.5, 3.5 * (1 - progress));
				ctx.stroke();
			} else if (pt.shape === 'hex') {
				// Rotating Cyber Hexagon Gateway
				const hexRadius = pt.size + progress * 22;
				const angleOffset = progress * Math.PI;
				ctx.translate(pt.x, pt.y);
				ctx.rotate(angleOffset);
				ctx.beginPath();
				for (let i = 0; i < 6; i++) {
					const a = (i * Math.PI) / 3;
					const hx = Math.cos(a) * hexRadius;
					const hy = Math.sin(a) * hexRadius;
					if (i === 0) ctx.moveTo(hx, hy);
					else ctx.lineTo(hx, hy);
				}
				ctx.closePath();
				ctx.strokeStyle = pt.color;
				ctx.lineWidth = Math.max(0.5, 2.5 * (1 - progress));
				ctx.setLineDash([4, 4]);
				ctx.stroke();
			} else if (pt.shape === 'star') {
				// 4-pointed Sparkle Star
				ctx.translate(pt.x, pt.y);
				ctx.fillStyle = pt.color;
				const sz = pt.size * (1 - progress * 0.4);
				ctx.beginPath();
				ctx.moveTo(0, -sz);
				ctx.quadraticCurveTo(0, 0, sz, 0);
				ctx.quadraticCurveTo(0, 0, 0, sz);
				ctx.quadraticCurveTo(0, 0, -sz, 0);
				ctx.quadraticCurveTo(0, 0, 0, -sz);
				ctx.closePath();
				ctx.fill();
			} else if (pt.shape === 'matrix') {
				// Rising Cyber Data Bit
				ctx.font = 'bold 12px "Pretendard", sans-serif';
				ctx.fillStyle = pt.color;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
			} else if (pt.shape === 'byte') {
				// Golden Cyber Data Ingot
				ctx.translate(pt.x, pt.y);
				ctx.rotate(animTime * 8);
				const sz = pt.size * (1 + 0.2 * Math.sin(animTime * 12));

				ctx.fillStyle = '#fbbf24';
				ctx.beginPath();
				ctx.moveTo(0, -sz); ctx.lineTo(sz, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz, 0);
				ctx.closePath();
				ctx.fill();
			} else {
				ctx.fillStyle = pt.color;
				ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
			}

			ctx.restore();
		}
	}

	function drawFloatingTexts(ctx: CanvasRenderingContext2D, engine: GameEngine) {
		for (const ft of engine.floatingTexts) {
			ctx.save();
			ctx.globalAlpha = Math.max(0, Math.min(1, ft.life * 1.8));

			ctx.font = `bold ${ft.fontSize}px "Pretendard", sans-serif`;
			ctx.fillStyle = '#000000';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(ft.text, ft.x + 1, ft.y + 1);

			ctx.fillStyle = ft.color;
			ctx.fillText(ft.text, ft.x, ft.y);
			ctx.restore();
		}
	}

	function drawGameOverScreen(
		ctx: CanvasRenderingContext2D,
		engine: GameEngine,
		animTime: number
	) {
		ctx.fillStyle = engine.stats.isGameWon ? 'rgba(0, 128, 128, 0.75)' : 'rgba(0, 0, 128, 0.85)';
		ctx.fillRect(0, 0, GameEngine.WIDTH, GameEngine.HEIGHT);

		ctx.font = 'bold 28px "Pretendard", sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			engine.stats.isGameWon ? '*** SYSTEM PROTECTED: VICTORY ***' : '*** FATAL EXCEPTION: SYSTEM CRASH ***',
			GameEngine.WIDTH / 2,
			GameEngine.HEIGHT / 2 - 40
		);

		ctx.font = '14px "Pretendard", sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(
			`STOP: 0x0000007B (ROUND: ${engine.stats.currentRound} / ${engine.stats.maxRound})`,
			GameEngine.WIDTH / 2,
			GameEngine.HEIGHT / 2
		);
		ctx.fillText(
			gameStore.gameOverReason || 'Press Retry button to reboot kernel.',
			GameEngine.WIDTH / 2,
			GameEngine.HEIGHT / 2 + 25
		);
	}

	function getQuickSellButtonRect(): { x: number; y: number; w: number; h: number; refund: number } | null {
		const engine = gameStore.engine;
		if (!engine.selectedSlot || isDraggingActive) return null;

		const myRole = engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2' ? 'p2' : 'p1';
		if (engine.selectedSlot.player !== myRole) return null;

		const player = engine.selectedSlot.player === 'p1' ? engine.p1 : engine.p2;
		const slot = player.slots[engine.selectedSlot.index];
		if (!slot || !slot.unit) return null;

		const master = UNITS_MASTER[slot.unit.unitId];
		if (!master) return null;

		const refund = Math.pow(2, master.tier) * 10;

		// Exact Center of the Player Field Track (P1: 260, 360 / P2: 1020, 360)
		const centerX = engine.selectedSlot.player === 'p1' ? GameEngine.P1_CENTER_X : GameEngine.P2_CENTER_X;
		const centerY = engine.selectedSlot.player === 'p1' ? GameEngine.P1_CENTER_Y : GameEngine.P2_CENTER_Y;

		// Compact & Sleek Dimensions (Text only: 판매 (+20B))
		const w = 84;
		const h = 22;

		return {
			x: centerX - w / 2,
			y: centerY - h / 2,
			w,
			h,
			refund
		};
	}

	function isPointInRect(px: number, py: number, r: { x: number; y: number; w: number; h: number }): boolean {
		return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
	}

	function drawQuickSellButton(
		ctx: CanvasRenderingContext2D,
		rect: { x: number; y: number; w: number; h: number; refund: number },
		isHovered: boolean,
		animTime: number
	) {
		ctx.save();

		// Soft drop shadow
		ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
		ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);

		// Button background
		ctx.fillStyle = isHovered ? '#dc2626' : '#991b1b';
		ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

		// 3D Bevel Border
		ctx.lineWidth = 1.2;
		// Top & Left Highlight
		ctx.strokeStyle = isHovered ? '#fca5a5' : '#f87171';
		ctx.beginPath();
		ctx.moveTo(rect.x, rect.y + rect.h);
		ctx.lineTo(rect.x, rect.y);
		ctx.lineTo(rect.x + rect.w, rect.y);
		ctx.stroke();

		// Bottom & Right Shadow
		ctx.strokeStyle = '#450a0a';
		ctx.beginPath();
		ctx.moveTo(rect.x + rect.w, rect.y);
		ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
		ctx.lineTo(rect.x, rect.y + rect.h);
		ctx.stroke();

		// Glowing Hover Outline
		if (isHovered) {
			ctx.strokeStyle = '#fef08a';
			ctx.lineWidth = 1.5;
			ctx.strokeRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
		}

		// Text: 💰 +20B
		ctx.font = 'bold 10px "Pretendard", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Text Shadow
		ctx.fillStyle = '#000000';
		ctx.fillText(`💰 +${rect.refund}B`, rect.x + rect.w / 2 + 1, rect.y + rect.h / 2 + 1);

		// Main Text
		ctx.fillStyle = isHovered ? '#fef08a' : '#ffffff';
		ctx.fillText(`💰 +${rect.refund}B`, rect.x + rect.w / 2, rect.y + rect.h / 2);

		ctx.restore();
	}

	function getCanvasCoords(e: MouseEvent) {
		if (!canvasEl) return { x: 0, y: 0 };
		const rect = canvasEl.getBoundingClientRect();
		const scaleX = GameEngine.WIDTH / rect.width;
		const scaleY = GameEngine.HEIGHT / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	function findSlotAt(x: number, y: number): { player: 'p1' | 'p2'; index: number } | null {
		const engine = gameStore.engine;
		const isOnline = engine.stats.gameMode === 'ONLINE_COOP';
		const myRole = gameStore.netRole;

		// 1P Slots (Base socket or Warped socket)
		if (!isOnline || myRole === 'p1') {
			for (const s of engine.p1.slots) {
				const isW = s.unit?.isWarped;
				const posX = isW ? engine.p1.warpSlots[s.index]?.x ?? s.x : s.x;
				const posY = isW ? engine.p1.warpSlots[s.index]?.y ?? s.y : s.y;
				const radius = isW ? 22 : 28;
				if (Math.hypot(posX - x, posY - y) <= radius) {
					return { player: 'p1', index: s.index };
				}
			}
		}

		// 2P Slots (Base socket or Warped socket)
		if (
			(isOnline && myRole === 'p2') ||
			(!isOnline && engine.stats.gameMode !== 'SOLO')
		) {
			for (const s of engine.p2.slots) {
				const isW = s.unit?.isWarped;
				const posX = isW ? engine.p2.warpSlots[s.index]?.x ?? s.x : s.x;
				const posY = isW ? engine.p2.warpSlots[s.index]?.y ?? s.y : s.y;
				const radius = isW ? 22 : 28;
				if (Math.hypot(posX - x, posY - y) <= radius) {
					return { player: 'p2', index: s.index };
				}
			}
		}
		return null;
	}

	let lastClickTime = 0;
	let lastClickSlot: { player: 'p1' | 'p2'; index: number } | null = null;

	function handleDoubleClick(e: MouseEvent) {
		const pos = getCanvasCoords(e);
		const engine = gameStore.engine;
		const slotInfo = findSlotAt(pos.x, pos.y);
		if (slotInfo) {
			const myRole = engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2' ? 'p2' : 'p1';
			if (slotInfo.player === myRole) {
				if (engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2') {
					multiplayer.sendP2Action({
						type: 'TOGGLE_WARP',
						slotIndex: slotInfo.index
					});
				} else {
					const player = slotInfo.player === 'p1' ? engine.p1 : engine.p2;
					engine.toggleUnitWarp(player, slotInfo.index);
				}
			}
			engine.selectedSlot = slotInfo;
			mouseDownPos = null;
			isDraggingActive = false;
			gameStore.sync();
		}
	}

	function handleMouseDown(e: MouseEvent) {
		const pos = getCanvasCoords(e);
		const engine = gameStore.engine;

		// 1. Check if Quick-Sell Button was clicked (Priority when unit selected)
		const sellBtnRect = getQuickSellButtonRect();
		if (sellBtnRect && isPointInRect(pos.x, pos.y, sellBtnRect)) {
			if (engine.selectedSlot) {
				if (engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2') {
					multiplayer.sendP2Action({
						type: 'SELL',
						slotIndex: engine.selectedSlot.index
					});
				} else {
					const player = engine.selectedSlot.player === 'p1' ? engine.p1 : engine.p2;
					engine.sellUnit(player, engine.selectedSlot.index);
				}
			}
			engine.selectedSlot = null;
			engine.draggingUnit = null;
			mouseDownPos = null;
			isDraggingActive = false;
			gameStore.sync();
			return;
		}

		// 2. Check if 1P or 2P Summon Button/Area was clicked
		const isLocalP2 = gameStore.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2';
		const p1BtnRect = getSummonP1ButtonRect();
		if (!isLocalP2 && isPointInRect(pos.x, pos.y, p1BtnRect)) {
			if (gameStore.canSummonP1) gameStore.summonP1();
			return;
		}

		const p2BtnRect = getSummonP2ButtonRect();
		if (isLocalP2 && isPointInRect(pos.x, pos.y, p2BtnRect)) {
			if (gameStore.canSummonP2) gameStore.summonP2();
			return;
		}

		// 3. Check if 1P or 2P Overclock Upgrade Button was clicked
		const p1UpRect = getUpgradeP1ButtonRect();
		if (!isLocalP2 && isPointInRect(pos.x, pos.y, p1UpRect)) {
			if (gameStore.canUpgradeGachaP1) gameStore.upgradeGachaP1();
			return;
		}

		const p2UpRect = getUpgradeP2ButtonRect();
		if (isLocalP2 && isPointInRect(pos.x, pos.y, p2UpRect)) {
			if (gameStore.canUpgradeGachaP2) gameStore.upgradeGachaP2();
			return;
		}

		// 4. Check if a Slot was clicked
		const slotInfo = findSlotAt(pos.x, pos.y);
		const now = performance.now();
		const isDoubleClick =
			lastClickSlot &&
			slotInfo &&
			lastClickSlot.player === slotInfo.player &&
			lastClickSlot.index === slotInfo.index &&
			now - lastClickTime < 340;

		lastClickTime = now;
		lastClickSlot = slotInfo;

		if (isDoubleClick && slotInfo) {
			const myRole = engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2' ? 'p2' : 'p1';
			if (slotInfo.player === myRole) {
				if (engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2') {
					multiplayer.sendP2Action({
						type: 'TOGGLE_WARP',
						slotIndex: slotInfo.index
					});
				} else {
					const player = slotInfo.player === 'p1' ? engine.p1 : engine.p2;
					engine.toggleUnitWarp(player, slotInfo.index);
				}
			}
			engine.selectedSlot = slotInfo;
			mouseDownPos = null;
			isDraggingActive = false;
			gameStore.sync();
			return;
		}

		if (slotInfo) {
			mouseDownPos = pos;
			isDraggingActive = false;
			engine.selectedSlot = slotInfo;
		} else {
			engine.selectedSlot = null;
			mouseDownPos = null;
			isDraggingActive = false;
		}
		gameStore.sync();
	}

	function handleMouseMove(e: MouseEvent) {
		const pos = getCanvasCoords(e);
		const engine = gameStore.engine;
		hoveredSlot = findSlotAt(pos.x, pos.y);

		// Check hover on Summon Buttons
		const isLocalP2 = gameStore.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2';
		const p1BtnRect = getSummonP1ButtonRect();
		isHoveringSummonP1 = !isLocalP2 && isPointInRect(pos.x, pos.y, p1BtnRect);

		const p2BtnRect = getSummonP2ButtonRect();
		isHoveringSummonP2 = isLocalP2 && isPointInRect(pos.x, pos.y, p2BtnRect);

		// Check hover on Upgrade Buttons
		const p1UpRect = getUpgradeP1ButtonRect();
		isHoveringUpgradeP1 = !isLocalP2 && isPointInRect(pos.x, pos.y, p1UpRect);

		const p2UpRect = getUpgradeP2ButtonRect();
		isHoveringUpgradeP2 = isLocalP2 && isPointInRect(pos.x, pos.y, p2UpRect);

		// Check hover on Quick-Sell Button
		const sellBtnRect = getQuickSellButtonRect();
		isHoveringSellBtn = sellBtnRect !== null && isPointInRect(pos.x, pos.y, sellBtnRect);

		// Cursor styling
		if (canvasEl) {
			if (
				(isHoveringSummonP1 && gameStore.canSummonP1) ||
				(isHoveringSummonP2 && gameStore.canSummonP2) ||
				(isHoveringUpgradeP1 && gameStore.canUpgradeGachaP1) ||
				(isHoveringUpgradeP2 && gameStore.canUpgradeGachaP2) ||
				isHoveringSellBtn ||
				hoveredSlot !== null
			) {
				canvasEl.style.cursor = 'pointer';
			} else {
				canvasEl.style.cursor = 'default';
			}
		}

		// Check drag start threshold (> 6px) - ONLY allowed for own player
		if (mouseDownPos && engine.selectedSlot) {
			const myRole = engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2' ? 'p2' : 'p1';
			if (engine.selectedSlot.player === myRole) {
				const dist = Math.hypot(pos.x - mouseDownPos.x, pos.y - mouseDownPos.y);
				if (dist > 6) {
					const player = engine.selectedSlot.player === 'p1' ? engine.p1 : engine.p2;
					const slot = player.slots[engine.selectedSlot.index];
					if (slot?.unit) {
						isDraggingActive = true;
						engine.draggingUnit = {
							player: engine.selectedSlot.player,
							slotIndex: engine.selectedSlot.index,
							unit: slot.unit
						};
					}
				}
			}
		}

		if (engine.draggingUnit && isDraggingActive) {
			engine.dragPos = pos;
		}
	}

	function handleMouseUp(e: MouseEvent) {
		const engine = gameStore.engine;
		if (engine.draggingUnit && isDraggingActive) {
			const pos = getCanvasCoords(e);
			const targetSlot = findSlotAt(pos.x, pos.y);

			if (
				targetSlot &&
				targetSlot.player === engine.draggingUnit.player &&
				targetSlot.index !== engine.draggingUnit.slotIndex
			) {
				if (engine.stats.gameMode === 'ONLINE_COOP' && gameStore.netRole === 'p2') {
					multiplayer.sendP2Action({
						type: 'MERGE',
						fromSlot: engine.draggingUnit.slotIndex,
						toSlot: targetSlot.index
					});
				} else {
					const player = engine.draggingUnit.player === 'p1' ? engine.p1 : engine.p2;
					engine.mergeUnits(player, engine.draggingUnit.slotIndex, targetSlot.index);
				}
				engine.selectedSlot = null;
			}

			engine.draggingUnit = null;
		}

		mouseDownPos = null;
		isDraggingActive = false;
		gameStore.sync();
	}
</script>

<div class="game-viewport relative flex items-center justify-center select-none">
	<canvas
		bind:this={canvasEl}
		width={GameEngine.WIDTH}
		height={GameEngine.HEIGHT}
		class="game-canvas"
		style:cursor={isHoveringSellBtn ? 'pointer' : 'crosshair'}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		ondblclick={handleDoubleClick}
	></canvas>
</div>

<style>
	.game-viewport {
		width: 100%;
		max-width: 1280px;
		aspect-ratio: 16 / 9;
		background: #020617;
	}

	.game-canvas {
		width: 100%;
		height: 100%;
		object-fit: contain;
		cursor: crosshair;
	}
</style>
