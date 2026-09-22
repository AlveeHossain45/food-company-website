import { randomUUID } from 'node:crypto'

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const SEED_PRODUCTS = [
  { name: 'Premium Maida',     description: 'Finest quality refined flour for premium bakeries.', kgPerBag: 50 },
  { name: 'Popular Maida',     description: 'Everyday refined flour trusted by households.',      kgPerBag: 50 },
  { name: 'Super Green Maida', description: 'High-grade maida for commercial baking.',             kgPerBag: 50 },
  { name: 'Classic Maida',     description: 'Reliable classic-grade refined flour.',               kgPerBag: 50 },
  { name: 'Chikun Vushi',      description: 'Traditional fine-ground vushi for local recipes.',    kgPerBag: 55 },
  { name: 'Mota Vushi',        description: 'Coarse-ground vushi for hearty meals.',               kgPerBag: 37 },
  { name: 'Filter',            description: 'Special filtered flour for fine baking.',             kgPerBag: 50 },
]

const SEED_PRODUCTION = [
  [0, 'Premium Maida', 7, 'Morning shift'],
  [0, 'Popular Maida', 6, ''],
  [0, 'Super Green Maida', 5, ''],
  [0, 'Classic Maida', 4, ''],
  [0, 'Chikun Vushi', 2, ''],
  [0, 'Mota Vushi', 2, ''],
  [0, 'Filter', 2, ''],
  [1, 'Premium Maida', 8, ''],
  [1, 'Popular Maida', 7, ''],
  [1, 'Super Green Maida', 4, ''],
  [1, 'Classic Maida', 4, ''],
  [2, 'Premium Maida', 8, ''],
  [2, 'Popular Maida', 6, ''],
  [2, 'Mota Vushi', 3, ''],
  [3, 'Premium Maida', 9, ''],
  [3, 'Filter', 4, ''],
  [4, 'Popular Maida', 7, ''],
  [4, 'Super Green Maida', 5, ''],
  [5, 'Premium Maida', 9, ''],
  [5, 'Classic Maida', 4, ''],
  [6, 'Chikun Vushi', 3, ''],
  [6, 'Mota Vushi', 2, ''],
]

const SEED_DELIVERY = [
  [0, 'Premium Maida', 4, 'Dhaka Bakery House', 'Morning dispatch'],
  [0, 'Popular Maida', 3, 'Rahman Store', ''],
  [0, 'Super Green Maida', 3, 'Green Bakers', ''],
  [0, 'Classic Maida', 2, 'City Foods', ''],
  [0, 'Chikun Vushi', 1, 'Local Market', ''],
  [0, 'Mota Vushi', 1, 'Village Traders', ''],
  [0, 'Filter', 1, 'Fine Flour Co.', ''],
  [1, 'Premium Maida', 5, 'Dhaka Bakery House', ''],
  [1, 'Popular Maida', 4, 'Rahman Store', ''],
  [1, 'Super Green Maida', 3, 'Green Bakers', ''],
  [2, 'Premium Maida', 6, 'Metro Foods', ''],
  [2, 'Classic Maida', 3, 'City Foods', ''],
  [3, 'Premium Maida', 7, 'Dhaka Bakery House', ''],
  [3, 'Filter', 2, 'Fine Flour Co.', ''],
  [4, 'Popular Maida', 5, 'Rahman Store', ''],
  [4, 'Super Green Maida', 4, 'Green Bakers', ''],
  [5, 'Premium Maida', 7, 'Metro Foods', ''],
  [5, 'Classic Maida', 4, 'City Foods', ''],
]

/**
 * Build the initial dataset. Password hashing is done by the caller
 * (see index.js) so this module stays dependency-free.
 */
export const buildSeed = () => {
  const now = new Date().toISOString()

  const products = SEED_PRODUCTS.map(p => ({
    id: randomUUID(),
    ...p,
    createdAt: now,
    updatedAt: now,
  }))

  let productionCounter = 0
  const production = SEED_PRODUCTION.map(([ago, product, quantity, note]) => {
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - ago)
    return {
      id: randomUUID(),
      date: daysAgo(ago),
      product,
      quantity,
      unit: 'Bags',
      note,
      addedBy: 'Alvee Hossain',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      seq: ++productionCounter,
    }
  })

  let deliveryCounter = 0
  const delivery = SEED_DELIVERY.map(([ago, product, quantity, customer, note]) => {
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - ago)
    return {
      id: randomUUID(),
      date: daysAgo(ago),
      product,
      quantity,
      unit: 'Bags',
      customer,
      note,
      addedBy: 'Alvee Hossain',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      seq: ++deliveryCounter,
    }
  })

  return {
    version: 1,
    users: [],
    products,
    production,
    delivery,
  }
}
