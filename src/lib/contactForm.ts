import DOMPurify from 'isomorphic-dompurify'
import { supabase } from './supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (optional)
function isValidPhone(phone?: string): boolean {
  if (!phone)
    return true
  const phoneRegex = /^\+?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4,6}$/
  return phoneRegex.test(phone)
}

// Sanitize input to prevent XSS attacks
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input).trim()
}

// Validate form data
function validateFormData(formData: ContactFormData): { valid: boolean, errors: string[] } {
  const errors: string[] = []

  if (!formData.name || formData.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters')
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push('A valid email address is required')
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.push('Phone number format is invalid')
  }

  if (!formData.subject || formData.subject.trim().length < 3) {
    errors.push('Subject is required and must be at least 3 characters')
  }

  if (!formData.message || formData.message.trim().length < 10) {
    errors.push('Message is required and must be at least 10 characters')
  }

  return { valid: errors.length === 0, errors }
}

// Store last submission timestamp for rate limiting
const submissionTimestamps = new Map<string, number>()
const RATE_LIMIT_SECONDS = 60 // 1 minute between submissions

export async function submitContactForm(formData: ContactFormData) {
  // Rate limiting check
  const clientIp = crypto.randomUUID() // In a real implementation, you would use the client's IP
  const lastSubmission = submissionTimestamps.get(clientIp) || 0
  const now = Date.now()

  if (now - lastSubmission < RATE_LIMIT_SECONDS * 1000) {
    throw new Error(`Please wait ${RATE_LIMIT_SECONDS} seconds between submissions`)
  }

  // Validate form data
  const { valid, errors } = validateFormData(formData)
  if (!valid) {
    throw new Error(errors.join('. '))
  }

  // Sanitize input
  const sanitizedData: ContactFormData = {
    name: sanitizeInput(formData.name),
    email: sanitizeInput(formData.email),
    phone: formData.phone ? sanitizeInput(formData.phone) : undefined,
    subject: sanitizeInput(formData.subject),
    message: sanitizeInput(formData.message),
  }

  // Submit to Supabase
  const { data, error } = await supabase
    .from('contact_form')
    .insert([sanitizedData as any])
    .select()

  if (error) {
    console.error('Error submitting contact form:', error)
    throw new Error('Failed to submit form. Please try again later.')
  }

  // Update rate limiting
  submissionTimestamps.set(clientIp, now)

  return data
}
