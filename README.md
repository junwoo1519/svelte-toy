# 🎯 Cursor Defense

> **"Real-time dark cyber tactical cursor tower defense game protecting kernel memory from virus incursions."**

![Version](https://img.shields.io/badge/version-4.0.2-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-orange.svg)
![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)

---

## 📖 Overview
- **Resolution**: 1280 x 720 (16:9 fixed viewport)
- **Engine**: Svelte 5 (Runes) + Procedural HTML5 Canvas 2D + Web Audio API
- **Gameplay**:
  - Spend Bytes to summon 25 cursor units across 5 tiers (1~4T standard + 5T Mythic Hidden Merges).
  - **Instant Auto-Merge & Chain Reaction**: Duplicate units automatically merge upon summoning, triggering cascading combos.
  - **Lucky Boss Warp**: When a boss appears, 5 random field units are automatically drafted into the boss chamber.
  - **Automatic Boss Overclock**: Defeating bosses automatically upgrades BIOS gacha summon rates (Lv.1 ~ Lv.8 MAX).
  - **RNG Skill Procs**: High-tier legendary & mythic units unleash devastating skills on low-chance (5%~10%) proc rolls.
  - 80 rounds, 100-mob overflow limit, and 8 unique boss encounters (BSOD, CIH Chernobyl, Y2K Millennium Doom).
  - Supports Solo, AI Co-op, and real-time WebSocket 2P Co-op modes.

---

## 🕹️ Controls
- **Summon Unit**: Click **`[🎲 Summon: XX Byte]`** button or press **`Space`** (supports rapid summoning).
- **Auto-Merge**: Duplicate units automatically merge into higher tiers (with Quantum Jump chance & chain reactions).
- **Inspect / Sell**: Click a placed unit to inspect stats, archetype, and attribute; click floating `[Sell (+XX Byte)]` button to refund.
- **Boss Chamber**: Automatically drafts 5 random units into the boss chamber during boss encounters (recalled on boss clear).

---

## 📌 Version Synchronization Checklist (6 Target Files)
Every release must synchronously update the version tag across these 6 locations:
1. 🖥️ `src/lib/components/ModeSelectModal.svelte` (`vX.X.X`)
2. 🛡️ `src/lib/components/TopHud.svelte` (`vX.X.X`)
3. 🌐 `src/routes/+page.svelte` (`vX.X.X`)
4. 📜 `CHANGELOG.md` (`vX.X.X`)
5. 📘 `README.md` (`version-X.X.X-blue.svg`)
6. ⚖️ `BALANCE.md` (`vX.X.X`)

---

## 📚 Technical Documentation
- **Architecture & Engine Specification**: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Balance Datasheet, Affinities & Formulas**: [`BALANCE.md`](./BALANCE.md)
- **Version Release History**: [`CHANGELOG.md`](./CHANGELOG.md)

---

## 🛠️ Build & Run
```bash
# Start local dev server (SvelteKit + WebSocket relay)
npm run dev

# Run TypeScript & Svelte diagnostics
npm run check

# Build production bundle
npm run build
```
