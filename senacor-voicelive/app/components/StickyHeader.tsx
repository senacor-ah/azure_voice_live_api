'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/LogoutButton'

interface StickyHeaderProps {
  userName?: string | null
}

export function StickyHeader({ userName }: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
        {/* Logo */}
        <span className="text-2xl font-black tracking-tight text-gray-900">
          senacor<span style={{ color: '#7da0d7' }}>.bank</span>
        </span>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Übersicht', href: '/#hero' },
            { label: 'Produkte', href: '/#produkte' },
            { label: 'Preise & Leistungen', href: '/produkte' },
            { label: 'Kompetenzen', href: '/#kompetenzen' },
            { label: 'Neuigkeiten', href: '/#neuigkeiten' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
