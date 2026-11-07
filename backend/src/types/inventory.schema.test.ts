import { describe, expect, it } from "vitest";
import { insertInventorySchema, updateInventorySchema } from "./inventory.schema.js";

const validInsert = {
  name: "Black Lotus",
  quantity: 1,
  cost: 100,
  url: "https://www.tcgplayer.com/product/123/magic-black-lotus",
};

describe("insertInventorySchema", () => {
  it("accepts a valid payload and transforms cost number to string", () => {
    const result = insertInventorySchema.safeParse(validInsert);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ name: "Black Lotus", quantity: 1 });
      expect(result.data.cost).toBe("100");
    }
  });

  it.each([
    ["empty name", { ...validInsert, name: "" }],
    ["over-100-char name", { ...validInsert, name: "x".repeat(101) }],
    ["quantity below 1", { ...validInsert, quantity: 0 }],
    ["negative cost", { ...validInsert, cost: -1 }],
    ["non-URL url", { ...validInsert, url: "not-a-url" }],
    ["missing name", { quantity: 1, cost: 1, url: validInsert.url }],
    ["missing quantity", { name: "x", cost: 1, url: validInsert.url }],
    ["missing cost", { name: "x", quantity: 1, url: validInsert.url }],
    ["missing url", { name: "x", quantity: 1, cost: 1 }],
  ])("rejects %s", (_label, payload) => {
    expect(insertInventorySchema.safeParse(payload).success).toBe(false);
  });
});

describe("updateInventorySchema", () => {
  it("accepts an empty object (pins current behavior)", () => {
    expect(updateInventorySchema.safeParse({}).success).toBe(true);
  });

  it.each([
    ["name only", { name: "Mox Pearl" }],
    ["quantity only", { quantity: 3 }],
    ["cost only", { cost: 50 }],
    ["full payload", { name: "Mox Pearl", quantity: 3, cost: 50 }],
  ])("accepts partial payload: %s", (_label, payload) => {
    expect(updateInventorySchema.safeParse(payload).success).toBe(true);
  });

  it("transforms cost number to string on update", () => {
    const result = updateInventorySchema.safeParse({ cost: 50 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cost).toBe("50");
    }
  });

  it.each([
    ["empty name", { name: "" }],
    ["over-100-char name", { name: "x".repeat(101) }],
    ["quantity below 1", { quantity: 0 }],
    ["negative cost", { cost: -5 }],
  ])("rejects %s", (_label, payload) => {
    expect(updateInventorySchema.safeParse(payload).success).toBe(false);
  });
});
