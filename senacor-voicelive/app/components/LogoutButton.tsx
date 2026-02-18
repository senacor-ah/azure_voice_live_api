'use client'

import { logout } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 transition-colors"
        style={{ backgroundColor: '#7da0d7' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6a8fc4')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7da0d7')}
      >
        Abmelden
      </button>
    </form>
  )
}
