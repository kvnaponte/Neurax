import { and, eq, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { usuarios, refresh_tokens, auth_logs } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

export function makeAuthRepository(db: DB) {
  return {
    findByEmail: (email: string) =>
      db.query.usuarios.findFirst({ where: eq(usuarios.email, email) }),

    findById: (id: string) =>
      db.query.usuarios.findFirst({ where: eq(usuarios.id, id) }),

    createUser: async (data: {
      nombre: string
      email: string
      hashed_password: string
      secret_answer_hash: string
      recovery_answer_1_hash: string
      recovery_answer_2_hash: string
    }) => {
      const [user] = await db.insert(usuarios).values({ ...data, secret_activated: true }).returning()
      return user!
    },

    updateUser: async (id: string, data: Partial<typeof usuarios.$inferInsert>) => {
      const [user] = await db
        .update(usuarios)
        .set({ ...data, updated_at: new Date() })
        .where(eq(usuarios.id, id))
        .returning()
      return user!
    },

    saveRefreshToken: (data: {
      usuario_id: string
      token_hash: string
      expires_at: Date
      device_info?: object
    }) => db.insert(refresh_tokens).values(data),

    findRefreshToken: (tokenHash: string) =>
      db.query.refresh_tokens.findFirst({
        where: and(eq(refresh_tokens.token_hash, tokenHash), isNull(refresh_tokens.revoked_at)),
      }),

    revokeRefreshToken: (tokenHash: string) =>
      db
        .update(refresh_tokens)
        .set({ revoked_at: new Date() })
        .where(eq(refresh_tokens.token_hash, tokenHash)),

    revokeAllUserTokens: (userId: string) =>
      db
        .update(refresh_tokens)
        .set({ revoked_at: new Date() })
        .where(and(eq(refresh_tokens.usuario_id, userId), isNull(refresh_tokens.revoked_at))),

    logAuthEvent: (data: {
      usuario_id?: string
      event_type: string
      result: string
      ip?: string
      user_agent?: string
      metadata?: object
    }) => db.insert(auth_logs).values(data),
  }
}

export type AuthRepository = ReturnType<typeof makeAuthRepository>
