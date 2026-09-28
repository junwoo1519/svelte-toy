import type {
	BossEntity,
	BossMaster,
	FloatingText,
	GameMode,
	GameStats,
	Monster,
	Particle,
	PlacedUnit,
	PlayerState,
	PopupItem,
	Projectile,
	Slot,
	UnitMaster
} from '$lib/types/game';
import {
	UNITS_MASTER,
	getRandomUnitByTier,
	HIDDEN_MERGE_RECIPES,
	GACHA_LEVEL_CONFIG,
	ATTRIBUTE_CHART,
	TIER_BOSS_SCALING
} from '$lib/data/units';
import { BOSSES_MASTER } from '$lib/data/bosses';
import { getRoundMonsterConfig } from '$lib/data/monsters';
import { sound } from '$lib/engine/SoundManager';

export class GameEngine {
	// Screen and coordinates
	public static readonly WIDTH = 1280;
	public static readonly HEIGHT = 720;

	public static readonly P1_CENTER_X = 250;
	public static readonly P1_CENTER_Y = 400;
	public static readonly P2_CENTER_X = 1030;
	public static readonly P2_CENTER_Y = 400;
	public static readonly BOSS_CENTER_X = 640;
	public static readonly BOSS_CENTER_Y = 345;

	public static readonly TRACK_RADIUS = 205;
	public static readonly SLOT_RADIUS = 122;
	public static readonly MAX_MONSTERS = 100;

	// Game state
	public stats: GameStats = {
		currentRound: 1,
		maxRound: 80,
		roundTimeLeft: 25.0,
		isBossRound: false,
		isGameOver: false,
		isGameWon: false,
		gameMode: 'SOLO',
		gameSpeed: 1,
		isPaused: false
	};

	public p1: PlayerState;
	public p2: PlayerState;

	public boss: BossEntity | null = null;
	public projectiles: Projectile[] = [];
	public floatingTexts: FloatingText[] = [];
	public particles: Particle[] = [];
	public popups: PopupItem[] = [];
	public bossWarningTimer = 0;
	public bossWarningName = '';

	// Spawn management
	private spawnTimerP1 = 0;
	private spawnTimerP2 = 0;
	private spawnedCountP1 = 0;
	private spawnedCountP2 = 0;
	private totalToSpawn = 0;
	private roundSpawnInterval = 1.0;
	private animTime = 0;
	private uiNotifyTimer = 0;

	// AI partner timer
	private aiActionTimer = 0;

	// Selection & interaction state for UI
	public selectedSlot: { player: 'p1' | 'p2'; index: number } | null = null;
	public draggingUnit: { player: 'p1' | 'p2'; slotIndex: number; unit: PlacedUnit } | null = null;
	public dragPos = { x: 0, y: 0 };

	// Event callbacks
	public onStateChange?: () => void;
	public onGameOver?: (reason: string) => void;
	public onGameWin?: () => void;

	constructor(mode: GameMode = 'SOLO') {
		this.stats.gameMode = mode;
		this.p1 = this.createPlayerState('p1', false, GameEngine.P1_CENTER_X, GameEngine.P1_CENTER_Y);
		this.p2 = this.createPlayerState('p2', mode === 'AI_COOP', GameEngine.P2_CENTER_X, GameEngine.P2_CENTER_Y);

		this.startRound(1);
	}

	private createPlayerState(
		id: 'p1' | 'p2',
		isAi: boolean,
		centerX: number,
		centerY: number
	): PlayerState {
		const slots: Slot[] = [];
		for (let k = 0; k < 12; k++) {
			const angle = (k * Math.PI) / 6;
			slots.push({
				index: k,
				x: centerX + GameEngine.SLOT_RADIUS * Math.cos(angle),
				y: centerY + GameEngine.SLOT_RADIUS * Math.sin(angle),
				unit: null
			});
		}

		// Warp slots inside boss room (Placed neatly along the outer walls of the boss room)
		const warpSlots: { x: number; y: number }[] = [];
		const warpX = id === 'p1' ? 515 : 765;
		for (let i = 0; i < 12; i++) {
			warpSlots.push({
				x: warpX + (i % 2 === 0 ? -14 : 14),
				y: 200 + Math.floor(i / 2) * 54
			});
		}

		return {
			id,
			isAlive: true,
			isAi,
			gold: 110,
			summonCount: 0,
			slots,
			monsters: [],
			trackCenterX: centerX,
			trackCenterY: centerY,
			trackRadius: GameEngine.TRACK_RADIUS,
			warpSlots,
			gachaLevel: 1
		};
	}

	public getSummonCost(player: PlayerState): number {
		return 50 + Math.floor(player.summonCount / 3) * 5;
	}

	public getGachaUpgradeCost(player: PlayerState): number | null {
		const config = GACHA_LEVEL_CONFIG[player.gachaLevel || 1];
		return config ? config.cost : null;
	}

	public getSummonedTier(gachaLevel: number): number {
		const roll = Math.random();
		const config = GACHA_LEVEL_CONFIG[gachaLevel] || GACHA_LEVEL_CONFIG[1];
		const { t5 = 0, t4, t3, t2 } = config.rates;

		if (t5 > 0 && roll < t5) {
			return 5;
		}
		if (t4 > 0 && roll < t5 + t4) {
			return 4;
		}
		if (t3 > 0 && roll < t5 + t4 + t3) {
			return 3;
		}
		if (t2 > 0 && roll < t5 + t4 + t3 + t2) {
			return 2;
		}
		return 1;
	}

	public upgradeGacha(player: PlayerState): boolean {
		if (this.stats.isGameOver) return false;
		if (player.gachaLevel >= 10) return false;

		const cost = this.getGachaUpgradeCost(player);
		if (cost === null || player.gold < cost) return false;

		player.gold -= cost;
		player.gachaLevel++;

		const isP1 = player.id === 'p1';
		const cx = player.trackCenterX;
		const cy = player.trackCenterY;

		// Spectacular Level-up VFX
		this.createShockwave(cx, cy, '#FBBF24', 65, 0.6);
		this.createShockwave(cx, cy, '#38BDF8', 45, 0.45);
		this.createPixelCubes(cx, cy, '#FBBF24', 16);

		if (isP1) {
			sound.playSuperCritical();
			const nextConfig = GACHA_LEVEL_CONFIG[player.gachaLevel];
			this.addFloatingText(cx, cy - 35, `⚡ [BIOS OVERCLOCK] 소환기 Lv.${player.gachaLevel}!`, '#FBBF24', 18);
			if (nextConfig) {
				this.addFloatingText(cx, cy - 12, nextConfig.shortRates, '#38BDF8', 13);
			}
		}

		this.notifyChange();
		return true;
	}

	public summonUnit(player: PlayerState): boolean {
		if (this.stats.isGameOver) return false;
		const cost = this.getSummonCost(player);
		if (player.gold < cost) return false;

		const emptySlots = player.slots.filter((s) => s.unit === null);
		if (emptySlots.length === 0) return false;

		// Deduct gold & increment count
		player.gold -= cost;
		player.summonCount++;

		// Pick random slot & Tier based on Gacha Level
		const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
		const targetTier = this.getSummonedTier(player.gachaLevel || 1);
		const master = getRandomUnitByTier(targetTier);

		slot.unit = {
			instanceId: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			unitId: master.id,
			slotIndex: slot.index,
			isWarped: false,
			cooldown: 0,
			spawnAnimTimer: master.tier === 4 ? 0.65 : 0.45
		};

		if (player.id === 'p1') {
			if (master.tier >= 4) {
				sound.playLegendary();
				this.addFloatingText(slot.x, slot.y - 24, `👑 [전설 직뽑] ${master.name}!`, '#FBBF24', 17);
			} else if (master.tier === 3) {
				sound.playSuperCritical();
				this.addFloatingText(slot.x, slot.y - 20, `💎 [영웅 직뽑] ${master.name}!`, '#A855F7', 15);
			} else if (master.tier === 2) {
				sound.playMerge();
				this.addFloatingText(slot.x, slot.y - 18, `✨ [희귀 직뽑] ${master.name}`, '#38BDF8', 14);
			} else {
				sound.playSummon();
				this.addFloatingText(slot.x, slot.y - 18, `✨ ${master.name}`, master.themeColor, 14);
			}
		}

		this.createSummonEffect(slot.x, slot.y, master.themeColor, master.tier);
		this.notifyChange();
		return true;
	}

	public mergeUnits(player: PlayerState, sourceSlotIndex: number, targetSlotIndex: number): boolean {
		if (sourceSlotIndex === targetSlotIndex) return false;
		const sourceSlot = player.slots[sourceSlotIndex];
		const targetSlot = player.slots[targetSlotIndex];

		if (!sourceSlot?.unit || !targetSlot?.unit) return false;
		const sourceMaster = UNITS_MASTER[sourceSlot.unit.unitId];
		const targetMaster = UNITS_MASTER[targetSlot.unit.unitId];
		if (!sourceMaster || !targetMaster) return false;
		if (sourceMaster.tier >= 5 || targetMaster.tier >= 5) return false;

		const isP1 = player.id === 'p1';
		const rand = Math.random();

		// 1. Tier 4 + Tier 4: Mythic Awakening (100% Guaranteed Success)
		// Board Jam Relief: Duplicate pair guarantees designated Mythic, different 4T pair yields random Mythic
		if (sourceMaster.tier === 4 && targetMaster.tier === 4) {
			const isDuplicatePair = sourceMaster.id === targetMaster.id;
			sourceSlot.unit = null; // Consume material unit

			let upgradedMaster: UnitMaster;
			if (isDuplicatePair && HIDDEN_MERGE_RECIPES[sourceMaster.id]) {
				const hiddenUnitId = HIDDEN_MERGE_RECIPES[sourceMaster.id];
				upgradedMaster = UNITS_MASTER[hiddenUnitId];
			} else {
				upgradedMaster = getRandomUnitByTier(5);
			}

			targetSlot.unit = {
				instanceId: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
				unitId: upgradedMaster.id,
				slotIndex: targetSlotIndex,
				isWarped: false,
				cooldown: 0,
				spawnAnimTimer: 0.85
			};

			if (isP1) {
				sound.playSuperCritical();
				const banner = isDuplicatePair ? `🚨 [MYTHIC 지정 각성!]` : `🎲 [MYTHIC 융합 각성!]`;
				this.addFloatingText(targetSlot.x, targetSlot.y - 32, `${banner} ${upgradedMaster.name} 강림!`, upgradedMaster.themeColor, 22);
			}
			this.createSummonEffect(targetSlot.x, targetSlot.y, upgradedMaster.themeColor, 5);

			this.notifyChange();
			return true;
		}

		// Tier 1 ~ 3 Merges require identical units
		if (sourceSlot.unit.unitId !== targetSlot.unit.unitId) return false;
		const currentMaster = sourceMaster;

		// 2. Tier 1 ~ 3 Merges: 100% Guaranteed Success (with rare Quantum Jump)
		let superCritChance = 0.02; // T1: 2% chance for +2 Tier Quantum Jump
		if (currentMaster.tier === 2) {
			superCritChance = 0.02; // T2: 2% chance for +2 Tier Quantum Jump
		} else if (currentMaster.tier === 3) {
			superCritChance = 0.01; // T3: 1% chance for +2 Tier Mythic Quantum Jump
		}

		sourceSlot.unit = null; // Always consume 1 ingredient unit

		if (rand < superCritChance) {
			// 🌟 SUPER CRITICAL! (+2 Tier Quantum Jump)
			const jumpTier = Math.min(5, currentMaster.tier + 2) as 3 | 4 | 5;
			const upgradedMaster = getRandomUnitByTier(jumpTier);
			targetSlot.unit = {
				instanceId: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
				unitId: upgradedMaster.id,
				slotIndex: targetSlotIndex,
				isWarped: false,
				cooldown: 0,
				spawnAnimTimer: jumpTier === 5 ? 0.85 : 0.65
			};

			if (isP1) {
				sound.playSuperCritical();
				this.addFloatingText(targetSlot.x, targetSlot.y - 30, `🌟 [JACKPOT! +2티어 점프] T${jumpTier} ${upgradedMaster.name}!`, '#FBBF24', 22);
			}
			this.createSummonEffect(targetSlot.x, targetSlot.y, upgradedMaster.themeColor, jumpTier);
		} else {
			// ✅ 100% GUARANTEED NORMAL SUCCESS (+1 Tier)
			const nextTier = (currentMaster.tier + 1) as 2 | 3 | 4;
			const upgradedMaster = getRandomUnitByTier(nextTier);
			const isTier4 = nextTier === 4;
			targetSlot.unit = {
				instanceId: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
				unitId: upgradedMaster.id,
				slotIndex: targetSlotIndex,
				isWarped: false,
				cooldown: 0,
				spawnAnimTimer: isTier4 ? 0.65 : 0.5
			};

			if (isP1) {
				if (isTier4) {
					sound.playLegendary();
					this.addFloatingText(targetSlot.x, targetSlot.y - 28, `👑 [LEGENDARY] ${upgradedMaster.name} 각성!`, '#FBBF24', 20);
				} else {
					sound.playMerge();
					this.addFloatingText(targetSlot.x, targetSlot.y - 20, `★ MERGE: ${upgradedMaster.name}!`, upgradedMaster.themeColor, 16);
				}
			}
			this.createSummonEffect(targetSlot.x, targetSlot.y, upgradedMaster.themeColor, nextTier);
		}

		this.notifyChange();
		return true;
	}

	public sellUnit(player: PlayerState, slotIndex: number): boolean {
		const slot = player.slots[slotIndex];
		if (!slot?.unit) return false;

		const master = UNITS_MASTER[slot.unit.unitId];
		const refund = master ? Math.pow(2, master.tier) * 10 : 20;

		player.gold += refund;
		const x = slot.x;
		const y = slot.y;
		slot.unit = null;

		if (player.id === 'p1') {
			sound.playSummon();
			this.addFloatingText(x, y - 15, `+${refund} Byte`, '#FBBF24', 15);
		}

		this.selectedSlot = null;
		this.notifyChange();
		return true;
	}

	public toggleUnitWarp(player: PlayerState, slotIndex: number): boolean {
		const slot = player.slots[slotIndex];
		if (!slot || !slot.unit) return false;

		const isP1 = player.id === 'p1';

		// If currently warped -> Recall back to base field
		if (slot.unit.isWarped) {
			slot.unit.isWarped = false;
			const destX = slot.x;
			const destY = slot.y;
			this.createParticles(destX, destY, '#38bdf8', 10);
			this.createShockwave(destX, destY, '#38bdf8', 25, 0.35);
			if (isP1) {
				sound.playSummon();
				this.addFloatingText(destX, destY - 18, '↩️ 기지 복귀', '#38BDF8', 14);
			}
			this.notifyChange();
			return true;
		}

		// If not warped -> Attempt to warp into boss room (Max 5 units allowed anytime)
		const currentlyWarped = player.slots.filter((s) => s.unit?.isWarped).length;
		if (currentlyWarped >= 5) {
			if (isP1) {
				sound.playFail();
				this.addFloatingText(slot.x, slot.y - 18, '⚠️ 보스방 정원 초과 (최대 5기)!', '#EF4444', 14);
			}
			return false;
		}

		slot.unit.isWarped = true;
		const warpPos = player.warpSlots[slot.index];
		const destX = warpPos ? warpPos.x : slot.x;
		const destY = warpPos ? warpPos.y : slot.y;

		this.createParticles(slot.x, slot.y, '#FBBF24', 8);
		this.createParticles(destX, destY, '#FBBF24', 12);
		this.createShockwave(destX, destY, '#FBBF24', 30, 0.4);

		if (isP1) {
			sound.playSummon();
			this.addFloatingText(destX, destY - 20, `⚡ 보스방 투입! (${currentlyWarped + 1}/5)`, '#FBBF24', 15);
		}

		this.notifyChange();
		return true;
	}

	public startRound(round: number) {
		this.stats.currentRound = round;
		this.stats.isBossRound = round % 10 === 0;
		this.stats.roundTimeLeft = this.stats.isBossRound ? 60.0 : 25.0;

		// Clear boss or spawn boss
		if (this.stats.isBossRound) {
			const bossMaster = BOSSES_MASTER[round];
			if (bossMaster) {
				const isSolo = this.stats.gameMode === 'SOLO';
				const maxHp = Math.round(bossMaster.maxHp * (isSolo ? 0.55 : 1.5));
				this.boss = {
					master: bossMaster,
					hp: maxHp,
					maxHp: maxHp,
					shield: 0,
					maxShield: 0,
					defense: bossMaster.defense,
					x: GameEngine.BOSS_CENTER_X,
					y: GameEngine.BOSS_CENTER_Y,
					timeLimit: bossMaster.timeLimit,
					timeLeft: bossMaster.timeLimit,
					skills: bossMaster.skills.map((s) => ({
						skill: s,
						cooldownTimer: s.interval || 10
					}))
				};
				this.bossWarningTimer = 3.2;
				this.bossWarningName = bossMaster.name;
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 80, `⚠️ BOSS: ${bossMaster.name} 출현!`, '#EF4444', 24);
			}
		} else {
			this.boss = null;
			this.bossWarningTimer = 0;
			this.bossWarningName = '';
		}

		// Setup spawn configs & reset counters
		const config = getRoundMonsterConfig(round, this.stats.gameMode === 'SOLO');
		this.totalToSpawn = config.count;
		this.roundSpawnInterval = config.interval;
		this.spawnTimerP1 = 0;
		this.spawnTimerP2 = 0;
		this.spawnedCountP1 = 0;
		this.spawnedCountP2 = 0;

		// Warped unit placements are preserved freely across rounds
		this.notifyChange();
	}

	public updateClientVisuals(dt: number) {
		if (this.stats.isGameOver || this.stats.isPaused) return;

		const effectiveDt = dt * this.stats.gameSpeed;
		this.animTime += effectiveDt;

		if (this.bossWarningTimer > 0) {
			this.bossWarningTimer -= effectiveDt;
		}

		// Interpolate / advance monster positions smoothly
		for (const m of this.p1.monsters) {
			if (m.stunDuration <= 0) {
				const effectiveSpeed = m.speed * (1 - m.slowRate);
				m.angle += (effectiveSpeed / m.trackRadius) * 60 * effectiveDt;
				m.x = m.trackCenterX + m.trackRadius * Math.cos(m.angle);
				m.y = m.trackCenterY + m.trackRadius * Math.sin(m.angle);
			}
		}
		for (const m of this.p2.monsters) {
			if (m.stunDuration <= 0) {
				const effectiveSpeed = m.speed * (1 - m.slowRate);
				m.angle += (effectiveSpeed / m.trackRadius) * 60 * effectiveDt;
				m.x = m.trackCenterX + m.trackRadius * Math.cos(m.angle);
				m.y = m.trackCenterY + m.trackRadius * Math.sin(m.angle);
			}
		}

		// Update unit attack and spawn animation timers
		for (const slot of this.p1.slots) {
			if (slot.unit?.attackAnimTimer && slot.unit.attackAnimTimer > 0) {
				slot.unit.attackAnimTimer -= effectiveDt;
			}
			if (slot.unit?.spawnAnimTimer && slot.unit.spawnAnimTimer > 0) {
				slot.unit.spawnAnimTimer -= effectiveDt;
			}
		}
		for (const slot of this.p2.slots) {
			if (slot.unit?.attackAnimTimer && slot.unit.attackAnimTimer > 0) {
				slot.unit.attackAnimTimer -= effectiveDt;
			}
			if (slot.unit?.spawnAnimTimer && slot.unit.spawnAnimTimer > 0) {
				slot.unit.spawnAnimTimer -= effectiveDt;
			}
		}

		// Update Projectiles motion smoothly
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const p = this.projectiles[i];
			if (p.type === 'LINE_PIERCE') {
				const moveDist = p.speed * effectiveDt;
				p.x += Math.cos(p.pierceAngle || 0) * moveDist;
				p.y += Math.sin(p.pierceAngle || 0) * moveDist;
			} else {
				const dx = p.targetX - p.x;
				const dy = p.targetY - p.y;
				const dist = Math.hypot(dx, dy);
				const step = p.speed * effectiveDt;
				if (dist > step && dist >= 8) {
					p.x += (dx / dist) * step;
					p.y += (dy / dist) * step;
				}
			}
		}

		// Update Visuals (particles, floating texts)
		this.updateVisuals(effectiveDt);
		this.notifyChange();
	}

	public update(dt: number) {
		if (this.stats.isGameOver || this.stats.isPaused) return;

		const effectiveDt = dt * this.stats.gameSpeed;
		this.animTime += effectiveDt;

		// Boss Warning Timer update
		if (this.bossWarningTimer > 0) {
			this.bossWarningTimer -= effectiveDt;
		}

		// Round timer update
		this.stats.roundTimeLeft -= effectiveDt;

		// Check boss or regular wave completion
		this.updateWaveStatus(effectiveDt);

		// Spawn monsters
		this.updateMonsterSpawns(effectiveDt);

		// Update monsters (movement, debuff timers, overload check)
		this.updateMonsters(effectiveDt, this.p1);
		if (this.stats.gameMode !== 'SOLO') {
			this.updateMonsters(effectiveDt, this.p2);
		}

		// Update Boss
		if (this.boss) {
			this.updateBoss(effectiveDt);
		}

		// Update Units (buffs calculation, attack targeting, projectile spawning)
		this.updateUnits(effectiveDt, this.p1);
		if (this.stats.gameMode !== 'SOLO') {
			this.updateUnits(effectiveDt, this.p2);
		}

		// AI Partner logic
		if (this.p2.isAi && this.stats.gameMode === 'AI_COOP') {
			this.updateAi(effectiveDt);
		}

		// Update Projectiles
		this.updateProjectiles(effectiveDt);

		// Update Visuals (floating texts, particles)
		this.updateVisuals(effectiveDt);

		// ⚡ Throttled UI State notification (10 FPS) to eliminate Svelte store re-render lag
		this.uiNotifyTimer += effectiveDt;
		if (this.uiNotifyTimer >= 0.1 || this.stats.isGameOver || this.stats.isGameWon) {
			this.uiNotifyTimer = 0;
			this.notifyChange();
		}
	}

	private updateWaveStatus(dt: number) {
		if (this.stats.isBossRound) {
			if (this.boss) {
				this.boss.timeLeft -= dt;
				if (this.boss.timeLeft <= 0) {
					this.triggerGameOver('보스 처치 제한 시간(60초) 초과!');
					return;
				}
				if (this.boss.formatCountdown !== undefined) {
					this.boss.formatCountdown -= dt;
					if (this.boss.formatCountdown <= 0) {
						if (this.boss.master.id === 'BOSS_80R') {
							this.triggerGameOver('Y2K 세기말 밀레니엄 붕괴! 시스템이 영구 리셋되었습니다.');
						} else {
							this.triggerGameOver('블루스크린 강제 포맷 카운트다운 만료!');
						}
						return;
					}
				}
			}
			// In boss rounds, round completion is exclusively driven by applyDamageToBoss
			return;
		}

		// Fast Wave Clear: If all wave monsters have spawned and all are cleared, advance immediately!
		const isP1SpawnDone = this.spawnedCountP1 >= this.totalToSpawn;
		const isP2SpawnDone = this.stats.gameMode === 'SOLO' || this.spawnedCountP2 >= this.totalToSpawn;
		const isP1Cleared = this.p1.monsters.length === 0;
		const isP2Cleared = this.stats.gameMode === 'SOLO' || this.p2.monsters.length === 0;

		if (isP1SpawnDone && isP2SpawnDone && isP1Cleared && isP2Cleared) {
			this.finishRound();
			return;
		}

		// Normal round timeout
		if (this.stats.roundTimeLeft <= 0) {
			this.finishRound();
		}
	}

	private finishRound() {
		// Round reward: Balanced base reward + Reasonable Fast Clear Time Bonus
		const baseReward = Math.round(20 + this.stats.currentRound * 2.5);
		const timeBonus = Math.max(0, Math.round(this.stats.roundTimeLeft * 0.5));
		const totalReward = baseReward + timeBonus;

		this.p1.gold += totalReward;

		// Display gained bytes directly above the Available Memory VFD
		if (timeBonus > 0) {
			this.addFloatingText(120, 670, `+${totalReward}B (클리어 ${baseReward} + 타임보너스 +${timeBonus})`, '#38BDF8', 16);
		} else {
			this.addFloatingText(120, 670, `+${totalReward} Byte`, '#fbbf24', 18);
		}

		if (this.stats.gameMode !== 'SOLO') {
			this.p2.gold += totalReward;
			if (timeBonus > 0) {
				this.addFloatingText(1160, 670, `+${totalReward}B (클리어 ${baseReward} + 타임보너스 +${timeBonus})`, '#38BDF8', 16);
			} else {
				this.addFloatingText(1160, 670, `+${totalReward} Byte`, '#fbbf24', 18);
			}
		}

		if (this.stats.currentRound >= this.stats.maxRound) {
			this.triggerGameWin();
			return;
		}

		// Next round
		this.startRound(this.stats.currentRound + 1);
	}

	private updateMonsterSpawns(dt: number) {
		const config = getRoundMonsterConfig(this.stats.currentRound, this.stats.gameMode === 'SOLO');

		// P1 Spawns
		if (this.spawnedCountP1 < this.totalToSpawn) {
			this.spawnTimerP1 += dt;
			if (this.spawnTimerP1 >= this.roundSpawnInterval) {
				this.spawnTimerP1 = 0;
				this.spawnMonster(this.p1, config);
				this.spawnedCountP1++;
			}
		}

		// P2 Spawns (if Coop: AI_COOP or ONLINE_COOP)
		if (this.stats.gameMode !== 'SOLO' && this.spawnedCountP2 < this.totalToSpawn) {
			this.spawnTimerP2 += dt;
			if (this.spawnTimerP2 >= this.roundSpawnInterval) {
				this.spawnTimerP2 = 0;
				this.spawnMonster(this.p2, config);
				this.spawnedCountP2++;
			}
		}
	}

	private spawnMonster(player: PlayerState, config: any) {
		const id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
		const angle = -Math.PI / 2; // Start from top

		const monster: Monster = {
			id,
			tier: Math.floor(this.stats.currentRound / 10) + 1,
			name: config.name,
			maxHp: config.hp,
			hp: config.hp,
			defense: config.defense,
			speed: config.speed,
			angle,
			trackCenterX: player.trackCenterX,
			trackCenterY: player.trackCenterY,
			trackRadius: player.trackRadius,
			x: player.trackCenterX + player.trackRadius * Math.cos(angle),
			y: player.trackCenterY + player.trackRadius * Math.sin(angle),
			isDead: false,
			slowRate: 0,
			slowDuration: 0,
			stunDuration: 0,
			armorDownRate: 0,
			armorDownDuration: 0,
			damageAmpRate: 0,
			damageAmpDuration: 0,
			hitCount: 0,
			color: config.color,
			size: config.size
		};

		player.monsters.push(monster);
	}

	private updateMonsters(dt: number, player: PlayerState) {
		for (let i = player.monsters.length - 1; i >= 0; i--) {
			const m = player.monsters[i];

			if (m.isDead) {
				player.monsters.splice(i, 1);
				continue;
			}

			// Debuff timers
			if (m.slowDuration > 0) {
				m.slowDuration -= dt;
				if (m.slowDuration <= 0) m.slowRate = 0;
			}
			if (m.stunDuration > 0) {
				m.stunDuration -= dt;
			}
			if (m.armorDownDuration > 0) {
				m.armorDownDuration -= dt;
				if (m.armorDownDuration <= 0) m.armorDownRate = 0;
			}
			if (m.damageAmpDuration > 0) {
				m.damageAmpDuration -= dt;
				if (m.damageAmpDuration <= 0) m.damageAmpRate = 0;
			}

			// Movement along circle
			if (m.stunDuration <= 0) {
				const effectiveSpeed = m.speed * (1 - m.slowRate);
				m.angle += (effectiveSpeed / m.trackRadius) * 60 * dt; // Radian velocity
			}

			m.x = m.trackCenterX + m.trackRadius * Math.cos(m.angle);
			m.y = m.trackCenterY + m.trackRadius * Math.sin(m.angle);
		}

		// Check Overload (100 mobs)
		if (player.monsters.length >= GameEngine.MAX_MONSTERS) {
			this.triggerGameOver(`${player.id === 'p1' ? '1P' : '2P'} 트랙 과부하 (${GameEngine.MAX_MONSTERS}마리 한계 초과)!`);
		}
	}

	private updateBoss(dt: number) {
		if (!this.boss) return;

		// 0.25s Multi-hit Rate-limiting Window
		this.boss.recentHitTimer = (this.boss.recentHitTimer || 0) + dt;
		if (this.boss.recentHitTimer >= 0.25) {
			this.boss.recentHitTimer = 0;
			this.boss.recentHitCount = 0;
		}

		// Decrement lag duration if active
		if (this.boss.lagDuration && this.boss.lagDuration > 0) {
			this.boss.lagDuration -= dt;
		}

		// Skills
		for (const s of this.boss.skills) {
			s.cooldownTimer -= dt;
			if (s.cooldownTimer <= 0) {
				s.cooldownTimer = s.skill.interval || 15;
				this.executeBossSkill(s.skill);
			}
		}

		// Check 50R format countdown trigger
		if (this.boss.master.id === 'BOSS_50R' && this.boss.formatCountdown === undefined) {
			if (this.boss.hp / this.boss.maxHp <= 0.3) {
				this.boss.formatCountdown = 15.0;
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 90, '🚨 강제 포맷 15초 카운트다운 시작!', '#EF4444', 20);
			}
		}

		// Check 80R Y2K Time Rollback (at <= 70% HP)
		if (this.boss.master.id === 'BOSS_80R' && !this.boss.timeRollbackTriggered) {
			if (this.boss.hp / this.boss.maxHp <= 0.7) {
				this.boss.timeRollbackTriggered = true;
				const healAmount = Math.round(this.boss.maxHp * 0.1);
				this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + healAmount);
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 90, `⏳ Y2K 타임 롤백! +${healAmount.toLocaleString()} HP 회복 & 좀비 침투!`, '#38BDF8', 20);

				// Spawn 12 fast zombie packets on both tracks
				const config = getRoundMonsterConfig(this.stats.currentRound, this.stats.gameMode === 'SOLO');
				for (let i = 0; i < 12; i++) {
					this.spawnMonster(this.p1, { ...config, name: 'Y2K 좀비 패킷', speed: config.speed * 1.5, color: '#EF4444' });
					if (this.stats.gameMode !== 'SOLO') {
						this.spawnMonster(this.p2, { ...config, name: 'Y2K 좀비 패킷', speed: config.speed * 1.5, color: '#EF4444' });
					}
				}
			}
		}

		// Check 80R Y2K 20s Millennial Reset Countdown (at <= 25% HP)
		if (this.boss.master.id === 'BOSS_80R' && this.boss.formatCountdown === undefined) {
			if (this.boss.hp / this.boss.maxHp <= 0.25) {
				this.boss.formatCountdown = 20.0;
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 90, '🚨 [00:00] Y2K 세기말 리셋 20초 카운트다운 시작!', '#EF4444', 22);
			}
		}
	}

	private executeBossSkill(skill: any) {
		if (!this.boss) return;

		switch (skill.type) {
			case 'POPUP_INVASION': {
				sound.playPopup();
				const count = skill.popupCount || 2;
				for (let i = 0; i < count; i++) {
					this.popups.push({
						id: `pop_${Date.now()}_${Math.random()}`,
						x: 200 + Math.random() * 800,
						y: 100 + Math.random() * 400,
						title: '경고: 악성 팝업 창!',
						content: '지금 즉시 [X]를 클릭하여 닫으세요!',
						width: 220,
						height: 120
					});
				}
				break;
			}

			case 'SHIELD_ARMOR_UP': {
				this.boss.shield = this.boss.maxHp * (skill.shieldRate || 0.2);
				this.boss.maxShield = this.boss.shield;
				this.addFloatingText(this.boss.x, this.boss.y - 40, '🛡️ 쉴드 & 방어막 활성화!', '#38BDF8', 16);
				break;
			}

			case 'SPY_INFECTION': {
				sound.playBossAlert();
				const placedP1 = this.p1.slots.filter((s) => s.unit !== null && (!s.unit.trojanDuration || s.unit.trojanDuration <= 0));
				if (placedP1.length > 0) {
					const pick = placedP1[Math.floor(Math.random() * placedP1.length)];
					if (pick.unit) {
						pick.unit.trojanDuration = skill.duration || 6.0;
						this.createParticles(pick.x, pick.y, '#A855F7', 12);
						this.addFloatingText(pick.x, pick.y - 20, '🕵️ [트로이 침투] 스파이 감염 (공격불능+주변오염)!', '#A855F7', 15);
					}
				}
				if (this.stats.gameMode !== 'SOLO') {
					const placedP2 = this.p2.slots.filter((s) => s.unit !== null && (!s.unit.trojanDuration || s.unit.trojanDuration <= 0));
					if (placedP2.length > 0) {
						const pick = placedP2[Math.floor(Math.random() * placedP2.length)];
						if (pick.unit) pick.unit.trojanDuration = skill.duration || 6.0;
					}
				}
				break;
			}

			case 'UNIT_ENCRYPT': {
				sound.playBossAlert();
				// 30R: 필드 최고 티어 핵심 딜러를 정밀 인질 암호화!
				const placedP1 = this.p1.slots.filter((s) => s.unit !== null);
				if (placedP1.length > 0) {
					placedP1.sort((a, b) => {
						const tA = UNITS_MASTER[a.unit!.unitId]?.tier || 1;
						const tB = UNITS_MASTER[b.unit!.unitId]?.tier || 1;
						return tB - tA;
					});
					const hostage = placedP1[0];
					if (hostage.unit) {
						hostage.unit.frozenDuration = skill.duration || 5.0;
						this.createParticles(hostage.x, hostage.y, '#A855F7', 15);
						this.addFloatingText(hostage.x, hostage.y - 24, `🔒 [인질] 최고티어 유닛 암호화! (${skill.duration || 5}s)`, '#A855F7', 16);
					}
				}
				if (this.stats.gameMode !== 'SOLO') {
					const placedP2 = this.p2.slots.filter((s) => s.unit !== null);
					if (placedP2.length > 0) {
						placedP2.sort((a, b) => {
							const tA = UNITS_MASTER[a.unit!.unitId]?.tier || 1;
							const tB = UNITS_MASTER[b.unit!.unitId]?.tier || 1;
							return tB - tA;
						});
						if (placedP2[0].unit) placedP2[0].unit.frozenDuration = skill.duration || 5.0;
					}
				}
				break;
			}

			case 'GLOBAL_LAG': {
				const duration = skill.duration || 6.0;
				const debuff = skill.attackSpeedDebuff || 0.3;
				this.boss.lagDuration = duration;
				this.boss.lagDebuffRate = debuff;
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 50, `⚡ 디도스 렉 유발: 전 타워 공속 -${Math.round(debuff * 100)}% (${duration}초)`, '#EF4444', 16);
				break;
			}

			case 'PACKET_FLOOD': {
				const config = getRoundMonsterConfig(this.stats.currentRound, this.stats.gameMode === 'SOLO');
				for (let i = 0; i < (skill.mobCount || 6); i++) {
					this.spawnMonster(this.p1, { ...config, speed: config.speed * 1.5 });
					if (this.stats.gameMode !== 'SOLO') {
						this.spawnMonster(this.p2, { ...config, speed: config.speed * 1.5 });
					}
				}
				break;
			}

			case 'ZONE_DISABLE': {
				sound.playBossAlert();
				// 50R BSOD: 메모리 덤프 (SEC 보안 속성은 50% 확률로 방화벽 저항)
				const placedP1 = this.p1.slots.filter((s) => s.unit !== null);
				for (let i = 0; i < Math.min(placedP1.length, 2); i++) {
					const pick = placedP1[Math.floor(Math.random() * placedP1.length)];
					if (pick.unit) {
						const m = UNITS_MASTER[pick.unit.unitId];
						if (m?.attribute === 'SEC' && Math.random() < 0.5) {
							this.addFloatingText(pick.x, pick.y - 18, '🛡️ 보안 방화벽 저항!', '#38BDF8', 14);
						} else {
							pick.unit.frozenDuration = skill.duration || 4.0;
							this.createGlitchBurst(pick.x, pick.y, '#3B82F6', 6);
							this.addFloatingText(pick.x, pick.y - 18, '💻 BSOD 충돌! (4s)', '#3B82F6', 14);
						}
					}
				}
				if (this.stats.gameMode !== 'SOLO') {
					const placedP2 = this.p2.slots.filter((s) => s.unit !== null);
					for (let i = 0; i < Math.min(placedP2.length, 2); i++) {
						const pick = placedP2[Math.floor(Math.random() * placedP2.length)];
						if (pick.unit) pick.unit.frozenDuration = skill.duration || 4.0;
					}
				}
				break;
			}

			// 60R: CIH Chernobyl
			case 'HARDWARE_OVERHEAT': {
				sound.playBossAlert();
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 60, '☢️ 메인보드 과열! 몬스터 이동속도 +80%', '#EF4444', 18);
				for (const m of this.p1.monsters) {
					m.speed *= 1.8;
				}
				for (const m of this.p2.monsters) {
					m.speed *= 1.8;
				}
				this.createParticles(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y, '#EF4444', 25);
				break;
			}

			case 'BAD_SECTOR': {
				sound.playCrit();
				const count = skill.targetCount || 2;
				const placedP1 = this.p1.slots.filter((s) => s.unit !== null);
				for (let i = 0; i < Math.min(placedP1.length, count); i++) {
					const pick = placedP1[Math.floor(Math.random() * placedP1.length)];
					if (pick.unit) pick.unit.frozenDuration = skill.duration || 7.0;
				}
				if (this.stats.gameMode !== 'SOLO') {
					const placedP2 = this.p2.slots.filter((s) => s.unit !== null);
					for (let i = 0; i < Math.min(placedP2.length, count); i++) {
						const pick = placedP2[Math.floor(Math.random() * placedP2.length)];
						if (pick.unit) pick.unit.frozenDuration = skill.duration || 7.0;
					}
				}
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 50, '⚠️ 하드웨어 배드 섹터 침식! (유닛 마비)', '#F59E0B', 16);
				break;
			}

			// 70R: Cryptojacker
			case 'RESOURCE_DRAIN': {
				sound.playPopup();
				const drainAmount = Math.min(this.p1.gold, 60);
				this.p1.gold = Math.max(0, this.p1.gold - drainAmount);
				let totalDrained = drainAmount;
				if (this.stats.gameMode !== 'SOLO') {
					const p2Drain = Math.min(this.p2.gold, 60);
					this.p2.gold = Math.max(0, this.p2.gold - p2Drain);
					totalDrained += p2Drain;
				}
				const shieldGained = totalDrained * 400;
				this.boss.shield += shieldGained;
				this.boss.maxShield = Math.max(this.boss.maxShield, this.boss.shield);
				this.addFloatingText(this.boss.x, this.boss.y - 40, `⛏️ 리소스 강탈! +${shieldGained.toLocaleString()} 쉴드 흡수`, '#38BDF8', 16);
				break;
			}

			case 'HASH_COLLISION': {
				sound.playCrit();
				const count = skill.targetCount || 2;
				const topUnitsP1 = this.p1.slots
					.filter((s) => s.unit !== null)
					.sort((a, b) => (UNITS_MASTER[b.unit!.unitId]?.tier || 1) - (UNITS_MASTER[a.unit!.unitId]?.tier || 1));
				for (let i = 0; i < Math.min(topUnitsP1.length, count); i++) {
					if (topUnitsP1[i].unit) topUnitsP1[i].unit!.frozenDuration = skill.duration || 6.0;
				}
				if (this.stats.gameMode !== 'SOLO') {
					const topUnitsP2 = this.p2.slots
						.filter((s) => s.unit !== null)
						.sort((a, b) => (UNITS_MASTER[b.unit!.unitId]?.tier || 1) - (UNITS_MASTER[a.unit!.unitId]?.tier || 1));
					for (let i = 0; i < Math.min(topUnitsP2.length, count); i++) {
						if (topUnitsP2[i].unit) topUnitsP2[i].unit!.frozenDuration = skill.duration || 6.0;
					}
				}
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 50, '🪙 해시 락 충돌! 핵심 고티어 유닛 동결!', '#A855F7', 16);
				break;
			}

			// 80R: Y2K Millennium
			case 'RSOD_CRASH': {
				sound.playPopup();
				const count = skill.popupCount || 4;
				for (let i = 0; i < count; i++) {
					this.popups.push({
						id: `pop_${Date.now()}_${Math.random()}`,
						x: 180 + Math.random() * 850,
						y: 80 + Math.random() * 420,
						title: '🛑 치명적 RSOD 에러: Y2K_EXCEPTION',
						content: '즉시 [X]를 클릭하여 세기말 메모리 붕괴를 막으십시오!',
						width: 240,
						height: 125
					});
				}
				this.addFloatingText(GameEngine.BOSS_CENTER_X, GameEngine.BOSS_CENTER_Y - 60, '🛑 레드스크린 에러 창 폭격!', '#EF4444', 18);
				break;
			}
		}
	}

	private updateUnits(dt: number, player: PlayerState) {
		// Global buffs from T4_TASKMASTER & HIDDEN_CTRLALTDEL (Unique Auras: Non-stacking)
		let hasTaskmaster = false;
		let hasCtrlAltDel = false;
		for (const slot of player.slots) {
			if (slot.unit?.unitId === 'T4_TASKMASTER') {
				hasTaskmaster = true;
			} else if (slot.unit?.unitId === 'HIDDEN_CTRLALTDEL') {
				hasCtrlAltDel = true;
			}
		}

		let teamAttackSpeedBonus = 0;
		let teamCritBonus = 0;
		if (hasTaskmaster) {
			teamAttackSpeedBonus += 0.25;
			teamCritBonus += 0.12;
		}
		if (hasCtrlAltDel) {
			teamAttackSpeedBonus += 0.35;
			teamCritBonus += 0.2;
		}

		for (let i = 0; i < player.slots.length; i++) {
			const slot = player.slots[i];
			const unit = slot.unit;
			if (!unit) continue;

			const master = UNITS_MASTER[unit.unitId];
			if (!master) continue;

			// Handle status/debuff timers (frozen, trojan spy, overheat)
			if (unit.frozenDuration && unit.frozenDuration > 0) {
				unit.frozenDuration -= dt;
				continue;
			}
			if (unit.trojanDuration && unit.trojanDuration > 0) {
				unit.trojanDuration -= dt;
				continue;
			}
			if (unit.overheatDuration && unit.overheatDuration > 0) {
				unit.overheatDuration -= dt;
				continue;
			}

			// Local slot buffs (T1_HAND, T2_LINK, T3_MACRO)
			let localAttackSpeedBonus = teamAttackSpeedBonus;
			let localDamageBonus = 0;
			let localRangeBonus = 0;

			// 10R Boss: 팝업 스팸 봇 - 시야 차단 사거리 -20%
			if (this.boss && this.boss.master.id === 'BOSS_10R') {
				localRangeBonus -= 0.20;
			}

			// 20R Boss: 인접 슬롯이 트로이 감염된 경우 공격력 -25% 오염
			if (this.boss && this.boss.master.id === 'BOSS_20R') {
				const adjLeftUnit = player.slots[(i + 11) % 12]?.unit;
				const adjRightUnit = player.slots[(i + 1) % 12]?.unit;
				if ((adjLeftUnit?.trojanDuration && adjLeftUnit.trojanDuration > 0) || 
					(adjRightUnit?.trojanDuration && adjRightUnit.trojanDuration > 0)) {
					localDamageBonus -= 0.25;
				}
			}

			// 70R Boss: 크립토재킹 채굴 타이탄 - 전력 강탈로 인한 공속 -25%
			if (this.boss && this.boss.master.id === 'BOSS_70R') {
				localAttackSpeedBonus -= 0.25;
			}

			// T1_HAND adjacent 1
			const adjLeft = player.slots[(i + 11) % 12];
			const adjRight = player.slots[(i + 1) % 12];
			if (adjLeft?.unit?.unitId === 'T1_HAND' || adjRight?.unit?.unitId === 'T1_HAND') {
				localAttackSpeedBonus += 0.12;
			}

			// T2_LINK cross (i-1, i+1, i+6)
			const oppSlot = player.slots[(i + 6) % 12];
			if (
				adjLeft?.unit?.unitId === 'T2_LINK' ||
				adjRight?.unit?.unitId === 'T2_LINK' ||
				oppSlot?.unit?.unitId === 'T2_LINK'
			) {
				localRangeBonus += 0.15;
				localDamageBonus += 0.15;
			}

			// HIDDEN_ROOT_ADMIN adjacent 1 aura (+40% Damage)
			if (adjLeft?.unit?.unitId === 'HIDDEN_ROOT_ADMIN' || adjRight?.unit?.unitId === 'HIDDEN_ROOT_ADMIN') {
				localDamageBonus += 0.4;
			}

			// T3_MACRO around
			for (let offset = -4; offset <= 4; offset++) {
				if (offset === 0) continue;
				const neighbor = player.slots[(i + offset + 12) % 12];
				if (neighbor?.unit?.unitId === 'T3_MACRO') {
					localAttackSpeedBonus += 0.2;
					break;
				}
			}

			// Attack animation timer update
			if (unit.attackAnimTimer && unit.attackAnimTimer > 0) {
				unit.attackAnimTimer -= dt;
			}

			// Spawn animation timer update
			if (unit.spawnAnimTimer && unit.spawnAnimTimer > 0) {
				unit.spawnAnimTimer -= dt;
			}

			// Attack cooldown update (applying Boss GLOBAL_LAG debuff if active)
			let bossLagDebuff = 0;
			if (this.boss && this.boss.lagDuration && this.boss.lagDuration > 0) {
				bossLagDebuff = this.boss.lagDebuffRate || 0.3;
			}
			const netAttackSpeedBonus = Math.max(-0.7, localAttackSpeedBonus - bossLagDebuff);
			let effectiveCooldownDuration = master.attackSpeed / (1 + netAttackSpeedBonus);

			// 80R Boss: Y2K 밀레니엄 둠 - 타임 패러독스로 인한 쿨타임 주기 무작위 왜곡 (0.7x ~ 1.4x)
			if (this.boss && this.boss.master.id === 'BOSS_80R') {
				effectiveCooldownDuration *= (0.7 + Math.random() * 0.7);
			}

			if (unit.cooldown > 0) {
				unit.cooldown -= dt;
			}

			// Unit Position (normal slot or warp slot)
			let currentUnitX = slot.x;
			let currentUnitY = slot.y;
			if (unit.isWarped) {
				const warpPos = player.warpSlots[slot.index];
				if (warpPos) {
					currentUnitX = warpPos.x;
					currentUnitY = warpPos.y;
				}
			}

			// Special passive or pulse attacks
			if (master.attackType === 'PASSIVE_ONLY') continue;

			// Find target for aim tracking & combat
			const target = this.findTargetForUnit(
				player,
				master,
				currentUnitX,
				currentUnitY,
				localRangeBonus,
				unit.isWarped
			);

			// Smooth procedural Aim Tracking towards target
			if (target?.target && typeof target.target.x === 'number' && typeof target.target.y === 'number') {
				const desiredAngle = Math.atan2(target.target.y - currentUnitY, target.target.x - currentUnitX);
				if (unit.targetAngle === undefined) {
					unit.targetAngle = desiredAngle;
				} else {
					let diff = desiredAngle - unit.targetAngle;
					while (diff < -Math.PI) diff += Math.PI * 2;
					while (diff > Math.PI) diff -= Math.PI * 2;
					unit.targetAngle += diff * Math.min(1, dt * 14);
				}
			} else if (unit.targetAngle === undefined) {
				unit.targetAngle = -Math.PI * 0.75; // Default classic Windows NW pointer angle
			}

			// Check if ready to attack
			if (unit.cooldown <= 0) {
				if (target) {
					this.performAttack(
						player,
						unit,
						master,
						currentUnitX,
						currentUnitY,
						target,
						localDamageBonus,
						teamCritBonus
					);
					unit.cooldown = effectiveCooldownDuration;
				}
			}
		}
	}

	private findTargetForUnit(
		player: PlayerState,
		master: UnitMaster,
		unitX: number,
		unitY: number,
		rangeBonus: number,
		isWarped: boolean
	): { type: 'monster' | 'boss'; target: any } | null {
		// If warped, prioritize boss
		if (isWarped && this.boss) {
			return { type: 'boss', target: this.boss };
		}

		if (player.monsters.length === 0) {
			if (this.boss && (master.range >= 9999 || isWarped)) {
				return { type: 'boss', target: this.boss };
			}
			return null;
		}

		const effectiveRange = master.range * (1 + rangeBonus);

		// In-range monsters
		const inRangeMonsters = player.monsters.filter((m) => {
			if (effectiveRange >= 9000) return true;
			const dist = Math.hypot(m.x - unitX, m.y - unitY);
			return dist <= effectiveRange;
		});

		if (inRangeMonsters.length === 0) return null;

		// Targeting priority
		if (master.targetPriority === 'HIGHEST_HP') {
			inRangeMonsters.sort((a, b) => b.hp - a.hp);
			return { type: 'monster', target: inRangeMonsters[0] };
		}

		// Default: FIRST (highest angle/distance traveled)
		inRangeMonsters.sort((a, b) => b.angle - a.angle);
		return { type: 'monster', target: inRangeMonsters[0] };
	}

	private performAttack(
		player: PlayerState,
		unit: PlacedUnit,
		master: UnitMaster,
		startX: number,
		startY: number,
		targetWrap: { type: 'monster' | 'boss'; target: any } | null,
		damageBonus: number,
		critBonus: number
	) {
		const isP1 = player.id === 'p1';
		if (isP1) sound.playShoot(master.tier);

		// Trigger Unit-specific Attack Animation Motion
		const targetX = targetWrap?.target && typeof targetWrap.target.x === 'number' ? targetWrap.target.x : startX + 100;
		const targetY = targetWrap?.target && typeof targetWrap.target.y === 'number' ? targetWrap.target.y : startY;
		unit.attackAnimTimer = 0.22;
		unit.targetAngle = Math.atan2(targetY - startY, targetX - startX);

		let baseDmg = master.damage * (1 + damageBonus);
		let isCrit = false;

		// Aim crit & Tier 5 Skills
		if (master.id === 'T2_AIM' && Math.random() < 0.3 + critBonus) {
			isCrit = true;
			baseDmg *= 2.0;
			if (isP1) sound.playCrit();
		} else if (master.id === 'T4_ADMIN') {
			// Periodic burst: every 6th attack deals 400% (2,080 DMG)
			unit.skillCooldown = (unit.skillCooldown || 0) + 1;
			if (unit.skillCooldown >= 6) {
				unit.skillCooldown = 0;
				isCrit = true;
				baseDmg *= 4.0;
				if (isP1) sound.playCrit();
				this.createPixelCubes(startX, startY, '#FBBF24', 8);
			}
		} else if (master.id === 'HIDDEN_ROOT_ADMIN') {
			// 100% Crit + 3-hit 500% (750% to Boss) Super Nuclear Burst
			isCrit = true;
			unit.skillCooldown = (unit.skillCooldown || 0) + 1;
			if (unit.skillCooldown >= 3) {
				unit.skillCooldown = 0;
				const isBossTarget = targetWrap?.type === 'boss';
				baseDmg *= isBossTarget ? 7.5 : 5.0;
				if (isP1) {
					sound.playCrit();
					sound.playLegendary();
				}
				this.createPixelCubes(startX, startY, '#F59E0B', 14);
			} else {
				baseDmg *= 2.0;
				if (isP1) sound.playCrit();
			}
		} else if (master.id === 'HIDDEN_CTRLALTDEL') {
			// SIGKILL: Every 4th attack triggers global process termination
			unit.skillCooldown = (unit.skillCooldown || 0) + 1;
			if (unit.skillCooldown >= 4) {
				unit.skillCooldown = 0;
				isCrit = true;
				baseDmg *= 1.5;
				if (isP1) {
					sound.playCrit();
					sound.playLegendary();
				}
				this.createGlitchBurst(startX, startY, '#FF0055', 10);

				// Surrounding monster health reduction & execute (320px radius, or 9999px if warped)
				const execRadius = unit.isWarped ? 9999 : 320;
				for (const m of player.monsters) {
					if (m.isDead) continue;
					if (Math.hypot(m.x - startX, m.y - startY) > execRadius) continue;
					const cutHp = Math.round(m.hp * 0.25);
					m.hp -= cutHp;
					this.createParticles(m.x, m.y, '#FF0055', 6);
					this.createGlitchBurst(m.x, m.y, '#FF0055', 3);
					if (m.hp / m.maxHp <= 0.15 || m.hp <= 0) {
						m.hp = 0;
						m.isDead = true;
						player.gold += 1;
						this.createByteAbsorptionEffect(m.x, m.y, player.id, 1);
					} else {
						this.addDamageFloatingText(m.x, m.y - 12, `💥 -${cutHp}`, '#FF0055', 14);
					}
				}

				if (this.boss && (unit.isWarped || Math.hypot(this.boss.x - startX, this.boss.y - startY) <= execRadius)) {
					const bx = this.boss.x;
					const by = this.boss.y;
					this.boss.defense = Math.round(this.boss.master.defense * 0.5); // 50% defense break
					const bossCutHp = Math.round(this.boss.maxHp * 0.02); // 2% Max HP true boss damage
					this.boss.hp -= bossCutHp;
					this.createParticles(bx, by, '#FF0055', 14);
					this.addDamageFloatingText(bx, by - 25, `💥 -${bossCutHp} (SIGKILL 2% 파괴)`, '#FF0055', 17);
				}
			}
		}

		if (!targetWrap || !targetWrap.target) return;

		// 40R Boss Penalty: 디도스 패킷 병목 (25% 확률로 패킷 유실 / Miss)
		if (this.boss && this.boss.master.id === 'BOSS_40R' && Math.random() < 0.25) {
			if (isP1) {
				this.addFloatingText(startX, startY - 14, '⚠️ Packet Loss (유실)', '#EF4444', 12);
			}
			return;
		}

		// 60R Boss Penalty: CIH 체르노빌 하드웨어 과열 누적 (12회 공격 시 2.0s 과열 냉각)
		if (this.boss && this.boss.master.id === 'BOSS_60R') {
			unit.heatStack = (unit.heatStack || 0) + 1;
			if (unit.heatStack >= 12) {
				unit.heatStack = 0;
				unit.overheatDuration = 2.0;
				this.createParticles(startX, startY, '#EF4444', 10);
				if (isP1) {
					this.addFloatingText(startX, startY - 16, '🔥 CPU 과열 냉각! (2.0s)', '#EF4444', 14);
				}
			}
		}

		// 70R Boss Penalty: 크립토재킹 채굴 전력 누수 (공격 시 8% 확률로 1 Byte 채굴 강탈)
		if (this.boss && this.boss.master.id === 'BOSS_70R' && player.gold > 0 && Math.random() < 0.08) {
			player.gold -= 1;
			if (isP1) {
				this.addFloatingText(startX, startY - 14, '⛏️ -1 Byte (채굴)', '#F59E0B', 11);
			}
		}

		// 80R Boss Penalty: Y2K 밀레니엄 둠 투사체 속도 -50% 왜곡
		const projSpeedMult = this.boss && this.boss.master.id === 'BOSS_80R' ? 0.5 : 1.0;

		const target = targetWrap.target;

		// Calculate muzzle origin for directional projectile/laser firing (shoots from cursor tip)
		let spawnX = startX;
		let spawnY = startY;
		const anchoredUnitIds = [
			'T2_HOURGLASS', 'T2_RESIZE', 'T3_SPINNER', 'T3_DENIED', 'T3_MACRO',
			'T4_WHEEL', 'T4_CONSOLE', 'T4_TASKMASTER', 'HIDDEN_BSOD_WHEEL', 'HIDDEN_DEBUG_CONSOLE'
		];
		if (!anchoredUnitIds.includes(master.id)) {
			const muzzleDist = master.tier >= 4 ? 17 : 14;
			spawnX = startX + Math.cos(unit.targetAngle || 0) * muzzleDist;
			spawnY = startY + Math.sin(unit.targetAngle || 0) * muzzleDist;
		}

		if (master.attackType === 'LINE_PIERCE') {
			// Line pierce towards target
			const angle = Math.atan2(targetY - startY, targetX - startX);
			this.projectiles.push({
				id: `p_${Date.now()}_${Math.random()}`,
				x: spawnX,
				y: spawnY,
				targetX: startX + Math.cos(angle) * 300,
				targetY: startY + Math.sin(angle) * 300,
				speed: master.projectileSpeed * 40 * projSpeedMult,
				damage: baseDmg,
				sourcePlayerId: player.id,
				sourceUnitId: unit.unitId,
				unitMaster: master,
				color: master.themeColor,
				type: 'LINE_PIERCE',
				pierceAngle: angle,
				maxDistance: 260,
				traveledDistance: 0,
				hitMonsterIds: [],
				hitBoss: false
			});
			return;
		}

		if (master.attackType === 'MULTI_CHAIN') {
			// Chain laser: 4 targets for T3, 6 targets for HIDDEN_QUANTUM_ERASER
			const maxTargets = master.id === 'HIDDEN_QUANTUM_ERASER' ? 6 : 4;
			const effectiveRange = master.range * (unit.isWarped ? 9999 : 1.25);
			const inRange = player.monsters
				.filter((m) => effectiveRange >= 9000 || Math.hypot(m.x - startX, m.y - startY) <= effectiveRange)
				.sort((a, b) => b.angle - a.angle);
			const targets = inRange.slice(0, maxTargets);
			for (const t of targets) {
				this.applyDamageToMonster(player, t, baseDmg, isCrit, master);
				this.createLaserBeam(spawnX, spawnY, t.x, t.y, master.themeColor);
			}
			if (targetWrap?.type === 'boss' && this.boss) {
				this.applyDamageToBoss(baseDmg, isCrit, master);
				this.createLaserBeam(spawnX, spawnY, this.boss.x, this.boss.y, master.themeColor);
			}
			return;
		}

		if (master.attackType === 'AOE_AURA') {
			const isBlackhole = master.id === 'HIDDEN_BSOD_WHEEL';

			// If attacking boss (e.g. warped in boss chamber)
			if (targetWrap?.type === 'boss' && this.boss) {
				const bx = this.boss.x;
				const by = this.boss.y;
				// Blackhole Spinner deals 3x damage to Boss
				this.applyDamageToBoss(isBlackhole ? baseDmg * 3 : baseDmg, isCrit, master);
				this.createParticles(bx, by, master.themeColor, 6);
				return;
			}

			// Localized surrounding aura on field monsters (T3 Spinner, T4 Console, T4 Wheel, Blackhole Spinner, Cheat Engine)
			const radius = master.range;
			const isCheatEngine = master.id === 'HIDDEN_DEBUG_CONSOLE';

			let triggerTimeStop = false;
			if (isBlackhole) {
				unit.skillCooldown = (unit.skillCooldown || 0) + 1;
				triggerTimeStop = (unit.skillCooldown || 0) >= 17; // ~6 seconds (0.35s * 17)
				if (triggerTimeStop) {
					unit.skillCooldown = 0;
					if (isP1) {
						sound.playLegendary();
					}
				}
			}

			for (const m of player.monsters) {
				const dist = Math.hypot(m.x - startX, m.y - startY);
				if (dist <= radius) {
					if (master.id === 'T3_SPINNER') {
						this.applyDamageToMonster(player, m, baseDmg, isCrit, master);
						m.slowRate = 0.45;
						m.slowDuration = 1.5;
						m.hitCount = (m.hitCount || 0) + 1;
						if (m.hitCount >= 4) {
							m.hitCount = 0;
							m.stunDuration = 1.8;
						}
					} else if (master.id === 'T4_WHEEL') {
						this.applyDamageToMonster(player, m, baseDmg, isCrit, master);
						m.slowRate = 0.35;
						m.slowDuration = 1.0;
					} else if (isBlackhole) {
						this.applyDamageToMonster(player, m, baseDmg, isCrit, master);
						m.slowRate = 0.5;
						m.slowDuration = 1.0;
						if (triggerTimeStop) {
							m.stunDuration = 1.2;
						}
					} else if (master.id === 'T4_CONSOLE') {
						m.armorDownRate = 0.5;
						m.armorDownDuration = 2.0;
						m.damageAmpRate = 0.3;
						m.damageAmpDuration = 2.0;
						this.applyDamageToMonster(player, m, baseDmg, false, master);
					} else if (isCheatEngine) {
						m.armorDownRate = 0.7;
						m.armorDownDuration = 2.5;
						m.damageAmpRate = 0.5;
						m.damageAmpDuration = 2.5;
						this.applyDamageToMonster(player, m, baseDmg, true, master);
					}
				}
			}
			return;
		}

		// Single / Splash / Sniper / Knockback projectile
		this.projectiles.push({
			id: `p_${Date.now()}_${Math.random()}`,
			x: spawnX,
			y: spawnY,
			targetX: target.x,
			targetY: target.y,
			targetMonsterId: targetWrap.type === 'monster' ? target.id : undefined,
			speed: master.projectileSpeed * 40 * projSpeedMult,
			damage: baseDmg,
			sourcePlayerId: player.id,
			sourceUnitId: unit.unitId,
			unitMaster: master,
			color: master.themeColor,
			type: master.attackType,
			isCrit,
			splashRadius: master.attackType === 'AOE_SPLASH' ? 70 : undefined
		});
	}

	private updateProjectiles(dt: number) {
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const p = this.projectiles[i];

			if (p.type === 'LINE_PIERCE') {
				const moveDist = p.speed * dt;
				p.traveledDistance = (p.traveledDistance || 0) + moveDist;
				p.x += Math.cos(p.pierceAngle || 0) * moveDist;
				p.y += Math.sin(p.pierceAngle || 0) * moveDist;

				// Check hit monsters along path (at most once per monster)
				const ownerPlayer = p.sourcePlayerId === 'p2' ? this.p2 : this.p1;
				const monsters = [...this.p1.monsters, ...this.p2.monsters];
				if (!p.hitMonsterIds) p.hitMonsterIds = [];
				for (const m of monsters) {
					if (!p.hitMonsterIds.includes(m.id) && Math.hypot(m.x - p.x, m.y - p.y) < m.size + 10) {
						p.hitMonsterIds.push(m.id);
						this.applyDamageToMonster(ownerPlayer, m, p.damage, p.isCrit || false, p.unitMaster);
					}
				}

				// Check hit boss (at most once per projectile)
				if (this.boss && !p.hitBoss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < 65) {
					p.hitBoss = true;
					this.applyDamageToBoss(p.damage, p.isCrit || false, p.unitMaster);
				}

				if (p.traveledDistance >= (p.maxDistance || 260)) {
					this.projectiles.splice(i, 1);
				}
				continue;
			}

			// Standard tracking / homing projectile
			const dx = p.targetX - p.x;
			const dy = p.targetY - p.y;
			const dist = Math.hypot(dx, dy);
			const step = p.speed * dt;

			if (dist <= step || dist < 8) {
				// Hit target!
				this.onProjectileHit(p);
				this.projectiles.splice(i, 1);
			} else {
				p.x += (dx / dist) * step;
				p.y += (dy / dist) * step;
			}
		}
	}

	private onProjectileHit(p: Projectile) {
		// Create hit particle
		this.createParticles(p.targetX, p.targetY, p.color, 6);

		// If hit boss
		if (!p.targetMonsterId && this.boss) {
			this.applyDamageToBoss(p.damage, p.isCrit || false, p.unitMaster);
			return;
		}

		// Find monster & determine owner player
		const ownerPlayer = p.sourcePlayerId === 'p2' ? this.p2 : this.p1;
		const allMonsters = [...this.p1.monsters, ...this.p2.monsters];
		const targetMonster = allMonsters.find((m) => m.id === p.targetMonsterId);

		if (p.type === 'AOE_BOX') {
			const boxW = 80;
			const boxH = 50;
			for (const m of allMonsters) {
				if (Math.abs(m.x - p.targetX) <= boxW / 2 && Math.abs(m.y - p.targetY) <= boxH / 2) {
					this.applyDamageToMonster(ownerPlayer, m, p.damage, p.isCrit || false, p.unitMaster);
				}
			}
			this.createParticles(p.targetX, p.targetY, p.color, 8);
			return;
		}

		if (p.type === 'AOE_SPLASH') {
			const radius = p.splashRadius || 70;
			for (const m of allMonsters) {
				if (Math.hypot(m.x - p.targetX, m.y - p.targetY) <= radius) {
					this.applyDamageToMonster(ownerPlayer, m, p.damage, p.isCrit || false, p.unitMaster);
					m.slowRate = 0.3;
					m.slowDuration = 2.5;
				}
			}
			return;
		}

		if (targetMonster) {
			this.applyDamageToMonster(ownerPlayer, targetMonster, p.damage, p.isCrit || false, p.unitMaster);

			// Tier-Scaled Impact FX
			if (p.unitMaster.tier >= 3) {
				if (p.unitMaster.id === 'T3_SNIPER') {
					this.createShockwave(p.targetX, p.targetY, '#C084FC', 24, 0.3);
				} else if (p.unitMaster.id === 'T4_ADMIN') {
					this.createShockwave(p.targetX, p.targetY, '#FBBF24', 28, 0.35);
				} else if (p.unitMaster.id === 'HIDDEN_ROOT_ADMIN') {
					this.createPixelCubes(p.targetX, p.targetY, '#F59E0B', 6);
				}
			}

			// Knockback
			if (p.type === 'KNOCKBACK') {
				targetMonster.angle -= 0.16;
			}
		}
	}

	public applyDamageToMonster(
		player: PlayerState,
		m: Monster,
		damage: number,
		isCrit: boolean,
		master: UnitMaster
	) {
		if (m.isDead) return;

		// Defense reduction (50% Pierce for T3 Sniper, 100% Pierce for Tier 5 Mythic Units)
		let effectiveDef = m.defense * (1 - m.armorDownRate);
		if (master.id === 'T3_SNIPER') {
			effectiveDef = Math.round(effectiveDef * 0.5);
		} else if (master.tier === 5) {
			effectiveDef = 0;
		}

		let finalDmg = Math.max(1, Math.round(damage - effectiveDef));

		// Damage amp
		if (m.damageAmpRate > 0) {
			finalDmg = Math.round(finalDmg * (1 + m.damageAmpRate));
		}

		// Magic wand % HP & Execute
		if (master.id === 'T4_MAGICWAND') {
			finalDmg += Math.round(m.hp * 0.03);
			if (m.hp / m.maxHp <= 0.18) {
				finalDmg = m.hp; // Execute!
			}
		} else if (master.id === 'HIDDEN_QUANTUM_ERASER') {
			// Quantum Eraser: 5% current HP damage + 25% execute & bonus gold
			finalDmg += Math.round(m.hp * 0.05);
			if (m.hp / m.maxHp <= 0.25) {
				finalDmg = m.hp;
				player.gold += 2;
				this.addFloatingText(m.x, m.y - 15, '+2 Byte', '#FACC15', 13);
			}
		}

		// Denied armor down
		if (master.id === 'T3_DENIED') {
			m.armorDownRate = 0.35;
			m.armorDownDuration = 5.0;
		}

		m.hp -= finalDmg;

		this.addDamageFloatingText(
			m.x,
			m.y - 12,
			`${isCrit ? '💥 ' : ''}${finalDmg}`,
			master.tier === 5 ? master.themeColor : isCrit ? '#F59E0B' : '#FFFFFF',
			master.tier === 5 ? 17 : isCrit ? 15 : 11
		);

		if (m.hp <= 0) {
			m.isDead = true;

			// Base kill reward: 1 Byte + (round / 30)
			let killReward = 1 + Math.floor(this.stats.currentRound / 30);

			// Lucky Byte & Jackpot System (5% chance total)
			const rand = Math.random();
			let isJackpot = false;
			let isLucky = false;

			if (rand < 0.005) {
				// 0.5% Jackpot: +25 Byte
				killReward += 25;
				isJackpot = true;
				this.addFloatingText(m.x, m.y - 20, '+25 Byte', '#FFD700', 15);
				if (player.id === 'p1') sound.playLegendary();
			} else if (rand < 0.05) {
				// 4.5% Lucky Byte: +5 Byte
				killReward += 5;
				isLucky = true;
				this.addFloatingText(m.x, m.y - 18, '+5 Byte', '#FBBF24', 13);
				if (player.id === 'p1') sound.playCrit();
			}

			player.gold += killReward;
			this.createByteAbsorptionEffect(m.x, m.y, player.id, isJackpot ? 6 : isLucky ? 4 : 2);
			this.createParticles(m.x, m.y, isJackpot ? '#FFD700' : isLucky ? '#FBBF24' : m.color, isJackpot ? 12 : 6);
		}
	}

	public applyDamageToBoss(damage: number, isCrit: boolean, master: UnitMaster) {
		if (!this.boss) return;

		const bx = this.boss.x;
		const by = this.boss.y;

		// 1. 3-Way Attribute Multiplier (BIT > SEC > NET > BIT)
		const bossAttr = this.boss.master.attribute;
		const unitAttr = master.attribute;
		const attrMult = unitAttr && bossAttr && ATTRIBUTE_CHART[unitAttr] ? (ATTRIBUTE_CHART[unitAttr][bossAttr] ?? 1.0) : 1.0;

		// 2. Tier Boss Damage Scaling (Anti-overcrowding)
		const tierRate = TIER_BOSS_SCALING[master.tier] ?? 1.0;
		const rawBossDmg = damage * attrMult * tierRate;

		// 3. Defense calculation (T3_SNIPER 50% pierce, Tier 5 Mythic 100% pierce)
		let effectiveDef = this.boss.defense;
		if (master.id === 'T3_SNIPER') {
			effectiveDef = Math.round(this.boss.defense * 0.5);
		} else if (master.tier === 5) {
			effectiveDef = 0;
		}

		// Tier 4 Boss Floor Damage (25% minimum floor to prevent multi-hit rapid 1-damage stall)
		let baseDmg = Math.round(rawBossDmg - effectiveDef);
		if (master.tier === 4) {
			baseDmg = Math.max(Math.round(rawBossDmg * 0.25), baseDmg);
		}
		let finalDmg = Math.max(1, baseDmg);

		// 4. Rate-Limiting Armor (Multi-Hit Dampening per 0.25s window)
		const threshold = this.boss.master.hitLimitThreshold ?? 6;
		const dampening = this.boss.master.hitDampeningRate ?? 0.75;
		this.boss.recentHitCount = (this.boss.recentHitCount || 0) + 1;
		if (this.boss.recentHitCount > threshold) {
			finalDmg = Math.max(1, Math.round(finalDmg * (1 - dampening)));
		}

		// Tier 5 Mythic Boss Special Damage
		if (master.id === 'HIDDEN_QUANTUM_ERASER') {
			// Quantum Eraser: +0.4% Boss Max HP true damage per hit
			finalDmg += Math.round(this.boss.maxHp * 0.004);
		} else if (master.id === 'HIDDEN_DEBUG_CONSOLE') {
			// Cheat Engine: +0.3% Boss Max HP true decay damage per hit + 50% amp
			finalDmg = Math.round((finalDmg + this.boss.maxHp * 0.003) * 1.5);
		}

		// 80R Y2K Final Phase Hyper Armor (30% Damage Reduction)
		if (this.boss.master.id === 'BOSS_80R' && this.boss.formatCountdown !== undefined) {
			finalDmg = Math.max(1, Math.round(finalDmg * 0.7));
		}

		// Shield absorbs damage first
		if (this.boss.shield > 0) {
			if (this.boss.shield >= finalDmg) {
				this.boss.shield -= finalDmg;
				this.addFloatingText(bx, by - 20, `🛡️ -${finalDmg}`, '#38BDF8', 14);
				return;
			} else {
				finalDmg -= this.boss.shield;
				this.boss.shield = 0;
			}
		}

		this.boss.hp -= finalDmg;
		this.addDamageFloatingText(
			bx,
			by - 20,
			`${isCrit ? '💥 ' : ''}${finalDmg}`,
			isCrit ? '#F59E0B' : '#FFFFFF',
			isCrit ? 18 : 13
		);

		if (this.boss.hp <= 0) {
			// Boss defeated!
			sound.playVictory();
			let reward = this.boss.master.rewardGold;
			const isSpeedKill = this.boss.timeLeft >= 30; // Defeated within 30s of 60s
			if (isSpeedKill) {
				reward = Math.round(reward * 1.5);
			}

			this.p1.gold += reward;
			if (this.stats.gameMode !== 'SOLO') this.p2.gold += reward;

			// Stream magnetic reward bytes to player inventory
			this.createByteAbsorptionEffect(bx, by, 'p1', 10);
			if (this.stats.gameMode !== 'SOLO') {
				this.createByteAbsorptionEffect(bx, by, 'p2', 10);
			}

			this.addFloatingText(
				bx,
				by,
				`🎉 BOSS CLEAR! +${reward} Byte${isSpeedKill ? ' (⚡ 쾌속처치 1.5배!)' : ''}`,
				'#10B981',
				20
			);

			this.boss = null;
			this.popups = [];

			// Warped units remain in boss chamber unless recalled by player

			if (this.stats.currentRound >= this.stats.maxRound) {
				this.triggerGameWin();
			} else {
				this.finishRound();
			}
		}
	}

	private updateAi(dt: number) {
		this.aiActionTimer += dt;
		if (this.aiActionTimer < 1.0) return;
		this.aiActionTimer = 0;

		// AI Boss Warp Management (Automatically keep top 5 strongest units deployed in boss room)
		if (this.boss) {
			const activeUnits = this.p2.slots
				.filter((s) => s.unit !== null)
				.map((s) => ({
					slotIndex: s.index,
					unit: s.unit!,
					tier: UNITS_MASTER[s.unit!.unitId]?.tier || 1,
					damage: UNITS_MASTER[s.unit!.unitId]?.damage || 0
				}));

			activeUnits.sort((a, b) => (b.tier !== a.tier ? b.tier - a.tier : b.damage - a.damage));
			const top5Slots = new Set(activeUnits.slice(0, 5).map((u) => u.slotIndex));

			for (const s of this.p2.slots) {
				if (s.unit) {
					s.unit.isWarped = top5Slots.has(s.index);
				}
			}
		} else {
			for (const s of this.p2.slots) {
				if (s.unit?.isWarped) {
					s.unit.isWarped = false;
				}
			}
		}

		// AI Gacha Overclock Upgrade logic
		if (this.p2.gachaLevel < 10) {
			const upgradeCost = this.getGachaUpgradeCost(this.p2);
			if (upgradeCost !== null && this.p2.gold >= upgradeCost + 70) {
				this.upgradeGacha(this.p2);
				return;
			}
		}

		const cost = this.getSummonCost(this.p2);
		const emptySlots = this.p2.slots.filter((s) => s.unit === null);

		// AI Summon logic
		if (this.p2.gold >= cost && emptySlots.length > 0) {
			this.summonUnit(this.p2);
			return;
		}

		// AI Merge logic: find 2 matching units
		const units = this.p2.slots.filter((s) => s.unit !== null);
		for (let i = 0; i < units.length; i++) {
			for (let j = i + 1; j < units.length; j++) {
				const u1 = units[i].unit!;
				const u2 = units[j].unit!;
				if (u1.unitId === u2.unitId) {
					const master = UNITS_MASTER[u1.unitId];
					if (master && master.tier < 5) {
						this.mergeUnits(this.p2, units[i].index, units[j].index);
						return;
					}
				}
			}
		}

		// AI Merge fallback: if board is crowded (>= 10 units), merge any two Tier 4 units
		if (units.length >= 10) {
			const t4Slots = units.filter((s) => UNITS_MASTER[s.unit!.unitId]?.tier === 4);
			if (t4Slots.length >= 2) {
				this.mergeUnits(this.p2, t4Slots[0].index, t4Slots[1].index);
				return;
			}
		}
	}

	private updateVisuals(dt: number) {
		// Floating texts
		for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
			const ft = this.floatingTexts[i];
			ft.life -= dt * 1.5;
			ft.x += ft.vx * dt;
			ft.y += ft.vy * dt;
			if (ft.life <= 0) {
				this.floatingTexts.splice(i, 1);
			}
		}

		// Particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const pt = this.particles[i];
			pt.life -= dt;

			// Magnetic Homing Physics (Byte Absorption into RAM Box)
			if (pt.isHoming && pt.targetX !== undefined && pt.targetY !== undefined) {
				const dx = pt.targetX - pt.x;
				const dy = pt.targetY - pt.y;
				const dist = Math.hypot(dx, dy);

				if (dist < 32 || pt.life <= 0.05) {
					// Absorbed into RAM inventory! Sparkle burst at destination
					this.createParticles(pt.targetX, pt.targetY - 10, '#fbbf24', 2);
					this.particles.splice(i, 1);
					continue;
				}

				// Accelerates smoothly as it nears the RAM box (up to 950px/s)
				const progress = 1 - Math.max(0, pt.life / pt.maxLife);
				const homeSpeed = 160 + progress * 780;

				const targetVx = (dx / dist) * homeSpeed;
				const targetVy = (dy / dist) * homeSpeed;

				pt.vx += (targetVx - pt.vx) * Math.min(1, dt * 12);
				pt.vy += (targetVy - pt.vy) * Math.min(1, dt * 12);
			}

			if (pt.shape !== 'line') {
				pt.x += pt.vx * dt;
				pt.y += pt.vy * dt;
			}

			if (pt.life <= 0) {
				this.particles.splice(i, 1);
			}
		}
	}

	public createSummonEffect(x: number, y: number, color: string, tier: number = 1) {
		if (tier === 4) {
			// ===============================================
			// 👑 TIER 4 LEGENDARY AWAKENING MEGA VFX 👑
			// ===============================================
			// 1. Triple Supernova Shockwave Rings
			this.particles.push({
				x, y, vx: 0, vy: 0,
				color: '#f59e0b', size: 24, life: 0.7, maxLife: 0.7, shape: 'ring'
			});
			this.particles.push({
				x, y, vx: 0, vy: 0,
				color: '#ffffff', size: 14, life: 0.55, maxLife: 0.55, shape: 'ring'
			});
			this.particles.push({
				x, y, vx: 0, vy: 0,
				color: '#ec4899', size: 30, life: 0.85, maxLife: 0.85, shape: 'ring'
			});

			// 2. Dual Counter-Rotating Holy Gates
			this.particles.push({
				x, y, vx: 0, vy: 0,
				color: '#fbbf24', size: 40, life: 0.65, maxLife: 0.65, shape: 'hex'
			});
			this.particles.push({
				x, y, vx: 0, vy: 0,
				color: '#38bdf8', size: 24, life: 0.5, maxLife: 0.5, shape: 'hex'
			});

			// 3. 8 Radial Golden Laser Beams
			for (let i = 0; i < 8; i++) {
				const a = (i * Math.PI * 2) / 8;
				const len = 90;
				this.createLaserBeam(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, '#fbbf24');
			}

			// 4. 12 Ascending Mythic Gold Runes
			const mythicSymbols = ['👑', '★', 'MAX', '✦', '👑', '⚡', '999', '✦', '★', '👑', 'MAX', '✦'];
			for (let i = 0; i < 12; i++) {
				const sym = mythicSymbols[i];
				const offsetX = (Math.random() - 0.5) * 36;
				this.particles.push({
					x: x + offsetX,
					y: y + (Math.random() * 14 - 7),
					vx: (Math.random() - 0.5) * 30,
					vy: -55 - Math.random() * 65,
					color: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
					size: 13,
					life: 0.6 + Math.random() * 0.3,
					maxLife: 0.9,
					shape: 'matrix',
					text: sym
				});
			}
			return;
		}

		// Standard Tier 1~3 Summon Effect
		// 1. Dual Concentric Expanding Shockwave Rings
		this.particles.push({
			x,
			y,
			vx: 0,
			vy: 0,
			color: color || '#38bdf8',
			size: 14,
			life: 0.45,
			maxLife: 0.45,
			shape: 'ring'
		});
		this.particles.push({
			x,
			y,
			vx: 0,
			vy: 0,
			color: '#ffffff',
			size: 8,
			life: 0.32,
			maxLife: 0.32,
			shape: 'ring'
		});

		// 2. Rotating Cyber Hexagon Gateway
		this.particles.push({
			x,
			y,
			vx: 0,
			vy: 0,
			color: color || '#38bdf8',
			size: 26,
			life: 0.42,
			maxLife: 0.42,
			shape: 'hex'
		});

		// 3. Rising Cyber Data Bits / Matrix Characters
		const symbols = ['1', '0', '✦', '▲', '⚡', '◆', '1', '0'];
		for (let i = 0; i < 6; i++) {
			const sym = symbols[Math.floor(Math.random() * symbols.length)];
			const offsetX = (Math.random() - 0.5) * 24;
			this.particles.push({
				x: x + offsetX,
				y: y + (Math.random() * 10 - 5),
				vx: (Math.random() - 0.5) * 20,
				vy: -40 - Math.random() * 45,
				color: Math.random() > 0.5 ? '#38bdf8' : '#4ade80',
				size: 11,
				life: 0.45 + Math.random() * 0.25,
				maxLife: 0.7,
				shape: 'matrix',
				text: sym
			});
		}
	}

	public pushParticle(p: Particle) {
		if (this.particles.length >= 120) {
			const idx = this.particles.findIndex((pt) => !pt.isHoming);
			if (idx !== -1) {
				this.particles.splice(idx, 1);
			} else {
				this.particles.shift();
			}
		}
		this.particles.push(p);
	}

	public pushFloatingText(ft: FloatingText) {
		if (this.floatingTexts.length >= 35) {
			this.floatingTexts.shift();
		}
		this.floatingTexts.push(ft);
	}

	public createParticles(x: number, y: number, color: string, count: number) {
		const cappedCount = Math.min(count, 8);
		for (let i = 0; i < cappedCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 30 + Math.random() * 80;
			this.pushParticle({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				color,
				size: 2 + Math.random() * 3,
				life: 0.35 + Math.random() * 0.25,
				maxLife: 0.6
			});
		}
	}

	public createLaserBeam(x1: number, y1: number, x2: number, y2: number, color: string, life = 0.11) {
		this.pushParticle({
			x: x1,
			y: y1,
			vx: 0,
			vy: 0,
			targetX: x2,
			targetY: y2,
			color,
			size: 2,
			life: life,
			maxLife: life,
			shape: 'line'
		});
	}

	public createShockwave(x: number, y: number, color: string, size = 18, life = 0.35) {
		this.pushParticle({
			x,
			y,
			vx: 0,
			vy: 0,
			color,
			size,
			life,
			maxLife: life,
			shape: 'shockwave'
		});
	}

	public createPixelCubes(x: number, y: number, color: string, count = 8) {
		const cappedCount = Math.min(count, 6);
		for (let i = 0; i < cappedCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 25 + Math.random() * 60;
			this.pushParticle({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 20,
				color,
				size: 4 + Math.random() * 4,
				life: 0.45 + Math.random() * 0.25,
				maxLife: 0.7,
				shape: 'pixel_cube'
			});
		}
	}

	public createGlitchBurst(x: number, y: number, color: string, count = 5) {
		const cappedCount = Math.min(count, 4);
		for (let i = 0; i < cappedCount; i++) {
			this.pushParticle({
				x: x + (Math.random() - 0.5) * 30,
				y: y + (Math.random() - 0.5) * 20,
				vx: (Math.random() - 0.5) * 40,
				vy: (Math.random() - 0.5) * 10,
				color,
				size: 10 + Math.random() * 15,
				life: 0.2 + Math.random() * 0.15,
				maxLife: 0.35,
				shape: 'glitch'
			});
		}
	}

	public addFloatingText(x: number, y: number, text: string, color: string, fontSize = 13) {
		this.pushFloatingText({
			id: `ft_${Date.now()}_${Math.random()}`,
			x,
			y,
			text,
			color,
			fontSize,
			life: 0.85,
			vx: (Math.random() - 0.5) * 10,
			vy: -35
		});
	}

	public addDamageFloatingText(x: number, y: number, text: string, color: string, fontSize = 12) {
		const spreadX = (Math.random() - 0.5) * 16;
		this.pushFloatingText({
			id: `ft_${Date.now()}_${Math.random()}`,
			x: x + spreadX,
			y: y,
			text,
			color,
			fontSize,
			life: 0.45,
			vx: spreadX * 0.8,
			vy: -48
		});
	}

	public createByteAbsorptionEffect(fromX: number, fromY: number, playerId: 'p1' | 'p2', amount: number = 1) {
		const targetX = playerId === 'p2' ? 1020 : 260;
		const targetY = 338;
		const count = Math.min(Math.max(1, amount), 3);

		for (let i = 0; i < count; i++) {
			const spreadAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.8;
			const burstSpeed = 45 + Math.random() * 55;
			this.pushParticle({
				x: fromX + (Math.random() - 0.5) * 8,
				y: fromY + (Math.random() - 0.5) * 8,
				vx: Math.cos(spreadAngle) * burstSpeed,
				vy: Math.sin(spreadAngle) * burstSpeed,
				color: '#fbbf24',
				size: 8,
				life: 0.75,
				maxLife: 0.75,
				shape: 'byte',
				targetX,
				targetY,
				isHoming: true
			});
		}
	}

	public closePopup(id: string) {
		this.popups = this.popups.filter((p) => p.id !== id);
		this.notifyChange();
	}

	private triggerGameOver(reason: string) {
		this.stats.isGameOver = true;
		sound.playGameOver();
		if (this.onGameOver) this.onGameOver(reason);
		this.notifyChange();
	}

	private triggerGameWin() {
		this.stats.isGameOver = true;
		this.stats.isGameWon = true;
		sound.playVictory();
		if (this.onGameWin) this.onGameWin();
		this.notifyChange();
	}

	public getSnapshot() {
		return {
			p1: {
				gold: this.p1.gold,
				summonCount: this.p1.summonCount,
				slots: this.p1.slots.map((s) => ({
					index: s.index,
					unit: s.unit ? { ...s.unit } : null
				})),
				monsters: this.p1.monsters.map((m) => ({ ...m }))
			},
			p2: {
				gold: this.p2.gold,
				summonCount: this.p2.summonCount,
				slots: this.p2.slots.map((s) => ({
					index: s.index,
					unit: s.unit ? { ...s.unit } : null
				})),
				monsters: this.p2.monsters.map((m) => ({ ...m }))
			},
			boss: this.boss ? { ...this.boss } : null,
			stats: { ...this.stats },
			totalToSpawn: this.totalToSpawn,
			spawnedCountP1: this.spawnedCountP1,
			spawnedCountP2: this.spawnedCountP2,
			bossWarningTimer: this.bossWarningTimer,
			bossWarningName: this.bossWarningName,
			popups: this.popups.slice(0, 10).map((p) => ({ ...p })),
			projectiles: this.projectiles.slice(0, 30).map((p) => ({ ...p })),
			particles: this.particles.slice(0, 25).map((pt) => ({ ...pt })),
			floatingTexts: this.floatingTexts.slice(0, 15).map((f) => ({ ...f }))
		};
	}

	public applySnapshot(snap: any) {
		if (!snap || !snap.p1 || !snap.p2) return;
		this.p1.gold = snap.p1.gold;
		this.p1.summonCount = snap.p1.summonCount;
		for (let i = 0; i < this.p1.slots.length; i++) {
			this.p1.slots[i].unit = snap.p1.slots[i]?.unit ? { ...snap.p1.slots[i].unit } : null;
		}
		this.p1.monsters = snap.p1.monsters || [];

		this.p2.gold = snap.p2.gold;
		this.p2.summonCount = snap.p2.summonCount;
		for (let i = 0; i < this.p2.slots.length; i++) {
			this.p2.slots[i].unit = snap.p2.slots[i]?.unit ? { ...snap.p2.slots[i].unit } : null;
		}
		this.p2.monsters = snap.p2.monsters || [];

		this.boss = snap.boss ? { ...snap.boss } : null;
		this.stats = { ...snap.stats };
		this.totalToSpawn = snap.totalToSpawn;
		this.spawnedCountP1 = snap.spawnedCountP1;
		this.spawnedCountP2 = snap.spawnedCountP2;
		this.bossWarningTimer = snap.bossWarningTimer;
		this.bossWarningName = snap.bossWarningName;
		this.popups = snap.popups || [];
		this.projectiles = snap.projectiles || [];
		this.particles = snap.particles || [];
		this.floatingTexts = snap.floatingTexts || [];

		this.notifyChange();
	}

	public notifyChange() {
		if (this.onStateChange) this.onStateChange();
	}
}
