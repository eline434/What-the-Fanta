// Foursquare Places API: which shops that sell Fanta are around a location?

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Place = Coordinates & {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  distance: number; // metres from the centre of the search
};

// Only shops where you can buy a Fanta. IDs looked up with the Foursquare API itself.
const FANTA_SHOP_CATEGORIES = [
  '52f2ab2ebcbc57f1066b8b46', // Supermarket (Delhaize, ALDI, …)
  '4bf58dd8d48988d118951735', // Grocery Store (Carrefour Market, …)
  '4d954b0ea243a5684a65b473', // Convenience Store (night shops, Carrefour Express, …)
  '4bf58dd8d48988d113951735', // Fuel Station (Q8, TotalEnergies, …)
];

type FoursquarePlace = {
  fsq_place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  location?: { address?: string };
  categories?: { name: string }[];
};

// radius in metres, Foursquare allows up to 100 km but returns at most 50 places.
export const searchShops = async ({ latitude, longitude }: Coordinates, radius: number): Promise<Place[]> => {
  const key = process.env.EXPO_PUBLIC_FOURSQUARE_KEY;
  if (!key) {
    throw new Error('Missing Foursquare key. Add EXPO_PUBLIC_FOURSQUARE_KEY to .env.local.');
  }

  const query = [
    `ll=${latitude},${longitude}`,
    `radius=${Math.round(radius)}`,
    'sort=DISTANCE',
    'limit=50',
    `fsq_category_ids=${FANTA_SHOP_CATEGORIES.join(',')}`,
  ].join('&');

  const response = await fetch(`https://places-api.foursquare.com/places/search?${query}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Places-Api-Version': '2025-06-17',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Foursquare could not find shops (error ${response.status}).`);
  }

  const json: { results: FoursquarePlace[] } = await response.json();
  return json.results.map((place) => ({
    id: place.fsq_place_id,
    name: place.name,
    category: place.categories?.[0]?.name ?? null,
    address: place.location?.address ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    distance: place.distance,
  }));
};

// 120 → "120 m", 1450 → "1.5 km"
export const formatDistance = (metres: number) =>
  metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;

// Straight-line distance in metres between two points on earth (the "haversine" formula).
// Foursquare's distance is from the centre of the search, this one is from wherever you are.
export const distanceBetween = (a: Coordinates, b: Coordinates) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
};
