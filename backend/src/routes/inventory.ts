import type { FastifyInstance } from 'fastify'
import { and, desc, eq } from 'drizzle-orm'
import { inventory } from '../db/schema'
import { db } from '../index'
import { priceFetch } from '../services/priceFetch'
import { refreshAllPrices } from '../services/refreshAllPrices'
import { insertInventorySchema } from '../types/inventory.schema'
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
      const userInventory = await db.select().from(inventory).where(eq(inventory.userId, session.user.id)).orderBy(desc(inventory.currentPrice))
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
      return reply.status(400).send({ error: parsed.error.issues[0].message })
    }
    const { name, quantity, cost, url } = parsed.data
    try {
      const userItem = await db.insert(inventory).values({
        name,
        quantity,
        cost,
        url,
        userId: session.user.id,
      }).returning()
      return reply.status(201).send({ item: userItem[0] })
    }
    catch (error) {
      console.error('Error inserting data:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  app.patch<{ Params: { id: string } }>('/:id/fetch-price', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: new Headers(request.headers as Record<string, string>),
    })
    if (!session) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    const item = await db.select().from(inventory).where(and(eq(inventory.id, request.params.id), eq(inventory.userId, session.user.id))).limit(1)
    if (!item.length)
      return reply.status(404).send({ error: 'Item not found' })
    const price = await priceFetch(item[0].url)
    if (!price)
      return reply.status(400).send({ error: 'Could not fetch price' })
    await db.update(inventory).set({ currentPrice: price }).where(eq(inventory.id, item[0].id))
    return reply.send({ price })
  })

  app.patch('/refresh-all', async (request, reply) => {
    const cronSecret = request.headers['cron-secret']
    if (cronSecret !== process.env.CRON_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    try {
      const results = await refreshAllPrices()
      return reply.send(results)
    }
    catch (error) {
      console.error('Error refreshing all prices:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
