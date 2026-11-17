// Sound, synthesised with WebAudio: no audio files, nothing fetched. A soft
// hum follows the beam, a chime marks a kill, a low thud marks the hearth
// taking a hit. Everything is guarded so a browser without audio (or a
// headless one) simply stays silent.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let hum = null;
  let humGain = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted || !ensure()) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.35;
      return muted;
    },
    get muted() { return muted; },
    placeMirror() { tone(420, 0.12, 'triangle', 0.25, 300); },
    removeMirror() { tone(300, 0.1, 'triangle', 0.18, 200); },
    kill() { tone(880, 0.16, 'sine', 0.22, 1320); },
    shatter() { tone(520, 0.3, 'sawtooth', 0.14, 90); },
    hearthHit() { tone(140, 0.35, 'sawtooth', 0.3, 70); },
    nightClear() {
      tone(523, 0.18, 'sine', 0.22);
      setTimeout(() => tone(659, 0.18, 'sine', 0.22), 140);
      setTimeout(() => tone(784, 0.3, 'sine', 0.24), 280);
    },
    victory() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.24), i * 170));
    },
    defeat() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.45, 'triangle', 0.2), i * 200));
    },
    pickUpgrade() { tone(660, 0.14, 'sine', 0.2, 990); },
    // A low horn when a night begins — the march is coming.
    nightStart() { tone(196, 0.5, 'triangle', 0.25, 147); },
    // A bright blip when the beam gathers a glimmer shard.
    coin() { tone(1320, 0.1, 'sine', 0.18, 1760); },
    // A cold zap when the Matriarch throws an ice bolt.
    bossBolt() { tone(700, 0.18, 'sawtooth', 0.12, 180); },
    // A dull buzz when the game refuses an action.
    denied() { tone(160, 0.15, 'square', 0.12, 110); },
    // The beam hum: a quiet oscillator whose gain follows the beam. Called
    // every frame with the beam's strength (0 when the beam is idle).
    setBeam(strength) {
      if (muted || !ensure()) return;
      try {
        if (!hum) {
          hum = ctx.createOscillator();
          hum.type = 'sawtooth';
          hum.frequency.value = 96;
          humGain = ctx.createGain();
          humGain.gain.value = 0;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 420;
          hum.connect(filter);
          filter.connect(humGain);
          humGain.connect(master);
          hum.start();
        }
        const target = Math.min(0.05, 0.012 + strength * 0.05);
        humGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
        hum.frequency.setTargetAtTime(96 + strength * 60, ctx.currentTime, 0.1);
      } catch {
        // Silence is fine.
      }
    },
  };
}
