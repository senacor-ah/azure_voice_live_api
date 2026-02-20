/**
 * GET|POST /api/mock-api/[...path]
 * Catch-all mock On-Prem API endpoints for development
 */

import { NextRequest, NextResponse } from 'next/server'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const fullPath = path.join('/')
  console.log(`Mock API call: ${request.method} /${fullPath}`)

  return NextResponse.json({
    status: 'success',
    endpoint: fullPath,
    method: request.method,
    message: 'Mock API response',
  })
}

export const GET = handler
export const POST = handler
