'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { VoiceSessionOverlay } from './VoiceSessionOverlay'

/**
 * GlobalVoiceWidget
 *
 * Renders the floating avatar launch button + the voice session overlay.
 * Placed directly in the root layout so it is present on every page and
 * is never unmounted during client-side navigation.
 *
 * The overlay uses CSS visibility (not conditional rendering) so the
 * VoiceSessionApp – and with it the WebRTC PeerConnection – stays alive
 * even when the overlay panel is closed.
 */
export function GlobalVoiceWidget() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Hide the widget entirely on the dashboard route
  if (pathname?.startsWith('/dashboard')) return null

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
        {/* Tooltip Label */}
        <div
          className={`text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
          style={{ background: '#1a1a2e' }}
        >
          KI-Beraterin starten
        </div>

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`avatar-pulse relative w-16 h-16 rounded-full focus:outline-none overflow-hidden ${isOpen ? '[animation:none] scale-110' : ''}`}
          style={{
            boxShadow: isOpen
              ? '0 0 0 3px white, 0 0 0 5px #5a82bf, 0 8px 32px rgba(125,160,215,0.6)'
              : '0 0 0 3px white, 0 0 0 5px #7da0d7, 0 8px 32px rgba(125,160,215,0.45)',
          }}
          aria-label="KI-Avatar starten"
          aria-expanded={isOpen}
        >
          <Image
            src="/avatar-assistant.png"
            alt="KI-Beraterin"
            fill
            className="object-cover object-top"
            sizes="64px"
          />
        </button>
      </div>

      {/*
        VoiceSessionOverlay is always rendered so VoiceSessionApp (and its
        RTCPeerConnection / WebSocket) are never unmounted by navigation.
        The overlay itself controls its own visibility via CSS.
      */}
      <VoiceSessionOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
