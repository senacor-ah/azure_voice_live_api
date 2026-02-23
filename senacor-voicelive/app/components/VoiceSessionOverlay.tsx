'use client'

import { useEffect } from 'react'
import { VoiceSessionApp } from './voice-session/VoiceSessionApp'
import { X } from 'lucide-react'

interface VoiceSessionOverlayProps {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
}

export function VoiceSessionOverlay({ isOpen, onClose, userName }: VoiceSessionOverlayProps) {
  // ESC key closes the overlay
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Lock body scroll while open (mobile only)
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // NOTE: We intentionally do NOT return null when closed.
  // Keeping VoiceSessionApp always mounted means the RTCPeerConnection and
  // WebSocket stay alive during client-side page navigation. The overlay
  // content is hidden via CSS only.

  return (
    <>
      {/* Wrapper: fullscreen on mobile, chat-widget popup on desktop */}
      <div
        className="chat-widget fixed z-[100] inset-0 md:inset-auto md:bottom-[96px] md:right-8 md:w-[400px] md:rounded-3xl md:overflow-hidden"
        style={{
          display: isOpen ? '' : 'none',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          height: undefined,
        }}
      >
        <div className="relative w-full h-full md:h-[min(780px,calc(100vh-110px))]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', color: '#64748b' }}
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
          <VoiceSessionApp userName={userName} isOpen={isOpen} onClose={onClose} />
        </div>
      </div>
    </>
  )
}
