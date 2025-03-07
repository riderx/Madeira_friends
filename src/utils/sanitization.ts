import DOMPurify from 'dompurify'

export function sanitizeInput(input: string): string {
  if (!input)
    return ''
  // First strip HTML tags
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Then trim whitespace
  return sanitized.trim()
}

export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    }
    else {
      sanitized[key] = value
    }
  }

  return sanitized
}
