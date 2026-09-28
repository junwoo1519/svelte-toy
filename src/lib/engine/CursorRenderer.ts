import type { UnitMaster } from '$lib/types/game';

/**
 * Procedural Vector Cursor Renderer with Dynamic Aim Rotation & Attack Animations
 * - Aim Rotation: Directional units smoothly track and point towards targetAngle.
 * - Physics Curve: Instant 1.0 peak recoil on attack frame, followed by smooth elastic decay.
 * - Attack Actions:
 *   1) 찌르기 & 클릭형 (Lunge / Tap): Arrow, Hand, Select, Admin, SUDO
 *   2) 정밀 사격 & 저격 반동형 (Kickback / Recoil): Sniper, Cross, I-Beam, Aim, Ctrl+Alt+Del
 *   3) 초고속 회전 & 와류 방출형 (Hyperspeed Cyclone / Spin): Spinner, Hourglass, Wheel, BSOD Wheel, Resize
 *   4) 물리 타격 & 스탬프 & 키다운형 (Stamp / Keydown / Matrix): Denied, Macro, Console, Cheat Engine
 *   5) 마법 영창 & 다중 분신 & 지휘 오라형 (Spell / Multicast / Command): Magic Wand, MultiDrag, Quantum Eraser, Link, Taskmaster
 */
export function drawCursorUnit(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	unit: UnitMaster,
	isWarped: boolean = false,
	isFrozen: boolean = false,
	animTime: number = 0,
	scale: number = 1.0,
	attackProgress: number = 0, // 1.0 (firing peak) -> 0.0 (rest)
	targetAngle: number = -Math.PI * 0.75
) {
	ctx.save();
	ctx.translate(x, y);

	// 1. Attack motions disabled: All attack motions (kickback, lunge, spin bursts, flips) are removed
	// to keep units steady, while all in-game attack effects (projectiles, lasers, hits) remain active.
	const recoil = 0;

	// 2. Base Tier Socket Aura: Disabled to eliminate sparkle/aura noise around cursors

	// 3. Frozen Effect (30R Ransomware / 60R Bad Sector)
	if (isFrozen) {
		drawFrozenLock(ctx);
		ctx.restore();
		return;
	}

	// 4. Warped Strike Mode Frame
	if (isWarped) {
		ctx.beginPath();
		ctx.arc(0, 0, 12, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
		ctx.fill();
		ctx.strokeStyle = '#fbbf24';
		ctx.lineWidth = 1.2;
		ctx.stroke();
	}

	// 5. Directional Attack Lunge / Recoil Kickback Translation
	let transX = 0;
	let transY = 0;
	if (recoil > 0.001) {
		switch (unit.id) {
			// 찌르기 & 돌진형 (Forward Lunge along target axis)
			case 'T1_ARROW':
				transX = Math.cos(targetAngle) * (recoil * 8.0);
				transY = Math.sin(targetAngle) * (recoil * 8.0);
				break;
			case 'T1_HAND':
				transX = Math.cos(targetAngle) * (recoil * 7.0);
				transY = Math.sin(targetAngle) * (recoil * 7.0);
				break;
			case 'T2_SELECT':
				transX = Math.cos(targetAngle) * (recoil * 6.0);
				transY = Math.sin(targetAngle) * (recoil * 6.0);
				break;
			case 'T4_ADMIN':
				transX = Math.cos(targetAngle) * (recoil * 9.0);
				transY = Math.sin(targetAngle) * (recoil * 9.0);
				break;
			case 'T4_MAGICWAND':
				transX = Math.cos(targetAngle) * (recoil * 4.5);
				transY = Math.sin(targetAngle) * (recoil * 4.5);
				break;
			case 'T3_MULTIDRAG':
				transX = Math.cos(targetAngle) * (recoil * 4.0);
				transY = Math.sin(targetAngle) * (recoil * 4.0);
				break;

			// 사격 & 저격 반동형 (Heavy Kickback away from target)
			case 'T3_SNIPER':
				transX = -Math.cos(targetAngle) * (recoil * 11.0);
				transY = -Math.sin(targetAngle) * (recoil * 11.0);
				break;
			case 'T1_CROSS':
				transX = -Math.cos(targetAngle) * (recoil * 6.0);
				transY = -Math.sin(targetAngle) * (recoil * 6.0);
				break;
			case 'T1_IBEAM':
				transX = -Math.cos(targetAngle) * (recoil * 5.0);
				transY = -Math.sin(targetAngle) * (recoil * 5.0);
				break;
			case 'T2_AIM':
				transX = -Math.cos(targetAngle) * (recoil * 7.5);
				transY = -Math.sin(targetAngle) * (recoil * 7.5);
				break;

			default:
				// Anchored units (Hourglass, Resize, Link, Spinner, Denied, Macro, Wheel, Console, Taskmaster, BSOD, Debug, T5 Mythics)
				break;
		}
	}

	ctx.translate(transX, transY);
	ctx.scale(scale, scale);

	// Retro drop shadow for 3D cursor clarity
	ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
	ctx.shadowBlur = 3;
	ctx.shadowOffsetX = 1.5;
	ctx.shadowOffsetY = 1.5;

	ctx.fillStyle = unit.themeColor;
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 1.8;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

	// 6. Draw Vector Unit Shapes with Custom Aim Rotation & Unique Actions
	switch (unit.id) {
		case 'T1_ARROW':
			drawSleekArrow(ctx, '#ffffff', '#38bdf8', recoil, targetAngle);
			break;
		case 'T1_IBEAM':
			drawSleekIBeam(ctx, recoil, targetAngle);
			break;
		case 'T1_CROSS':
			drawSleekCross(ctx, recoil, targetAngle);
			break;
		case 'T1_HAND':
			drawSleekHand(ctx, recoil, targetAngle);
			break;
		case 'T1_WAIT':
			drawSleekWait(ctx, animTime, recoil, targetAngle);
			break;

		case 'T2_AIM':
			drawSleekAim(ctx, animTime, recoil, targetAngle);
			break;
		case 'T2_HOURGLASS':
			drawSleekHourglass(ctx, animTime, recoil);
			break;
		case 'T2_RESIZE':
			drawSleekResize(ctx, animTime, recoil);
			break;
		case 'T2_LINK':
			drawSleekLink(ctx, animTime, recoil, targetAngle);
			break;
		case 'T2_SELECT':
			drawSleekSelect(ctx, animTime, recoil, targetAngle);
			break;

		case 'T3_SNIPER':
			drawSleekSniper(ctx, animTime, recoil, targetAngle);
			break;
		case 'T3_SPINNER':
			drawSleekSpinner(ctx, animTime, recoil);
			break;
		case 'T3_DENIED':
			drawSleekDenied(ctx, animTime, recoil);
			break;
		case 'T3_MULTIDRAG':
			drawSleekMultiDrag(ctx, animTime, recoil, targetAngle);
			break;
		case 'T3_MACRO':
			drawSleekMacro(ctx, animTime, recoil);
			break;

		case 'T4_WHEEL':
			drawSleekWheel(ctx, animTime, recoil);
			break;
		case 'T4_MAGICWAND':
			drawSleekMagicWand(ctx, animTime, recoil, targetAngle);
			break;
		case 'T4_ADMIN':
			drawSleekAdmin(ctx, animTime, recoil, targetAngle);
			break;
		case 'T4_CONSOLE':
			drawSleekConsole(ctx, animTime, recoil);
			break;
		case 'T4_TASKMASTER':
			drawSleekTaskmaster(ctx, animTime, recoil);
			break;

		case 'HIDDEN_CTRLALTDEL':
			drawSleekCtrlAltDel(ctx, animTime, recoil, targetAngle);
			break;
		case 'HIDDEN_BSOD_WHEEL':
			drawSleekBlackholeWheel(ctx, animTime, recoil);
			break;
		case 'HIDDEN_QUANTUM_ERASER':
			drawSleekQuantumEraser(ctx, animTime, recoil, targetAngle);
			break;
		case 'HIDDEN_ROOT_ADMIN':
			drawSleekRootAdmin(ctx, animTime, recoil, targetAngle);
			break;
		case 'HIDDEN_DEBUG_CONSOLE':
			drawSleekCheatEngine(ctx, animTime, recoil);
			break;

		default:
			drawSleekArrow(ctx, '#ffffff', '#38bdf8', recoil, targetAngle);
			break;
	}

	ctx.restore();
}

// ----------------------------------------------------
// Base Holographic Socket Auras
// ----------------------------------------------------

function drawTierBaseAura(
	ctx: CanvasRenderingContext2D,
	unit: UnitMaster,
	recoil: number,
	animTime: number,
	targetAngle: number
) {
	if (unit.tier === 5) {
		// Mythic Crimson/Gold Quantum Aura & Supernova Muzzle Burst
		const pulse = Math.sin(animTime * 6) * 2;
		ctx.beginPath();
		ctx.arc(0, 0, 20 + recoil * 6 + pulse, 0, Math.PI * 2);
		ctx.strokeStyle = '#FF0055';
		ctx.lineWidth = 2 + recoil * 2;
		ctx.setLineDash([6, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.beginPath();
		ctx.arc(0, 0, 17 + recoil * 4, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(255, 0, 85, ${0.25 + recoil * 0.4})`;
		ctx.fill();

		// Rotating outer mythic sparkles & solar flares
		const flareCount = recoil > 0.1 ? 6 : 3;
		for (let a = 0; a < flareCount; a++) {
			const ang = animTime * 4 + (a * Math.PI * 2) / flareCount;
			const dist = 20 + recoil * 8;
			const spX = Math.cos(ang) * dist;
			const spY = Math.sin(ang) * dist;
			ctx.fillStyle = a % 2 === 0 ? '#FFD700' : '#FF0055';
			ctx.beginPath();
			ctx.arc(spX, spY, 2 + recoil * 2, 0, Math.PI * 2);
			ctx.fill();
		}

		// Firing Hypernova Starburst along target axis
		if (recoil > 0.1) {
			ctx.save();
			ctx.rotate(targetAngle);
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.moveTo(14 + recoil * 10, 0);
			ctx.lineTo(6, -4 * recoil);
			ctx.lineTo(6, 4 * recoil);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
	} else if (unit.tier === 4) {
		// Legendary Prismatic Halo & Stellar Flare
		ctx.beginPath();
		ctx.arc(0, 0, 18 + recoil * 4.5, 0, Math.PI * 2);
		ctx.strokeStyle = `hsla(${(animTime * 140) % 360}, 95%, 65%, ${0.6 + recoil * 0.3})`;
		ctx.lineWidth = 1.5 + recoil * 1.5;
		ctx.setLineDash([4, 4]);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.beginPath();
		ctx.arc(0, 0, 16 + recoil * 3, 0, Math.PI * 2);
		ctx.fillStyle = `hsla(${(animTime * 140) % 360}, 90%, 60%, ${0.18 + recoil * 0.3})`;
		ctx.fill();

		// Firing Prismatic Sparkles
		if (recoil > 0.1) {
			ctx.save();
			ctx.rotate(animTime * 6);
			for (let k = 0; k < 4; k++) {
				const ang = (k * Math.PI) / 2;
				ctx.strokeStyle = '#FBBF24';
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(Math.cos(ang) * (20 * recoil), Math.sin(ang) * (20 * recoil));
				ctx.stroke();
			}
			ctx.restore();
		}
	} else if (unit.tier === 3) {
		// Epic Neon Violet Aura & Diamond Spark
		ctx.beginPath();
		ctx.arc(0, 0, 16 + recoil * 3.5, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + recoil * 0.4})`;
		ctx.lineWidth = 1.2 + recoil * 1.2;
		ctx.setLineDash([3, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.fillStyle = `rgba(147, 51, 234, ${0.15 + recoil * 0.25})`;
		ctx.beginPath();
		ctx.arc(0, 0, 15 + recoil * 2, 0, Math.PI * 2);
		ctx.fill();

		// Firing Violet Spark
		if (recoil > 0.1) {
			ctx.save();
			ctx.rotate(targetAngle);
			ctx.fillStyle = '#C084FC';
			ctx.fillRect(8, -1.5, 8 * recoil, 3);
			ctx.restore();
		}
	} else if (unit.tier === 2) {
		// Rare Cyan Cyber Pulse
		ctx.beginPath();
		ctx.arc(0, 0, 15 + recoil * 2, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
		ctx.fill();
	}
}

function drawFrozenLock(ctx: CanvasRenderingContext2D) {
	ctx.beginPath();
	ctx.arc(0, 0, 17, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
	ctx.fill();
	ctx.strokeStyle = '#0284c7';
	ctx.lineWidth = 2;
	ctx.stroke();

	ctx.font = '12px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('🔒', 0, 0);
}

// ----------------------------------------------------
// Reusable Helper: Sleek Pointer Vector Path
// ----------------------------------------------------

function drawSleekArrowShape(
	ctx: CanvasRenderingContext2D,
	bodyColor = '#ffffff',
	accentColor = '#38bdf8',
	recoil = 0
) {
	ctx.beginPath();
	ctx.moveTo(-5, -12); // Tip
	ctx.lineTo(-5, 9);
	ctx.lineTo(-1, 5);
	ctx.lineTo(4, 11);
	ctx.lineTo(7, 9);
	ctx.lineTo(2, 3);
	ctx.lineTo(9, 3);
	ctx.closePath();

	ctx.fillStyle = bodyColor;
	ctx.fill();
	ctx.stroke();

	// Glossy Bevel Highlight
	ctx.beginPath();
	ctx.moveTo(-4, -10);
	ctx.lineTo(-4, 7);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : accentColor;
	ctx.lineWidth = 1 + recoil * 1.5;
	ctx.stroke();
}

// ----------------------------------------------------
// TIER 1: Standard OS Cursors
// ----------------------------------------------------

/** T1_ARROW: 대상 방향으로 팁 회전 조준 + 8px 스냅 런지 찌르기 + 커서 팁 클릭 파문 펄스 */
function drawSleekArrow(
	ctx: CanvasRenderingContext2D,
	bodyColor = '#ffffff',
	accentColor = '#38bdf8',
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	// Tip is at (-5, -12), angle Math.atan2(-12, -5) ≈ -1.9656 rad.
	const baseAngle = Math.atan2(-12, -5);
	ctx.rotate(targetAngle - baseAngle);

	drawSleekArrowShape(ctx, bodyColor, accentColor, recoil);

	// 💥 Click Ripple Wave & Tip Muzzle Flash on attack
	if (recoil > 0.05) {
		// Expanding Click Ripple Ring bursting forward from tip (-5, -12)
		ctx.beginPath();
		ctx.arc(-5, -12, 3 + recoil * 14, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * recoil})`;
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Secondary sharp inner ring
		ctx.beginPath();
		ctx.arc(-5, -12, 2 + recoil * 6, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(255, 255, 255, ${recoil})`;
		ctx.lineWidth = 1.2;
		ctx.stroke();

		// Bright diamond muzzle spark at tip
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		const tipX = -5;
		const tipY = -12;
		const sp = 2 + recoil * 4;
		ctx.moveTo(tipX, tipY - sp);
		ctx.lineTo(tipX + sp * 0.6, tipY);
		ctx.lineTo(tipX, tipY + sp);
		ctx.lineTo(tipX - sp * 0.6, tipY);
		ctx.closePath();
		ctx.fill();
	}

	ctx.restore();
}

/** T1_IBEAM: 레이저 슬릿 바 직각 조준 + 5px 후방 반동 킥 + 중심 펄스 관통 섬광 */
function drawSleekIBeam(
	ctx: CanvasRenderingContext2D,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	// Stands perpendicular to target angle (slicing text beam bar)
	ctx.rotate(targetAngle + Math.PI / 2);

	const expandH = 9 + recoil * 5;
	const barW = 7 + recoil * 2;

	ctx.beginPath();
	ctx.moveTo(-barW, -expandH); ctx.lineTo(barW, -expandH);
	ctx.moveTo(0, -expandH); ctx.lineTo(0, expandH);
	ctx.moveTo(-barW, expandH); ctx.lineTo(barW, expandH);
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 3.5;
	ctx.stroke();

	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#38bdf8';
	ctx.lineWidth = 1.8 + recoil * 1.5;
	ctx.stroke();

	// Center laser diode emitting piercing pulse
	ctx.beginPath();
	ctx.arc(0, 0, 2 + recoil * 3, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// Slicing laser guide lines on fire
	if (recoil > 0.1) {
		ctx.beginPath();
		ctx.moveTo(0, -expandH - 4);
		ctx.lineTo(0, expandH + 4);
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}

	ctx.restore();
}

/** T1_CROSS: 조준선 타겟 축 정렬 + 6px 후방 반동 + 45도 스냅 스핀 및 머즐 스파크 */
function drawSleekCross(
	ctx: CanvasRenderingContext2D,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle); // Align crosshair to target axis
	ctx.rotate(recoil * (Math.PI / 4)); // 45 deg snap spin

	ctx.beginPath();
	ctx.moveTo(0, -11 - recoil * 3); ctx.lineTo(0, 11 + recoil * 3);
	ctx.moveTo(-11 - recoil * 3, 0); ctx.lineTo(11 + recoil * 3, 0);
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 3.5;
	ctx.stroke();

	ctx.strokeStyle = recoil > 0.2 ? '#fca5a5' : '#f8fafc';
	ctx.lineWidth = 1.8;
	ctx.stroke();

	// Center Precision Reticle Ring
	ctx.beginPath();
	ctx.arc(0, 0, 4.5 + recoil * 3, 0, Math.PI * 2);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#38bdf8';
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(0, 0, 2 + recoil * 2.5, 0, Math.PI * 2);
	ctx.fillStyle = recoil > 0.2 ? '#fbbf24' : '#ef4444';
	ctx.fill();

	// 💥 Crosshair muzzle sparks along 4 axes
	if (recoil > 0.1) {
		for (let i = 0; i < 4; i++) {
			const a = (i * Math.PI) / 2;
			ctx.beginPath();
			ctx.arc(Math.cos(a) * (11 + recoil * 4), Math.sin(a) * (11 + recoil * 4), 1.5, 0, Math.PI * 2);
			ctx.fillStyle = '#f87171';
			ctx.fill();
		}
	}

	ctx.restore();
}

/** T1_HAND: 검지 손가락 타겟 조준 + 7px 전방 런지 + 손끝 탭(Tap) 클릭 링 파문 */
function drawSleekHand(
	ctx: CanvasRenderingContext2D,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	// Index finger tip is at (0, -11). Base angle is -Math.PI / 2
	ctx.rotate(targetAngle + Math.PI / 2);

	// Tap motion: finger press scale
	const tapScaleY = 1 - recoil * 0.12;
	ctx.scale(1, tapScaleY);

	ctx.beginPath();
	ctx.moveTo(-3, -11);
	ctx.lineTo(-3, 0);
	ctx.lineTo(-7, 2);
	ctx.lineTo(-7, 9);
	ctx.lineTo(7, 9);
	ctx.lineTo(7, 2);
	ctx.lineTo(2, 0);
	ctx.lineTo(2, -11);
	ctx.closePath();

	ctx.fillStyle = recoil > 0.2 ? '#e0f2fe' : '#ffffff';
	ctx.fill();
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 1.8;
	ctx.stroke();

	// Index finger highlight
	ctx.beginPath();
	ctx.moveTo(-1, -9);
	ctx.lineTo(-1, 0);
	ctx.strokeStyle = '#60a5fa';
	ctx.lineWidth = 1;
	ctx.stroke();

	// 💥 Touchscreen Click Tap Ripple Shockwave from fingertip (0, -11)
	if (recoil > 0.05) {
		ctx.beginPath();
		ctx.arc(0, -11, 4 + recoil * 14, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 * recoil})`;
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Inner flash
		ctx.beginPath();
		ctx.arc(0, -11, 2 + recoil * 4, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(255, 255, 255, ${recoil * 0.9})`;
		ctx.fill();
	}

	ctx.restore();
}

/** T1_WAIT: 윈도우 표준 대기 커서 (AppStarting) - 포인터 화살표 + 우하단 회전 대기 링 & 크로노 펄스 */
function drawSleekWait(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();

	// 1. Orient arrow pointer towards targetAngle
	const baseAngle = Math.atan2(-12, -5);
	ctx.rotate(targetAngle - baseAngle);

	// Slightly shift arrow to balance composition with the bottom-right wait spinner
	ctx.save();
	ctx.translate(-2, -2);
	drawSleekArrowShape(ctx, '#ffffff', '#818cf8', recoil);
	ctx.restore();

	// 2. Mini Spinning Wait Indicator (Positioned at bottom-right of arrow stem: x = 5, y = 5)
	const spinnerX = 5;
	const spinnerY = 5;

	ctx.save();
	ctx.translate(spinnerX, spinnerY);

	// Subtle glowing backdrop disc
	ctx.beginPath();
	ctx.arc(0, 0, 7, 0, Math.PI * 2);
	ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
	ctx.fill();
	ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
	ctx.lineWidth = 1;
	ctx.stroke();

	// Rotating Wait Ring
	const spinSpeed = animTime * 5 + recoil * 20;
	ctx.rotate(spinSpeed);

	// Multi-segment loading spinner arc
	ctx.beginPath();
	ctx.arc(0, 0, 4.5, 0, Math.PI * 1.35);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#818cf8';
	ctx.lineWidth = 1.8;
	ctx.lineCap = 'round';
	ctx.stroke();

	// Orbiting bright node
	const nodeAngle = spinSpeed * 0.6;
	const nx = Math.cos(nodeAngle) * 4.5;
	const ny = Math.sin(nodeAngle) * 4.5;
	ctx.beginPath();
	ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
	ctx.fillStyle = '#38bdf8';
	ctx.fill();

	// Center tiny core dot
	ctx.beginPath();
	ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	ctx.restore();

	// 3. Firing Slow Ripple from Arrow Tip & Spinner
	if (recoil > 0.05) {
		// Tip slow shockwave
		ctx.beginPath();
		ctx.arc(-7, -14, 3 + recoil * 12, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(129, 140, 248, ${0.85 * recoil})`;
		ctx.lineWidth = 1.6;
		ctx.stroke();

		// Spinner pulse
		ctx.beginPath();
		ctx.arc(spinnerX, spinnerY, 5 + recoil * 10, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * recoil})`;
		ctx.lineWidth = 1.4;
		ctx.stroke();
	}

	ctx.restore();
}

// ----------------------------------------------------
// TIER 2: Cyber Blue Cursors
// ----------------------------------------------------

/** T2_AIM: 정밀 조준선 락온 회전 + 7.5px 후방 반동 킥 + 조준경 줌인 펄스 & 레이저 사이트 */
function drawSleekAim(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle); // Align scope to target angle

	// Lock-on zoom: reticle snaps tight on attack, outer ring spins
	ctx.save();
	ctx.rotate(animTime * 1.5 + recoil * 4);
	const aimRadius = 9.5 + (recoil > 0.3 ? 3 : -recoil * 2);

	ctx.beginPath();
	ctx.arc(0, 0, aimRadius, 0, Math.PI * 2);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#00d2ff';
	ctx.lineWidth = 1.8 + recoil * 1.2;
	ctx.stroke();

	// 4 Precision Tick Marks
	for (let i = 0; i < 4; i++) {
		const a = (i * Math.PI) / 2;
		ctx.beginPath();
		ctx.moveTo(Math.cos(a) * (aimRadius - 3), Math.sin(a) * (aimRadius - 3));
		ctx.lineTo(Math.cos(a) * (aimRadius + 3), Math.sin(a) * (aimRadius + 3));
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}
	ctx.restore();

	// Center Core laser flash
	ctx.beginPath();
	ctx.arc(0, 0, 2.5 + recoil * 3, 0, Math.PI * 2);
	ctx.fillStyle = recoil > 0.2 ? '#ffffff' : '#00d2ff';
	ctx.fill();

	// 💥 Forward lock-on laser sight muzzle flash
	if (recoil > 0.1) {
		ctx.beginPath();
		ctx.arc(0, 0, 10 + recoil * 14, -Math.PI / 4, Math.PI / 4);
		ctx.strokeStyle = 'rgba(0, 210, 255, 0.85)';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	ctx.restore();
}

/** T2_HOURGLASS: 시공간 360도 크로노스 고속 회전 + 시간 지연 링 펄스 */
function drawSleekHourglass(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();
	ctx.rotate(Math.sin(animTime * 3) * 0.2 + recoil * Math.PI * 2); // 360 chrono-spin

	ctx.beginPath();
	ctx.moveTo(-8, -9);
	ctx.lineTo(8, -9);
	ctx.lineTo(1, 0);
	ctx.lineTo(8, 9);
	ctx.lineTo(-8, 9);
	ctx.lineTo(-1, 0);
	ctx.closePath();

	ctx.fillStyle = recoil > 0.2 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(6, 182, 212, 0.35)';
	ctx.fill();
	ctx.strokeStyle = '#00d2ff';
	ctx.lineWidth = 1.8;
	ctx.stroke();

	// Glowing Sand Core
	ctx.beginPath();
	ctx.arc(0, 4 + Math.sin(animTime * 6) * 1.5, 2 + recoil * 1.5, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	// 💥 Chronos distortion wave
	if (recoil > 0.1) {
		ctx.beginPath();
		ctx.arc(0, 0, 12 + recoil * 14, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * recoil})`;
		ctx.lineWidth = 1.8;
		ctx.setLineDash([4, 4]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	ctx.restore();
}

/** T2_RESIZE: 4방향 화살표 9px 사방 폭발 팽창 펄스 */
function drawSleekResize(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	const pulse = Math.sin(animTime * 5) * 1.2 + recoil * 9;

	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#00d2ff';
	ctx.lineWidth = 1.8 + recoil * 1;

	// Cross axes
	ctx.beginPath();
	ctx.moveTo(0, -9 - pulse); ctx.lineTo(0, 9 + pulse);
	ctx.moveTo(-9 - pulse, 0); ctx.lineTo(9 + pulse, 0);
	ctx.stroke();

	// 4 Sleek Arrowheads
	ctx.fillStyle = '#ffffff';
	// Up
	ctx.beginPath(); ctx.moveTo(0, -11 - pulse); ctx.lineTo(-3, -7 - pulse); ctx.lineTo(3, -7 - pulse); ctx.closePath(); ctx.fill();
	// Down
	ctx.beginPath(); ctx.moveTo(0, 11 + pulse); ctx.lineTo(-3, 7 + pulse); ctx.lineTo(3, 7 + pulse); ctx.closePath(); ctx.fill();
	// Left
	ctx.beginPath(); ctx.moveTo(-11 - pulse, 0); ctx.lineTo(-7 - pulse, -3); ctx.lineTo(-7 - pulse, 3); ctx.closePath(); ctx.fill();
	// Right
	ctx.beginPath(); ctx.moveTo(11 + pulse, 0); ctx.lineTo(7 + pulse, -3); ctx.lineTo(7 + pulse, 3); ctx.closePath(); ctx.fill();
}

/** T2_LINK: 교차 체인 링크 타겟 조준 + 고속 링크 회전 및 전기 아크 */
function drawSleekLink(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle); // Orient links towards target

	// Dual intersecting chain links
	ctx.beginPath();
	ctx.ellipse(-4, -4, 6, 3.5, Math.PI / 4 + recoil * 1.5, 0, Math.PI * 2);
	ctx.ellipse(4, 4, 6, 3.5, Math.PI / 4 - recoil * 1.5, 0, Math.PI * 2);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#00d2ff';
	ctx.lineWidth = 2 + recoil * 1.2;
	ctx.stroke();
	ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
	ctx.fill();

	// Electric connection arc on attack
	if (recoil > 0.1) {
		ctx.beginPath();
		ctx.moveTo(-4, -4);
		ctx.lineTo(4, 4);
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	ctx.restore();
}

/** T2_SELECT: 내부 화살표 타겟 조준 + 6px 런지 + 사각 점선 영역 스캔 펄스 */
function drawSleekSelect(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	// Dashed select box (anchored)
	ctx.save();
	ctx.setLineDash([3, 2]);
	ctx.lineDashOffset = -animTime * 8 - recoil * 15;
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#38bdf8';
	ctx.lineWidth = 1.5 + recoil * 1.5;
	const boxSz = 9 + recoil * 4;
	ctx.strokeRect(-boxSz, -boxSz, boxSz * 2, boxSz * 2);
	ctx.setLineDash([]);
	ctx.restore();

	// Inner arrow aiming directly at target!
	drawSleekArrow(ctx, '#00d2ff', '#ffffff', recoil, targetAngle);
}

// ----------------------------------------------------
// TIER 3: Epic Neon Violet Cursors
// ----------------------------------------------------

/** T3_SNIPER: 타겟 정밀 락온 조준 + 11px 초중량 후방 반동 킥 + 총구 머즐 플래시 & 충격파 원뿔 폭발 */
function drawSleekSniper(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle); // Scope aims directly along line of fire

	// Multi-ring Laser Scope
	ctx.beginPath();
	ctx.arc(0, 0, 11, 0, Math.PI * 2);
	ctx.strokeStyle = recoil > 0.2 ? '#f3e8ff' : '#c084fc';
	ctx.lineWidth = 1.8 + recoil * 1.2;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(0, 0, 6, 0, Math.PI * 2);
	ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
	ctx.lineWidth = 1;
	ctx.stroke();

	// Crosshairs aligned to target axis
	ctx.beginPath();
	ctx.moveTo(0, -15); ctx.lineTo(0, 15);
	ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#e9d5ff';
	ctx.lineWidth = 1.2;
	ctx.stroke();

	// Red Laser Diode Center
	ctx.beginPath();
	ctx.arc(0, 0, 2.5 + recoil * 2.5, 0, Math.PI * 2);
	ctx.fillStyle = '#ef4444';
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1;
	ctx.stroke();

	// 💥 High-Caliber Heavy Muzzle Blast Shockwave & Flash along target axis (+X)
	if (recoil > 0.05) {
		// Forward expanding blast cone ring
		ctx.beginPath();
		ctx.arc(14, 0, 4 + recoil * 16, -Math.PI / 3, Math.PI / 3);
		ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 * recoil})`;
		ctx.lineWidth = 2.2;
		ctx.stroke();

		// Inner violet blast arc
		ctx.beginPath();
		ctx.arc(14, 0, 2 + recoil * 8, -Math.PI / 2, Math.PI / 2);
		ctx.strokeStyle = `rgba(192, 132, 252, ${recoil})`;
		ctx.lineWidth = 1.8;
		ctx.stroke();

		// Blinding Diamond Muzzle Star
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		const mzX = 14 + recoil * 10;
		ctx.moveTo(mzX + 8 * recoil, 0);
		ctx.lineTo(mzX, -4 * recoil);
		ctx.lineTo(mzX - 3 * recoil, 0);
		ctx.lineTo(mzX, 4 * recoil);
		ctx.closePath();
		ctx.fill();
	}

	ctx.restore();
}

/** T3_SPINNER: 제자리 고정 + 8구체 플라즈마 노드 (공격 모션 제거) */
function drawSleekSpinner(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();
	ctx.rotate(animTime * 3); // Smooth calm rotation, no attack spin burst

	for (let i = 0; i < 8; i++) {
		const angle = (i * Math.PI * 2) / 8;
		const alpha = (i + 1) / 8;
		const orbDist = 8.5 + recoil * 7;
		ctx.beginPath();
		ctx.arc(Math.cos(angle) * orbDist, Math.sin(angle) * orbDist, 2.5 + recoil * 2.5, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
		ctx.fill();
	}

	// Plasma lightning arcs connecting nodes when firing
	if (recoil > 0.15) {
		ctx.beginPath();
		for (let i = 0; i < 8; i++) {
			const a = (i * Math.PI * 2) / 8;
			const d = 8.5 + recoil * 7;
			const px = Math.cos(a) * d;
			const py = Math.sin(a) * d;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.closePath();
		ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}

	ctx.restore();

	// Core blinding violet spark
	ctx.beginPath();
	ctx.arc(0, 0, 2.5 + recoil * 3, 0, Math.PI * 2);
	ctx.fillStyle = recoil > 0.2 ? '#ffffff' : '#c084fc';
	ctx.fill();
}

/** T3_DENIED: 거대한 붉은 금지 표지판 스탬프 임팩트(Stamp Slam) + 지면 균열 충격파 */
function drawSleekDenied(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();

	ctx.beginPath();
	ctx.arc(0, 0, 10, 0, Math.PI * 2);
	ctx.strokeStyle = recoil > 0.2 ? '#fca5a5' : '#ef4444';
	ctx.lineWidth = 2.5 + recoil * 1.5;
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-7, -7);
	ctx.lineTo(7, 7);
	ctx.lineWidth = 2.5 + recoil * 1.5;
	ctx.stroke();

	// 💥 Heavy ground stamp shockwave ring
	if (recoil > 0.05) {
		ctx.beginPath();
		ctx.arc(0, 0, 10 + recoil * 12, 0, Math.PI * 2);
		ctx.strokeStyle = `rgba(239, 68, 68, ${recoil * 0.85})`;
		ctx.lineWidth = 2.5;
		ctx.stroke();
	}

	ctx.restore();
}

/** T3_MULTIDRAG: 타겟 방향 3단 부채꼴 전개(Triple Fan) + 4px 런지 + 다중 레이저 충전 */
function drawSleekMultiDrag(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	const baseAngle = Math.atan2(-12, -5);
	const rot = targetAngle - baseAngle;
	ctx.rotate(rot);

	const fanSpread = 4 + recoil * 7;
	const fanAng = recoil * 0.15;

	// Left wing cursor
	ctx.save();
	ctx.globalAlpha = 0.55;
	ctx.translate(-fanSpread, -fanSpread * 0.5);
	ctx.rotate(-fanAng);
	drawSleekArrowShape(ctx, '#a855f7', '#ffffff', recoil);
	ctx.restore();

	// Right wing cursor
	ctx.save();
	ctx.globalAlpha = 0.75;
	ctx.translate(fanSpread * 0.5, fanSpread);
	ctx.rotate(fanAng);
	drawSleekArrowShape(ctx, '#c084fc', '#ffffff', recoil);
	ctx.restore();

	// Center lead cursor
	drawSleekArrowShape(ctx, '#f3e8ff', '#9333ea', recoil);

	ctx.restore();
}

/** T3_MACRO: 물리적 CTRL 키캡 3.5px 키다운(Keydown Press) + 스위치 발광 파티클 */
function drawSleekMacro(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	// Physical mechanical keycap depress on attack
	const keyY = recoil * 3.5;
	ctx.fillStyle = recoil > 0.2 ? '#a21caf' : '#1e1b4b';
	ctx.beginPath();
	ctx.roundRect(-10, -8 + keyY, 20, 16, 3);
	ctx.fill();
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#c084fc';
	ctx.lineWidth = 1.5 + recoil * 1.5;
	ctx.stroke();

	ctx.font = 'bold 8px "Pretendard", sans-serif';
	ctx.fillStyle = recoil > 0.2 ? '#ffffff' : '#e879f9';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('CTRL', 0, keyY);

	// Click sparks emitting to adjacent sockets
	if (recoil > 0.1) {
		for (let i = 0; i < 4; i++) {
			const ang = (i * Math.PI) / 2 + Math.PI / 4;
			const dist = 12 + recoil * 6;
			ctx.fillStyle = '#f0abfc';
			ctx.beginPath();
			ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 1.5, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

// ----------------------------------------------------
// TIER 4: Legendary Golden & Prismatic Cursors
// ----------------------------------------------------

/** T4_WHEEL: 6색 무지개 프리즘 휠 (정적 고정, 번쩍임/회전/충격파 제거) */
function drawSleekWheel(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();

	const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6'];
	const wheelRadius = 11;
	for (let i = 0; i < 6; i++) {
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.arc(0, 0, wheelRadius, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
		ctx.closePath();
		ctx.fillStyle = colors[i];
		ctx.fill();
	}

	// Diamond center crystal
	ctx.beginPath();
	ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 1.2;
	ctx.stroke();

	ctx.restore();
}

/** T4_MAGICWAND: 타겟 방향 마법 영창 호 휘두르기(Stardust Swing) + 별가루 샤워 */
function drawSleekMagicWand(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	// Point wand towards target angle
	ctx.rotate(targetAngle + Math.PI / 2);

	// Slashing magic arc swing on attack!
	const swing = Math.sin(recoil * Math.PI) * 0.75;
	ctx.rotate(swing);

	// Wand shaft (extending downwards)
	ctx.fillStyle = '#334155';
	ctx.fillRect(-1.5, 0, 3, 14);
	ctx.strokeStyle = '#020617';
	ctx.lineWidth = 1;
	ctx.strokeRect(-1.5, 0, 3, 14);

	// Golden Star Tip at (0, -4)
	ctx.fillStyle = recoil > 0.2 ? '#ffffff' : '#fbbf24';
	ctx.beginPath();
	ctx.arc(0, -4, 5 + recoil * 3.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.2;
	ctx.stroke();

	// 💥 Stardust Shower & Arc Flare on attack
	if (recoil > 0.05) {
		const spAngle = animTime * 6 + recoil * 15;
		const spDist = 9 + recoil * 7;
		ctx.beginPath();
		ctx.arc(Math.cos(spAngle) * spDist, -4 + Math.sin(spAngle) * spDist, 2.5 + recoil * 2, 0, Math.PI * 2);
		ctx.fillStyle = '#fde047';
		ctx.fill();

		// Forward Stardust Burst Arc
		ctx.beginPath();
		ctx.arc(0, -4, 6 + recoil * 14, -Math.PI * 0.75, -Math.PI * 0.25);
		ctx.strokeStyle = `rgba(251, 191, 36, ${recoil})`;
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	ctx.restore();
}

/** T4_ADMIN: 황금 이지스 쉴드 타겟 조준 + 9px 성스러운 돌진(Holy Lunge) & 심판 충격파 */
function drawSleekAdmin(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	// Aegis shield faces target angle
	ctx.rotate(targetAngle + Math.PI / 2);

	// Gold Cyber Aegis Shield
	ctx.beginPath();
	ctx.moveTo(0, -13);
	ctx.lineTo(9, -8);
	ctx.lineTo(8, 6);
	ctx.lineTo(0, 12);
	ctx.lineTo(-8, 6);
	ctx.lineTo(-9, -8);
	ctx.closePath();

	ctx.fillStyle = recoil > 0.2 ? '#fef08a' : '#f59e0b';
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.5 + recoil * 1.5;
	ctx.stroke();

	// Inner Admin Pointer
	drawSleekArrowShape(ctx, '#ffffff', '#fef08a', recoil);

	// 💥 Holy Shield Bash Shockwave emitting forward
	if (recoil > 0.05) {
		ctx.beginPath();
		ctx.arc(0, -13, 4 + recoil * 16, -Math.PI * 0.8, -Math.PI * 0.2);
		ctx.strokeStyle = `rgba(254, 240, 138, ${recoil * 0.9})`;
		ctx.lineWidth = 2.5;
		ctx.stroke();
	}

	ctx.restore();
}

/** T4_CONSOLE: 개발자 터미널 펄스 + >>> 프롬프트 & 매트릭스 버스트 */
function drawSleekConsole(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();

	ctx.fillStyle = '#020617';
	ctx.beginPath();
	ctx.roundRect(-11, -8, 22, 16, 3);
	ctx.fill();
	ctx.strokeStyle = recoil > 0.2 ? '#ffffff' : '#10b981';
	ctx.lineWidth = 1.5 + recoil * 1.5;
	ctx.stroke();

	// Matrix scanline glow on attack
	if (recoil > 0.1) {
		ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
		ctx.fillRect(-11, -8, 22, 16);
	}

	const blink = Math.sin(animTime * 8) > 0;
	ctx.font = 'bold 9px "Pretendard", sans-serif';
	ctx.fillStyle = recoil > 0.2 ? '#a7f3d0' : '#34d399';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(recoil > 0.2 ? '>>> RUN' : blink ? '>_' : '>', 0, 0);

	ctx.restore();
}

/** T4_TASKMASTER: 황금 왕관 지휘 광선(Command Aura) + 3색 보석 찬란한 플레어 */
function drawSleekTaskmaster(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();
	ctx.translate(0, -recoil * 4); // Elevation on attack

	// Golden Crown of Mastery
	ctx.beginPath();
	ctx.moveTo(-9, 7);
	ctx.lineTo(-9, -5);
	ctx.lineTo(-4, 0);
	ctx.lineTo(0, -9);
	ctx.lineTo(4, 0);
	ctx.lineTo(9, -5);
	ctx.lineTo(9, 7);
	ctx.closePath();

	ctx.fillStyle = recoil > 0.2 ? '#fef08a' : '#fbbf24';
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.5 + recoil * 1;
	ctx.stroke();

	// 3 Crown Jewels (Glowing on attack)
	ctx.fillStyle = '#ef4444';
	ctx.beginPath(); ctx.arc(-9, -5, 1.5 + recoil * 1.5, 0, Math.PI * 2); ctx.fill();
	ctx.fillStyle = '#38bdf8';
	ctx.beginPath(); ctx.arc(0, -9, 1.8 + recoil * 2, 0, Math.PI * 2); ctx.fill();
	ctx.fillStyle = '#ef4444';
	ctx.beginPath(); ctx.arc(9, -5, 1.5 + recoil * 1.5, 0, Math.PI * 2); ctx.fill();

	// 8 Golden command rays of authority
	if (recoil > 0.1) {
		for (let i = 0; i < 8; i++) {
			const a = (i * Math.PI * 2) / 8 + animTime * 2;
			ctx.beginPath();
			ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
			ctx.lineTo(Math.cos(a) * (12 + recoil * 10), Math.sin(a) * (12 + recoil * 10));
			ctx.strokeStyle = '#fef08a';
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}
	}

	ctx.restore();
}

// ----------------------------------------------------
// TIER 5: Hidden Mythic Units (초월 5종)
// ----------------------------------------------------

/** HIDDEN_CTRLALTDEL: 차원 크로스헤어 락온 + 정적 키캡 배치 (공격 번쩍임/흔들림/충격파 제거) */
function drawSleekCtrlAltDel(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle); // Central crosshair aims straight at target

	// 3 Keycaps: Ctrl, Alt, Del in stable, fixed positions (no violent recoil acceleration, expansion, or flashing)
	const keys = ['Ctrl', 'Alt', 'Del'];
	const orbitRadius = 15;

	for (let i = 0; i < 3; i++) {
		const angle = (i * Math.PI * 2) / 3;
		const kx = Math.cos(angle) * orbitRadius;
		const ky = Math.sin(angle) * orbitRadius;

		ctx.save();
		ctx.translate(kx, ky);

		ctx.fillStyle = '#1e1b4b';
		ctx.beginPath();
		ctx.roundRect(-7, -4.5, 14, 9, 2);
		ctx.fill();

		ctx.strokeStyle = '#fb7185';
		ctx.lineWidth = 1.2;
		ctx.stroke();

		ctx.font = 'bold 6.5px "Pretendard", sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(keys[i], 0, 0.5);

		ctx.restore();
	}

	// Central Crimson Spatial Crosshair (Steady, no flashing or pulsing)
	ctx.beginPath();
	ctx.moveTo(0, -10); ctx.lineTo(0, 10);
	ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
	ctx.strokeStyle = '#ff0055';
	ctx.lineWidth = 2;
	ctx.stroke();

	// Central Quantum Singularity Core (Steady, no flashing)
	ctx.beginPath();
	ctx.arc(0, 0, 4, 0, Math.PI * 2);
	ctx.fillStyle = '#ff0055';
	ctx.fill();
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.restore();
}

/** HIDDEN_BSOD_WHEEL: 사상의 지평선 이중 고리 + 특이점 (정적 고정, 번쩍임/회전/충격파 제거) */
function drawSleekBlackholeWheel(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();

	// 1. Dual Event Horizon Rings (Clean, steady, no fast spin or recoil bursts)
	const colors = ['#818cf8', '#c084fc', '#38bdf8', '#4f46e5'];
	for (let i = 0; i < 4; i++) {
		const angle = (i * Math.PI) / 2;
		ctx.beginPath();
		ctx.arc(0, 0, 11, angle, angle + Math.PI / 3);
		ctx.strokeStyle = colors[i];
		ctx.lineWidth = 3;
		ctx.stroke();
	}

	// 2. Central Singularity Core (Clean, steady, no white flash or contraction)
	ctx.beginPath();
	ctx.arc(0, 0, 5, 0, Math.PI * 2);
	ctx.fillStyle = '#0f172a';
	ctx.fill();
	ctx.strokeStyle = '#818cf8';
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.restore();
}

/** HIDDEN_QUANTUM_ERASER: 양자 지우개 타겟 조준 + 3중 픽셀 브러시 (번쩍임/런지/충격파 제거) */
function drawSleekQuantumEraser(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle + Math.PI / 2); // Points quantum wand at target

	// Wand shaft
	ctx.fillStyle = '#1e1b4b';
	ctx.fillRect(-2.5, 0, 5, 15);
	ctx.strokeStyle = '#facc15';
	ctx.lineWidth = 1.2;
	ctx.strokeRect(-2.5, 0, 5, 15);

	// Wand Tip Quantum Core (Steady, no white flash)
	ctx.beginPath();
	ctx.arc(0, -4, 5, 0, Math.PI * 2);
	ctx.fillStyle = '#facc15';
	ctx.fill();
	ctx.strokeStyle = '#fef08a';
	ctx.lineWidth = 1.5;
	ctx.stroke();

	// Orbiting Pixel Brushes (Steady fixed layout, no recoil acceleration)
	for (let i = 0; i < 3; i++) {
		const ang = (i * Math.PI * 2) / 3;
		const px = Math.cos(ang) * 11;
		const py = -4 + Math.sin(ang) * 11;
		ctx.fillStyle = '#fde047';
		ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
	}

	ctx.restore();
}

/** HIDDEN_ROOT_ADMIN: 거대 황금 이지스 타겟 조준 (슈퍼 런지/번쩍임/충격파 제거) */
function drawSleekRootAdmin(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0,
	targetAngle = -Math.PI * 0.75
) {
	ctx.save();
	ctx.rotate(targetAngle + Math.PI / 2); // Faces target angle

	// Massive Golden Aegis Shield Base (Steady, no yellow flash)
	ctx.beginPath();
	ctx.moveTo(0, -14);
	ctx.lineTo(11, -8);
	ctx.lineTo(10, 7);
	ctx.lineTo(0, 14);
	ctx.lineTo(-10, 7);
	ctx.lineTo(-11, -8);
	ctx.closePath();

	ctx.fillStyle = '#78350f';
	ctx.fill();
	ctx.strokeStyle = '#f59e0b';
	ctx.lineWidth = 2;
	ctx.stroke();

	// Inner Ruby SUDO Pointer (Steady, no recoil kick)
	drawSleekArrowShape(ctx, '#ffffff', '#ef4444', 0);

	// SUDO Text
	ctx.font = 'bold 6.5px "Pretendard", sans-serif';
	ctx.fillStyle = '#fef08a';
	ctx.textAlign = 'center';
	ctx.fillText('ROOT', 0, 10);

	ctx.restore();
}

/** HIDDEN_DEBUG_CONSOLE: 치트 엔진 터미널 (지터/번쩍임/스캔파동 제거) */
function drawSleekCheatEngine(
	ctx: CanvasRenderingContext2D,
	animTime: number,
	recoil = 0
) {
	ctx.save();

	// Matrix Terminal Window Box (Steady, no jitter, no white flash)
	ctx.fillStyle = '#022c22';
	ctx.beginPath();
	ctx.roundRect(-12, -9, 24, 18, 2);
	ctx.fill();
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 1.8;
	ctx.stroke();

	// Glowing Matrix Hex Text (Steady, no rapid flickering, no 'GOD' flash)
	ctx.font = 'bold 8px "Pretendard", sans-serif';
	ctx.fillStyle = '#34d399';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('HEX', 0, 0);

	ctx.restore();
}
