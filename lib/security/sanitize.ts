import { z } from 'zod'

export function sanitizeTarget(input: string): string {
  if (!input) return ''
  return input
    .trim()
    .replace(/[<>'"`;\\]/g, '')
    .substring(0, 500)
}

export function normalizeTarget(input: string): string {
  return sanitizeTarget(input)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

export const scanTargetSchema = z.string()
  .min(1, 'Target is required')
  .max(500, 'Target too long')
  .regex(/^[a-zA-Z0-9.\-_/:@]+$/, 'Invalid characters in target')

export const apiKeySchema = z.string().min(16).max(128)
