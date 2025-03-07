import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'

// Rate limiting configuration
const MAX_SUBMISSIONS = 3 // Maximum submissions allowed in the time window
const TIME_WINDOW_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// Validate email format with more comprehensive regex
export function validateEmail(email: string): boolean {
  const emailRegex = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
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

// Check if the user has exceeded rate limits with localStorage persistence
export function checkRateLimit(ipAddress: string): boolean {
  const now = Date.now()
  const storageKey = `contact_rate_limit_${ipAddress}`

  // Get timestamps from storage or initialize empty array
  let timestamps: number[] = []
  try {
    const storedData = localStorage.getItem(storageKey)
    if (storedData) {
      timestamps = JSON.parse(storedData)
    }
  }
  catch (e) {
    console.error('Error retrieving rate limit data:', e)
  }

  // Filter out timestamps older than the time window
  timestamps = timestamps.filter(timestamp => now - timestamp < TIME_WINDOW_MS)

  // Store updated timestamps
  try {
    localStorage.setItem(storageKey, JSON.stringify(timestamps))
  }
  catch (e) {
    console.error('Error storing rate limit data:', e)
  }

  // Check if user has exceeded the maximum allowed submissions
  return timestamps.length < MAX_SUBMISSIONS
}

// Record a submission for rate limiting with localStorage persistence
export function recordSubmission(ipAddress: string): void {
  const now = Date.now()
  const storageKey = `contact_rate_limit_${ipAddress}`

  // Get timestamps from storage or initialize empty array
  let timestamps: number[] = []
  try {
    const storedData = localStorage.getItem(storageKey)
    if (storedData) {
      timestamps = JSON.parse(storedData)
    }
  }
  catch (e) {
    console.error('Error retrieving rate limit data:', e)
  }

  // Add new timestamp
  timestamps.push(now)

  // Store updated timestamps
  try {
    localStorage.setItem(storageKey, JSON.stringify(timestamps))
  }
  catch (e) {
    console.error('Error storing rate limit data:', e)
  }
}

// Sanitize input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input).trim()
}

// Submit contact form data to the database with improved error handling
export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  honeypot?: string
}, ipAddress: string = '0.0.0.0'): Promise<{ success: boolean, error?: string, errorType?: string }> {
  try {
    // Check honeypot field
    if (isBot(formData.honeypot)) {
      // Silently reject bot submissions
      console.log('Bot submission detected and rejected')
      return { success: true } // Return success to avoid giving feedback to bots
    }

    // Check rate limit
    if (!checkRateLimit(ipAddress)) {
      console.warn(`Rate limit exceeded for IP: ${ipAddress}`)
      return {
        success: false,
        error: 'Too many submissions. Please try again later.',
        errorType: 'RATE_LIMIT_EXCEEDED',
      }
    }

    // Validate inputs with specific error types
    if (!validateEmail(formData.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
        errorType: 'INVALID_EMAIL',
      }
    }

    if (!validatePhone(formData.phone)) {
      return {
        success: false,
        error: 'Please enter a valid phone number or leave it empty.',
        errorType: 'INVALID_PHONE',
      }
    }

    if (!validateLength(formData.name, 2, 100)) {
      return {
        success: false,
        error: 'Name must be between 2 and 100 characters.',
        errorType: 'INVALID_NAME_LENGTH',
      }
    }

    if (!validateLength(formData.subject, 2, 200)) {
      return {
        success: false,
        error: 'Subject must be between 2 and 200 characters.',
        errorType: 'INVALID_SUBJECT_LENGTH',
      }
    }

    if (!validateLength(formData.message, 10, 5000)) {
      return {
        success: false,
        error: 'Message must be between 10 and 5000 characters.',
        errorType: 'INVALID_MESSAGE_LENGTH',
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

    if (error) {
      console.error('Database error when submitting contact form:', error)
      throw error
    }

    // Record submission for rate limiting
    recordSubmission(ipAddress)

    return { success: true }
  }
  catch (error: any) {
    console.error('Error submitting contact form:', error)

    // Provide more specific error messages based on the error type
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'A submission with this information already exists.',
        errorType: 'DUPLICATE_SUBMISSION',
      }
    }
    else if (error?.code?.startsWith('22')) {
      return {
        success: false,
        error: 'Invalid data format. Please check your inputs.',
        errorType: 'INVALID_DATA_FORMAT',
      }
    }
    else if (error?.code?.startsWith('23')) {
      return {
        success: false,
        error: 'Database constraint violation. Please try again with different data.',
        errorType: 'CONSTRAINT_VIOLATION',
      }
    }
    else if (error?.code?.startsWith('28')) {
      return {
        success: false,
        error: 'Authorization error. You do not have permission to submit this form.',
        errorType: 'AUTHORIZATION_ERROR',
      }
    }

    return {
      success: false,
      error: 'Failed to submit the form. Please try again later.',
      errorType: 'UNKNOWN_ERROR',
    }
  }
}
