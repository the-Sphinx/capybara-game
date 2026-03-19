// Sound config — maps labels to audio files + playback settings.
// To swap a sound, only change "file" here. Game code uses labels only.
export const SOUND_CONFIG = {
  pop: {
    file: 'assets/audio/pop1.mp3',
    volume: 0.45,
    varyRate: true,
    minRate: 0.94,
    maxRate: 1.06,
  },
  pop2: {
    file: 'assets/audio/pop2.mp3',
    volume: 0.45,
    varyRate: true,
    minRate: 0.94,
    maxRate: 1.06,
  },
  bite: {
    file: 'assets/audio/apple_bite.mp3',
    volume: 0.7,
    varyRate: true,
    minRate: 0.92,
    maxRate: 1.08,
  },
  correct: {
    file: 'assets/audio/ding.mp3',
    volume: 0.65,
    varyRate: false,
  },
  wrong: {
    file: 'assets/audio/fail1.mp3',
    volume: 0.5,
    varyRate: false,
  },
  success: {
    file: 'assets/audio/victory.mp3',
    volume: 0.75,
    varyRate: false,
  },
  failure: {
    file: 'assets/audio/fail2.mp3',
    volume: 0.75,
    varyRate: false,
  },
  ticking_clock: {
    file: 'assets/audio/ticking_clock.mp3',
    volume: 0.75,
    varyRate: false,
  },
};
