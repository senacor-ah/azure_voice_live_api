/**
 * GET /api/config
 * Client configuration endpoint - returns config WITHOUT sensitive data
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ws_endpoint: '/api/ws/voice',
    auth_required: true,
    auth_flow: 'oneTimeToken',
  })
}
