const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const seedDelivery = () => [
  // Today
  { id: 'd1',  date: daysAgo(0), product: 'Premium Maida',     quantity: 4, unit: 'Bags', customer: 'Dhaka Bakery House', note: 'Morning dispatch', addedBy: 'Alvee Hossain' },
  { id: 'd2',  date: daysAgo(0), product: 'Popular Maida',     quantity: 3, unit: 'Bags', customer: 'Rahman Store',       note: '',                addedBy: 'Alvee Hossain' },
  { id: 'd3',  date: daysAgo(0), product: 'Super Green Maida', quantity: 3, unit: 'Bags', customer: 'Green Bakers',       note: '',                addedBy: 'Alvee Hossain' },
  { id: 'd4',  date: daysAgo(0), product: 'Classic Maida',     quantity: 2, unit: 'Bags', customer: 'City Foods',         note: '',                addedBy: 'Alvee Hossain' },
  { id: 'd5',  date: daysAgo(0), product: 'Chikun Vushi',      quantity: 1, unit: 'Bags', customer: 'Local Market',       note: '',                addedBy: 'Alvee Hossain' },
  { id: 'd6',  date: daysAgo(0), product: 'Mota Vushi',        quantity: 1, unit: 'Bags', customer: 'Village Traders',    note: '',                addedBy: 'Alvee Hossain' },
  { id: 'd7',  date: daysAgo(0), product: 'Filter',            quantity: 1, unit: 'Bags', customer: 'Fine Flour Co.',     note: '',                addedBy: 'Alvee Hossain' },

  // Yesterday
  { id: 'd8',  date: daysAgo(1), product: 'Premium Maida',     quantity: 5, unit: 'Bags', customer: 'Dhaka Bakery House', note: '', addedBy: 'Alvee Hossain' },
  { id: 'd9',  date: daysAgo(1), product: 'Popular Maida',     quantity: 4, unit: 'Bags', customer: 'Rahman Store',       note: '', addedBy: 'Alvee Hossain' },
  { id: 'd10', date: daysAgo(1), product: 'Super Green Maida', quantity: 3, unit: 'Bags', customer: 'Green Bakers',       note: '', addedBy: 'Alvee Hossain' },

  // 2 days ago
  { id: 'd11', date: daysAgo(2), product: 'Premium Maida',     quantity: 6, unit: 'Bags', customer: 'Metro Foods',        note: '', addedBy: 'Alvee Hossain' },
  { id: 'd12', date: daysAgo(2), product: 'Classic Maida',     quantity: 3, unit: 'Bags', customer: 'City Foods',         note: '', addedBy: 'Alvee Hossain' },

  // 3 days ago
  { id: 'd13', date: daysAgo(3), product: 'Premium Maida',     quantity: 7, unit: 'Bags', customer: 'Dhaka Bakery House', note: '', addedBy: 'Alvee Hossain' },
  { id: 'd14', date: daysAgo(3), product: 'Filter',            quantity: 2, unit: 'Bags', customer: 'Fine Flour Co.',     note: '', addedBy: 'Alvee Hossain' },

  // 4 days ago
  { id: 'd15', date: daysAgo(4), product: 'Popular Maida',     quantity: 5, unit: 'Bags', customer: 'Rahman Store',       note: '', addedBy: 'Alvee Hossain' },
  { id: 'd16', date: daysAgo(4), product: 'Super Green Maida', quantity: 4, unit: 'Bags', customer: 'Green Bakers',       note: '', addedBy: 'Alvee Hossain' },

  // 5 days ago
  { id: 'd17', date: daysAgo(5), product: 'Premium Maida',     quantity: 7, unit: 'Bags', customer: 'Metro Foods',        note: '', addedBy: 'Alvee Hossain' },
  { id: 'd18', date: daysAgo(5), product: 'Classic Maida',     quantity: 4, unit: 'Bags', customer: 'City Foods',         note: '', addedBy: 'Alvee Hossain' },
]