import DOMPurify from 'dompurify'
import { supabase } from './supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  website?: string // Honeypot field
}

// Server-side validation function
function validateFormData(formData: ContactFormData): { valid: boolean, error?: string } {
  // Validate name
  if (!formData.name || formData.name.length > 100)
    return { valid: false, error: 'Name is required and must be 100 characters or less' }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!formData.email || !emailRegex.test(formData.email) || formData.email.length > 100)
    return { valid: false, error: 'Valid email is required and must be 100 characters or less' }

  // Validate phone (optional)
  if (formData.phone) {
    const phoneRegex = /^\+?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4,6}$/
    if (!phoneRegex.test(formData.phone) || formData.phone.length > 20)
      return { valid: false, error: 'Phone number format is invalid' }
  }

  // Validate subject
  if (!formData.subject || formData.subject.length > 200)
    return { valid: false, error: 'Subject is required and must be 200 characters or less' }

  // Validate message
  if (!formData.message || formData.message.length > 1000)
    return { valid: false, error: 'Message is required and must be 1000 characters or less' }

  // Honeypot check
  if (formData.website && formData.website.length > 0)
    return { valid: false, error: 'Bot submission detected' }

  return { valid: true }
}

// Sanitize form data to prevent XSS attacks
function sanitizeFormData(formData: ContactFormData): ContactFormData {
  return {
    name: DOMPurify.sanitize(formData.name),
    email: DOMPurify.sanitize(formData.email),
    phone: formData.phone ? DOMPurify.sanitize(formData.phone) : undefined,
    subject: DOMPurify.sanitize(formData.subject),
    message: DOMPurify.sanitize(formData.message),
    website: formData.website,
  }
}

// Store last submission time in localStorage to implement rate limiting
function checkRateLimit(email: string): boolean {
  const rateLimitKey = `contact_form_last_submit_${email}`
  const lastSubmitTime = localStorage.getItem(rateLimitKey)
  const now = Date.now()
  const cooldownPeriod = 10 * 60 * 1000 // 10 minutes in milliseconds

  if (lastSubmitTime) {
    const timeSinceLastSubmit = now - Number.parseInt(lastSubmitTime, 10)
    if (timeSinceLastSubmit < cooldownPeriod) {
      return false // Rate limit exceeded
    }
  }

  // Update last submission time
  localStorage.setItem(rateLimitKey, now.toString())
  return true // Rate limit not exceeded
}

export async function submitContactForm(formData: ContactFormData) {
  // Validate form data
  const validation = validateFormData(formData)
  if (!validation.valid)
    throw new Error(validation.error || 'Invalid form data')

  // Sanitize form data
  const sanitizedData = sanitizeFormData(formData)

  // Check rate limiting
  if (!checkRateLimit(sanitizedData.email)) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Remove honeypot field before inserting
  const { website, ...dataToInsert } = sanitizedData as any

  // Check for existing submissions in the last 10 minutes
  const tenMinutesAgo = new Date()
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

  const { data: existingSubmissions, error: queryError } = await supabase
    .from('contact_form')
    .select('created_at')
    .eq('email', sanitizedData.email)
    .gte('created_at', tenMinutesAgo.toISOString())

  if (queryError) {
    console.error('Error checking rate limit:', queryError)
    throw new Error(`Failed to check rate limit: ${queryError.message}`)
  }

  // Server-side rate limiting
  if (existingSubmissions && existingSubmissions.length > 0) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Insert sanitized data into database
  const { data, error } = await supabase
    .from('contact_form')
    .insert([dataToInsert])
    .select()

  if (error) {
    console.error('Error submitting contact form:', error)
    throw new Error(`Failed to submit form: ${error.message}`)
  }

  return data
}
