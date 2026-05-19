import { createHash, randomBytes } from 'crypto'

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
