import {z} from 'zod'

export const InventorySchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  name: z.string(),
  quantity: z.number().min(1),
  currentPrice: z.number().min(0),
  cost: z.number().min(0).transform(String),
  url: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const insertInventorySchema = z.object({
  name: z.string(),
  quantity: z.number().min(1),
  cost: z.number().min(0).transform(String),
  url: z.string()
})

export type Inventory = z.infer<typeof InventorySchema>
