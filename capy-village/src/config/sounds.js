// Sound config — maps labels to audio files + playback settings.
// To swap a sound, only change "file" here. Game code uses labels only.
export const SOUND_CONFIG = {
  pop: {
    file: 'audio/pop1.mp3',
    volume: 0.45,
    varyRate: true,
    minRate: 0.94,
    maxRate: 1.06,
  },
  pop2: {
    file: 'audio/pop2.mp3',
    volume: 0.45,
    varyRate: true,
    minRate: 0.94,
    maxRate: 1.06,
  },
  bite: {
    file: 'audio/apple_bite.mp3',
    volume: 0.7,
    varyRate: true,
    minRate: 0.92,
    maxRate: 1.08,
  },
  correct: {
    file: 'audio/ding.mp3',
    volume: 0.65,
    varyRate: false,
  },
  wrong: {
    file: 'audio/fail1.mp3',
    volume: 0.5,
    varyRate: false,
  },
  success: {
    file: 'audio/victory.mp3',
    volume: 0.75,
    varyRate: false,
  },
  failure: {
    file: 'audio/fail2.mp3',
    volume: 0.75,
    varyRate: false,
  },
  ticking_clock: {
    file: 'audio/ticking_clock.mp3',
    volume: 0.75,
    varyRate: false,
  },
};
