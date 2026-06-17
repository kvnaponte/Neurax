import { randomBytes, createHash } from 'crypto'
import { and, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { cronos_api_keys } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function makeCronosApiKeysService(db: DB) {
  async function generarApiKey(usuarioId: string, nombre: string, permisos?: Record<string, unknown>) {
    const rawKey = `NEURAX_AGENT_${randomBytes(32).toString('hex')}`
    const keyHash = hashKey(rawKey)

    await db.insert(cronos_api_keys).values({
      usuario_id: usuarioId,
      nombre,
      key_hash: keyHash,
      permisos: permisos ?? null,
      activa: true,
    })

    return { key: rawKey, nombre, permisos: permisos ?? null }
  }

  async function autenticarAgente(keyEnClaro: string) {
    const keyHash = hashKey(keyEnClaro)
    const [apiKey] = await db
      .select()
      .from(cronos_api_keys)
      .where(and(eq(cronos_api_keys.key_hash, keyHash), eq(cronos_api_keys.activa, true)))
      .limit(1)

    if (!apiKey) return null

    await db.update(cronos_api_keys)
      .set({ last_used_at: new Date() })
      .where(eq(cronos_api_keys.id, apiKey.id))

    return { userId: apiKey.usuario_id, permisos: apiKey.permisos }
  }

  async function revocarApiKey(usuarioId: string, keyId: string) {
    const [existing] = await db
      .select()
      .from(cronos_api_keys)
      .where(and(eq(cronos_api_keys.id, keyId), eq(cronos_api_keys.usuario_id, usuarioId)))
      .limit(1)

    if (!existing) throw makeError('API Key no encontrada', 404)

    await db.update(cronos_api_keys)
      .set({ activa: false })
      .where(eq(cronos_api_keys.id, keyId))
  }

  return { generarApiKey, autenticarAgente, revocarApiKey }
}

export type CronosApiKeysService = ReturnType<typeof makeCronosApiKeysService>
