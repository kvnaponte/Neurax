import type { AuthRepository } from './auth.repository'

type EventType =
  | 'register'
  | 'login'
  | 'logout'
  | 'verify_secret'
  | 'refresh_token'
  | 'recover_verify'
  | 'reset_password'

type Result = 'success' | 'failure' | 'blocked'

export function makeAuditLogger(repo: AuthRepository) {
  return async (
    eventType: EventType,
    result: Result,
    opts: { usuarioId?: string; ip?: string; userAgent?: string; metadata?: object } = {}
  ) => {
    await repo.logAuthEvent({
      usuario_id: opts.usuarioId,
      event_type: eventType,
      result,
      ip: opts.ip,
      user_agent: opts.userAgent,
      metadata: opts.metadata,
    })
  }
}
