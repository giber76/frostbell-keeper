// All sound is synthesised with WebAudio: no audio files, no network.
// The hearth crackles, bolts thwip, coins chime, the bell tolls, and a horn
// opens every wave. Nothing plays until the player first interacts, and M
// mutes everything.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let crackleTimer = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch { return null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state === 'suspended') return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, lowFreq) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state === 'suspended') return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowFreq || 1200;
    const gain = c.createGain();
    gain.gain.value = vol || 0.08;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    // One note, now, for the melody in music.js: the same guarded tone,
    // public so the melody can play it on its own clock.
    playNote(freq, dur, type, vol) { tone(freq, dur, type, vol); },
    shoot() { tone(720, 0.09, 'triangle', 0.07, 320); },
    hit() { noise(0.06, 0.06, 2400); },
    kill() { tone(520, 0.12, 'sine', 0.1, 780); tone(1040, 0.08, 'sine', 0.05, 1560); },
    coin() { tone(1320, 0.1, 'sine', 0.08); tone(1760, 0.14, 'sine', 0.06); },
    build() { tone(220, 0.12, 'square', 0.05, 330); tone(440, 0.1, 'sine', 0.06); },
    denied() { tone(160, 0.16, 'sawtooth', 0.06, 110); },
    leak() { tone(300, 0.35, 'sawtooth', 0.1, 90); noise(0.3, 0.08, 500); },
    horn() { tone(196, 0.5, 'sawtooth', 0.09, 196); tone(294, 0.5, 'sawtooth', 0.07, 294); },
    bell() { tone(523, 1.4, 'sine', 0.16); tone(784, 1.1, 'sine', 0.1); tone(1046, 0.9, 'sine', 0.06); },
    // The Keeper's Ember Arts (v8): a nova's cold ring, a surge's
    // rising fan, a kindle's warm flare.
    nova() { tone(880, 0.35, 'sine', 0.12, 220); noise(0.25, 0.05, 900); },
    surge() { tone(660, 0.12, 'triangle', 0.09, 990); tone(990, 0.1, 'triangle', 0.06, 1320); },
    kindle() { tone(523, 0.2, 'sine', 0.1); tone(784, 0.3, 'sine', 0.08); },
    waveClear() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.09), i * 90)); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.1), i * 130)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'triangle', 0.09), i * 160)); },
    startCrackle() {
      if (crackleTimer) return;
      crackleTimer = setInterval(() => {
        if (!muted && ctx && ctx.state === 'running' && Math.random() < 0.5) {
          noise(0.05, 0.02, 3000);
        }
      }, 240);
    },
  };
}
