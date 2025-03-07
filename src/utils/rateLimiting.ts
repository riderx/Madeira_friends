const SUBMISSION_LIMIT = 3 // Max submissions in time window
const TIME_WINDOW_MS = 60 * 60 * 1000 // 1 hour in milliseconds

interface Submission {
  timestamp: number
}

export function checkRateLimit(formType: string): boolean {
  const storageKey = `form_submissions_${formType}`
  const now = Date.now()

  // Get existing submissions from localStorage
  const storedSubmissions = localStorage.getItem(storageKey)
  const submissions: Submission[] = storedSubmissions
    ? JSON.parse(storedSubmissions)
    : []

  // Filter out submissions older than the time window
  const recentSubmissions = submissions.filter(
    sub => now - sub.timestamp < TIME_WINDOW_MS,
  )

  // Check if user has exceeded the submission limit
  if (recentSubmissions.length >= SUBMISSION_LIMIT) {
    return false
  }

  // Add current submission to the list
  recentSubmissions.push({ timestamp: now })

  // Save updated submissions to localStorage
  localStorage.setItem(storageKey, JSON.stringify(recentSubmissions))

  return true
}

export function getTimeUntilNextSubmission(formType: string): number {
  const storageKey = `form_submissions_${formType}`
  const now = Date.now()

  // Get existing submissions from localStorage
  const storedSubmissions = localStorage.getItem(storageKey)
  if (!storedSubmissions)
    return 0

  const submissions: Submission[] = JSON.parse(storedSubmissions)

  // Filter out submissions older than the time window
  const recentSubmissions = submissions.filter(
    sub => now - sub.timestamp < TIME_WINDOW_MS,
  )

  if (recentSubmissions.length < SUBMISSION_LIMIT)
    return 0

  // Sort submissions by timestamp (oldest first)
  recentSubmissions.sort((a, b) => a.timestamp - b.timestamp)

  // Calculate time until oldest submission expires
  const oldestSubmission = recentSubmissions[0]
  const expiryTime = oldestSubmission.timestamp + TIME_WINDOW_MS

  return Math.max(0, expiryTime - now)
}
