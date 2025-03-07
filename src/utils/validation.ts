// Email validation regex
const EMAIL_REGEX = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

// Phone validation regex (international format)
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

// Max lengths
const MAX_LENGTHS = {
  name: 100,
  email: 100,
  phone: 20,
  subject: 200,
  message: 2000,
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= MAX_LENGTHS.email
}

export function validatePhone(phone: string): boolean {
  if (!phone)
    return true // Phone is optional
  return PHONE_REGEX.test(phone) && phone.length <= MAX_LENGTHS.phone
}

export function validateName(name: string): boolean {
  return name.trim().length > 0 && name.length <= MAX_LENGTHS.name
}

export function validateSubject(subject: string): boolean {
  return subject.trim().length > 0 && subject.length <= MAX_LENGTHS.subject
}

export function validateMessage(message: string): boolean {
  return message.trim().length > 0 && message.length <= MAX_LENGTHS.message
}

export function getValidationError(field: string, value: string): string | null {
  switch (field) {
    case 'name':
      if (!validateName(value)) {
        return value.length === 0
          ? 'Name is required'
          : `Name must be less than ${MAX_LENGTHS.name} characters`
      }
      break
    case 'email':
      if (!validateEmail(value)) {
        return value.length === 0
          ? 'Email is required'
          : 'Please enter a valid email address'
      }
      break
    case 'phone':
      if (!validatePhone(value)) {
        return 'Please enter a valid phone number'
      }
      break
    case 'subject':
      if (!validateSubject(value)) {
        return value.length === 0
          ? 'Subject is required'
          : `Subject must be less than ${MAX_LENGTHS.subject} characters`
      }
      break
    case 'message':
      if (!validateMessage(value)) {
        return value.length === 0
          ? 'Message is required'
          : `Message must be less than ${MAX_LENGTHS.message} characters`
      }
      break
  }
  return null
}
