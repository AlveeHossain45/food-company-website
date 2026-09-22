/**
 * Single source of truth for the product catalog.
 * PRODUCT_NAMES, seedProducts() and getKgPerBag() all derive from it.
 * Each product has a different weight per bag (KG).
 * All calculations work with BAGS as the base unit.
 */
export const PRODUCT_CATALOG = [
  {
    name: 'Premium Maida',
    description: 'Finest quality refined flour for premium bakeries.',
    kgPerBag: 50,
  },
  {
    name: 'Popular Maida',
    description: 'Everyday refined flour trusted by households.',
    kgPerBag: 50,
  },
  {
    name: 'Super Green Maida',
    description: 'High-grade maida for commercial baking.',
    kgPerBag: 50,
  },
  {
    name: 'Classic Maida',
    description: 'Reliable classic-grade refined flour.',
    kgPerBag: 50,
  },
  {
    name: 'Chikun Vushi',
    description: 'Traditional fine-ground vushi for local recipes.',
    kgPerBag: 55,
  },
  {
    name: 'Mota Vushi',
    description: 'Coarse-ground vushi for hearty meals.',
    kgPerBag: 37,
  },
  {
    name: 'Filter',
    description: 'Special filtered flour for fine baking.',
    kgPerBag: 50,
  },
]

export const PRODUCT_NAMES = PRODUCT_CATALOG.map(p => p.name)

export const seedProducts = () =>
  PRODUCT_CATALOG.map((p, i) => ({ id: `p${i + 1}`, ...p }))

/**
 * Get kg per bag for a product name.
 * Pass the live `products` array when custom products may exist —
 * falls back to the built-in catalog, then to 50 kg.
 */
export const getKgPerBag = (productName, products = null) => {
  if (Array.isArray(products)) {
    const hit = products.find(p => p.name === productName)
    if (hit) return Number(hit.kgPerBag) || 50
  }
  const hit = PRODUCT_CATALOG.find(p => p.name === productName)
  return hit ? hit.kgPerBag : 50
}
