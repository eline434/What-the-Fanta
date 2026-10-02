// Open Food Facts: a free, open database of shop products (https://world.openfoodfacts.org).
// We only use it to put a name to a barcode that nobody has linked to a Fanta yet.
// Its answer is only needed on the scan screen, so this is a plain function, not a store.

export type Product = {
  name: string;
  brands: string;
  isFanta: boolean;
};

// Returns null when the product is unknown or when you're offline.
export const lookUpProduct = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands`,
      // Open Food Facts asks apps to say who they are.
      { headers: { 'User-Agent': 'WhatTheFanta/1.0 (school project)' } }
    );
    const json = await response.json();
    if (json.status !== 1 || !json.product) {
      return null;
    }

    const name: string = json.product.product_name ?? '';
    const brands: string = json.product.brands ?? '';
    return { name, brands, isFanta: `${name} ${brands}`.toLowerCase().includes('fanta') };
  } catch {
    return null;
  }
};
