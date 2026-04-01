export const Colors = {
  BLUE_DARK: '#1B3A7A',
  BLUE_LIGHT: '#6BA3D6',
  BG: '#DDE5EF',
  SHADOW: '#C2CDD9',
  HIGHLIGHT: '#F5F9FF',
  GREEN: '#27AE60',
  RED: '#E74C3C',
  AMBER: '#F39C12',
} as const;

export type ColorKey = keyof typeof Colors;
