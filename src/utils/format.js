/* ============================================================
 * format.js — All formatting helper functions
 * ------------------------------------------------------------
 * - Number formatting with thousands separator
 * - Date formatting (short, long, datetime)
 * - ISO date helpers
 * - Greeting based on time of day
 * - Initials extractor for avatars
 * ============================================================ */

/**
 * Format a number with comma separators.
 * Example: 1250 → "1,250"
 */
export const formatNumber = (n) => {
    if (n == null || isNaN(n)) return '0'
    return Number(n).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
  }
  
  /**
   * Format ISO date string → "21 Sep 2026"
   */
  export const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  
  /**
   * Format ISO date string → "Sep 21" (short form, for chart labels)
   */
  export const formatDateShort = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
  /**
   * Format ISO date string → "21 Sep, 10:45 AM"
   */
  export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d)) return '—'
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  /**
   * Format any Date as LOCAL calendar date (YYYY-MM-DD).
   * Using toISOString() here would shift dates by a day in
   * timezones ahead of UTC (e.g. Bangladesh, UTC+6).
   */
  export const toLocalISO = (d = new Date()) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  /**
   * Get today's LOCAL date as ISO string (YYYY-MM-DD)
   * Useful for default date inputs and date comparisons.
   */
  export const todayISO = () => toLocalISO(new Date())
  
  /**
   * Get greeting based on current hour.
   * Morning:  < 12
   * Afternoon: 12–16
   * Evening:  >= 17
   */
  export const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
  
  /**
   * Get full formatted date → "Monday, 21 September 2026"
   */
  export const getFullDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  
  /**
   * Extract initials from a name for avatar display.
   * Example: "Alvee Hossain" → "AH"
   */
  export const getInitials = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('') || 'U'
    )
  }
  
  /**
   * Shorten a long string with ellipsis.
   * Example: shorten("Premium Maida Extra", 12) → "Premium Maid…"
   */
  export const shorten = (str = '', max = 14) => {
    if (!str) return ''
    return str.length > max ? str.slice(0, max - 1) + '…' : str
  }