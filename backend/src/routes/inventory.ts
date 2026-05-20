import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { inventory } from '../db/schema'
import { db } from '../index'
import { auth } from '../utils/auth'

export default async function inventoryRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: new Headers(request.headers as Record<string, string>),
    })
    if (!session) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    try {
      const userInventory = await db.select().from(inventory).where(eq(inventory.userId, session.user.id))
      return reply.status(200).send({
        inventory: userInventory,
        message: userInventory.length === 0 ? 'No items found for user' : undefined,
      })
    }
    catch (error) {
      console.error('Error fetching inventory:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
