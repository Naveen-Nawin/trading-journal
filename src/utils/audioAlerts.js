/**
 * Web Audio API synthesized alert sounds.
 * 100% client-side, zero external files, works offline, reliable across all browsers.
 */

// Soft warning tone for >= 3 trades (Caution / Emotion Check)
export const playWarningTone = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Two warning pulses: 587Hz (D5) -> 440Hz (A4)
    [0, 0.22].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now + delay);
      osc.frequency.exponentialRampToValueAtTime(440, now + delay + 0.16);

      gain.gain.setValueAtTime(0.35, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.19);
    });
  } catch (err) {
    console.warn('Could not play warning tone:', err);
  }
};

// Heavy warning siren / buzzer sound for 5 trades (Lockout Alert)
export const playHeavyWarningSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 4 intense descending alarm bursts (880Hz down to 220Hz with harmonics)
    [0, 0.25, 0.5, 0.75].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + delay);
      osc.frequency.exponentialRampToValueAtTime(220, now + delay + 0.2);

      gain.gain.setValueAtTime(0.45, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.23);
    });
  } catch (err) {
    console.warn('Could not play heavy warning sound:', err);
  }
};
