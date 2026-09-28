export type AttackType =
	| 'SINGLE'
	| 'LINE_PIERCE'
	| 'AOE_SPLASH'
	| 'KNOCKBACK'
	| 'AOE_BOX'
	| 'SINGLE_SNIPER'
	| 'AOE_AURA'
	| 'MULTI_CHAIN'
	| 'GLOBAL_PULSE'
	| 'PASSIVE_ONLY';

export type TargetPriority = 'FIRST' | 'HIGHEST_HP' | 'BOSS_ONLY';

export type UnitTier = 1 | 2 | 3 | 4 | 5;

export type UnitAttribute = 'BIT' | 'NET' | 'SEC';
export type UnitArchetype = 'RAPID' | 'AOE' | 'HEAVY' | 'SUPP';

export interface UnitSkill {
	type: string;
	[key: string]: any;
}

export interface UnitMaster {
	id: string;
	name: string;
	tier: UnitTier;
	themeColor: string;
	attackType: AttackType;
	damage: number;
	attackSpeed: number; // 초당 공격 쿨타임
	range: number; // 9999 = 전 맵
	projectileSpeed: number;
	targetPriority?: TargetPriority;
	skill: UnitSkill | null;
	attribute?: UnitAttribute;
	archetype?: UnitArchetype;
}

export interface PlacedUnit {
	instanceId: string;
	unitId: string;
	slotIndex: number; // 0 ~ 11
	isWarped: boolean; // 보스방 워프 여부
	cooldown: number; // 남은 쿨타임 (초)
	skillCooldown?: number; // 특수 스킬 쿨타임
	frozenDuration?: number; // 랜섬웨어/BSOD 동결 지속시간
	trojanDuration?: number; // 20R 트로이 목마 감염 지속시간
	overheatDuration?: number; // 60R 체르노빌 과열 냉각 지속시간
	heatStack?: number; // 60R 체르노빌 과열 누적 스택 (0~12)
	attackAnimTimer?: number; // 공격 모션 타이머 (0 ~ 0.25초)
	spawnAnimTimer?: number; // 소환 연출 바운스 타이머 (0 ~ 0.45초)
	targetAngle?: number; // 공격 대상 방향 각도 (라디안)
}

export interface Slot {
	index: number;
	x: number;
	y: number;
	unit: PlacedUnit | null;
}

export interface Monster {
	id: string;
	tier: number;
	name: string;
	maxHp: number;
	hp: number;
	defense: number;
	speed: number; // 라디안/초 이동 속도
	angle: number; // 현재 원형 트랙 각도 (0 ~ 2π, 계속 누적)
	trackCenterX: number;
	trackCenterY: number;
	trackRadius: number;
	x: number;
	y: number;
	isDead: boolean;
	slowRate: number;
	slowDuration: number;
	stunDuration: number;
	armorDownRate: number;
	armorDownDuration: number;
	damageAmpRate: number;
	damageAmpDuration: number;
	hitCount: number; // 로딩 스피너 스턴용 피격수
	color: string;
	size: number;
	isBoss?: boolean;
}

export interface BossSkill {
	type: string;
	interval?: number;
	timer?: number;
	[key: string]: any;
}

export interface BossMaster {
	id: string;
	round: number;
	name: string;
	maxHp: number;
	timeLimit: number;
	rewardGold: number;
	defense: number;
	skills: BossSkill[];
	attribute?: UnitAttribute;
	hitLimitThreshold?: number; // 0.25초당 유효 피격 한계치 (초과 시 감쇠)
	hitDampeningRate?: number; // 한계 초과 시 피해 감쇠율 (0.0 ~ 1.0)
}

export interface BossEntity {
	master: BossMaster;
	hp: number;
	maxHp: number;
	shield: number;
	maxShield: number;
	defense: number;
	x: number;
	y: number;
	timeLimit: number;
	timeLeft: number;
	skills: {
		skill: BossSkill;
		cooldownTimer: number;
	}[];
	isEnraged?: boolean;
	formatCountdown?: number;
	timeRollbackTriggered?: boolean;
	recentHitCount?: number;
	recentHitTimer?: number;
	lagDuration?: number;
	lagDebuffRate?: number;
}

export interface Projectile {
	id: string;
	x: number;
	y: number;
	targetX: number;
	targetY: number;
	targetMonsterId?: string;
	speed: number;
	damage: number;
	sourcePlayerId?: 'p1' | 'p2';
	sourceUnitId: string;
	unitMaster: UnitMaster;
	color: string;
	type: AttackType;
	isCrit?: boolean;
	pierceAngle?: number;
	pierceDistance?: number;
	maxDistance?: number;
	traveledDistance?: number;
	splashRadius?: number;
	chainTargets?: string[];
	chainIndex?: number;
	hitMonsterIds?: string[];
	hitBoss?: boolean;
}

export interface FloatingText {
	id: string;
	x: number;
	y: number;
	text: string;
	color: string;
	fontSize: number;
	life: number; // 0 ~ 1
	vx: number;
	vy: number;
}

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: string;
	size: number;
	life: number;
	maxLife: number;
	shape?: 'circle' | 'square' | 'line' | 'ring' | 'hex' | 'star' | 'matrix' | 'byte' | 'shockwave' | 'lightning' | 'pixel_cube' | 'glitch';
	text?: string;
	targetX?: number;
	targetY?: number;
	isHoming?: boolean;
}

export interface PopupItem {
	id: string;
	x: number;
	y: number;
	title: string;
	content: string;
	width: number;
	height: number;
}

export type GameMode = 'SOLO' | 'AI_COOP' | 'ONLINE_COOP';

export interface PlayerState {
	id: 'p1' | 'p2';
	isAlive: boolean;
	isAi: boolean;
	gold: number;
	summonCount: number;
	slots: Slot[];
	monsters: Monster[];
	trackCenterX: number;
	trackCenterY: number;
	trackRadius: number;
	warpSlots: { x: number; y: number }[];
	gachaLevel: number; // 1 ~ 4 (BIOS 소환기 오버클럭 단계)
}

export interface GameStats {
	currentRound: number;
	maxRound: number;
	roundTimeLeft: number;
	isBossRound: boolean;
	isGameOver: boolean;
	isGameWon: boolean;
	gameMode: GameMode;
	gameSpeed: number; // 1 or 2
	isPaused: boolean;
}
