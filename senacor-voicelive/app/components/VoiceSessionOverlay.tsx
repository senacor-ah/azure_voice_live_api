'use client'

import { useEffect } from 'react'
import { VoiceSessionApp } from './voice-session/VoiceSessionApp'
import { X } from 'lucide-react'

interface VoiceSessionOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function VoiceSessionOverlay({ isOpen, onClose }: VoiceSessionOverlayProps) {
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
      {/* Mobile: fullscreen overlay – hidden via inline style when closed */}
      <div
        className="md:hidden fixed inset-0 z-[100]"
        style={{ display: isOpen ? '' : 'none' }}
      >
        <div className="relative w-full h-full flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', color: '#64748b' }}
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
          <VoiceSessionApp />
        </div>
      </div>

      {/* Desktop: chat-widget popup above the button – hidden via inline style when closed */}
      <div
        className="hidden md:block fixed z-[100] chat-widget"
        style={{ bottom: '96px', right: '32px', display: isOpen ? '' : 'none' }}
      >
        <div
          className="relative w-[400px] rounded-3xl overflow-hidden"
          style={{
            height: '680px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', color: '#64748b' }}
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
          <VoiceSessionApp />
        </div>
      </div>
    </>
  )
}
