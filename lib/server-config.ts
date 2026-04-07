// Set API_URL in .env.local to point to your backend.
// Example: API_URL=http://localhost:3001
export const API_URL = process.env.API_URL ?? 'http://localhost:3001'

export const COOKIE_NAME = 'yiiva_rt'
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
