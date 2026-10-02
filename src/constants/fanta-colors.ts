import { Fanta } from '@/data/fantas';

type CanColors = {
  body: string;
  dark: string; // bottom of the can, a darker shade of the body
};

// Some flavours don't look like their category (Lemon is "citrus" but should be yellow),
// so a word in the name wins over the category.
const nameColors: Record<string, CanColors> = {
  lemon: { body: '#FFD100', dark: '#C9A300' },
  lime: { body: '#8DC63F', dark: '#5E8A22' },
  cassis: { body: '#5B1F69', dark: '#3A1245' },
  blueberry: { body: '#3A5BBF', dark: '#263D85' },
  mango: { body: '#FFB000', dark: '#C98600' },
  pineapple: { body: '#FFD23F', dark: '#C9A020' },
  watermelon: { body: '#F2545B', dark: '#B83238' },
};

const categoryColors: Record<string, CanColors> = {
  citrus: { body: '#FF8200', dark: '#C25E00' },
  tropical: { body: '#FFC20E', dark: '#C99400' },
  berry: { body: '#E4002B', dark: '#A8001F' },
  'fruit-blend': { body: '#FF4F9A', dark: '#C2306F' },
  melon: { body: '#7AC143', dark: '#4F8A22' },
  'stone-fruit': { body: '#FF9E7A', dark: '#D46A45' },
  apple: { body: '#A6CE39', dark: '#6F9120' },
  cherry: { body: '#B0003A', dark: '#78002A' },
  'cherry-citrus': { body: '#D6284B', dark: '#9C1932' },
  elderflower: { body: '#E3DDB0', dark: '#ADA673' },
  grape: { body: '#6A2C91', dark: '#461C61' },
  'tea-fruit': { body: '#C8A165', dark: '#94733F' },
  'berry-tropical': { body: '#F0506E', dark: '#B3314B' },
};

// For categories we don't know yet, e.g. a new Fanta added by a user.
const fallbackColors: CanColors = { body: '#1D3F9B', dark: '#122A6B' };

export const getCanColors = (fanta: Fanta): CanColors => {
  const name = fanta.name.toLowerCase();
  const nameMatch = Object.keys(nameColors).find((word) => name.includes(word));
  if (nameMatch) {
    return nameColors[nameMatch];
  }
  return categoryColors[fanta.category] ?? fallbackColors;
};
