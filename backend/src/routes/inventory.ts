import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { inventory } from '../db/schema'
import { db } from '../index'
import { auth } from '../utils/auth'
import { insertInventorySchema } from '../types/inventory.schema'

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

  app.post('/', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: new Headers(request.headers as Record<string, string>),
    })
    if (!session) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    const parsed = insertInventorySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message})
    }
    const { name, quantity, cost, url } = parsed.data
    try {
      const userItem = await db.insert(inventory).values({
        name, 
        quantity, 
        cost,
        url,
        userId: session.user.id
      }).returning()
      return reply.status(201).send({ item: userItem[0]})
    }
    catch (error) {
      console.error('Error inserting data:', error)
      return reply.status(500).send({ error: 'Internal server error'})
    }
  })
}
