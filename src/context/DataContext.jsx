import { createContext, useContext, useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import { seedProducts } from '../data/products.js'
import { seedProduction } from '../data/production.js'
import { seedDelivery } from '../data/delivery.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [products, setProducts] = useState(() =>
    storage.get(STORAGE_KEYS.PRODUCTS, null) || seedProducts()
  )
  const [production, setProduction] = useState(() =>
    storage.get(STORAGE_KEYS.PRODUCTION, null) || seedProduction()
  )
  const [delivery, setDelivery] = useState(() =>
    storage.get(STORAGE_KEYS.DELIVERY, null) || seedDelivery()
  )
  const [loading, setLoading] = useState(true)

  // Persist
  useEffect(() => { storage.set(STORAGE_KEYS.PRODUCTS, products) }, [products])
  useEffect(() => { storage.set(STORAGE_KEYS.PRODUCTION, production) }, [production])
  useEffect(() => { storage.set(STORAGE_KEYS.DELIVERY, delivery) }, [delivery])

  // Simulate async load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(t)
  }, [])

  // CRUD
  const addProduction = (rec) =>
    setProduction(prev => [{ ...rec, id: Date.now().toString() }, ...prev])
  const updateProduction = (id, patch) =>
    setProduction(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  const deleteProduction = (id) =>
    setProduction(prev => prev.filter(r => r.id !== id))

  const addDelivery = (rec) =>
    setDelivery(prev => [{ ...rec, id: Date.now().toString() }, ...prev])
  const updateDelivery = (id, patch) =>
    setDelivery(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  const deleteDelivery = (id) =>
    setDelivery(prev => prev.filter(r => r.id !== id))

  const addProduct = (p) =>
    setProducts(prev => [...prev, { ...p, id: Date.now().toString() }])
  const updateProduct = (id, patch) =>
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  const deleteProduct = (id) =>
    setProducts(prev => prev.filter(p => p.id !== id))

  return (
    <DataContext.Provider
      value={{
        loading,
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