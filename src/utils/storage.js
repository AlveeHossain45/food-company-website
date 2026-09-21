const PREFIX = 'yfm_'
const DATA_VERSION = 'v2_bags'  // ← bump this to force reset when schema changes

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  remove(key) { localStorage.removeItem(PREFIX + key) },
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  },
}

export const STORAGE_KEYS = {
  PRODUCTION: 'production',
  DELIVERY: 'delivery',
  PRODUCTS: 'products',
  THEME: 'theme',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  AUTH: 'auth',
  VERSION: 'data_version',
}

/** Run once on app start to reset outdated schemas */
export const runMigrations = () => {
  const current = storage.get(STORAGE_KEYS.VERSION, null)
  if (current !== DATA_VERSION) {
    // Clear old data keys (keep theme, auth, profile, settings)
    storage.remove(STORAGE_KEYS.PRODUCTION)
    storage.remove(STORAGE_KEYS.DELIVERY)
    storage.remove(STORAGE_KEYS.PRODUCTS)
    storage.set(STORAGE_KEYS.VERSION, DATA_VERSION)
    console.log('✅ Data migrated to', DATA_VERSION)
  }
}