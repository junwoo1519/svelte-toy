import { GameEngine } from '$lib/engine/GameEngine';
import type { GameMode, UnitMaster } from '$lib/types/game';
import { UNITS_MASTER } from '$lib/data/units';
import { sound } from '$lib/engine/SoundManager';
import { multiplayer, type NetworkAction } from '$lib/network/MultiplayerManager';

class GameStore {
	public engine: GameEngine;
	public gameMode = $state<GameMode>('SOLO');
	public p1Gold = $state(150);
	public p1SummonCost = $state(50);
	public canSummonP1 = $state(true);

	public p2Gold = $state(150);
	public p2SummonCost = $state(50);
	public canSummonP2 = $state(false);

	// Legacy aliases
	public summonCost = $state(50);
	public canSummon = $state(true);
	public p1MonsterCount = $state(0);
	public p2MonsterCount = $state(0);
	public currentRound = $state(1);
	public roundTimeLeft = $state(25);
	public isBossRound = $state(false);
	public isGameOver = $state(false);
	public isGameWon = $state(false);
	public gameSpeed = $state(1);
	public isPaused = $state(false);
	public isGuideOpen = $state(false);
	public isModeSelectOpen = $state(true);
	public gameOverReason = $state<string | null>(null);

	// Multiplayer network state
	public netRole = $state<'p1' | 'p2' | null>(null);
	public netRoomId = $state<string | null>(null);
	public netError = $state<string | null>(null);
	public isWaitingForGuest = $state(false);

	// Selected unit
	public selectedSlotIndex = $state<number | null>(null);
	public selectedUnit = $state<UnitMaster | null>(null);
	public refundAmount = $state(0);

	// BIOS Gacha Overclock state
	public p1GachaLevel = $state(1);
	public p2GachaLevel = $state(1);
	public p1GachaUpgradeCost = $state<number | null>(180);
	public p2GachaUpgradeCost = $state<number | null>(180);
	public canUpgradeGachaP1 = $state(false);
	public canUpgradeGachaP2 = $state(false);

	constructor() {
		this.engine = new GameEngine('SOLO');
		this.engine.stats.isPaused = true;
		this.initEngine('SOLO', true);
		this.setupMultiplayer();
	}

	private setupMultiplayer() {
		multiplayer.onStatusChange = () => {
			this.netRoomId = multiplayer.roomId;
			this.netRole = multiplayer.role;
			this.netError = multiplayer.errorMessage;
			this.sync();
		};

		multiplayer.onStartGame = (role, roomId) => {
			this.netRole = role;
			this.netRoomId = roomId;
			this.netError = null;
			this.isWaitingForGuest = false;
			this.isModeSelectOpen = false;

			// Initialize as ONLINE_COOP
			this.initEngine('ONLINE_COOP', false);
			console.log(`[🚀 Game Started] ONLINE_COOP as ${role} in Room #${roomId}`);
		};

		multiplayer.onP2Action = (action: NetworkAction) => {
			if (this.netRole === 'p1') {
				// Host applies P2 action to P2 player state
				switch (action.type) {
					case 'SUMMON':
						this.engine.summonUnit(this.engine.p2);
						break;
					case 'MERGE':
						if (action.fromSlot !== undefined && action.toSlot !== undefined) {
							this.engine.mergeUnits(this.engine.p2, action.fromSlot, action.toSlot);
						}
						break;
					case 'SELL':
						if (action.slotIndex !== undefined) {
							this.engine.sellUnit(this.engine.p2, action.slotIndex);
						}
						break;
					case 'TOGGLE_WARP':
						if (action.slotIndex !== undefined) {
							this.engine.toggleUnitWarp(this.engine.p2, action.slotIndex);
						}
						break;
					case 'UPGRADE_GACHA':
						this.engine.upgradeGacha(this.engine.p2);
						break;
				}
				this.sync();
				// Immediately push authoritative state snapshot to guest
				multiplayer.sendGameSync(this.engine.getSnapshot());
			}
		};

		multiplayer.onStateSync = (snapshot: any) => {
			if (this.netRole === 'p2') {
				this.engine.applySnapshot(snapshot);
			}
		};

		multiplayer.onPartnerDisconnected = (message: string) => {
			this.gameOverReason = message;
			this.netError = message;
			this.sync();
		};
	}

	public initEngine(mode: GameMode, pausedOnStart: boolean = false) {
		this.gameMode = mode;
		this.gameOverReason = null;
		this.engine = new GameEngine(mode);
		this.engine.stats.isPaused = pausedOnStart;

		this.engine.onStateChange = () => {
			this.sync();
		};

		this.engine.onGameOver = (reason: string) => {
			this.gameOverReason = reason;
			this.sync();
		};

		this.engine.onGameWin = () => {
			this.gameOverReason = '축하합니다! 전설의 80라운드를 모두 정복하고 Y2K 밀레니엄 버그를 완벽히 격퇴했습니다!';
			this.sync();
		};

		this.sync();
	}

	public startGame(mode: GameMode) {
		this.isModeSelectOpen = false;
		this.netRole = null;
		this.netRoomId = null;
		this.netError = null;
		this.isWaitingForGuest = false;
		this.initEngine(mode, false);
	}

	public startOnlineHost() {
		this.netError = null;
		this.isWaitingForGuest = true;
		multiplayer.createRoom();
	}

	public joinOnlineGuest(roomId: string) {
		this.netError = null;
		multiplayer.joinRoom(roomId);
	}

	public openModeSelect() {
		this.engine.stats.isPaused = true;
		this.isModeSelectOpen = true;
		this.sync();
	}

	public summonP1() {
		if (this.gameMode === 'ONLINE_COOP' && this.netRole === 'p2') {
			return; // Guest cannot summon for Host
		}
		sound.playSummon();
		this.engine.summonUnit(this.engine.p1);
		this.sync();
	}

	public summonP2() {
		if (this.gameMode === 'SOLO') return;

		if (this.gameMode === 'ONLINE_COOP') {
			if (this.netRole === 'p2') {
				sound.playSummon();
				multiplayer.sendP2Action({ type: 'SUMMON' });
			} else {
				this.engine.summonUnit(this.engine.p2);
			}
		} else {
			// AI Co-op
			this.engine.summonUnit(this.engine.p2);
		}
		this.sync();
	}

	public summon() {
		if (this.engine.stats.gameMode === 'ONLINE_COOP' && this.netRole === 'p2') {
			this.summonP2();
		} else {
			this.summonP1();
		}
	}

	public sell() {
		if (this.selectedSlotIndex !== null) {
			if (this.engine.stats.gameMode === 'ONLINE_COOP' && this.netRole === 'p2') {
				multiplayer.sendP2Action({ type: 'SELL', slotIndex: this.selectedSlotIndex });
			} else {
				const targetPlayer = this.engine.selectedSlot?.player === 'p2' ? this.engine.p2 : this.engine.p1;
				this.engine.sellUnit(targetPlayer, this.selectedSlotIndex);
				this.sync();
			}
		}
	}

	public upgradeGachaP1() {
		if (this.gameMode === 'ONLINE_COOP' && this.netRole === 'p2') return;
		this.engine.upgradeGacha(this.engine.p1);
		this.sync();
	}

	public upgradeGachaP2() {
		if (this.gameMode === 'SOLO') return;
		if (this.gameMode === 'ONLINE_COOP') {
			if (this.netRole === 'p2') {
				multiplayer.sendP2Action({ type: 'UPGRADE_GACHA' });
			} else {
				this.engine.upgradeGacha(this.engine.p2);
			}
		} else {
			this.engine.upgradeGacha(this.engine.p2);
		}
		this.sync();
	}

	public upgradeGacha() {
		if (this.engine.stats.gameMode === 'ONLINE_COOP' && this.netRole === 'p2') {
			this.upgradeGachaP2();
		} else {
			this.upgradeGachaP1();
		}
	}

	public sync() {
		// 1P Calculations
		const costP1 = this.engine.getSummonCost(this.engine.p1);
		this.p1Gold = this.engine.p1.gold;
		this.p1SummonCost = costP1;
		this.canSummonP1 = this.p1Gold >= costP1 && this.engine.p1.slots.some((s) => s.unit === null);

		this.p1GachaLevel = this.engine.p1.gachaLevel || 1;
		this.p1GachaUpgradeCost = this.engine.getGachaUpgradeCost(this.engine.p1);
		this.canUpgradeGachaP1 = this.p1GachaUpgradeCost !== null && this.p1Gold >= this.p1GachaUpgradeCost;

		// 2P Calculations
		const isSolo = this.engine.stats.gameMode === 'SOLO';
		const costP2 = this.engine.getSummonCost(this.engine.p2);
		this.p2Gold = this.engine.p2.gold;
		this.p2SummonCost = costP2;
		this.canSummonP2 = !isSolo && this.p2Gold >= costP2 && this.engine.p2.slots.some((s) => s.unit === null);

		this.p2GachaLevel = this.engine.p2.gachaLevel || 1;
		this.p2GachaUpgradeCost = this.engine.getGachaUpgradeCost(this.engine.p2);
		this.canUpgradeGachaP2 = !isSolo && this.p2GachaUpgradeCost !== null && this.p2Gold >= this.p2GachaUpgradeCost;

		// Backward compatibility
		this.summonCost = this.netRole === 'p2' ? this.p2SummonCost : this.p1SummonCost;
		this.canSummon = this.netRole === 'p2' ? this.canSummonP2 : this.canSummonP1;
		this.p1MonsterCount = this.engine.p1.monsters.length;
		this.p2MonsterCount = this.engine.p2.monsters.length;
		this.currentRound = this.engine.stats.currentRound;
		this.roundTimeLeft = this.engine.stats.roundTimeLeft;
		this.isBossRound = this.engine.stats.isBossRound;
		this.isGameOver = this.engine.stats.isGameOver;
		this.isGameWon = this.engine.stats.isGameWon;
		this.gameSpeed = this.engine.stats.gameSpeed;
		this.isPaused = this.engine.stats.isPaused;

		if (this.engine.selectedSlot) {
			const targetPlayer = this.engine.selectedSlot.player === 'p2' ? this.engine.p2 : this.engine.p1;
			const slot = targetPlayer.slots[this.engine.selectedSlot.index];
			this.selectedSlotIndex = this.engine.selectedSlot.index;
			if (slot?.unit) {
				const master = UNITS_MASTER[slot.unit.unitId];
				this.selectedUnit = master || null;
				this.refundAmount = master ? Math.pow(2, master.tier) * 10 : 0;
			} else {
				this.selectedUnit = null;
				this.refundAmount = 0;
			}
		} else {
			this.selectedSlotIndex = null;
			this.selectedUnit = null;
			this.refundAmount = 0;
		}
	}

	public restart(mode?: GameMode) {
		const targetMode = mode || this.engine.stats.gameMode;
		if (targetMode !== 'ONLINE_COOP') {
			multiplayer.disconnect();
			this.netRole = null;
			this.netRoomId = null;
			this.netError = null;
			this.isWaitingForGuest = false;
		}
		this.initEngine(targetMode, false);
	}
}

export const gameStore = new GameStore();
