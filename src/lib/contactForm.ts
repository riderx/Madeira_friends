import { supabase } from './supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}

// Server-side validation for contact form data
function validateContactFormData(formData: ContactFormData): { valid: boolean, error?: string } {
  // Email validation regex
  const EMAIL_REGEX = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  // Phone validation regex (optional field)
  const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

  // Name validation
  if (!formData.name || typeof formData.name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }
  if (formData.name.length < 2 || formData.name.length > 100) {
    return { valid: false, error: 'Name must be between 2 and 100 characters' }
  }

  // Email validation
  if (!formData.email || typeof formData.email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }
  if (!EMAIL_REGEX.test(formData.email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  if (formData.email.length > 100) {
    return { valid: false, error: 'Email must be less than 100 characters' }
  }

  // Phone validation (optional)
  if (formData.phone && typeof formData.phone === 'string') {
    if (!PHONE_REGEX.test(formData.phone)) {
      return { valid: false, error: 'Invalid phone number format' }
    }
    if (formData.phone.length > 20) {
      return { valid: false, error: 'Phone number must be less than 20 characters' }
    }
  }

  // Subject validation
  if (!formData.subject || typeof formData.subject !== 'string') {
    return { valid: false, error: 'Subject is required' }
  }
  if (formData.subject.length < 3 || formData.subject.length > 200) {
    return { valid: false, error: 'Subject must be between 3 and 200 characters' }
  }

  // Message validation
  if (!formData.message || typeof formData.message !== 'string') {
    return { valid: false, error: 'Message is required' }
  }
  if (formData.message.length < 10 || formData.message.length > 1000) {
    return { valid: false, error: 'Message must be between 10 and 1000 characters' }
  }

  return { valid: true }
}

export async function submitContactForm(formData: ContactFormData) {
  // Perform server-side validation
  const validation = validateContactFormData(formData)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Prepare data for insertion
  const dataToInsert = {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone ? formData.phone.trim() : null,
    subject: formData.subject.trim(),
    message: formData.message.trim(),
    // Client IP will be captured by Supabase RLS policy
  }

  try {
    // Insert data into the database
    const { data, error } = await supabase
      .from('contact_form')
      .insert([dataToInsert])
      .select()

    if (error) {
      console.error('Error submitting contact form:', error)
      throw error
    }

    return data
  }
  catch (error: any) {
    // Enhanced error handling
    if (error.code === '23514') {
      throw new Error('Invalid data provided. Please check your inputs.')
    }
    else if (error.code === '23505') {
      throw new Error('You have already submitted this message.')
    }
    else if (error.code === '23502') {
      throw new Error('Please fill in all required fields.')
    }
    else if (error.message && error.message.includes('rate limit')) {
      throw new Error('Too many submissions. Please try again later.')
    }
    else {
      console.error('Contact form submission error:', error)
      throw error
    }
  }
}
