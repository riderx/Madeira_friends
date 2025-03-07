import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'

// Store submission timestamps for rate limiting
const submissionTimestamps: Record<string, number[]> = {}

// Progressive rate limiting configuration
const RATE_LIMITS = [
  { count: 3, window: 60 * 60 * 1000, message: 'Too many submissions. Please try again in an hour.' }, // 3 per hour
  { count: 5, window: 24 * 60 * 60 * 1000, message: 'Daily submission limit reached. Please try again tomorrow.' }, // 5 per day
  { count: 15, window: 7 * 24 * 60 * 60 * 1000, message: 'Weekly submission limit reached.' }, // 15 per week
]

// Validate email format
export function validateEmail(email: string): boolean {
  // More comprehensive regex that handles subdomains and special characters better
  const emailRegex = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
  return emailRegex.test(email) && email.length <= 255
}

// Validate phone number format (optional field)
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone)
    return true // Phone is optional

  // Support for international phone number formats
  // Allows +country code and various separator formats
  const phoneRegex = /^(?:\+|00)?[1-9]\d{0,3}[-\s.]?(?:[1-9]\d{0,3})?[-\s.]?\d{1,4}[-\s.]?\d{1,9}$/

  // Remove all non-digit characters for length check
  const digitsOnly = phone.replace(/\D/g, '')

  // Check if the number of digits is reasonable for a phone number
  return phoneRegex.test(phone) && digitsOnly.length >= 7 && digitsOnly.length <= 15
}

// Validate input length
export function validateLength(text: string, minLength: number, maxLength: number): boolean {
  return text.length >= minLength && text.length <= maxLength
}

// Check if the submission is from a bot (honeypot check and other heuristics)
export function isBot(formData: {
  honeypot?: string | null
  submissionTime?: number
  formLoadTime?: number
  name?: string
  email?: string
  message?: string
}): boolean {
  // Check honeypot field
  if (formData.honeypot)
    return true

  // Check for suspicious patterns in submission
  const suspiciousPatterns = [
    // Check if submission happened too quickly after form load
    formData.submissionTime && formData.formLoadTime
    && (formData.submissionTime - formData.formLoadTime < 1500),

    // Check for automated input patterns
    formData.name && formData.email && formData.name === formData.email,

    // Check for common spam keywords in message
    formData.message && /\b(?:viagra|casino|lottery|prize|winner)\b/i.test(formData.message),
  ]

  return suspiciousPatterns.includes(true)
}

// Check if the user has exceeded rate limits
export function checkRateLimit(ipAddress: string): { allowed: boolean, message?: string } {
  const now = Date.now()

  // Initialize array for this IP if it doesn't exist
  if (!submissionTimestamps[ipAddress]) {
    submissionTimestamps[ipAddress] = []
  }

  // For each rate limit configuration, check if user has exceeded the limit
  for (const limit of RATE_LIMITS) {
    const relevantSubmissions = submissionTimestamps[ipAddress].filter(
      timestamp => now - timestamp < limit.window,
    )

    if (relevantSubmissions.length >= limit.count) {
      return { allowed: false, message: limit.message }
    }
  }

  return { allowed: true }
}

// Record a submission for rate limiting
export function recordSubmission(ipAddress: string): void {
  if (!submissionTimestamps[ipAddress]) {
    submissionTimestamps[ipAddress] = []
  }

  submissionTimestamps[ipAddress].push(Date.now())
}

// Sanitize input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  if (!input)
    return ''

  // First trim to remove leading/trailing whitespace
  const trimmed = input.trim()

  // Apply DOMPurify with stricter configuration
  const sanitized = DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep the content of removed tags
    RETURN_DOM: false, // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true,
  })

  return sanitized
}

// Submit contact form data to the database
export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  honeypot?: string
  submissionTime?: number
  formLoadTime?: number
}, ipAddress: string = '0.0.0.0'): Promise<{ success: boolean, error?: string }> {
  try {
    // Check if submission is from a bot
    if (isBot({
      honeypot: formData.honeypot,
      submissionTime: formData.submissionTime,
      formLoadTime: formData.formLoadTime,
      name: formData.name,
      email: formData.email,
      message: formData.message,
    })) {
      // Silently reject bot submissions
      return { success: true } // Return success to avoid giving feedback to bots
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(ipAddress)
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.message || 'Too many submissions. Please try again later.',
      }
    }

    // Validate inputs
    if (!validateEmail(formData.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      }
    }

    if (!validatePhone(formData.phone)) {
      return {
        success: false,
        error: 'Please enter a valid phone number or leave it empty.',
      }
    }

    if (!validateLength(formData.name, 2, 100)) {
      return {
        success: false,
        error: 'Name must be between 2 and 100 characters.',
      }
    }

    if (!validateLength(formData.subject, 2, 200)) {
      return {
        success: false,
        error: 'Subject must be between 2 and 200 characters.',
      }
    }

    if (!validateLength(formData.message, 10, 5000)) {
      return {
        success: false,
        error: 'Message must be between 10 and 5000 characters.',
      }
    }

    // Sanitize all inputs
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email),
      phone: formData.phone ? sanitizeInput(formData.phone) : null,
      subject: sanitizeInput(formData.subject),
      message: sanitizeInput(formData.message),
      ip_address: ipAddress,
    }

    // Insert into database
    const { error } = await supabase
      .from('contact_submissions')
      .insert([sanitizedData])

    if (error)
      throw error

    // Record submission for rate limiting
    recordSubmission(ipAddress)

    return { success: true }
  }
  catch (error) {
    console.error('Error submitting contact form:', error)

    // Determine error type without exposing sensitive details
    let errorMessage = 'Failed to submit the form. Please try again later.'

    if (error instanceof Error) {
      // Check for specific error types without exposing internal details
      if (error.message.includes('validation')) {
        errorMessage = 'Please check your input and try again.'
      }
      else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many submissions. Please try again later.'
      }
      else if (error.message.includes('database')) {
        // Log the detailed error for debugging but return a generic message
        console.error('Database error:', error)
        errorMessage = 'Server error. Please try again later.'
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
