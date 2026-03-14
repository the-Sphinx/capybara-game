// Language Grove — content data
// All words are uppercase for consistent rendering.

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const CONSONANTS = ALL_LETTERS.filter(l => !VOWELS.includes(l));

// ── Category word pools ───────────────────────────────────────────────────────

export const CATEGORIES = {
  animals: {
    label: 'Animals',
    words: ['DOG', 'CAT', 'LION', 'BIRD', 'FISH', 'BEAR', 'FROG', 'DUCK', 'WOLF', 'DEER', 'COW', 'HEN', 'RAT', 'FOX', 'PIG'],
  },
  fruits: {
    label: 'Fruits',
    words: ['APPLE', 'MANGO', 'GRAPE', 'PEACH', 'LEMON', 'MELON', 'BERRY', 'PLUM', 'LIME', 'PEAR', 'FIG', 'KIWI', 'DATE', 'GUAVA', 'CHERRY'],
  },
  colors: {
    label: 'Colors',
    words: ['RED', 'BLUE', 'GREEN', 'PINK', 'GOLD', 'GRAY', 'BROWN', 'BLACK', 'WHITE', 'ORANGE', 'TEAL', 'NAVY', 'VIOLET', 'CORAL', 'CREAM'],
  },
  foods: {
    label: 'Foods',
    words: ['BREAD', 'RICE', 'SOUP', 'CAKE', 'MILK', 'MEAT', 'CORN', 'BEAN', 'EGG', 'PIZZA', 'PASTA', 'STEW', 'TACO', 'TOAST', 'SALAD'],
  },
  clothes: {
    label: 'Clothes',
    words: ['SHIRT', 'PANTS', 'HAT', 'COAT', 'SOCK', 'BOOT', 'SCARF', 'DRESS', 'GLOVE', 'CAP', 'TIE', 'SKIRT', 'BELT', 'VEST', 'ROBE'],
  },
  flyingThings: {
    label: 'Flying Things',
    words: ['BIRD', 'PLANE', 'BEE', 'KITE', 'BAT', 'OWL', 'ROCKET', 'WASP', 'EAGLE', 'HAWK', 'MOTH', 'DART', 'DRONE', 'CLOUD', 'RAVEN'],
  },
};

// Words used for lettersInWord mode, grouped by difficulty
export const LETTER_WORDS = {
  easy:   ['DOG', 'CAT', 'SUN', 'BEE', 'ANT', 'HEN', 'PIG', 'COW'],
  medium: ['APPLE', 'HOUSE', 'PLANT', 'STONE', 'CLOUD', 'BRUSH', 'FLAME', 'CRANE'],
  hard:   ['FLOWER', 'BASKET', 'GARDEN', 'RABBIT', 'BRIDGE', 'POCKET', 'CANDLE', 'JUNGLE'],
};

// ── ChoiceRound content ───────────────────────────────────────────────────────

export const SENTENCES = [
  { stem: 'Birds can ___.', correct: 'FLY',   distractors: ['TREE', 'SWIM', 'SLEEP'] },
  { stem: 'Fish live in ___.', correct: 'WATER', distractors: ['SKY', 'SAND', 'FIRE'] },
  { stem: 'The sun gives us ___.', correct: 'LIGHT', distractors: ['RAIN', 'SNOW', 'WIND'] },
  { stem: 'Dogs like to ___.', correct: 'BARK',  distractors: ['FLY', 'SWIM', 'MEOW'] },
  { stem: 'We read a ___.', correct: 'BOOK',  distractors: ['CLOUD', 'FORK', 'STONE'] },
  { stem: 'Frogs can ___.', correct: 'JUMP',  distractors: ['DRIVE', 'BAKE', 'SING'] },
  { stem: 'We sleep in a ___.', correct: 'BED',   distractors: ['POOL', 'TREE', 'BOAT'] },
  { stem: 'Ice is very ___.', correct: 'COLD',  distractors: ['SOFT', 'LOUD', 'GREEN'] },
  { stem: 'Plants need ___ to grow.', correct: 'WATER', distractors: ['GLASS', 'STONE', 'METAL'] },
  { stem: 'A cat says ___.', correct: 'MEOW',  distractors: ['BARK', 'MOO', 'ROAR'] },
  { stem: 'We wear ___ on our feet.', correct: 'SHOES', distractors: ['HATS', 'CUPS', 'BAGS'] },
  { stem: 'The sky is ___.', correct: 'BLUE',  distractors: ['WET', 'ROUND', 'LOUD'] },
  { stem: 'Birds live in a ___.', correct: 'NEST',  distractors: ['CAVE', 'POND', 'BARN'] },
  { stem: 'We use a pencil to ___.', correct: 'WRITE', distractors: ['COOK', 'SWIM', 'CLIMB'] },
  { stem: 'Bees make ___.', correct: 'HONEY', distractors: ['BREAD', 'JUICE', 'STONE'] },
];

export const OPPOSITES = [
  { prompt: 'HOT',   correct: 'COLD',  distractors: ['DRY',   'FAST',  'BIG']   },
  { prompt: 'BIG',   correct: 'SMALL', distractors: ['SOFT',  'TALL',  'ROUND'] },
  { prompt: 'UP',    correct: 'DOWN',  distractors: ['LEFT',  'OPEN',  'FAST']  },
  { prompt: 'DAY',   correct: 'NIGHT', distractors: ['SUN',   'DARK',  'SLEEP'] },
  { prompt: 'FAST',  correct: 'SLOW',  distractors: ['SOFT',  'COLD',  'HIGH']  },
  { prompt: 'HAPPY', correct: 'SAD',   distractors: ['TIRED', 'LOUD',  'TALL']  },
  { prompt: 'HARD',  correct: 'SOFT',  distractors: ['ROUGH', 'HEAVY', 'SHARP'] },
  { prompt: 'OPEN',  correct: 'SHUT',  distractors: ['LOUD',  'SMALL', 'ROUND'] },
  { prompt: 'OLD',   correct: 'NEW',   distractors: ['WORN',  'DARK',  'TALL']  },
  { prompt: 'TALL',  correct: 'SHORT', distractors: ['THIN',  'LIGHT', 'SOFT']  },
  { prompt: 'CLEAN', correct: 'DIRTY', distractors: ['WET',   'DARK',  'ROUGH'] },
  { prompt: 'FULL',  correct: 'EMPTY', distractors: ['LIGHT', 'ROUND', 'FLAT']  },
  { prompt: 'LOUD',  correct: 'QUIET', distractors: ['STILL', 'SOFT',  'LOW']   },
  { prompt: 'LIGHT', correct: 'HEAVY', distractors: ['DARK',  'SMALL', 'SOLID'] },
  { prompt: 'NEAR',  correct: 'FAR',   distractors: ['WIDE',  'DEEP',  'CLOSE'] },
];

export const SYNONYMS = [
  { prompt: 'BIG',    correct: 'HUGE',  distractors: ['SMALL', 'TINY',  'FLAT']  },
  { prompt: 'HAPPY',  correct: 'GLAD',  distractors: ['SAD',   'TIRED', 'COLD']  },
  { prompt: 'FAST',   correct: 'QUICK', distractors: ['SLOW',  'SOFT',  'SHORT'] },
  { prompt: 'SICK',   correct: 'ILL',   distractors: ['WELL',  'FINE',  'GOOD']  },
  { prompt: 'PRETTY', correct: 'NICE',  distractors: ['UGLY',  'DARK',  'PLAIN'] },
  { prompt: 'SMALL',  correct: 'TINY',  distractors: ['BIG',   'TALL',  'LOUD']  },
  { prompt: 'START',  correct: 'BEGIN', distractors: ['STOP',  'END',   'LEAVE'] },
  { prompt: 'LOOK',   correct: 'SEE',   distractors: ['HEAR',  'FEEL',  'SMELL'] },
  { prompt: 'COLD',   correct: 'COOL',  distractors: ['HOT',   'WARM',  'MILD']  },
  { prompt: 'TALK',   correct: 'SPEAK', distractors: ['SLEEP', 'WALK',  'EAT']   },
  { prompt: 'TIRED',  correct: 'WEARY', distractors: ['FRESH', 'LIVELY','AWAKE'] },
  { prompt: 'CRY',    correct: 'WEEP',  distractors: ['LAUGH', 'YELL',  'SING']  },
  { prompt: 'SMART',  correct: 'CLEVER',distractors: ['DULL',  'SLOW',  'PLAIN'] },
  { prompt: 'ANGRY',  correct: 'MAD',   distractors: ['CALM',  'GLAD',  'COOL']  },
  { prompt: 'SHUT',   correct: 'CLOSE', distractors: ['OPEN',  'LIFT',  'PUSH']  },
];

export const RIDDLES = [
  {
    text: 'I have wings but I am not a plane.\nI sing in the morning.',
    correct: 'BIRD',
    distractors: ['DOG', 'TREE', 'CAR'],
  },
  {
    text: 'I am round and yellow.\nI shine in the sky every day.',
    correct: 'SUN',
    distractors: ['MOON', 'STAR', 'LAMP'],
  },
  {
    text: 'I fall from the sky when it is cold.\nI am white and soft.',
    correct: 'SNOW',
    distractors: ['RAIN', 'HAIL', 'LEAF'],
  },
  {
    text: 'I have four legs and a tail.\nI say "woof".',
    correct: 'DOG',
    distractors: ['CAT', 'BEAR', 'DUCK'],
  },
  {
    text: 'People read me.\nI am full of pages and words.',
    correct: 'BOOK',
    distractors: ['CUP', 'DOOR', 'BALL'],
  },
  {
    text: 'I live in water.\nI have fins and scales.',
    correct: 'FISH',
    distractors: ['FROG', 'DUCK', 'CRAB'],
  },
  {
    text: 'I grow on trees.\nI am sweet and you can eat me.',
    correct: 'FRUIT',
    distractors: ['LEAF', 'WOOD', 'STONE'],
  },
  {
    text: 'I am cold and made of water.\nYou lick me on a hot day.',
    correct: 'ICE',
    distractors: ['SNOW', 'MILK', 'JUICE'],
  },
  {
    text: 'You wear me on your head.\nI keep you warm or out of the sun.',
    correct: 'HAT',
    distractors: ['SOCK', 'BELT', 'COAT'],
  },
  {
    text: 'I come out at night.\nI am very bright and I am not the sun.',
    correct: 'MOON',
    distractors: ['STAR', 'LAMP', 'FIRE'],
  },
];
