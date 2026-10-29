# 📜 Cursor Defense - Changelog & Version History

---

## 📌 Latest Version: `v4.0.2` (2026-10-13)

> 💡 **Version Synchronization Rule**:
> All releases must synchronize version strings across 6 files:
> 1. 🖥️ `src/lib/components/ModeSelectModal.svelte` (`vX.X.X`)
> 2. 🛡️ `src/lib/components/TopHud.svelte` (`vX.X.X`)
> 3. 🌐 `src/routes/+page.svelte` (`vX.X.X`)
> 4. 📜 `CHANGELOG.md` (`vX.X.X`)
> 5. 📘 `README.md` (`version-X.X.X-blue.svg`)
> 6. ⚖️ `BALANCE.md` (`vX.X.X`)

---

### 🚀 [v4.0.2] - 2026-10-13 (Visual Clarity: Summon Floating Text Elimination)
- **🧹 Summon Floating Text Removal**:
  - Completely removed floating text popups upon unit summoning (`[Legendary Summon]`, `[Hero Summon]`, `[Rare Summon]`, `UnitName`).
  - Sustained rich procedural audio fanfares and summon particle bursts with Tier 4+ shockwaves (`createShockwave`), ensuring instantaneous, tactile feedback during rapid Spacebar summoning without screen noise.

---

### 🚀 [v4.0.1] - 2026-10-13 (Visual Clarity: Ephemeral Text Removal & Enhanced Combat VFX)
- **🧹 Auto-Merge Floating Text Removal**:
  - Removed short-lived floating text banners on auto-merges (`[MYTHIC]`, `[JACKPOT!]`, `[CHAIN COMBO]`, `[LEGENDARY]`, `AUTO-MERGE: ...`) which vanished too rapidly to read.
  - Enhanced visual punchiness with crisp radial shockwaves (`createShockwave`), high-density pixel cube bursts (`createPixelCubes`), and rich audio cues without text clutter.
- **⚡ Skill Proc Floating Text Streamlining**:
  - Removed ephemeral skill proc banners that cluttered the screen during fast-paced combat (`[ADMIN 400%]`, `[SUDO 8%]`, `[SIGKILL 5%]`, `[TIME STOP 5%]`, `[WAND EXECUTE]`, `[QUANTUM ERASE]`).
  - Replaced text popups with dedicated high-impact visual effects (attribute-colored shockwaves, glitch bursts, and pixel cube showers) while retaining clean floating damage numbers (`💥 -${damage}`) on targets.
- **🌐 Documentation Language Standardization**:
  - Formally codified the English documentation rule in `ARCHITECTURE.md` Section 7.
  - Standardized all repository markdown files (`README.md`, `CHANGELOG.md`, `BALANCE.md`, `ARCHITECTURE.md`) to 100% English.

---

### 🚀 [v4.0.0] - 2026-10-13 (Major Milestone: Instant Auto-Merge, Lucky Boss Warp & RNG Proc Overhaul)
- **⚡ Instant Auto-Merge & Cascading Chain Reaction System**:
  - Overhauled manual drag-and-drop merging: summoning a unit immediately checks the field for duplicate pairs and instantly merges them into a higher tier.
  - **Cascading Chain Combos**: When newly synthesized higher-tier units match existing units on the field, cascading merges trigger in sequence (`⚡ CHAIN COMBO x2!`, `🌟 TRIPLE MERGE x3!`), awarding bonus Byte currency.
  - **Tier 4 Auto-Synthesis & Board Jam Relief**: Identical 4T pairs automatically evolve into their designated Tier 5 Mythic. If field capacity reaches $\ge 10$ units without matching pairs, disparate 4T units automatically fuse into a random Tier 5 Mythic to prevent end-game gridlock.
- **🏛️ Lucky Boss Warp (RNG 5-Unit Draft Deployment)**:
  - Replaced manual warp double-clicking and re-rolls with pure fortune: upon entering boss encounters (10R, 20R, ...), 5 random units are drafted from the field and warped directly into the boss chamber.
  - Upon boss defeat or round completion, all 5 deployed units are safely recalled back to their home base sockets.
- **📈 Automatic BIOS Summoner Overclock on Boss Defeat (Lv.1 ~ Lv.8 MAX)**:
  - Completely eliminated manual Byte spending on overclock level upgrades.
  - Defeating each boss automatically levels up the summoner overclock rate (Clear 10R: Lv.2 ➡️ Clear 70R: Lv.8 MAX).
  - Streamlines economic decision-making, allowing players to focus 100% of their Byte currency on rapid summoning and lucky merge combos.
- **🎯 Thrilling Low-Chance RNG Skill Procs (5% ~ 10% Jackpot Rolls)**:
  - Replaced fixed N-hit countdown cycles with thrilling, low-chance (5%~10%) RNG proc rolls calibrated around attack speeds:
    - **`T4 Administrator Pointer`**: **8% proc chance** on attack for 400% Critical Strike (5,000 nuclear damage + 2.0s AoE Stun).
    - **`T4 Magic Wand`**: **10% proc chance** on attack for 800 magic burst and instant execution on targets below 18% HP.
    - **`T5 Root Superuser (SUDO)`**: **8% proc chance** on attack for 500% (750% vs Bosses) true damage strike (10,000 execute).
    - **`T5 Ctrl + Alt + Del`**: **5% proc chance** on attack for `SIGKILL` (25% current HP wipe + 50% boss armor shred & 2% max HP true damage).
    - **`T5 Black Hole Spinner`**: **5% proc chance** per pulse for 1.2s localized time-stop stun (3x boss damage multiplier).
    - **`T5 Quantum Eraser`**: **6% proc chance** on hit to instantly erase enemies below 25% HP + 2 Byte cash bonus.
    - **`T5 Cheat Engine`**: **6% proc chance** per pulse to unleash a 5s decaying corrosion debuff dealing 6% max HP/s.
- **🖥️ UI & Control Deck Modernization**:
  - Replaced split summon capsules with a single, wide **`[ 🎲 Summon: XX Byte (Space) ]`** button, maximizing tactile rapid summoning.
  - Removed canvas drag-linking vectors; clicking a placed unit opens unit inspection and quick-sell (`[Sell (+XX Byte)]`).

---

### 🚀 [v3.6.0] - 2026-09-23 (Anytime Boss Chamber Warp & Boss Characteristic Unit Penalty Overhaul)
- **Anytime Boss Chamber Warp & Recall**:
  - Removed boss-round-only deployment constraints; players can double-click units anytime during standard rounds to deploy up to 5 units into the boss chamber or recall them back to base.
  - Eliminated automatic ejection upon round transitions and boss clear, granting players full strategic authority over forward deployments.
  - Integrated persistent occupancy telemetry (`1P Deployed: X/5`) and double-click guidance at the bottom-center of the boss room.
- **Malware-Themed Boss Characteristic Penalties**:
  - **10R Popup Spam Bot**: Obstructive popups reduce all friendly unit attack ranges by **-20%** while the boss is active.
  - **20R Trojan Horse**: Every 14s, infects 1 friendly unit as a spy (`trojanDuration: 6.0s`), disabling attacks and contaminating adjacent left/right sockets with **-25%** damage reduction (`🕵️ SPY` badge).
  - **30R Ransomware**: Targets and locks the highest-tier active carry unit in hostage encryption (5.0s complete freeze).
  - **40R DDoS Master**: Traffic overload imposes -30% attack speed lag and **25% Packet Loss (Miss)** chance per projectile.
  - **50R Blue Screen of Death (BSOD)**: Every 10s causes memory dump crashes across 2 units (`SEC` security units retain 50% firewall resistance).
  - **60R CIH Chernobyl**: Implements hardware overheating (triggers 2.0s emergency cooling shutdown every 12 attacks, labeled `🔥 OVERHEAT`).
  - **70R Cryptojacking**: Illegal mining power drain inflicts persistent **-25%** attack speed reduction and steals **1 Byte on 8% of attacks**.
  - **80R Y2K Millennium Doom**: Millennial time paradox reduces projectile flight speed by **-50%** and introduces random attack cooldown jitter (0.7x ~ 1.4x tempo distortion).

---

### 🚀 [v3.5.0] - 2026-09-23 (Global Pulse to Localized Surrounding AoE Conversion Overhaul)
- **Global Pulse to Localized Surrounding AoE Conversion**:
  - **Wheel of Death (`T4_WHEEL`)**:
    - Converted attack mechanism from full-screen hit (`GLOBAL_PULSE`, range 9999) to a **localized 180px pulsing aura (`AOE_AURA`)**.
    - Rebalanced base damage from 140 ➡️ **160** to reward tactical choke point socket positioning.
    - Added an intuitive 180px canvas range indicator ring upon hovering or selecting the unit.
  - **Black Hole Spinner (`HIDDEN_BSOD_WHEEL`)**:
    - Converted attack mechanism from full-screen hit (`GLOBAL_PULSE`, range 9999) to a **260px heavy pulsing aura (`AOE_AURA`)**.
    - Increased base damage from 480 ➡️ **520**. Emits a 50% slow aura and 1.2s time-stop stun every 17 hits (~6s).
    - Preserved 3x focused pulse damage multiplier against bosses when deployed in the boss chamber.
  - **Ctrl + Alt + Del (`HIDDEN_CTRLALTDEL`)**:
    - Restricted 4-hit `SIGKILL` (25% HP deletion and sub-15% execution) from full-screen to a **320px localized radius around the unit** (9999px when warped to boss room).
    - 50% boss defense shred and 2% max HP true damage apply only when the boss is within 320px range (or within boss chamber).

---

### 🚀 [v3.4.0] - 2026-09-23 (2-Player Co-op Hardcore Balancing & Boss Scaling Calibration)
- **2-Player Co-op (AI / Online) Difficulty Rebalance (Plan B)**:
  - **Boss Health Scaling**: Scaled 2P boss max HP from 1.0x to **`1.50x`** (`maxHp = bossMaster.maxHp * 1.50`), representing ~2.73x solo boss health (55%), ensuring 60s time-attack tension and late-game boss gimmicks trigger reliably.
  - **Minion Health Scaling**: Scaled 2P normal monster HP multiplier from 1.0x to **`1.25x`** (~1.47x solo 0.85x).
  - **Wave Spawn Volume & Density**: Increased 2P wave spawn count by **`+15%`** (`countMultiplier = 1.15`, boss round minions 18 ➡️ 20).
  - **Compressed Spawn Intervals**: Shortened 2P spawn intervals by ~12% to induce thrilling wave influx, ensuring 100-mob track overflow pressure challenges coordinated players.

---

### 🚀 [v3.3.0] - 2026-09-23 (Visual Comfort & Unit Attack Motion Elimination Overhaul)
- **Unit Attack Motion Elimination (Zero Visual Fatigue)**:
  - **Tier 1 ~ 4 Units**: Completely eliminated unit physical recoil, lunges, 45-degree rotational snaps, 360-degree flips, and stamp slams (`recoil = 0`). Units stay firmly locked into sockets while smoothly tracking target angles (`targetAngle`).
  - **Preserved Pure Combat VFX**: Fully preserved projectile flight (arrows, laser beams, sniper rounds, magic bolts), multi-chain lightning, impact sparks, slow/stun/shred debuff halos, floating damage numbers, and procedural audio.
- **Tier 5 Mythic & T4 Wheel Flash / Motion Removal**:
  - `HIDDEN_CTRLALTDEL` (Ctrl + Alt + Del): Removed 9px recoil kick, keycap high-speed spin acceleration (`recoil * 22`), scale pulsation, white/red/yellow flashing, and ground shockwave arcs. Streamlined projectile from 14px flare to a crisp 4px penetrating beam.
  - `HIDDEN_BSOD_WHEEL` (Black Hole Spinner): Removed high-speed spin (`animTime * 3.5`), core white flash, scale breathing, and gravitational pulse rings ➡️ replaced with static vector geometry.
  - `T4_WHEEL` (Wheel of Death): Removed spin rotation (`animTime * 6`), size pulsing, and radial rainbow rings ➡️ replaced with static vector geometry.
  - `HIDDEN_QUANTUM_ERASER`: Removed 5.5px lunge, tip flash, brush high-speed spin, and quantum emission waves.
  - `HIDDEN_ROOT_ADMIN`: Removed 12px super lunge, golden shield flash, internal recoil kick, and shockwave arcs.
  - `HIDDEN_DEBUG_CONSOLE`: Removed jitter shake, border strobing, 10Hz text blinking, 'GOD' flash, and wireframe wave ripples.
- **Skill Trigger Circular Shockwave Removal**:
  - `HIDDEN_CTRLALTDEL` (SIGKILL): Removed large circular shockwaves (`createShockwave`) spawned at socket (radius 55) and boss location (radius 45).
  - `HIDDEN_ROOT_ADMIN`: Removed dual circular shockwaves (radius 48, 28) on super strike.
  - `T4_ADMIN`: Removed circular shockwaves on 6-hit burst.
  - Removed circular impact shockwaves on Tier 5 projectile hits.
  - Removed 14/8-particle burst explosions spawned directly over `GLOBAL_PULSE` units (`HIDDEN_BSOD_WHEEL`, `T4_WHEEL`).

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
