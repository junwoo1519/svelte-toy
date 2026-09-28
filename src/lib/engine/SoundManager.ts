class SoundManager {
	private ctx: AudioContext | null = null;
	private isMuted: boolean = false;
	private lastShootTime: number = 0;
	private lastCritTime: number = 0;

	private init() {
		if (!this.ctx && typeof window !== 'undefined') {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
			if (AudioCtx) {
				this.ctx = new AudioCtx();
			}
		}
		if (this.ctx && this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
	}

	public toggleMute() {
		this.isMuted = !this.isMuted;
		return this.isMuted;
	}

	public getMuted() {
		return this.isMuted;
	}

	public playSummon() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'triangle';
		osc.frequency.setValueAtTime(440, t);
		osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

		gain.gain.setValueAtTime(0.15, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.15);
	}

	public playMerge() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, t + idx * 0.05);

			gain.gain.setValueAtTime(0.12, t + idx * 0.05);
			gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.2);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(t + idx * 0.05);
			osc.stop(t + idx * 0.05 + 0.2);
		});
	}

	public playShoot(tier: number = 1) {
		if (this.isMuted) return;
		const now = performance.now();
		if (now - this.lastShootTime < 45) return;
		this.lastShootTime = now;

		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = tier >= 3 ? 'sawtooth' : 'square';
		const startFreq = 400 + tier * 150;
		osc.frequency.setValueAtTime(startFreq, t);
		osc.frequency.exponentialRampToValueAtTime(100, t + 0.06);

		gain.gain.setValueAtTime(0.04, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.06);
	}

	public playCrit() {
		if (this.isMuted) return;
		const now = performance.now();
		if (now - this.lastCritTime < 60) return;
		this.lastCritTime = now;

		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(1200, t);
		osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);

		gain.gain.setValueAtTime(0.15, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.1);
	}

	public playPopup() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(1046.5, t); // C6
		osc.frequency.setValueAtTime(1318.5, t + 0.08); // E6

		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.25);
	}

	public playBossAlert() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(220, t);
		osc.frequency.linearRampToValueAtTime(440, t + 0.3);
		osc.frequency.linearRampToValueAtTime(220, t + 0.6);

		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.65);
	}

	public playGameOver() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(300, t);
		osc.frequency.linearRampToValueAtTime(80, t + 0.8);

		gain.gain.setValueAtTime(0.2, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.85);
	}

	public playLegendary() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		// 6-note grand royal fanfare: C5 -> E5 -> G5 -> B5 -> C6 -> E6
		[523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51].forEach((freq, idx) => {
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t + idx * 0.08);

			gain.gain.setValueAtTime(0.22, t + idx * 0.08);
			gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.45);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(t + idx * 0.08);
			osc.stop(t + idx * 0.08 + 0.45);
		});
	}

	public playFail() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(220, t);
		osc.frequency.setValueAtTime(140, t + 0.1);

		gain.gain.setValueAtTime(0.18, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(t);
		osc.stop(t + 0.3);
	}

	public playSuperCritical() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		// Ultra 7-note ascending casino jackpot arpeggio
		[523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0].forEach((freq, idx) => {
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t + idx * 0.06);

			gain.gain.setValueAtTime(0.24, t + idx * 0.06);
			gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.5);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(t + idx * 0.06);
			osc.stop(t + idx * 0.06 + 0.5);
		});
	}

	public playVictory() {
		if (this.isMuted) return;
		this.init();
		if (!this.ctx) return;

		const t = this.ctx.currentTime;
		[523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t + idx * 0.12);

			gain.gain.setValueAtTime(0.2, t + idx * 0.12);
			gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.4);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start(t + idx * 0.12);
			osc.stop(t + idx * 0.12 + 0.4);
		});
	}
}

export const sound = new SoundManager();
