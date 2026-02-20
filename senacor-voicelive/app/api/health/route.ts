/**
 * GET /api/health
 * Health check endpoint
 */

import { NextResponse } from 'next/server'
import { getAuthSessionManager } from '@/lib/services/auth-session-manager'

export async function GET() {
  const sessionManager = getAuthSessionManager()

  return NextResponse.json({
    status: 'healthy',
    service: 'senacor-voicelive',
    active_sessions: sessionManager.getSessionCount(),
  })
}
