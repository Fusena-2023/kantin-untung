export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format tanggal dengan waktu ke format Indonesia
 * Contoh: "12 Januari 2026, 14:30"
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-'

  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  return new Date(date).toLocaleDateString('id-ID', {
    ...defaultOptions,
    ...options
  })
}

/**
 * Format tanggal saja tanpa waktu ke format Indonesia
 * Contoh: "12 Januari 2026"
 */
export const formatDateOnly = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format tanggal pendek ke format Indonesia
 * Contoh: "12 Jan 2026"
 */
export const formatDateShort = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format tanggal ke format input DD/MM/YYYY
 * Contoh: "12/01/2026"
 */
export const formatDateInput = (date) => {
  if (!date) return ''

  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Parse tanggal dari format DD/MM/YYYY ke format YYYY-MM-DD (untuk database)
 * Input: "12/01/2026" -> Output: "2026-01-12"
 */
export const parseDateFromInput = (dateStr) => {
  if (!dateStr) return null

  // Jika sudah dalam format YYYY-MM-DD, langsung return
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Parse dari format DD/MM/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
  }

  return dateStr
}

/**
 * Konversi tanggal dari format YYYY-MM-DD ke DD/MM/YYYY
 */
export const dateToIndonesian = (dateStr) => {
  if (!dateStr) return ''

  // Jika sudah dalam format DD/MM/YYYY, langsung return
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr
  }

  // Parse dari format YYYY-MM-DD
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  return dateStr
}

export const parseNumber = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove currency formatting
    const cleaned = value.replace(/[^\d.-]/g, '')
    return parseFloat(cleaned) || 0
  }
  return 0
}

/**
 * Format tanggal lengkap dengan hari
 * Contoh: "Senin, 12 Januari 2026"
 */
export const formatDateFull = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format waktu saja
 * Contoh: "14:30"
 */
export const formatTime = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
