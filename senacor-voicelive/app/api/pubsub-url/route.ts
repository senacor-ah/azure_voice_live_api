/**
 * GET /api/pubsub-url
 *
 * Returns a signed WebSocket URL for connecting to Azure Web PubSub.
 * Protected: requires a valid session cookie.
 *
 * Response shape:
 *   { url: string }          – full wss:// URL with embedded access_token
 *   { error: string }        – on failure
 *
 * The URL is valid for 60 minutes and uses a read-only subscriber role.
 * It grants only `webpubsub.joinLeaveGroup` so the browser can subscribe but
 * cannot publish back to the hub.
 */

import { NextResponse } from 'next/server'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import { getSession } from '@/app/lib/dal'

export async function GET() {
  // Auth guard – redirect-free version so we can return JSON errors
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connectionString = process.env.AZURE_WEBPUBSUB_CONNECTION_STRING
  const hubName = process.env.AZURE_WEBPUBSUB_HUB_NAME ?? 'conversation_events'

  if (!connectionString) {
    return NextResponse.json(
      { error: 'Web PubSub not configured (missing AZURE_WEBPUBSUB_CONNECTION_STRING)' },
      { status: 503 },
    )
  }

  try {
    const client = new WebPubSubServiceClient(connectionString, hubName)

    // GenerateClientTokenOptions:
    //   userId              – tag the connection with the logged-in user
    //   roles               – subscriber-only (no publish back)
    //   expirationTimeInMinutes – token TTL (Python SDK: minutes_to_expire)
    const tokenResponse = await client.getClientAccessToken({
      userId: session.userId,
      // sendToGroup is needed so the client can receive group-targeted messages;
      // joinLeaveGroup allows subscribing to specific groups.
      roles: ['webpubsub.sendToGroup', 'webpubsub.joinLeaveGroup'],
      expirationTimeInMinutes: 60,
    })

    // tokenResponse.url  = full wss:// URL with ?access_token=... appended
    // tokenResponse.token = raw JWT (not needed by the browser directly)
    return NextResponse.json({ url: tokenResponse.url })
  } catch (err) {
    console.error('Failed to generate PubSub access token:', err)
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 },
    )
  }
}
