import { supabase } from './supabase'

/**
 * Submit a contact form to Supabase
 * @param formData Contact form data
 * @param formData.name Name of the person submitting the form
 * @param formData.email Email of the person submitting the form
 * @param formData.phone Optional phone number of the person submitting the form
 * @param formData.subject Subject of the contact form message
 * @param formData.message Content of the contact form message
 * @returns Success status
 */
export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}): Promise<{ success: boolean, error: string | null }> {
  try {
    const { error } = await supabase
      .from('contact_form')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
        },
      ])

    if (error) {
      console.error('Error submitting contact form:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  }
  catch (error) {
    console.error('Error in submitContactForm:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
