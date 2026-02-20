/**
 * GET /api/sessions/stats
 * Session statistics endpoint
 */

import { NextResponse } from 'next/server'
import { getAuthSessionManager } from '@/lib/services/auth-session-manager'

export async function GET() {
  const sessionManager = getAuthSessionManager()
  const sessions = sessionManager.getAllSessions()

  const stats = {
    total_sessions: sessions.length,
    sessions: sessions.map((s) => ({
      session_id: s.sessionId,
      user_name: s.userContext?.name ?? 'Unknown',
      user_id: s.userContext?.user_id ?? 'Unknown',
      created_at: s.createdAt.toISOString(),
      expires_at: s.expiresAt.toISOString(),
    })),
  }

  return NextResponse.json(stats)
}
