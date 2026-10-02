export type FantaStatus = 'current' | 'regional' | 'limited' | 'historical';

// Same field names as the `flavours` table in Supabase,
// so rows from the database can be used without converting them.
export type Fanta = {
  id: string;
  name: string;
  category: string;
  countries: string[];
  status: FantaStatus;
  zero_sugar: boolean;
  image_url: string | null;
  barcodes: string[];
  created_at: string | null; // null for the bundled Fantas
};

// The 12 "current" Fantas are bundled with the app so they are always available offline.
export const defaultFantas: Fanta[] = [
  {
    id: 'fanta-orange',
    name: 'Orange',
    category: 'citrus',
    countries: ['Worldwide'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-orange-zero',
    name: 'Orange Zero Sugar',
    category: 'citrus',
    countries: ['Europe', 'USA', 'Worldwide'],
    status: 'current',
    zero_sugar: true,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-grape',
    name: 'Grape',
    category: 'grape',
    countries: ['USA', 'Europe', 'Asia', 'Africa'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-lemon',
    name: 'Lemon',
    category: 'citrus',
    countries: ['Europe', 'Asia', 'Africa'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-lemon-zero',
    name: 'Lemon Zero',
    category: 'citrus',
    countries: ['Europe'],
    status: 'current',
    zero_sugar: true,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-cassis',
    name: 'Cassis',
    category: 'berry',
    countries: ['Belgium', 'Netherlands', 'France', 'Europe'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-exotic',
    name: 'Exotic',
    category: 'tropical',
    countries: ['Europe', 'Africa', 'Middle East'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-strawberry',
    name: 'Strawberry',
    category: 'berry',
    countries: ['USA', 'Mexico', 'Africa', 'Asia'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-pineapple',
    name: 'Pineapple',
    category: 'tropical',
    countries: ['USA', 'Africa', 'Asia', 'Oceania'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-shokata',
    name: 'Shokata',
    category: 'elderflower',
    countries: ['Romania', 'Poland', 'Croatia', 'Serbia', 'Europe'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-elderflower',
    name: 'Elderflower',
    category: 'elderflower',
    countries: ['Europe'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
  {
    id: 'fanta-fruit-twist',
    name: 'Fruit Twist',
    category: 'fruit-blend',
    countries: ['United Kingdom', 'Europe'],
    status: 'current',
    zero_sugar: false,
    image_url: null,
    barcodes: [],
    created_at: null,
  },
];
