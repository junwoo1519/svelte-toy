import type { UnitMaster } from '$lib/types/game';

export const UNITS_MASTER: Record<string, UnitMaster> = {
	// ⚪ 1티어: 일반 (Normal) - 화이트 테마
	T1_ARROW: {
		id: 'T1_ARROW',
		name: '표준 화살표',
		tier: 1,
		themeColor: '#FFFFFF',
		attackType: 'SINGLE',
		damage: 14,
		attackSpeed: 0.32,
		range: 120,
		projectileSpeed: 12,
		attribute: 'BIT',
		archetype: 'RAPID',
		skill: null
	},
	T1_IBEAM: {
		id: 'T1_IBEAM',
		name: '텍스트 I-빔',
		tier: 1,
		themeColor: '#E2E8F0',
		attackType: 'LINE_PIERCE',
		damage: 18,
		attackSpeed: 0.7,
		range: 145,
		projectileSpeed: 14,
		attribute: 'NET',
		archetype: 'AOE',
		skill: null
	},
	T1_CROSS: {
		id: 'T1_CROSS',
		name: '크로스헤어',
		tier: 1,
		themeColor: '#CBD5E1',
		attackType: 'SINGLE',
		damage: 68,
		attackSpeed: 1.15,
		range: 230,
		projectileSpeed: 13,
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: null
	},
	T1_HAND: {
		id: 'T1_HAND',
		name: '링크 손가락',
		tier: 1,
		themeColor: '#F8FAFC',
		attackType: 'SINGLE',
		damage: 15,
		attackSpeed: 0.6,
		range: 110,
		projectileSpeed: 10,
		attribute: 'SEC',
		archetype: 'SUPP',
		skill: {
			type: 'SINGLE_BUFF',
			target: 'ADJACENT_ONE',
			attackSpeedBonus: 0.12,
			description: '단일 공격 + 인접한 좌우 아군 공속 +12%'
		}
	},
	T1_WAIT: {
		id: 'T1_WAIT',
		name: '대기 커서',
		tier: 1,
		themeColor: '#E0E7FF',
		attackType: 'SINGLE',
		damage: 12,
		attackSpeed: 0.65,
		range: 125,
		projectileSpeed: 11,
		attribute: 'SEC',
		archetype: 'SUPP',
		skill: {
			type: 'SLOW_TARGET',
			slowRate: 0.15,
			duration: 2.0,
			description: '타격 시 대상 적 이속 15% 감속 (2초)'
		}
	},

	// 🔵 2티어: 고급 (Rare) - 시안/블루 테마
	T2_AIM: {
		id: 'T2_AIM',
		name: '정밀 조준선',
		tier: 2,
		themeColor: '#00D2FF',
		attackType: 'SINGLE',
		damage: 165,
		attackSpeed: 1.05,
		range: 210,
		projectileSpeed: 14,
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: {
			type: 'CRITICAL_STRIKE',
			chance: 0.3,
			multiplier: 2.0,
			description: '30% 확률로 2.0배 치명타 피해 (더블클릭 폭딜)'
		}
	},
	T2_HOURGLASS: {
		id: 'T2_HOURGLASS',
		name: '모래시계 렉',
		tier: 2,
		themeColor: '#38BDF8',
		attackType: 'AOE_SPLASH',
		damage: 48,
		attackSpeed: 0.8,
		range: 150,
		projectileSpeed: 9,
		attribute: 'SEC',
		archetype: 'AOE',
		skill: {
			type: 'SLOW_FIELD',
			slowRate: 0.3,
			duration: 2.5,
			radius: 70,
			description: '착탄 반경 70px 내 적 이속 30% 감소 (2.5초)'
		}
	},
	T2_RESIZE: {
		id: 'T2_RESIZE',
		name: '4방향 이동',
		tier: 2,
		themeColor: '#60A5FA',
		attackType: 'KNOCKBACK',
		damage: 55,
		attackSpeed: 0.42,
		range: 130,
		projectileSpeed: 11,
		attribute: 'SEC',
		archetype: 'RAPID',
		skill: {
			type: 'KNOCKBACK',
			distance: 0.25,
			description: '타격 시 적을 트랙 뒤로 강력 넉백'
		}
	},
	T2_LINK: {
		id: 'T2_LINK',
		name: '하이퍼링크',
		tier: 2,
		themeColor: '#06B6D4',
		attackType: 'SINGLE',
		damage: 45,
		attackSpeed: 0.65,
		range: 135,
		projectileSpeed: 12,
		attribute: 'NET',
		archetype: 'SUPP',
		skill: {
			type: 'CROSS_BUFF',
			rangeBonus: 0.15,
			damageBonus: 0.15,
			description: '인접 및 맞은편 십자 아군 사거리 +15%, 공격력 +15%'
		}
	},
	T2_SELECT: {
		id: 'T2_SELECT',
		name: '드래그 셀렉터',
		tier: 2,
		themeColor: '#22D3EE',
		attackType: 'AOE_BOX',
		damage: 52,
		attackSpeed: 0.85,
		range: 160,
		projectileSpeed: 12,
		attribute: 'NET',
		archetype: 'AOE',
		skill: {
			type: 'AOE_BOX',
			description: '사각 영역(80x50px) 내 모든 적에게 광역 피해'
		}
	},

	// 🟣 3티어: 영웅 (Epic) - 퍼플/바이올렛 테마
	T3_SNIPER: {
		id: 'T3_SNIPER',
		name: '스나이퍼 십자선',
		tier: 3,
		themeColor: '#C084FC',
		attackType: 'SINGLE_SNIPER',
		damage: 780,
		attackSpeed: 1.45,
		range: 250,
		projectileSpeed: 28,
		targetPriority: 'HIGHEST_HP',
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: {
			type: 'IGNORE_DEFENSE',
			rate: 0.5,
			description: '단일 대상 방어력 50% 관통 저격타'
		}
	},
	T3_SPINNER: {
		id: 'T3_SPINNER',
		name: '로딩 스피너',
		tier: 3,
		themeColor: '#A855F7',
		attackType: 'AOE_AURA',
		damage: 65,
		attackSpeed: 0.6,
		range: 165,
		projectileSpeed: 0,
		attribute: 'SEC',
		archetype: 'AOE',
		skill: {
			type: 'STUN_AURA',
			slowRate: 0.45,
			hitCountForStun: 4,
			stunDuration: 1.8,
			description: '주변 모든 적 광역 65 피해 + 이속 45% 감소 + 4회 피격 시 1.8초 기절'
		}
	},
	T3_DENIED: {
		id: 'T3_DENIED',
		name: '금지 마크',
		tier: 3,
		themeColor: '#E879F9',
		attackType: 'SINGLE',
		damage: 340,
		attackSpeed: 0.95,
		range: 200,
		projectileSpeed: 13,
		attribute: 'SEC',
		archetype: 'HEAVY',
		skill: {
			type: 'ARMOR_DOWN',
			rate: 0.35,
			duration: 5.0,
			description: '피격 대상 방어력 35% 감소 (5초)'
		}
	},
	T3_MULTIDRAG: {
		id: 'T3_MULTIDRAG',
		name: '멀티 셀렉트',
		tier: 3,
		themeColor: '#9333EA',
		attackType: 'MULTI_CHAIN',
		damage: 110,
		attackSpeed: 0.8,
		range: 170,
		projectileSpeed: 16,
		attribute: 'NET',
		archetype: 'AOE',
		skill: {
			type: 'CHAIN_TARGET',
			maxTargets: 4,
			description: '최대 4마리 적 동시 레이저 연결 타격'
		}
	},
	T3_MACRO: {
		id: 'T3_MACRO',
		name: '단축키 매크로',
		tier: 3,
		themeColor: '#D946EF',
		attackType: 'SINGLE',
		damage: 80,
		attackSpeed: 0.7,
		range: 130,
		projectileSpeed: 12,
		attribute: 'NET',
		archetype: 'SUPP',
		skill: {
			type: 'AROUND_BUFF',
			attackSpeedBonus: 0.2,
			cooldownReduction: 0.2,
			description: '인접 8방향 아군 공속 +20%, 쿨타임 -20%'
		}
	},

	// 🌈 4티어: 전설 (Legend) - RGB/골드 테마
	T4_WHEEL: {
		id: 'T4_WHEEL',
		name: '휠 오브 데스',
		tier: 4,
		themeColor: '#F43F5E',
		attackType: 'AOE_AURA',
		damage: 160,
		attackSpeed: 0.55,
		range: 180,
		projectileSpeed: 0,
		attribute: 'NET',
		archetype: 'AOE',
		skill: {
			type: 'AROUND_SLOW',
			slowRate: 0.35,
			description: '주변 180px 지속 파동 피해 + 범위 내 적군 이속 35% 감소 오라'
		}
	},
	T4_MAGICWAND: {
		id: 'T4_MAGICWAND',
		name: '매직 완드',
		tier: 4,
		themeColor: '#FBBF24',
		attackType: 'SINGLE',
		damage: 850,
		attackSpeed: 0.9,
		range: 220,
		projectileSpeed: 16,
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: {
			type: 'PERCENT_HP_EXECUTE',
			percentRate: 0.03,
			executeThreshold: 0.18,
			description: '적 현재 체력 3% 추가 피해 + 체력 18% 이하 즉시 처형'
		}
	},
	T4_ADMIN: {
		id: 'T4_ADMIN',
		name: '관리자 포인터',
		tier: 4,
		themeColor: '#F59E0B',
		attackType: 'SINGLE',
		damage: 1250,
		attackSpeed: 1.2,
		range: 250,
		projectileSpeed: 18,
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: {
			type: 'PERIODIC_BURST',
			cooldown: 6.0,
			critChance: 1.0,
			multiplier: 4.0,
			description: '6타마다 400% 확정 치명타 (5,000 대미지 핵폭딜)'
		}
	},
	T4_CONSOLE: {
		id: 'T4_CONSOLE',
		name: '개발자 콘솔',
		tier: 4,
		themeColor: '#10B981',
		attackType: 'AOE_AURA',
		damage: 220,
		attackSpeed: 0.75,
		range: 210,
		projectileSpeed: 0,
		attribute: 'SEC',
		archetype: 'SUPP',
		skill: {
			type: 'VULNERABILITY_AURA',
			armorDownRate: 0.5,
			damageAmpRate: 0.3,
			description: '적 방어력 50% 감소 + 받는 피해 30% 증폭 오라'
		}
	},
	T4_TASKMASTER: {
		id: 'T4_TASKMASTER',
		name: '마스터 단축키',
		tier: 4,
		themeColor: '#FFD700',
		attackType: 'PASSIVE_ONLY',
		damage: 0,
		attackSpeed: 0,
		range: 9999,
		projectileSpeed: 0,
		attribute: 'NET',
		archetype: 'SUPP',
		skill: {
			type: 'GLOBAL_TEAM_BUFF',
			attackSpeedBonus: 0.25,
			critChanceBonus: 0.12,
			description: '[고유 오라] 전 구역 아군 공속 +25%, 치명타 +12% (중복 불가)'
		}
	},

	// 🚨 5티어: 히든 신화 (Hidden Mythic) - 초월 유닛 5종
	HIDDEN_CTRLALTDEL: {
		id: 'HIDDEN_CTRLALTDEL',
		name: 'Ctrl + Alt + Del',
		tier: 5,
		themeColor: '#FF0055',
		attackType: 'LINE_PIERCE',
		damage: 950,
		attackSpeed: 0.38,
		range: 220,
		projectileSpeed: 24,
		attribute: 'SEC',
		archetype: 'RAPID',
		skill: {
			type: 'FORCE_TERMINATE',
			teamAttackSpeedBonus: 0.35,
			teamCritBonus: 0.2,
			executeHpRate: 0.25,
			executeThreshold: 0.15,
			bossArmorBreak: 0.5,
			bossStunDuration: 2.0,
			description: '[히든] 전 맵 아군 공속 +35%, 치명타 +20% | 4타마다 주변 320px 적 체력 25% 즉시 삭제 및 15% 이하 즉사 | 보스 방어력 50% 파괴 & 2% 최대체력 피해'
		}
	},
	HIDDEN_BSOD_WHEEL: {
		id: 'HIDDEN_BSOD_WHEEL',
		name: '블랙홀 스피너',
		tier: 5,
		themeColor: '#818CF8',
		attackType: 'AOE_AURA',
		damage: 520,
		attackSpeed: 0.45,
		range: 260,
		projectileSpeed: 0,
		attribute: 'NET',
		archetype: 'AOE',
		skill: {
			type: 'EVENT_HORIZON',
			slowRate: 0.5,
			timeStopInterval: 6.0,
			timeStopDuration: 1.2,
			description: '[히든] 주변 260px 적군 이속 50% 상시 둔화 + 0.45초 주기 520 파동 피해 (보스 3배) | 6초마다 1.2초간 범위 내 모든 적 시간 정지(완전 기절)'
		}
	},
	HIDDEN_QUANTUM_ERASER: {
		id: 'HIDDEN_QUANTUM_ERASER',
		name: '양자 지우개',
		tier: 5,
		themeColor: '#FACC15',
		attackType: 'MULTI_CHAIN',
		damage: 720,
		attackSpeed: 0.55,
		range: 240,
		projectileSpeed: 22,
		attribute: 'BIT',
		archetype: 'AOE',
		skill: {
			type: 'PIXEL_PURGE',
			chainCount: 6,
			percentHpDamage: 0.05,
			executeThreshold: 0.25,
			description: '[히든] 최대 6마리 동시 레이저 타격 | 적 현재 체력 5% 추가 피해 + 체력 25% 이하 즉시 픽셀 삭제(처형) (+2B) | 보스 0.4% 최대체력 피해'
		}
	},
	HIDDEN_ROOT_ADMIN: {
		id: 'HIDDEN_ROOT_ADMIN',
		name: '루트 슈퍼유저 (SUDO)',
		tier: 5,
		themeColor: '#F59E0B',
		attackType: 'SINGLE',
		damage: 3600,
		attackSpeed: 1.1,
		range: 320,
		projectileSpeed: 24,
		attribute: 'BIT',
		archetype: 'HEAVY',
		skill: {
			type: 'SUDO_FORCE',
			critChance: 1.0,
			burstInterval: 3,
			burstMultiplier: 5.0,
			auraDamageBonus: 0.4,
			description: '[히든] 100% 확정 치명타 | 3타마다 500% (보스 750%) 슈퍼 핵폭딜 (18,000 / 27,000 대미지) | 인접한 모든 아군 공격력 +40% 버프 오라'
		}
	},
	HIDDEN_DEBUG_CONSOLE: {
		id: 'HIDDEN_DEBUG_CONSOLE',
		name: '치트 엔진 (Cheat Engine)',
		tier: 5,
		themeColor: '#10B981',
		attackType: 'AOE_AURA',
		damage: 450,
		attackSpeed: 0.65,
		range: 250,
		projectileSpeed: 0,
		attribute: 'SEC',
		archetype: 'SUPP',
		skill: {
			type: 'GOD_MODE_CHEAT',
			armorDownRate: 0.7,
			damageAmpRate: 0.5,
			decayPercentPerSec: 0.06,
			description: '[히든] 범위 내 모든 적 방어력 70% 영구 파괴 + 받는 피해 50% 증폭 오라 | 6초마다 범위 내 모든 적 5초간 초당 최대 체력 6% 부식 피해 | 보스 0.3% 최대체력 피해'
		}
	},
};

export const TIER_CONFIG: Record<
	number,
	{ name: string; color: string; bgBadge: string; refund: number }
> = {
	1: { name: '일반 (Normal)', color: '#FFFFFF', bgBadge: '#334155', refund: 20 },
	2: { name: '고급 (Rare)', color: '#00D2FF', bgBadge: '#0369A1', refund: 40 },
	3: { name: '영웅 (Epic)', color: '#C084FC', bgBadge: '#6B21A8', refund: 80 },
	4: { name: '전설 (Legend)', color: '#FFD700', bgBadge: '#B45309', refund: 160 },
	5: { name: '히든 신화 (Mythic)', color: '#FF0055', bgBadge: '#881337', refund: 320 }
};

export const HIDDEN_MERGE_RECIPES: Record<string, string> = {
	T4_TASKMASTER: 'HIDDEN_CTRLALTDEL',
	T4_WHEEL: 'HIDDEN_BSOD_WHEEL',
	T4_MAGICWAND: 'HIDDEN_QUANTUM_ERASER',
	T4_ADMIN: 'HIDDEN_ROOT_ADMIN',
	T4_CONSOLE: 'HIDDEN_DEBUG_CONSOLE'
};

export const TIER_UNITS: Record<number, string[]> = {
	1: ['T1_ARROW', 'T1_IBEAM', 'T1_CROSS', 'T1_HAND', 'T1_WAIT'],
	2: ['T2_AIM', 'T2_HOURGLASS', 'T2_RESIZE', 'T2_LINK', 'T2_SELECT'],
	3: ['T3_SNIPER', 'T3_SPINNER', 'T3_DENIED', 'T3_MULTIDRAG', 'T3_MACRO'],
	4: ['T4_WHEEL', 'T4_MAGICWAND', 'T4_ADMIN', 'T4_CONSOLE', 'T4_TASKMASTER'],
	5: [
		'HIDDEN_CTRLALTDEL',
		'HIDDEN_BSOD_WHEEL',
		'HIDDEN_QUANTUM_ERASER',
		'HIDDEN_ROOT_ADMIN',
		'HIDDEN_DEBUG_CONSOLE'
	]
};

// 3각 상성 배율표 (BIT > SEC > NET > BIT)
export const ATTRIBUTE_CHART: Record<string, Record<string, number>> = {
	BIT: { SEC: 1.35, NET: 0.5, BIT: 1.0 },
	NET: { BIT: 1.35, SEC: 0.5, NET: 1.0 },
	SEC: { NET: 1.35, BIT: 0.5, SEC: 1.0 }
};

// 티어별 보스 피해 배율 (과밀화 저티어 도배 억제 & 고티어 소수정예화 강제)
export const TIER_BOSS_SCALING: Record<number, number> = {
	1: 0.2,
	2: 0.4,
	3: 0.85,
	4: 1.6,
	5: 2.5
};

export function getRandomUnitByTier(tier: number): UnitMaster {
	const unitIds = TIER_UNITS[tier] || TIER_UNITS[1];
	const randomId = unitIds[Math.floor(Math.random() * unitIds.length)];
	return UNITS_MASTER[randomId];
}

export interface GachaRates {
	t1: number;
	t2: number;
	t3: number;
	t4: number;
	t5?: number;
}

export const GACHA_LEVEL_CONFIG: Record<
	number,
	{ cost: number | null; rates: GachaRates; label: string; shortRates: string }
> = {
	1: {
		cost: 120, // Lv1 -> Lv2
		rates: { t1: 1.0, t2: 0.0, t3: 0.0, t4: 0.0, t5: 0.0 },
		label: 'Lv.1 (기본)',
		shortRates: 'T1:100%'
	},
	2: {
		cost: 220, // Lv2 -> Lv3
		rates: { t1: 0.8, t2: 0.2, t3: 0.0, t4: 0.0, t5: 0.0 },
		label: 'Lv.2 (초급 I)',
		shortRates: 'T1:80% T2:20%'
	},
	3: {
		cost: 380, // Lv3 -> Lv4
		rates: { t1: 0.65, t2: 0.3, t3: 0.05, t4: 0.0, t5: 0.0 },
		label: 'Lv.3 (초급 II)',
		shortRates: 'T1:65% T2:30% T3:5%'
	},
	4: {
		cost: 600, // Lv4 -> Lv5
		rates: { t1: 0.5, t2: 0.4, t3: 0.1, t4: 0.0, t5: 0.0 },
		label: 'Lv.4 (중급 I)',
		shortRates: 'T1:50% T2:40% T3:10%'
	},
	5: {
		cost: 950, // Lv5 -> Lv6
		rates: { t1: 0.38, t2: 0.45, t3: 0.17, t4: 0.0, t5: 0.0 },
		label: 'Lv.5 (중급 II)',
		shortRates: 'T1:38% T2:45% T3:17%'
	},
	6: {
		cost: 1800, // Lv6 -> Lv7 (Pre-40R apex)
		rates: { t1: 0.28, t2: 0.48, t3: 0.24, t4: 0.0, t5: 0.0 },
		label: 'Lv.6 (상급 I - 4T 잠금)',
		shortRates: 'T1:28% T2:48% T3:24%'
	},
	7: {
		cost: 3200, // Lv7 -> Lv8 (Post-40R first 4T unlock)
		rates: { t1: 0.2, t2: 0.48, t3: 0.295, t4: 0.025, t5: 0.0 },
		label: 'Lv.7 (상급 II - 4T 2.5% 해금)',
		shortRates: 'T2:48% T3:29.5% T4:2.5%'
	},
	8: {
		cost: 5500, // Lv8 -> Lv9
		rates: { t1: 0.14, t2: 0.46, t3: 0.36, t4: 0.04, t5: 0.0 },
		label: 'Lv.8 (전문 I - 4T 4%)',
		shortRates: 'T2:46% T3:36% T4:4%'
	},
	9: {
		cost: 9500, // Lv9 -> Lv10
		rates: { t1: 0.1, t2: 0.44, t3: 0.4, t4: 0.06, t5: 0.0 },
		label: 'Lv.9 (전문 II - 4T 6%)',
		shortRates: 'T3:40% T4:6%'
	},
	10: {
		cost: null, // MAX
		rates: { t1: 0.07, t2: 0.41, t3: 0.43, t4: 0.08, t5: 0.01 },
		label: 'Lv.10 MAX (4T: 8%, 5T 잭팟: 1%)',
		shortRates: 'T3:43% T4:8% T5:1%'
	}
};
