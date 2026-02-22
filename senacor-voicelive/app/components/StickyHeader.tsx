'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/LogoutButton'

interface StickyHeaderProps {
  userName?: string | null
  /** 'transparent' = hero-style (default on /), 'solid' = always white bg */
  variant?: 'transparent' | 'solid'
}

export function StickyHeader({ userName, variant = 'transparent' }: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [])

  const navLinks = userName
    ? [
        { label: 'Online Banking', href: '/banking' },
        { label: 'Preise & Leistungen', href: '/produkte' },
      ]
    : [
        { label: 'Übersicht', href: '/#hero' },
        { label: 'Produkte', href: '/#produkte' },
        { label: 'Preise & Leistungen', href: '/produkte' },
        { label: 'Kompetenzen', href: '/#kompetenzen' },
        { label: 'Neuigkeiten', href: '/#neuigkeiten' },
      ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        variant === 'solid' || scrolled || menuOpen
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href={userName ? '/banking' : '/'} className="text-2xl font-black tracking-tight text-gray-900">
          senacor<span style={{ color: '#7da0d7' }}>.bank</span>
        </Link>

        {/* Nav Links – Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth – Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {userName ? (
            <>
              <span className="text-sm text-gray-600">{userName}</span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              Anmelden
            </Link>
          )}
        </div>

        {/* Burger button – Mobile */}
        <button
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menü"
        >
          <span className={`block w-5 h-0.5 bg-gray-800 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 rounded mt-1 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 rounded mt-1 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="border-t border-gray-100 mt-2 pt-3">
              {userName ? (
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm text-gray-500">{userName}</span>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
                >
                  Anmelden
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
