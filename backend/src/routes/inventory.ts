import type { FastifyInstance } from "fastify";
import { and, asc, eq } from "drizzle-orm";
import { inventory } from "../db/schema.js";
import { db } from "../index.js";
import { priceFetch } from "../services/priceFetch.js";
import { refreshAllPrices } from "../services/refreshAllPrices.js";
import { insertInventorySchema, updateInventorySchema } from "../types/inventory.schema.js";
import { auth } from "../utils/auth.js";

export default async function inventoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, _reply) => {
    const session = await auth.api.getSession({
      headers: new Headers(request.headers as Record<string, string>),
    });
    if (!session) throw app.httpErrors.unauthorized();
    request.session = session;
  });
  /*
  Get all items in inventory table
*/
  app.get("/", async (request, reply) => {
    const userInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, request.session.user.id))
      .orderBy(asc(inventory.name));
    return reply.status(200).send({
      inventory: userInventory,
      message: userInventory.length === 0 ? "No items found for user" : undefined,
    });
  });
  /*
    Add item to inventory table
  */
  app.post("/", async (request, reply) => {
    const parsed = insertInventorySchema.safeParse(request.body);
    if (!parsed.success) {
      throw app.httpErrors.badRequest();
    }
    const { name, quantity, cost, url } = parsed.data;
    const userItem = await db
      .insert(inventory)
      .values({
        name,
        quantity,
        cost,
        url,
        userId: request.session.user.id,
      })
      .returning();
    return reply.status(201).send({ item: userItem[0] });
  });

  /*
    Update name, cost or quantity on a single item in the inventory table
  */

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const parsed = updateInventorySchema.safeParse(request.body);
    if (!parsed.success) throw app.httpErrors.badRequest();
    const item = await db
      .update(inventory)
      .set(parsed.data)
      .where(
        and(eq(inventory.id, request.params.id), eq(inventory.userId, request.session.user.id)),
      )
      .returning();
    if (!item.length) throw app.httpErrors.notFound("Item not found");
    return reply.send(item[0]);
  });

  /*
    Update the price on a single item in the inventory table
  */

  app.patch<{ Params: { id: string } }>("/:id/fetch-price", async (request, reply) => {
    const item = await db
      .select()
      .from(inventory)
      .where(
        and(eq(inventory.id, request.params.id), eq(inventory.userId, request.session.user.id)),
      )
      .limit(1);
    if (!item.length) throw app.httpErrors.notFound("Item not found");
    const price = await priceFetch(item[0].url);
    if (!price) throw app.httpErrors.badRequest("Could not fetch price");
    await db.update(inventory).set({ currentPrice: price }).where(eq(inventory.id, item[0].id));
    return reply.send({ price });
  });
  /*
  Refresh all prices, triggered by an authenticated user
*/
  app.post("/refresh-all", async (request, reply) => {
    const results = await refreshAllPrices();
    return reply.send(results);
  });
}
