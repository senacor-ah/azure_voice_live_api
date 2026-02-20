/**
 * Auth Session Manager - Handles oneTimeToken → Bearer Token flow
 * Migrated from: backend/src/auth_session_manager.py
 *
 * Manages user sessions with Bearer tokens from On-Prem authentication.
 */

import { v4 as uuidv4 } from 'uuid'
import type { SessionInfo, UserContext, WorkflowContext } from '@/lib/types/voice'

// ============================================================================
// Session Store (in-memory, like Python version)
// ============================================================================

const sessions = new Map<string, SessionInfo>()

// ============================================================================
// Auth Session Manager
// ============================================================================

export class AuthSessionManager {
  private onpremAuthUrl: string
  private onpremApiBaseUrl: string

  constructor(onpremAuthUrl: string, onpremApiBaseUrl: string) {
    this.onpremAuthUrl = onpremAuthUrl
    this.onpremApiBaseUrl = onpremApiBaseUrl
  }

  /** Get all sessions (for stats/health) */
  get activeSessions(): Map<string, SessionInfo> {
    return sessions
  }

  /** Get active session count */
  getSessionCount(): number {
    return sessions.size
  }

  /** Get all sessions as array (for API stats) */
  getAllSessions(): SessionInfo[] {
    return Array.from(sessions.values())
  }

  /**
   * Exchange oneTimeToken for Bearer Token and create session.
   */
  async createSessionFromOneTimeToken(oneTimeToken: string): Promise<SessionInfo> {
    console.log('Exchanging oneTimeToken for Bearer token...')

    try {
      const { bearerToken, userContext, expiresIn } = await this.exchangeToken(oneTimeToken)

      const sessionId = `session-${uuidv4().replace(/-/g, '')}`
      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      const session: SessionInfo = {
        sessionId,
        bearerToken,
        userContext,
        expiresAt,
        createdAt: new Date(),
        azureConnection: null,
        appointmentsCache: null,
        workflowContext: null,
        workflowActive: false,
      }

      sessions.set(sessionId, session)

      console.log(
        `Session created for user ${session.userContext.name} (expires in ${expiresIn} seconds)`,
      )

      return session
    } catch (e) {
      console.error('Token exchange failed:', e)
      throw new Error(`Authentication failed: ${String(e)}`)
    }
  }

  /**
   * Exchange oneTimeToken with On-Prem system.
   */
  private async exchangeToken(
    oneTimeToken: string,
  ): Promise<{ bearerToken: string; userContext: UserContext; expiresIn: number }> {
    // 🔧 Development: Dummy Session for test tokens (no HTTP roundtrip needed)
    if (oneTimeToken === '123456_TOK' || oneTimeToken.startsWith('dev-')) {
      console.log(`🔧 Development Mode: Using dummy session for token '${oneTimeToken}'`)
      return this.createDummySessionData()
    }

    try {
      const response = await fetch(this.onpremAuthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oneTimeToken }),
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`)
      }

      const data = await response.json()

      const bearerToken: string = data.access_token
      const expiresIn: number = data.expires_in ?? 3600

      const userContext: UserContext = {
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        roles: data.roles ?? [],
        tenant_id: data.tenant_id,
      }

      if (!bearerToken) {
        throw new Error('No access_token in response')
      }

      return { bearerToken, userContext, expiresIn }
    } catch (e) {
      console.error('Token exchange error:', e)
      throw e
    }
  }

  /**
   * Call On-Prem API with Bearer Token from session.
   */
  async callOnpremApi(
    sessionId: string,
    endpoint: string,
    method = 'GET',
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Invalid or expired session')
    }

    const url = `${this.onpremApiBaseUrl}/${endpoint.replace(/^\//, '')}`

    console.log(
      `Calling On-Prem API: ${method} ${endpoint} (user: ${session.userContext.name})`,
    )

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.bearerToken}`,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })

      if (!response.ok) {
        throw new Error(`On-Prem API error: ${response.status} - ${await response.text()}`)
      }

      return await response.json()
    } catch (e) {
      console.error('On-Prem API error:', e)
      throw e
    }
  }

  /** Get session by ID and validate expiration. */
  getSession(sessionId: string): SessionInfo | null {
    const session = sessions.get(sessionId)

    if (!session) return null

    if (new Date() > session.expiresAt) {
      console.warn(`Session expired: ${sessionId}`)
      this.deleteSession(sessionId)
      return null
    }

    return session
  }

  /** Delete a session and cleanup resources. */
  deleteSession(sessionId: string): void {
    const session = sessions.get(sessionId)
    if (session) {
      console.log(`Deleting session for user ${session.userContext.name}`)
      sessions.delete(sessionId)
    }
  }

  /** Remove all expired sessions. */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    const expired: string[] = []

    for (const [sid, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        expired.push(sid)
      }
    }

    for (const sid of expired) {
      this.deleteSession(sid)
    }

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired sessions`)
    }
  }

  /**
   * Create dummy session data for development/testing.
   */
  private createDummySessionData(): {
    bearerToken: string
    userContext: UserContext
    expiresIn: number
  } {
    const bearerToken = 'dummy-bearer-token-dev-123456'

    const userContext: UserContext = {
      user_id: 'usr_42',
      name: 'Anton Happel',
      email: 'anton.happel@example.com',
      roles: ['admin', 'user', 'voice_user'],
      tenant_id: 'tenant_acme_corp',
      department: 'IT Development',
      phone: '+49 123 456789',
      location: 'München, Deutschland',
      employee_id: 'EMP-2024-001',
      permissions: [
        'voice.access',
        'api.read',
        'api.write',
        'customer.view',
        'orders.manage',
      ],
    }

    const expiresIn = 7200 // 2 hours

    console.log(
      `✅ Created dummy session for: ${userContext.name} (${userContext.email})`,
    )

    return { bearerToken, userContext, expiresIn }
  }
}

// ============================================================================
// Singleton
// ============================================================================

let _authSessionManagerInstance: AuthSessionManager | null = null

export function getAuthSessionManager(): AuthSessionManager {
  if (!_authSessionManagerInstance) {
    const onpremAuthUrl = process.env.ONPREM_AUTH_URL ?? 'https://your-onprem-system.com/api/auth/exchange-token'
    const onpremApiBaseUrl = process.env.ONPREM_API_BASE_URL ?? 'https://your-onprem-system.com/api'
    _authSessionManagerInstance = new AuthSessionManager(onpremAuthUrl, onpremApiBaseUrl)
  }
  return _authSessionManagerInstance
}
