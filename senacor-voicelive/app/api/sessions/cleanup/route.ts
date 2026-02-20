/**
 * POST /api/sessions/cleanup
 * Manually trigger session cleanup (remove expired sessions)
 */

import { NextResponse } from 'next/server'
import { getAuthSessionManager } from '@/lib/services/auth-session-manager'

export async function POST() {
  try {
    const sessionManager = getAuthSessionManager()
    await sessionManager.cleanupExpiredSessions()

    return NextResponse.json({
      status: 'success',
      active_sessions: sessionManager.getSessionCount(),
    })
  } catch (e) {
    console.error('Cleanup error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
