import { supabase } from './supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export async function submitContactForm(formData: ContactFormData) {
  const { data, error } = await supabase
    .from('contact_form')
    .insert([formData])
    .select()

  if (error) {
    throw error
  }

  return data
}
