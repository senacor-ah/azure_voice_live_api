import { z } from 'zod'

// Login Form Schema
export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }).trim(),
  password: z
    .string()
    .min(6, { message: 'Passwort muss mindestens 6 Zeichen lang sein.' })
    .trim(),
})

// Session Payload Type
export type SessionPayload = {
  userId: string
  email: string
  name: string
  expiresAt: Date
}

// Form State Type
export type FormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

// User Type (für Demo-Zwecke hardcoded)
export type User = {
  id: string
  email: string
  password: string // In production würde das gehasht sein
  name: string
  role: 'admin' | 'user'
}

// Demo-Benutzer für Prototyp
export const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@senacor-bank.de',
    password: 'admin123', // In Produktion: bcrypt.hash('admin123', 10)
    name: 'Admin Senacor',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@senacor-bank.de',
    password: 'user123',
    name: 'User Senacor',
    role: 'user',
  },
]
