import type { BossMaster } from '$lib/types/game';

export const BOSSES_MASTER: Record<number, BossMaster> = {
	10: {
		id: 'BOSS_10R',
		round: 10,
		name: '팝업 스팸 봇',
		maxHp: 8500,
		timeLimit: 60,
		rewardGold: 100,
		defense: 5,
		attribute: 'BIT',
		hitLimitThreshold: 10,
		hitDampeningRate: 0.5,
		skills: [{ type: 'POPUP_INVASION', interval: 15.0, popupCount: 2 }]
	},
	20: {
		id: 'BOSS_20R',
		round: 20,
		name: '트로이 목마 코어',
		maxHp: 30000,
		timeLimit: 60,
		rewardGold: 150,
		defense: 15,
		attribute: 'SEC',
		hitLimitThreshold: 8,
		hitDampeningRate: 0.55,
		skills: [
			{
				type: 'SHIELD_ARMOR_UP',
				interval: 20.0,
				shieldRate: 0.2,
				defenseUpRate: 0.5,
				duration: 8.0
			},
			{
				type: 'SPY_INFECTION',
				interval: 14.0,
				duration: 6.0
			}
		]
	},
	30: {
		id: 'BOSS_30R',
		round: 30,
		name: '랜섬웨어 크립터',
		maxHp: 90000,
		timeLimit: 60,
		rewardGold: 200,
		defense: 25,
		attribute: 'NET',
		hitLimitThreshold: 7,
		hitDampeningRate: 0.6,
		skills: [{ type: 'UNIT_ENCRYPT', interval: 12.0, targetCount: 2, duration: 3.0 }]
	},
	40: {
		id: 'BOSS_40R',
		round: 40,
		name: '디도스 마스터',
		maxHp: 250000,
		timeLimit: 60,
		rewardGold: 300,
		defense: 80,
		attribute: 'NET',
		hitLimitThreshold: 6,
		hitDampeningRate: 0.7,
		skills: [
			{ type: 'GLOBAL_LAG', interval: 14.0, attackSpeedDebuff: 0.3, duration: 6.0 },
			{ type: 'PACKET_FLOOD', interval: 15.0, mobCount: 6 }
		]
	},
	50: {
		id: 'BOSS_50R',
		round: 50,
		name: '블루스크린 (BSOD)',
		maxHp: 950000,
		timeLimit: 60,
		rewardGold: 500,
		defense: 260,
		attribute: 'SEC',
		hitLimitThreshold: 5,
		hitDampeningRate: 0.75,
		skills: [
			{ type: 'ZONE_DISABLE', interval: 10.0, duration: 3.0 },
			{ type: 'FORMAT_COUNTDOWN', triggerHpRate: 0.4, limitTime: 15.0 }
		]
	},
	60: {
		id: 'BOSS_60R',
		round: 60,
		name: 'CIH 체르노빌 바이러스',
		maxHp: 1800000,
		timeLimit: 60,
		rewardGold: 800,
		defense: 450,
		attribute: 'BIT',
		hitLimitThreshold: 4,
		hitDampeningRate: 0.8,
		skills: [
			{ type: 'HARDWARE_OVERHEAT', interval: 11.0, duration: 5.0 },
			{ type: 'BAD_SECTOR', interval: 14.0, targetCount: 2, duration: 3.5 }
		]
	},
	70: {
		id: 'BOSS_70R',
		round: 70,
		name: '크립토재킹 채굴 타이탄',
		maxHp: 3600000,
		timeLimit: 60,
		rewardGold: 1200,
		defense: 750,
		attribute: 'NET',
		hitLimitThreshold: 4,
		hitDampeningRate: 0.85,
		skills: [
			{ type: 'RESOURCE_DRAIN', interval: 16.0, duration: 4.0 },
			{ type: 'HASH_COLLISION', interval: 18.0, targetCount: 2, duration: 3.5 }
		]
	},
	80: {
		id: 'BOSS_80R',
		round: 80,
		name: 'Y2K 밀레니엄 둠 (최종장)',
		maxHp: 8500000,
		timeLimit: 60,
		rewardGold: 2000,
		defense: 1200,
		attribute: 'SEC',
		hitLimitThreshold: 3,
		hitDampeningRate: 0.9,
		skills: [
			{ type: 'TIME_ROLLBACK', triggerHpRate: 0.7 },
			{ type: 'RSOD_CRASH', interval: 12.0, popupCount: 3 },
			{ type: 'Y2K_COUNTDOWN', triggerHpRate: 0.25, limitTime: 25.0 }
		]
	}
};
