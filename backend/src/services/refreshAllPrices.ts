import { eq } from 'drizzle-orm'
import { inventory } from '../db/schema'
import { db } from '../index'
import { priceFetch } from './priceFetch'

export async function refreshAllPrices() {
  const allItems = await db.select().from(inventory)
  const results = { updated: 0, failed: 0, total: allItems.length }

  for (const item of allItems) {
    try {
      const price = await priceFetch(item.url)
      if (price) {
        await db.update(inventory).set({ currentPrice: price }).where(eq(inventory.id, item.id))
        results.updated++
      }
      else {
        results.failed++
      }
    }
    catch {
      results.failed++
    }
  }
  return results
}
