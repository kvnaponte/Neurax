import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { uploadObject } from '../../shared/storage.js'
import {
  obtenerPerfil,
  actualizarNombre,
  actualizarAvatar,
} from './perfil.service.js'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const UpdateSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
})

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB

const perfilPlugin: FastifyPluginAsync = async (fastify) => {
  // GET /api/perfil
  fastify.get('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const perfil = await obtenerPerfil(db, userId)
    if (!perfil) return reply.status(404).send({ error: 'Perfil no encontrado' })
    return reply.send(perfil)
  })

  // PUT /api/perfil
  fastify.put('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const body = UpdateSchema.parse(req.body)
    if (body.nombre) await actualizarNombre(db, userId, body.nombre)
    const perfil = await obtenerPerfil(db, userId)
    return reply.send(perfil)
  })

  // POST /api/perfil/avatar  (multipart/form-data, campo "avatar")
  fastify.post('/avatar', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any

    const file = await req.file()
    if (!file) return reply.status(400).send({ error: 'No se envió ningún archivo' })
    if (file.fieldname !== 'avatar') {
      return reply.status(400).send({ error: 'El campo debe llamarse "avatar"' })
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      return reply.status(415).send({ error: 'Formato no soportado (usa jpeg, png o webp)' })
    }

    const buffer = await file.toBuffer()
    if (buffer.length > MAX_AVATAR_BYTES) {
      return reply.status(413).send({ error: 'La imagen supera el límite de 5MB' })
    }

    const avatarUrl = await uploadObject(buffer, 'avatars', file.mimetype)
    await actualizarAvatar(db, userId, avatarUrl)

    return reply.send({ avatar_url: avatarUrl })
  })
}

export default perfilPlugin
