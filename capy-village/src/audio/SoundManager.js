const BASE_URL = import.meta.env.BASE_URL;

// Minimum milliseconds between plays of the same sound (prevents chaos)
const COOLDOWN_MS = 50;

class SoundManager {
  constructor() {
    this._sounds     = {}; // label -> { cfg, audio }
    this._active     = {}; // label -> Set<Audio>  (all currently playing instances)
    this._lastPlayed = {}; // label -> timestamp
  }

  /** Preload all sounds from a config object. Call once at startup. */
  load(config) {
    for (const [label, cfg] of Object.entries(config)) {
      const audio = new Audio(BASE_URL + cfg.file);
      audio.preload = 'auto';
      audio.volume  = cfg.volume ?? 1.0;
      this._sounds[label] = { cfg, audio };
      this._active[label] = new Set();
    }
  }

  /**
   * Play a sound by label.
   * @param {string} label
   * @param {{ loop?: boolean }} [options]
   * @returns {{ stop: () => void }} handle — call .stop() to stop this instance
   */
  play(label, { loop = false } = {}) {
    const noop = { stop: () => {} };
    const entry = this._sounds[label];
    if (!entry) return noop;

    // Cooldown only applies to non-looping fire-and-forget sounds
    if (!loop) {
      const now = performance.now();
      if (now - (this._lastPlayed[label] ?? 0) < COOLDOWN_MS) return noop;
      this._lastPlayed[label] = now;
    }

    const { cfg, audio } = entry;

    let target;
    if (cfg.varyRate || loop) {
      target = new Audio(audio.src);
      target.volume = cfg.volume ?? 1.0;
    } else {
      target = audio;
      target.currentTime = 0;
    }

    if (cfg.varyRate && !loop) {
      const min = cfg.minRate ?? 0.92;
      const max = cfg.maxRate ?? 1.08;
      target.playbackRate = min + Math.random() * (max - min);
    }

    if (loop) target.loop = true;

    // Track this instance so stop(label) can reach it
    const active = this._active[label];
    if (active) {
      active.add(target);
      // Auto-remove one-shot clones when they finish
      if (!loop) {
        target.addEventListener('ended', () => active.delete(target), { once: true });
      }
    }

    target.play().catch(() => {});

    return {
      stop() {
        target.pause();
        target.currentTime = 0;
        if (active) active.delete(target);
      },
    };
  }

  /** Stop ALL playing instances of a label (base + any clones). */
  stop(label) {
    const active = this._active[label];
    if (!active) return;
    for (const t of active) {
      t.pause();
      t.currentTime = 0;
    }
    active.clear();
  }
}

export const soundManager = new SoundManager();
