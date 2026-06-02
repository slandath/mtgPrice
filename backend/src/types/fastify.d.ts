// backend/src/types/fastify.d.ts
import type { auth } from '../utils/auth'

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

declare module 'fastify' {
  interface FastifyRequest {
    session: Session
  }
}