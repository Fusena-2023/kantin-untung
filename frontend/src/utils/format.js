export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  return new Date(date).toLocaleDateString('id-ID', {
    ...defaultOptions,
    ...options
  })
}

export const formatDateOnly = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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
