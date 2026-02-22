'use server'

import { LoginFormSchema, FormState, DEMO_USERS } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'
import { redirect } from 'next/navigation'

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate form fields
  const validatedFields = LoginFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validatedFields.data

  // 2. Check user credentials (in production würde man hier die Datenbank abfragen)
  const user = DEMO_USERS.find(
    (u) => u.email === email && u.password === password
  )

  if (!user) {
    return {
      message: 'E-Mail oder Passwort ist falsch.',
    }
  }

  // 3. Create user session — use the name entered in the form
  await createSession(user.id, user.email, name)

  // 4. Redirect user
  redirect('/banking')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
