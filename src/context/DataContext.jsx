import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { seedProducts } from '../data/products.js'
import { seedProduction } from '../data/production.js'
import { seedDelivery } from '../data/delivery.js'

const DataContext = createContext(null)

/** Collision-proof local id (used only in offline mode). */
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const nowISO = () => new Date().toISOString()

/**
 * DataProvider — dual-mode store:
 *  - server mode: loads & mutates through the REST API (source of truth)
 *  - local mode:   localStorage-backed fallback when the API is offline
 */
export function DataProvider({ children }) {
  const { user } = useAuth()

  const [products, setProducts] = useState(
    () => storage.get(STORAGE_KEYS.PRODUCTS, null) || seedProducts()
  )
  const [production, setProduction] = useState(
    () => storage.get(STORAGE_KEYS.PRODUCTION, null) || seedProduction()
  )
  const [delivery, setDelivery] = useState(
    () => storage.get(STORAGE_KEYS.DELIVERY, null) || seedDelivery()
  )

  // 'loading' → probing server | 'server' | 'local' (offline fallback)
  const [mode, setMode] = useState('loading')
  const loading = mode === 'loading'

  /* Mutations issued while the initial sync is in flight must wait for
   * it — otherwise they write locally and are then overwritten by the
   * server response. */
  const modeWaiters = useRef([])
  const settleMode = (next) => {
    setMode(next)
    const waiters = modeWaiters.current
    modeWaiters.current = []
    waiters.forEach(resolve => resolve(next))
  }
  const whenReady = () =>
    mode === 'loading'
      ? new Promise(resolve => modeWaiters.current.push(resolve))
      : Promise.resolve(mode)

  /* ── Initial sync: pull everything from the API when signed in ── */
  useEffect(() => {
    let dead = false
    if (!user) {
      // Signed out: restore the pre-login dataset so another user's
      // server records are never shown or persisted locally.
      setProducts(storage.get(STORAGE_KEYS.PRODUCTS, null) || seedProducts())
      setProduction(storage.get(STORAGE_KEYS.PRODUCTION, null) || seedProduction())
      setDelivery(storage.get(STORAGE_KEYS.DELIVERY, null) || seedDelivery())
      settleMode('local')
      return
    }
    ;(async () => {
      try {
        const [p, pr, d] = await Promise.all([
          api.get('/products'),
          api.get('/production'),
          api.get('/delivery'),
        ])
        if (dead) return
        setProducts(p)
        setProduction(pr)
        setDelivery(d)
        settleMode('server')
      } catch {
        if (dead) return
        settleMode('local')
      }
    })()
    return () => { dead = true }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Persist only in local (offline) mode ── */
  useEffect(() => {
    if (mode === 'local') storage.set(STORAGE_KEYS.PRODUCTS, products)
  }, [products, mode])
  useEffect(() => {
    if (mode === 'local') storage.set(STORAGE_KEYS.PRODUCTION, production)
  }, [production, mode])
  useEffect(() => {
    if (mode === 'local') storage.set(STORAGE_KEYS.DELIVERY, delivery)
  }, [delivery, mode])

  /* ── Production CRUD ── */
  const addProduction = async (rec) => {
    if ((await whenReady()) === 'server') {
      const created = await api.post('/production', rec)
      setProduction(prev => [created, ...prev])
      return created
    }
    const created = { ...rec, id: uid(), unit: 'Bags', createdAt: nowISO(), updatedAt: nowISO() }
    setProduction(prev => [created, ...prev])
    return created
  }

  const updateProduction = async (id, patch) => {
    if ((await whenReady()) === 'server') {
      const updated = await api.put(`/production/${id}`, patch)
      setProduction(prev => prev.map(r => (r.id === id ? updated : r)))
      return updated
    }
    const existing = production.find(r => r.id === id)
    if (!existing) return null
    const updated = { ...existing, ...patch, updatedAt: nowISO() }
    setProduction(prev => prev.map(r => (r.id === id ? updated : r)))
    return updated
  }

  const deleteProduction = async (id) => {
    if ((await whenReady()) === 'server') await api.del(`/production/${id}`)
    setProduction(prev => prev.filter(r => r.id !== id))
  }

  /* ── Delivery CRUD ── */
  const addDelivery = async (rec) => {
    if ((await whenReady()) === 'server') {
      const created = await api.post('/delivery', rec)
      setDelivery(prev => [created, ...prev])
      return created
    }
    const created = { ...rec, id: uid(), unit: 'Bags', createdAt: nowISO(), updatedAt: nowISO() }
    setDelivery(prev => [created, ...prev])
    return created
  }

  const updateDelivery = async (id, patch) => {
    if ((await whenReady()) === 'server') {
      const updated = await api.put(`/delivery/${id}`, patch)
      setDelivery(prev => prev.map(r => (r.id === id ? updated : r)))
      return updated
    }
    const existing = delivery.find(r => r.id === id)
    if (!existing) return null
    const updated = { ...existing, ...patch, updatedAt: nowISO() }
    setDelivery(prev => prev.map(r => (r.id === id ? updated : r)))
    return updated
  }

  const deleteDelivery = async (id) => {
    if ((await whenReady()) === 'server') await api.del(`/delivery/${id}`)
    setDelivery(prev => prev.filter(r => r.id !== id))
  }

  /* ── Product CRUD ── */
  const addProduct = async (p) => {
    if ((await whenReady()) === 'server') {
      const created = await api.post('/products', p)
      setProducts(prev => [...prev, created])
      return created
    }
    const created = { ...p, id: uid(), createdAt: nowISO(), updatedAt: nowISO() }
    setProducts(prev => [...prev, created])
    return created
  }

  const updateProduct = async (id, patch) => {
    if ((await whenReady()) === 'server') {
      const updated = await api.put(`/products/${id}`, patch)
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)))
      return updated
    }
    const existing = products.find(p => p.id === id)
    if (!existing) return null
    const updated = { ...existing, ...patch, updatedAt: nowISO() }
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)))
    return updated
  }

  const deleteProduct = async (id) => {
    if ((await whenReady()) === 'server') await api.del(`/products/${id}`)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <DataContext.Provider
      value={{
        loading,
        mode,
        products, production, delivery,
        addProduction, updateProduction, deleteProduction,
        addDelivery, updateDelivery, deleteDelivery,
        addProduct, updateProduct, deleteProduct,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
