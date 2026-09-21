/**
 * Each product has a different weight per bag (KG).
 * All calculations now work with BAGS as the base unit.
 */
export const PRODUCT_NAMES = [
  'Premium Maida',
  'Popular Maida',
  'Super Green Maida',
  'Classic Maida',
  'Chikun Vushi',
  'Mota Vushi',
  'Filter',
]

export const seedProducts = () => [
  {
    id: 'p1',
    name: 'Premium Maida',
    description: 'Finest quality refined flour for premium bakeries.',
    kgPerBag: 50,
    stock: 0,
  },
  {
    id: 'p2',
    name: 'Popular Maida',
    description: 'Everyday refined flour trusted by households.',
    kgPerBag: 50,
    stock: 0,
  },
  {
    id: 'p3',
    name: 'Super Green Maida',
    description: 'High-grade maida for commercial baking.',
    kgPerBag: 50,
    stock: 0,
  },
  {
    id: 'p4',
    name: 'Classic Maida',
    description: 'Reliable classic-grade refined flour.',
    kgPerBag: 50,
    stock: 0,
  },
  {
    id: 'p5',
    name: 'Chikun Vushi',
    description: 'Traditional fine-ground vushi for local recipes.',
    kgPerBag: 55,
    stock: 0,
  },
  {
    id: 'p6',
    name: 'Mota Vushi',
    description: 'Coarse-ground vushi for hearty meals.',
    kgPerBag: 37,
    stock: 0,
  },
  {
    id: 'p7',
    name: 'Filter',
    description: 'Special filtered flour for fine baking.',
    kgPerBag: 50,
    stock: 0,
  },
]

/** Helper: get kg per bag for a product name */
export const getKgPerBag = (productName) => {
  const map = {
    'Premium Maida': 50,
    'Popular Maida': 50,
    'Super Green Maida': 50,
    'Classic Maida': 50,
    'Chikun Vushi': 55,
    'Mota Vushi': 37,
    'Filter': 50,
  }
  return map[productName] || 50
}