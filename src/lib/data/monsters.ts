export interface MonsterSpawnConfig {
	name: string;
	color: string;
	hp: number;
	defense: number;
	speed: number;
	count: number;
	interval: number; // spawn interval (seconds)
	size: number;
}

const MONSTER_NAMES = [
	'스팸 쿠키',
	'임시 파일',
	'광고 봇',
	'스파이웨어',
	'웜 바이러스',
	'키로거',
	'악성 스크립트',
	'메모리 누수',
	'좀비 PC 패킷',
	'백도어 트로이',
	'다크웹 스파이더',
	'랜섬 페이로드',
	'버퍼 오버플로우',
	'커널 루트킷',
	'양자 암호 바이러스',
	'제로데이 웜'
];

const MONSTER_COLORS = [
	'#EF4444', // Red
	'#F97316', // Orange
	'#EAB308', // Yellow
	'#84CC16', // Lime
	'#10B981', // Emerald
	'#06B6D4', // Cyan
	'#6366F1', // Indigo
	'#EC4899', // Pink
	'#F43F5E', // Rose
	'#A855F7', // Purple
	'#0284C7', // Sky Blue
	'#F59E0B', // Amber
	'#14B8A6', // Teal
	'#8B5CF6', // Violet
	'#D946EF', // Fuchsia
	'#E11D48'  // Crimson
];

export function getRoundMonsterConfig(round: number, isSolo: boolean): MonsterSpawnConfig {
	const nameIndex = (round - 1) % MONSTER_NAMES.length;
	const colorIndex = (round - 1) % MONSTER_COLORS.length;

	// Round scaling formulas (1R 30마리 시작 -> 80R 70마리, Option A 밸런스 개편)
	const baseHp = Math.round(75 * Math.pow(1.108, round - 1) + round * 20);
	const defense = Math.min(80, Math.floor((round - 1) * 0.8));
	// 2배 빠른 이동 속도 (트랙 한 바퀴 10~13초)
	const speed = 1.35 + Math.min(0.9, round * 0.012);
	const count = Math.min(70, 30 + Math.floor((round - 1) * 0.5));
	// 스폰 간격 (0.22s ~ 0.40s 간격으로 경쾌하게 쏟아져 나옴)
	const interval = Math.max(0.22, 0.40 - round * 0.0025);

	const isBossRound = [10, 20, 30, 40, 50, 60, 70, 80].includes(round);
	const hpMultiplier = isSolo ? 0.85 : 1.25;
	const countMultiplier = isSolo ? 0.95 : 1.15;

	// In boss rounds, spawn only 14~20 compact minions with ultra-fast 0.22s interval so players can warp immediately
	const finalCount = isBossRound
		? (isSolo ? 14 : 20)
		: Math.max(30, Math.round(count * countMultiplier));
	const finalInterval = isBossRound ? 0.22 : (isSolo ? interval : Math.max(0.18, interval * 0.88));

	return {
		name: `${MONSTER_NAMES[nameIndex]} v${Math.floor(round / 10) + 1}.${round % 10}`,
		color: MONSTER_COLORS[colorIndex],
		hp: Math.max(15, Math.round(baseHp * hpMultiplier)),
		defense,
		speed,
		count: finalCount,
		interval: finalInterval,
		size: 14 + Math.min(9, Math.floor(round / 8))
	};
}
