export const MATH_WORLD_SELECT_CONFIG = {
  backgroundPath: 'assets/images/math_garden_v3.png',
  worlds: [
    {
      id: 'number_garden',
      title: 'Number Garden',
      subtitle: 'Odd, even, divisible',
      unlockRequirementText: '',
      signBox: { x: 0.1298, y: 0.2964, w: 0.1081, h: 0.0526 },
    },
    {
      id: 'addition_field',
      title: 'Addition Field',
      subtitle: 'Add and grow',
      unlockRequirementText: 'Complete Number Garden',
      signBox: { x: 0.359, y: 0.2856, w: 0.0999, h: 0.0463 },
    },
    {
      id: 'subtraction_patch',
      title: 'Subtraction Patch',
      subtitle: 'Take away',
      unlockRequirementText: 'Complete Addition Field',
      signBox: { x: 0.1739, y: 0.4725, w: 0.109, h: 0.0537 },
    },
    {
      id: 'multiplication_meadow',
      title: 'Multiplication Meadow',
      subtitle: 'Groups and times',
      unlockRequirementText: 'Complete Subtraction Patch',
      signBox: { x: 0.5023, y: 0.5444, w: 0.111, h: 0.0532 },
    },
    {
      id: 'division_grove',
      title: 'Division Grove',
      subtitle: 'Split fairly',
      unlockRequirementText: 'Complete Multiplication Meadow',
      signBox: { x: 0.1986, y: 0.7319, w: 0.126, h: 0.0649 },
    },
    {
      id: 'fraction_forest',
      title: 'Fraction Forest',
      subtitle: 'Pieces and parts',
      unlockRequirementText: 'Complete Division Grove',
      signBox: { x: 0.7386, y: 0.3564, w: 0.1003, h: 0.0439 },
    },
    {
      id: 'geometry_yard',
      title: 'Geometry Yard',
      subtitle: 'Shapes and space',
      unlockRequirementText: 'Complete Fraction Forest',
      signBox: { x: 0.7822, y: 0.7334, w: 0.1289, h: 0.0629 },
    },
  ],
};
