/**
 * POST /api/mock-auth/exchange-token
 * Mock authentication for development — simulates the On-Prem token exchange
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const oneTimeToken = data.oneTimeToken as string | undefined

    console.log(`Mock auth: Exchanging token ${oneTimeToken}`)

    // Development: Accept any token that starts with 'dev-'
    if (oneTimeToken?.startsWith('dev-')) {
      return NextResponse.json({
        access_token: 'Bearer mock-bearer-token-12345',
        expires_in: 3600,
        user_id: 'dev-user-123',
        name: 'Anton Happel',
        email: 'anton.happel@example.com',
        roles: ['customer', 'premium'],
      })
    }

    return NextResponse.json({ error: 'Invalid development token' }, { status: 401 })
  } catch (e) {
    console.error('Mock auth error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
