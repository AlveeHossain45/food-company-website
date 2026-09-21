import { formatDateShort } from './format.js'
import { getKgPerBag } from '../data/products.js'

/* ============================================================
 * BAGS-BASED CALCULATION ENGINE
 * ------------------------------------------------------------
 * All quantities are stored in BAGS.
 * Total KG is computed using each product's kgPerBag.
 * ============================================================ */

/** Get total KG for a single record (bags × kgPerBag) */
export const recordToKG = (record) => {
  const bags = Number(record.quantity) || 0
  return bags * getKgPerBag(record.product)
}

/** Today's total in bags for production or delivery */
export const getTodayBags = (records) => {
  const today = new Date().toISOString().split('T')[0]
  return records
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
}

/** Total bags across all records */
export const getTotalBags = (records) =>
  records.reduce((s, r) => s + (Number(r.quantity) || 0), 0)

/** Total KG across all records */
export const getTotalKG = (records) =>
  records.reduce((s, r) => s + recordToKG(r), 0)

/** Yesterday's total bags */
export const getYesterdayBags = (records) => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const iso = d.toISOString().split('T')[0]
  return records
    .filter(r => r.date === iso)
    .reduce((s, r) => s + (Number(r.quantity) || 0), 0)
}

/** Stock per product — bags + kg */
export const getStockByProduct = (production, delivery, products) => {
  return products.map(p => {
    const producedBags = production
      .filter(r => r.product === p.name)
      .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

    const deliveredBags = delivery
      .filter(r => r.product === p.name)
      .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

    const remainingBags = producedBags - deliveredBags
    const kgPerBag = p.kgPerBag || 50

    return {
      ...p,
      producedBags,
      deliveredBags,
      remainingBags,
      producedKG: producedBags * kgPerBag,
      deliveredKG: deliveredBags * kgPerBag,
      remainingKG: remainingBags * kgPerBag,
    }
  })
}

/** Today's per-product production & delivery snapshot */
export const getTodayByProduct = (production, delivery, products) => {
  const today = new Date().toISOString().split('T')[0]

  return products
    .map(p => {
      const prodBags = production
        .filter(r => r.product === p.name && r.date === today)
        .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

      const delBags = delivery
        .filter(r => r.product === p.name && r.date === today)
        .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

      return {
        name: p.name,
        kgPerBag: p.kgPerBag,
        productionBags: prodBags,
        deliveryBags: delBags,
        remainingBags: prodBags - delBags,
        productionKG: prodBags * p.kgPerBag,
        deliveryKG: delBags * p.kgPerBag,
        remainingKG: (prodBags - delBags) * p.kgPerBag,
      }
    })
    .filter(p => p.productionBags > 0 || p.deliveryBags > 0)
}

/** Daily series (last N days) with bags + kg */
export const getDailySeries = (records, days = 7, includeDelivery = null) => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]

    const prodRecords = records.production.filter(r => r.date === iso)
    const prodBags = prodRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
    const prodKG = prodRecords.reduce((s, r) => s + recordToKG(r), 0)

    const item = {
      date: iso,
      label: formatDateShort(iso),
      production: prodBags,
      productionKG: prodKG,
    }

    if (includeDelivery) {
      const delRecords = records.delivery.filter(r => r.date === iso)
      const delBags = delRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
      const delKG = delRecords.reduce((s, r) => s + recordToKG(r), 0)
      item.delivery = delBags
      item.deliveryKG = delKG
    }

    result.push(item)
  }
  return result
}

/** Monthly series */
export const getMonthlySeries = (records, monthsBack = 6) => {
  const result = []
  const now = new Date()

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const prodRecords = records.production.filter(r => r.date.startsWith(prefix))
    const delRecords = records.delivery.filter(r => r.date.startsWith(prefix))

    result.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      production: prodRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      delivery: delRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    })
  }
  return result
}

/** Product-wise aggregation */
export const getProductWise = (production, delivery, products, metric = 'production') => {
  return products.map(p => {
    const prodBags = production
      .filter(r => r.product === p.name)
      .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

    const delBags = delivery
      .filter(r => r.product === p.name)
      .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

    return {
      name: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name,
      fullName: p.name,
      value: metric === 'production' ? prodBags : delBags,
    }
  })
}

/** Filter records by range */
export const filterByRange = (records, range) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let from

  switch (range) {
    case 'today': from = new Date(today); break
    case '7d':    from = new Date(today); from.setDate(from.getDate() - 6); break
    case '30d':   from = new Date(today); from.setDate(from.getDate() - 29); break
    case 'month': from = new Date(today.getFullYear(), today.getMonth(), 1); break
    case '3m':    from = new Date(today); from.setDate(from.getDate() - 89); break
    default:      return records
  }

  const fromISO = from.toISOString().split('T')[0]
  const toISO = today.toISOString().split('T')[0]
  return records.filter(r => r.date >= fromISO && r.date <= toISO)
}

/** Percent change between two numbers */
export const percentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/** Available stock (bags) for a product (excluding a specific delivery id) */
export const getAvailableBags = (productName, production, delivery, excludeDeliveryId = null) => {
  const prodBags = production
    .filter(r => r.product === productName)
    .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

  const delBags = delivery
    .filter(r => r.product === productName && r.id !== excludeDeliveryId)
    .reduce((s, r) => s + (Number(r.quantity) || 0), 0)

  return prodBags - delBags
}