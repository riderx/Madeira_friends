import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'

// Store submission timestamps for rate limiting
const submissionTimestamps: Record<string, number[]> = {}

// Rate limiting configuration
const MAX_SUBMISSIONS = 3 // Maximum submissions allowed in the time window
const TIME_WINDOW_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// Validate phone number format (optional field)
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone)
    return true // Phone is optional
  const phoneRegex = /^\+?\(?\d{1,4}\)?[-\s.]?\d{1,4}[-\s.]?\d{1,9}$/
  return phoneRegex.test(phone) && phone.length <= 20
}

// Validate input length
export function validateLength(text: string, minLength: number, maxLength: number): boolean {
  return text.length >= minLength && text.length <= maxLength
}

// Check if the submission is from a bot (honeypot check)
export function isBot(honeypotValue: string | null | undefined): boolean {
  return !!honeypotValue
}

// Check if the user has exceeded rate limits
export function checkRateLimit(ipAddress: string): boolean {
  const now = Date.now()

  // Initialize array for this IP if it doesn't exist
  if (!submissionTimestamps[ipAddress]) {
    submissionTimestamps[ipAddress] = []
  }

  // Filter out timestamps older than the time window
  submissionTimestamps[ipAddress] = submissionTimestamps[ipAddress].filter(
    timestamp => now - timestamp < TIME_WINDOW_MS,
  )

  // Check if user has exceeded the maximum allowed submissions
  return submissionTimestamps[ipAddress].length < MAX_SUBMISSIONS
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
  return DOMPurify.sanitize(input).trim()
}

// Submit contact form data to the database
export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  honeypot?: string
}, ipAddress: string = '0.0.0.0'): Promise<{ success: boolean, error?: string }> {
  try {
    // Check honeypot field
    if (isBot(formData.honeypot)) {
      // Silently reject bot submissions
      return { success: true } // Return success to avoid giving feedback to bots
    }

    // Check rate limit
    if (!checkRateLimit(ipAddress)) {
      return {
        success: false,
        error: 'Too many submissions. Please try again later.',
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
    return {
      success: false,
      error: 'Failed to submit the form. Please try again later.',
    }
  }
}
