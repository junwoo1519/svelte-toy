# 📜 Cursor Defense - Changelog & Version History

---

## 📌 Latest Version: `v3.6.0` (2026-09-23)

> 💡 **Version Synchronization Rule**:
> All releases must synchronize version strings across 6 files:
> 1. 🖥️ `src/lib/components/ModeSelectModal.svelte` (`vX.X.X`)
> 2. 🛡️ `src/lib/components/TopHud.svelte` (`vX.X.X`)
> 3. 🌐 `src/routes/+page.svelte` (`vX.X.X`)
> 4. 📜 `CHANGELOG.md` (`vX.X.X`)
> 5. 📘 `README.md` (`version-X.X.X-blue.svg`)
> 6. ⚖️ `BALANCE.md` (`vX.X.X`)

---

### 🚀 [v3.6.0] - 2026-09-23 (Anytime Boss Chamber Warp & Boss Characteristic Unit Penalty Overhaul)
- **보스방 상시 자유 출입 시스템 (Anytime Boss Chamber Warp & Recall)**:
  - 기존 보스 라운드(10R, 20R...) 한정 투입 제약을 전면 해제하여, 일반 라운드 중에도 언제든지 유닛을 더블클릭해 보스방으로 전진배치(최대 5기)하거나 기지로 복귀할 수 있도록 개선.
  - 라운드 전환 및 보스 처치 시 유닛이 강제로 기지로 사출되던 로직을 제거하여, 전진배치 상태가 유지되며 플레이어가 전략적으로 원할 때만 드나들 수 있도록 완전한 통제권 부여.
  - 보스방 중앙 하단에 상시 전진배치 수용 현황(`1P 전진배치: X/5`) 및 더블클릭 가이드를 항시 렌더링.
- **보스 특성 기반 아군 유닛 고유 패널티 시스템 (악성코드 테마)**:
  - **10R 팝업 스팸 봇**: 악성 팝업으로 인한 조준 시야 방해 ➡️ 보스 활성화 중 아군 전 유닛 사거리 **-20%** 감소.
  - **20R 트로이 목마**: 14초마다 아군 유닛 1기 스파이 감염(`trojanDuration: 6.0s`) ➡️ 해당 유닛 공격 불가 + 인접 좌우 아군 슬롯 공격력 **-25%** 오염 (`🕵️ SPY` 뱃지 표시).
  - **30R 랜섬웨어**: 필드에 배치된 유닛 중 **최고 티어 핵심 딜러 1기**를 정밀 인질 암호화 (5.0초 완전 동결).
  - **40R 디도스 마스터**: 트래픽 과부하 공속 -30% 렉 + 공격 시 **25% 확률로 패킷 유실(Miss)** 투사체 불발.
  - **50R 블루스크린 (BSOD)**: 10초마다 2기 메모리 덤프 충돌 (SEC 보안 속성 유닛은 50% 확률로 방화벽 저항).
  - **60R CIH 체르노빌**: 하드웨어 과열 누적 시스템 도입 (12회 공격 시 2.0초간 강제 냉각 셧다운, `🔥 과열` 뱃지 표시).
  - **70R 크립토재킹**: 불법 채굴 전력 강탈로 전 유닛 공속 **-25%** 상시 저하 + 공격 시 **8% 확률로 1 Byte** 채굴 강탈.
  - **80R Y2K 밀레니엄 둠**: 세기말 타임 패러독스로 투사체 비행 속도 **-50%** 감속 & 공격 쿨타임 주기 무작위 왜곡 (0.7x ~ 1.4x 템포 교란).

---

### 🚀 [v3.5.0] - 2026-09-23 (Global Pulse to Localized Surrounding AoE Conversion Overhaul)
- **전 맵 타격 유닛의 주변 국소 범위 데미지(Surrounding AoE Aura) 전면 전환**:
  - **휠 오브 데스 (`T4_WHEEL`)**:
    - 공격 메커니즘을 전 맵 타격(`GLOBAL_PULSE`, 사거리 9999)에서 **`유닛 주변 180px 지속 펄스 오라(AOE_AURA)`**로 전면 전환.
    - 범위 집중화에 맞춰 기본 공격력을 140 ➡️ **160**으로 보정하여 유닛 배치 위치와 통로 교차점 설계의 전략성 강화.
    - 유닛 호버/클릭 시 캔버스에 180px 범위 인디케이터 링이 직관적으로 렌더링되도록 연동.
  - **블랙홀 스피너 (`HIDDEN_BSOD_WHEEL`)**:
    - 공격 메커니즘을 전 맵 타격(`GLOBAL_PULSE`, 사거리 9999)에서 **`유닛 주변 260px 대형 펄스 오라(AOE_AURA)`**로 전환.
    - 기본 공격력을 480 ➡️ **520**으로 상향 보정. 260px 주변 범위 내 몬스터에게 50% 슬로우 오라 및 17타(~6초) 주기 1.2초 시간 정지(스턴) 부여.
    - 보스방 워프 시 보스 대상 3배 집중 펄스 피해 메커니즘 정상 유지.
  - **Ctrl + Alt + Del (`HIDDEN_CTRLALTDEL`)**:
    - 4타 주기 고유 스킬 `SIGKILL`의 몬스터 체력 25% 즉시 삭제 및 15% 이하 즉사 판정을 전 맵에서 **`유닛 주변 320px 반경`**(보스방 워프 시 9999px)으로 한정.
    - 보스 방어력 50% 파괴 및 2% 최대체력 고정 피해 역시 유닛 주변 320px 내 보스 존재 시(또는 보스방 워프 시)에만 정밀하게 타격되도록 변경.

---

### 🚀 [v3.4.0] - 2026-09-23 (2-Player Co-op Hardcore Balancing & Boss Scaling Calibration)
- **2인 플레이(AI/온라인 협동) 난이도 전면 밸런스 재조정 (방안 B 적용)**:
  - **보스 체력 스케일링 상향**: 2인 모드 보스 최대 체력을 기존 1.0배에서 **`1.50배`**로 대폭 상향 (`maxHp = bossMaster.maxHp * 1.50`).
    - 솔로 보스 체력(55%) 대비 **약 2.73배**로 설정되어, 10기 유닛의 집중 화력과 방깎/증폭 시너지 속에서도 60초 타임어택의 긴장감과 보스 고유 기믹(50R 포맷 카운트다운, 80R Y2K 둠)이 정상적으로 발동되도록 조정.
  - **일반 몬스터 체력 상향**: 2인 모드 일반 몬스터 체력 배율을 기존 1.0배에서 **`1.25배`**로 상향 (솔로 0.85배 대비 약 1.47배).
  - **몬스터 스폰 물량 및 밀도 증가**: 2인 모드 웨이브 스폰 물량을 **`+15%`** 증가 (`countMultiplier = 1.15`, 보스 라운드 미니언 18 ➡️ 20마리).
  - **스폰 인터벌 압축**: 물량 증가에 맞춰 2인 모드 스폰 간격을 약 12% 단축하여 박진감 넘치는 웨이브 유입 유도. 트랙 100마리 오버플로우 위기감이 조성되어 협동 플레이의 도전 난이도 확보.

---

### 🚀 [v3.3.0] - 2026-09-23 (Visual Comfort & Unit Attack Motion Elimination Overhaul)
- **전 유닛 공격 모션 비활성화 (시각적 피로도 제로화)**:
  - **1T ~ 4T 유닛**: 유닛 자체의 물리 반동, 돌진 찌르기, 45도 회전 스냅, 360도 플립, 스탬프 슬램 등 유닛 흔들림 모션을 완전히 제거(`recoil = 0`). 소켓에 안정적으로 고정된 상태에서 적을 향한 조준 방향(`targetAngle`)만 정갈하게 추적.
  - **순수 공격 이펙트 보존**: 투사체 비행(화살, 레이저 빔, 저격탄, 마법탄 등), 다중 체인 레이저, 몬스터 피격 스파크, 둔화/기절/방깎 디버프, 플로팅 대미지 텍스트 및 사운드 효과는 100% 정상 작동.
- **5티어 히든 신화 유닛 & 휠 오브 데스 번쩍임/과도한 모션 삭제**:
  - `HIDDEN_CTRLALTDEL` (Ctrl + Alt + Del): 9px 후방 반동 킥, 키캡 고속 회전 가속(`recoil * 22`) 및 팽창, 흰색/빨간색/노란색 번쩍임, 전방 균열 충격파 호 삭제. 투사체 레이저 또한 눈부신 14px 광원 플레어에서 날렵하고 선명한 4px 관통 빔으로 최적화.
  - `HIDDEN_BSOD_WHEEL` (블랙홀 스피너): 고속 회전 모션(`animTime * 3.5`, `recoil * 35`), 코어 백색 플래시, 크기 수축/팽창, 외곽 중력파 펄스 링 삭제 ➡️ 정적 고정 벡터로 변경.
  - `T4_WHEEL` (휠 오브 데스): 상시 및 공격 시 고속 회전(`animTime * 6`, `recoil * 45`), 크기 팽창, 방사형 무지개 충격파 링 삭제 ➡️ 정적 고정 벡터로 변경.
  - `HIDDEN_QUANTUM_ERASER`: 5.5px 돌진, 팁 백색 플래시, 브러시 고속 회전 및 양자 방출파 제거.
  - `HIDDEN_ROOT_ADMIN`: 12px 슈퍼 런지, 방패 황금 플래시, 내부 반동 킥, 핵폭 충격파 호 제거.
  - `HIDDEN_DEBUG_CONSOLE`: 공격 시 좌우 지터 셰이크, 테두리 점멸, 10Hz 텍스트 점멸 및 'GOD' 플래시, 와이어프레임 파동 제거.
- **스킬 발동 시 원형 충격파 링 이펙트 제거**:
  - `HIDDEN_CTRLALTDEL` (SIGKILL): 4타마다 소켓 위치(반경 55)와 보스 위치(반경 45)에 터지던 대형 원형 충격파(`createShockwave`) 제거.
  - `HIDDEN_ROOT_ADMIN`: 3타 슈퍼 핵폭 시 발생하던 이중 원형 충격파(반경 48, 28) 제거.
  - `T4_ADMIN`: 6타 버스트 시 발생하던 원형 충격파 제거.
  - 5티어 투사체 적중 시 몹 위치에 발생하던 타격 원형 충격파 제거.
  - `GLOBAL_PULSE` 유닛(`HIDDEN_BSOD_WHEEL`, `T4_WHEEL`)이 유닛 바로 위에 0.45초/0.55초마다 연속으로 터뜨리던 14개/8개 파티클 폭발 제거.

---

### 🚀 [v3.2.0] - 2026-09-04 (Senior QA Balance Calibration & Board Jam Relief)
- **`T3_SNIPER` Balance Calibration**:
  - Defense penetration adjusted from 100% to 50% (`effectiveDef = Math.round(boss.defense * 0.5)`).
  - Range adjusted from 9999px to 250px, requiring tactical boss room warp deployment rather than sniping globally from base sockets.
- **`T4_TASKMASTER` Unique Aura**:
  - Capped global team buff (+25% Attack Speed, +12% Critical Chance) so it no longer stacks additively across multiple Taskmasters.
- **Tier 4 Boss Floor Damage (25% Anti-Stall Minimum Rule)**:
  - Enforced `baseDmg = Math.max(Math.round(rawBossDmg * 0.25), Math.round(rawBossDmg - effectiveDef))` for Tier 4 units, ensuring legendary multi-hit units (e.g. `T4_WHEEL`) deal meaningful chip damage rather than stalling at minimum 1 damage against DEF 260~1,200 bosses.
- **40R Boss (`BOSS_40R`) Difficulty Smoothing**:
  - Reduced DDoS Master HP from 350,000 to 250,000, flat defense from 140 to 80, and global lag debuff from -50% to -30% (duration 6.0s), smoothing the steep 40R cliff difficulty spike.
- **Gacha Overclock Rate Smoothing (Lv.7 ~ Lv.10)**:
  - Lv.7: 4T 2.5% (was 1.0%), T1 20%, T2 48%, T3 29.5%
  - Lv.8: 4T 4.0% (was 2.0%), T1 14%, T2 46%, T3 36%
  - Lv.9: 4T 6.0% (was 3.5%), T1 10%, T2 44%, T3 40%
  - Lv.10 MAX: 4T 8.0% (was 5.0%), 5T Jackpot 1.0% (was 0.5%), T1 7.0%, T2 41%, T3 43%
- **Tier 4 Synthesis Flexibility (Board Jam Relief)**:
  - Allowed merging ANY two 4T units: duplicate pair guarantees designated Mythic evolution (`HIDDEN_MERGE_RECIPES`), while different 4T pairs yield 100% guaranteed random 1 of 5 Tier 5 Mythics (`getRandomUnitByTier(5)`), completely resolving end-game board gridlock.
  - Added AI bot fallback to merge different 4T units when board capacity is crowded ($\ge 10$ units).

---

### 🚀 [v3.1.0] - 2026-09-04 (10-Level BIOS Summoner Overclocking Architecture)
- **10-Tier Gacha Overhaul**: Expanded summoner overclocking from 4 levels to 10 finely paced stages (`Lv.1` ~ `Lv.10 MAX`).
- **Tier 4 Gating**: Gated 4T summons at 0.0% through Lv.1~6. First 1.0% unlock occurs at Lv.7 (Post-40R DDoS barrier), scaling to 2.0% (Lv.8), 3.5% (Lv.9), and 5.0% (Lv.10).
- **Tier 5 Mythic Jackpot**: Unlocked an ultra-rare 0.5% direct Tier 5 pull exclusively at Lv.10 MAX.
- **Tier 1 Buffer**: Retained 7.5% T1 summon rate at Lv.10 (within 5~10% rule) to sustain merge material supply and prevent board oversaturation.
- **Piecewise Cost Scaling**: Mild polynomial ramp across Lv.1~5 (120B ~ 950B) transitions to steep exponential surge across Lv.6~9 (1,800B ~ 9,500B), establishing 40R as the natural gatekeeper.

---

### 🚀 [v3.0.3] - 2026-09-04 (T1_WAIT Distinct Vector Model: OS AppStarting Cursor)
- **AppStarting Cursor Art**: Replaced duplicate placeholder hourglass shape on `T1_WAIT` with the authentic OS `AppStarting` wait cursor (sleek white pointer arrow aiming at target + animated rotating cyber wait ring at bottom-right).
- **Clear Visual Distinction**: `T1_WAIT` (Tier 1 Arrow + Wait Ring, Single Slow) is now immediately distinguishable from `T2_HOURGLASS` (Tier 2 Large 360° Chrono Hourglass, AoE Field Slow).

---

### 🚀 [v3.0.2] - 2026-09-04 (ControlPanel Layout Shift & Line Wrap Elimination)
- **Zero Height Jitter**: Locked `ControlPanel` to a strict constant height (`64px`), eliminating vertical screen bouncing caused by dynamic height recalculation in centered layout.
- **Line Wrapping Prevention**: Enforced `whitespace-nowrap`, `truncate`, and removed `flex-wrap` across all unit inspector elements.
- **Symmetric 2-Row Subgrid**: Both selected and unselected states now share identical 2-row subgrid heights (`20px` + `20px`), ensuring absolute visual stability across all 25 units.

---

### 🚀 [v3.0.1] - 2026-09-04 (Bottom Deck Layout & Spacing Optimization)
- **Summon Button Removal**: Removed redundant summon button at the bottom-left of the control deck (summon remains accessible via `Space` hotkey and on-canvas circular hub button).
- **Expanded Description Panel**: Expanded unit inspector across available horizontal space with generous padding and clean gaps.
- **Attribute & Archetype Badges**: Integrated 3-way cyber attribute (`BIT`, `SEC`, `NET`) and archetype (`RAPID`, `AOE`, `HEAVY`, `SUPP`) indicators directly into the inspector.
- **Keycap Guide Spacing**: Increased spacing and distinct rounded cards for hotkey guidance (`Space`, `U`, `Drag`, `2x`).

---

### 🚀 [v3.0.0] - 2026-09-04 (Major Milestone: 80R Rebalance, 3-Way Affinities & Clean UI)

#### ⚖️ 1. Complete Balance Overhaul (`BALANCE.md`, `units.ts`, `bosses.ts`)
- **3-Way Elemental Affinities**: Introduced circular rock-paper-scissors system:
  - `BIT` (Compute/Single) > `SEC` (Security/Control) > `NET` (Network/AoE) > `BIT`.
  - Advantage: **+35% (x1.35)** / Disadvantage: **-50% (x0.50)**.
- **Combat Archetypes**:
  - `RAPID`: High attack speed (0.30~0.42s), low base damage. Blocked by boss armor.
  - `AOE`: Moderate attack speed (0.55~0.85s), low single-target damage. Wave clear specialist.
  - `HEAVY`: Slow attack speed (0.90~1.45s), high damage (1.8~3.2x), long range (200~9999px). Penetrates boss flat DEF.
  - `SUPP`: Debuffs, damage amplification, and team aura buffs. Added `T1_WAIT` (Slow) to complete 5x5 (25 units) matrix.
- **Anti-Spam Boss Defense & Rate-Limiting**:
  - Flat DEF post-40R: 40R (140) -> 50R (260) -> 60R (450) -> 70R (750) -> 80R (1,200).
  - Rate-limiting firewall: Caps valid hits per 0.25s window (3~6 hits), dampening excess hits by **70%~90%**.
  - Tier boss damage multipliers: T1 (0.2x), T2 (0.4x), T3 (0.85x), T4 (1.6x), T5 (2.5x), forcing elite tier consolidation.

#### 🎨 2. Visual & FX Optimization (`CursorRenderer.ts`, `GameCanvas.svelte`)
- **Sparkle / Noise Elimination**: Removed rotating mythic flares, rainbow halos, and summon starburst particles around cursor units for clean rendering.
- **Fixed 1.0 Unit Scale**: Removed recoil expansion (scale > 1.0) on all units. Recoil uses pure translation offsets.
- **Combat Text Cleanup**: Removed cluttering skill floating banners (`[SUDO]`, `[SIGKILL]`, `STUN`, `EXECUTE`), retaining only damage numbers and currency gains.

#### 🖥️ 3. UI/UX Modernization
- Replaced retro Win98 theme with modern dark cyber gaming aesthetic.
- Standardized typography to Pretendard single font.
- Compact HUD, 3-column modal grids, and optimized padding throughout.

---

### 📦 Condensed Historical Versions Summary (`v1.0.0` ~ `v2.9.x`)

| Version Range | Release Date | Key Features & Milestones |
|:---|:---:|:---|
| **`v2.9.0` ~ `v2.9.5`** | 2026-09-04 | 100-mob limit expansion, 25s round pacing, compact UI design, removal of screen noise, archetype split, boss rate-limiting firewall, `BALANCE.md` integration. |
| **`v2.7.0` ~ `v2.8.x`** | 2026-09-04 | 80-round expansion, 8 boss encounters culminating in 80R Y2K Millennium Doom, 5 Mythic Hidden units, Web Audio API procedural sound engine. |
| **`v2.5.0` ~ `v2.6.x`** | 2026-09-03 | Guaranteed deterministic merge recipes, boss chamber warp mechanic (max 5 units), drag-and-drop merging UX. |
| **`v2.0.0` ~ `v2.4.x`** | 2026-09-02 | Svelte 5 Runes migration (`$state`, `$derived`, `$props`), dual-lane co-op architecture, BIOS overclock gacha levels 1~5. |
| **`v1.0.0` ~ `v1.5.x`** | 2026-09-01 | Initial release: 16:9 Canvas 2D procedural vector cursor towers, circular mob pathing, 4-tier basic unit roster. |
