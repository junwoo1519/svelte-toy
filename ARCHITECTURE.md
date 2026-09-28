# 🤖 Architecture & Business Logic Specification (AI Quick Reference)

> **Project**: Cursor Defense (`마우스 포인터 디펜스`)  
> **Tech Stack**: Svelte 5 (Runes), TypeScript, HTML5 2D Canvas, Web Audio API, Tailwind CSS, Vite.  
> **Target Resolution**: 1280 x 720 (16:9 fixed viewport).  
> **Theme**: Modern Dark Cyber Gaming UI (Crisp 60FPS Vector & Clean HUD, Pretendard Typography, Compact Icon/Numeric UI).

---

## 1. Directory & Component Structure

```
server/
└── multiplayerServer.ts # Node.js WebSocket relay server (ws://localhost:4000)
src/
├── lib/
│   ├── network/
│   │   └── MultiplayerManager.ts # Client WebSocket network controller
│   ├── data/
│   │   ├── units.ts         # 25 cursor units master data (20 standard + 5 Tier 5 Hidden Mythic)
│   │   ├── bosses.ts        # 8 boss entities (HP, DEF, rate-limiting, skills, rewards)
│   │   └── monsters.ts      # 80-round mob scaling formulas & configs
│   ├── engine/
│   │   ├── GameEngine.ts    # Central headless game loop, math, state machine, AI partner (MAX_MONSTERS = 100)
│   │   ├── CursorRenderer.ts# Vector rendering of 25 cursors + aim tracking (attack recoil/motions eliminated for visual comfort, pure combat VFX preserved)
│   │   └── SoundManager.ts  # Web Audio API 8-bit procedural synthesizer (no external audio files)
│   ├── state/
│   │   └── gameStore.svelte.ts # Svelte 5 $state bridge connecting UI with GameEngine
│   ├── components/
│   │   ├── GameCanvas.svelte   # 60fps 2D Canvas (mobs, sockets, boss room, telemetry, VFX)
│   │   ├── TopHud.svelte       # Integrated modern gaming HUD (title, mode badge, speed controls)
│   │   ├── ControlPanel.svelte # Tactical command deck: unit inspector, stat chips, keycap guides
│   │   ├── BossPopups.svelte   # 10R boss gimmick: modern cyber tactical emergency alerts
│   │   ├── ModeSelectModal.svelte # Startup launcher (Solo / AI Co-op / Online Co-op)
│   │   ├── UnitGuideModal.svelte  # In-game Encyclopedia modal (Tier 1~5 & Bosses)
│   │   └── GameOverModal.svelte   # Victory/Defeat dialog
│   └── styles/
│       └── game.css         # Modern dark gaming theme variables, console frame, buttons, badges
└── routes/
    └── +page.svelte         # Main console container
```

---

## 2. Coordinates & Geometry Reference (1280 x 720)

| Region | Center (X, Y) | Radius / Dimensions | Purpose |
| :--- | :--- | :--- | :--- |
| **P1 Field** | `(250, 400)` | Socket $R=122$, Track $R=205$ | 12 radial unit sockets & circular mob track |
| **P2 Field** | `(1030, 400)` | Socket $R=122$, Track $R=205$ | AI Partner (or inactive in Solo mode) |
| **Boss Chamber** | `(640, 345)` | $320 \times 420$ ($X: 480 \sim 800$) | Central boss containment chamber |
| **Telemetry HUD** | `(640, 48 \sim 116)` | $320 \times 68$ | Central Round & Countdown Timer display |
| **P1 Warp Slots** | $X = 515$ | 2 columns ($Y: 200 \sim 500$) | Left flank inside boss room (Scale 0.65x) |
| **P2 Warp Slots** | $X = 765$ | 2 columns ($Y: 200 \sim 500$) | Right flank inside boss room (Scale 0.65x) |
| **Memory VFD Text**| `(120, 670)` | Floating text origin | Spawns `+XX Byte` round bonus directly above RAM VFD |

---

## 3. Core Business Logic & State Machines

### 3.1 Economy & Progression
- **Currency**: Byte (RAM Memory). Starting balance: `110 Byte` (2 immediate summons).
- **Summon Cost**: $50 + \lfloor\text{summonCount} / 3\rfloor \times 5\text{ Byte}$ (moderate cost ramp).
- **Kill Reward**: $1 + \lfloor\text{round} / 30\rfloor\text{ Byte}$ per standard mob.
- **🎰 Lucky Byte & Jackpot**:
  - 4.5% chance for `+5 Byte (LUCKY!)`
  - 0.5% chance for `+25 Byte (JACKPOT!)` with golden particles & sound
- **⏱️ Round Clear & Fast Clear Time Bonus**:
  $$\text{TotalReward} = (20 + \text{currentRound} \times 2.5) + \max(0, \text{round}(\text{roundTimeLeft} \times 0.5))\text{ Byte}$$
- **⚡ BIOS Summoner Overclocking System (Lv.1 ~ Lv.10 Architecture)**:
  - **Lv 1 (Base)**: Upgrade 120B | T1: 100%
  - **Lv 2 (Early I)**: Upgrade 220B | T1: 80%, T2: 20%
  - **Lv 3 (Early II)**: Upgrade 380B | T1: 65%, T2: 30%, T3: 5%
  - **Lv 4 (Mid I)**: Upgrade 600B | T1: 50%, T2: 40%, T3: 10%
  - **Lv 5 (Mid II)**: Upgrade 950B | T1: 38%, T2: 45%, T3: 17%
  - **Lv 6 (Upper I - Pre-40R Peak)**: Upgrade 1,800B | T1: 28%, T2: 48%, T3: 24% (4T Locked at 0%)
  - **Lv 7 (Upper II - 🌟 4T 2.5% Unlock)**: Upgrade 3,200B | T1: 20%, T2: 48%, T3: 29.5%, T4: 2.5% (Post-40R DDoS Gatekeeper)
  - **Lv 8 (Expert I)**: Upgrade 5,500B | T1: 14%, T2: 46%, T3: 36%, T4: 4.0%
  - **Lv 9 (Expert II)**: Upgrade 9,500B | T1: 10%, T2: 44%, T3: 40%, T4: 6.0%
  - **Lv 10 (MAX Overclock)**: MAX (null) | T1: 7.0% buffer, T2: 41%, T3: 43%, T4: 8.0%, T5: 1.0% Jackpot
- **Refund on Sell**: T1 = 20B, T2 = 40B, T3 = 80B, T4 = 160B, T5 = 320B.

### 3.2 Unit Synthesis & 100% Guaranteed Merge System
- **Deterministic Fail-Free Merges**:
  - **T1 + T1**: 🌟 **Quantum Jump (2%)** $\rightarrow$ T3 / ✅ **Guaranteed Merge (98%)** $\rightarrow$ T2
  - **T2 + T2**: 🌟 **Quantum Jump (2%)** $\rightarrow$ T4 / ✅ **Guaranteed Merge (98%)** $\rightarrow$ T3
  - **T3 + T3**: 🌟 **Quantum Jump (1%)** $\rightarrow$ T5 Mythic / ✅ **Guaranteed Merge (99%)** $\rightarrow$ T4
  - **T4 + T4 (Legendary Mythic Awakening & Board Jam Relief)**:
    - 🌟 **Duplicate Pair (Designated Recipe)**: Evolves into designated **Tier 5 Hidden Mythic** (Wheel $\rightarrow$ Blackhole Spinner, Wand $\rightarrow$ Quantum Eraser, Admin $\rightarrow$ Root Admin / SUDO, Console $\rightarrow$ Cheat Engine, Taskmaster $\rightarrow$ Ctrl+Alt+Del).
    - 🎲 **Different 4T Pair (Board Jam Relief)**: 100% guaranteed synthesis into a **random 1 of 5 Tier 5 Hidden Mythics**, completely preventing end-game board congestion locks.

### 3.3 Fast Wave Clear & Round Flow
1. **Round Duration**: Standard rounds: **25.0s** (Boss rounds: 60.0s). Each standard round spawns $30 + \text{round} \times 0.5$ mobs (1R 30 mobs $\rightarrow$ 80R 70 mobs, base HP 75) at interval $0.40\text{s} \sim 0.22\text{s}$. (Boss rounds spawn 14~18 fast minions at 0.22s).
2. **Fast Clear Trigger**:
   ```ts
   const isAllSpawned = spawnedCount >= totalToSpawn;
   const isTrackCleared = player.monsters.length === 0;
   if (isAllSpawned && isTrackCleared) {
       finishRound(); // Advances immediately and awards time bonus!
   }
   ```
3. **Overload Loss Condition**: `player.monsters.length >= 100` $\rightarrow$ Immediate Defeat (Track Overload Crash).

### 3.4 Boss Rounds & Tactical Warp Protocol
- **Boss Rounds**: Rounds 10, 20, 30, 40, 50, 60, 70, 80.
- **Entry Warning**: `GameEngine.bossWarningTimer` sets 3.2s full-screen emergency alert with siren strobe.
- **Tactical Double-Click Boss Warp Protocol (Max 5 Units)**:
  - Double-click unit in base socket $\rightarrow$ Warps unit to boss room flank pad (if `currentlyWarped < 5` and boss active).
  - Double-click again in boss room or socket $\rightarrow$ Recalls unit back to base field.
  - AI Partner automatically selects and warps top 5 highest DPS units.
  - On boss defeat or round transition, all warped units automatically return to base sockets.

---

## 4. Damage & Combat Calculations

### [4-1] Normal Monsters
$$\text{FinalDmg} = \max\left(1, (\text{Damage} \times \text{CritMultiplier} \times \text{DamageAmpRate}) - \text{MonsterDefense}\right)$$

### [4-2] Boss Combat Pipeline
1. **Attribute Multiplier (`attrMult`)**:
   $$\text{attrMult} = \text{ATTRIBUTE\_CHART}[\text{unit.attr}][\text{boss.attr}] \in \{1.35, 1.00, 0.50\}$$
2. **Tier Boss Multiplier (`tierBossRate`)**:
   $$\text{tierBossRate} = \{1T: 0.20,\; 2T: 0.40,\; 3T: 0.85,\; 4T: 1.60,\; 5T: 2.50\}$$
   $$\text{rawBossDmg} = \text{Damage} \times \text{attrMult} \times \text{tierBossRate}$$
3. **Flat Defense Subtraction & Tier 4 Floor Damage**:
   $$\text{EffectiveDef} = \begin{cases} 0 & \text{Tier 5 Mythic (100\% Pierce)} \\ \text{round}(\text{boss.defense} \times 0.50) & \text{T3 Sniper (50\% Pierce)} \\ \text{boss.defense} & \text{Standard Units} \end{cases}$$
   $$\text{baseDmg} = \begin{cases} \max\left(\text{round}(\text{rawBossDmg} \times 0.25), \text{round}(\text{rawBossDmg} - \text{EffectiveDef})\right) & \text{Tier 4 Units} \\ \max\left(1, \text{round}(\text{rawBossDmg} - \text{EffectiveDef})\right) & \text{Tiers 1, 2, 3, 5} \end{cases}$$
4. **Rate-Limiting Firewall (0.25s Window)**:
   $$\text{if } (\text{recentHits} > \text{hitLimitThreshold}) \implies \text{finalDmg} = \max\left(1, \text{Math.round}(\text{baseDmg} \times (1 - \text{hitDampeningRate}))\right)$$

---

## 5. Unit Roster Summary (25 Cursors)

| Tier | Units | Primary Role & Unique Mechanic |
| :--- | :--- | :--- |
| **T1 (Common)** | Arrow, I-Beam, Cross, Hand, Wait | Rapid single DPS, linear pierce, long-range heavy shot, adjacent AS +12% aura, single 15% slow |
| **T2 (Rare)** | Aim, Hourglass, Resize, Link, Select | 30% Crit (2x), AoE 30% slow field, track knockback, cross-slot +15% Range/DMG aura, box AoE |
| **T3 (Epic)** | Sniper, Spinner, Denied, MultiDrag, Macro | 50% DEF pierce (250 range), AoE 45% slow + stun aura, 35% armor shred, 4-chain laser, 8-slot +20% AS aura |
| **T4 (Legendary)** | Wheel, MagicWand, Admin, Console, Taskmaster | Global pulse + 35% slow (25% boss floor DMG), 3% MaxHP true dmg + execute, 6th-hit 400% burst, 50% shred + 30% amp, [Unique] team +25% AS / +12% Crit |
| **T5 (Mythic)** | **Ctrl + Alt + Del** | **2x Taskmaster**: 950 DMG, 0.38s AS, [Unique] Team +35% AS / +20% Crit, 4th-hit 25% SIGKILL + 50% Boss DEF shred |
| | **Blackhole Spinner** | **2x Wheel**: 480 DMG, 0.45s AS, Global 50% slow + 1.2s time stop every 6.0s |
| | **Quantum Eraser** | **2x MagicWand**: 720 DMG, 0.55s AS, 6-chain laser, 5% HP bonus DMG + 25% execute (+2B bonus) |
| | **Root Admin (SUDO)** | **2x Admin**: 3,600 DMG, 1.10s AS, 100% Crit + every 3rd hit 750% burst (27,000 DMG) |
| | **Cheat Engine** | **2x Console**: 450 DMG, 0.65s AS, 70% DEF shred + 50% DMG amp aura + 6%/s decay aura |

---

## 6. Boss Roster Summary (8 Bosses - v3.2.0 Rebalanced)

| Round | Boss Name | Attribute | Max HP (`v3.2.0`) | DEF | Rate Limit & Gimmick Countermeasure |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **10R** | Spam Bot (`BOSS_10R`) | `BIT` | 8,500 | 5 | 10 hits / 0.25s cap (50% damp); spawns popup overlays |
| **20R** | Trojan Core (`BOSS_20R`) | `SEC` | 30,000 | 15 | 8 hits / 0.25s cap (55% damp); renewable 20% shield & armor boost |
| **30R** | Ransomware (`BOSS_30R`) | `NET` | 90,000 | 25 | 7 hits / 0.25s cap (60% damp); freezes 2 units for 3.0s |
| **40R** | DDoS Master (`BOSS_40R`) | `NET` | **250,000** | **80** | **6 hits / 0.25s cap (70% damp)**; global 30% AS lag for 6.0s |
| **50R** | BSOD Master (`BOSS_50R`) | `SEC` | **950,000** | **260** | **5 hits / 0.25s cap (75% damp)**; 10s zone disable + 15s format countdown at $\le 40\%$ HP |
| **60R** | CIH Chernobyl (`BOSS_60R`) | `BIT` | **1,800,000** | **450** | **4 hits / 0.25s cap (80% damp)**; Overheat (+80% mob speed) & Bad Sector lock |
| **70R** | Cryptojacker (`BOSS_70R`) | `NET` | **3,600,000** | **750** | **4 hits / 0.25s cap (85% damp)**; 25% HP shield drain & Hash Lock |
| **80R** | Y2K Millennium (`BOSS_80R`) | `SEC` | **8,500,000** | **1,200** | **3 hits / 0.25s cap (90% damp)**; Time Rollback (+35% heal), RSOD & 25s reset |

---

## 7. Mandatory AI Development & Documentation Rules

1. **Mandatory Documentation Updates & Version Synchronization (CRITICAL RULE)**:
   - **`CHANGELOG.md`**: Whenever ANY feature, balance tweak, bug fix, or visual update is made, **ALWAYS bump the version tag (e.g. `v3.x.x`) and document the changes in `CHANGELOG.md`**.
   - **`BALANCE.md`**: Whenever unit damage, attack speed, range, archetypes, 3-way attributes, boss HP/DEF, or damage formulas are adjusted, **ALWAYS update `BALANCE.md`** to maintain the single source of mathematical truth.
   - **`ARCHITECTURE.md`**: Whenever architecture, network packets, math formulas, or game data are altered, **ALWAYS update `ARCHITECTURE.md`** so future AI sessions remain 100% synchronized without token waste.
   - **📌 Version Synchronization Checklist (6 Synchronized Locations)**:
     1. 🖥️ **`src/lib/components/ModeSelectModal.svelte`**: Modal header version badge (`vX.X.X`)
     2. 🛡️ **`src/lib/components/TopHud.svelte`**: Header titlebar version badge (`vX.X.X`)
     3. 🌐 **`src/routes/+page.svelte`**: HTML `<title>` browser tab (`vX.X.X`)
     4. 📜 **`CHANGELOG.md`**: Latest release header and detailed records (`vX.X.X`)
     5. 📘 **`README.md`**: Top version badge (`version-X.X.X-blue.svg`)
     6. ⚖️ **`BALANCE.md`**: Top version tag and unit/boss master tables (`vX.X.X`)
2. **Svelte 5 Runes**: Always use `$state`, `$derived`, `$props`. Avoid legacy `export let` or `$:`.
3. **State Updates**: `GameEngine` runs decoupled at 60fps. Always call `gameStore.sync()` or `engine.notifyChange()` after mutating game state outside canvas loop.
4. **No External Assets Needed**: All visual cursors, monsters, projectiles, and sounds are 100% procedurally synthesized in vector Canvas 2D and Web Audio API (`SoundManager.ts`).
5. **Build Verification**: Run `npm run check` and `npm run build` on Windows to ensure 0 errors.
