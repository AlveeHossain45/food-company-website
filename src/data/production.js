import { toLocalISO } from '../utils/format.js'

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalISO(d)
}

/**
 * Quantity is now in BAGS.
 * Each product has its own kgPerBag defined in products.js
 */
export const seedProduction = () => [
  // Today
  { id: 'pr1',  date: daysAgo(0), product: 'Premium Maida',     quantity: 7,  unit: 'Bags', note: 'Morning shift', addedBy: 'Alvee Hossain' },
  { id: 'pr2',  date: daysAgo(0), product: 'Popular Maida',     quantity: 6,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },
  { id: 'pr3',  date: daysAgo(0), product: 'Super Green Maida', quantity: 5,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },
  { id: 'pr4',  date: daysAgo(0), product: 'Classic Maida',     quantity: 4,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },
  { id: 'pr5',  date: daysAgo(0), product: 'Chikun Vushi',      quantity: 2,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },
  { id: 'pr6',  date: daysAgo(0), product: 'Mota Vushi',        quantity: 2,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },
  { id: 'pr7',  date: daysAgo(0), product: 'Filter',            quantity: 2,  unit: 'Bags', note: '',              addedBy: 'Alvee Hossain' },

  // Yesterday
  { id: 'pr8',  date: daysAgo(1), product: 'Premium Maida',     quantity: 8, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr9',  date: daysAgo(1), product: 'Popular Maida',     quantity: 7, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr10', date: daysAgo(1), product: 'Super Green Maida', quantity: 4, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr11', date: daysAgo(1), product: 'Classic Maida',     quantity: 4, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },

  // 2 days ago
  { id: 'pr12', date: daysAgo(2), product: 'Premium Maida',     quantity: 8, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr13', date: daysAgo(2), product: 'Popular Maida',     quantity: 6, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr14', date: daysAgo(2), product: 'Mota Vushi',        quantity: 3, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },

  // 3 days ago
  { id: 'pr15', date: daysAgo(3), product: 'Premium Maida',     quantity: 9, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr16', date: daysAgo(3), product: 'Filter',            quantity: 4, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },

  // 4 days ago
  { id: 'pr17', date: daysAgo(4), product: 'Popular Maida',     quantity: 7, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr18', date: daysAgo(4), product: 'Super Green Maida', quantity: 5, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },

  // 5 days ago
  { id: 'pr19', date: daysAgo(5), product: 'Premium Maida',     quantity: 9, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr20', date: daysAgo(5), product: 'Classic Maida',     quantity: 4, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },

  // 6 days ago
  { id: 'pr21', date: daysAgo(6), product: 'Chikun Vushi',      quantity: 3, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
  { id: 'pr22', date: daysAgo(6), product: 'Mota Vushi',        quantity: 2, unit: 'Bags', note: '', addedBy: 'Alvee Hossain' },
]