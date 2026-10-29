import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Product from "../src/models/Product.js";
import Movement from "../src/models/Movement.js";
import { recordMovement, currentStock, computeDelta, listProductsWithStock, productHistory } from "../src/lib/stock.js";
import { movementSchema } from "../src/lib/validators.js";

let rs, product;
const owner = { id: String(new mongoose.Types.ObjectId()), name: "Owner", role: "owner" };
const staff = { id: String(new mongoose.Types.ObjectId()), name: "Staff", role: "staff" };

beforeAll(async () => {
  rs = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); // transactions need a replica set
  await mongoose.connect(rs.getUri("test"));
  await Product.init();
  await Movement.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await rs.stop();
});
beforeEach(async () => {
  await Promise.all([Product.deleteMany({}), Movement.deleteMany({})]);
  product = await Product.create({ sku: "T-1", name: "Test item", category: "Test", unit: "pcs", price: 10, lowStockThreshold: 3 });
});

const move = (user, type, quantity, extra = {}) => recordMovement({ productId: product._id, type, quantity, reason: "test", user, ...extra });

describe("stock is derived from movements", () => {
  it("computes signed deltas per movement type", () => {
    expect(computeDelta("purchase", 5)).toBe(5);
    expect(computeDelta("sale", 5)).toBe(-5);
    expect(computeDelta("return", 2)).toBe(2);
    expect(computeDelta("adjustment", -4)).toBe(-4);
  });

  it("calculates current stock and running balance from history", async () => {
    await move(owner, "purchase", 10);
    await move(staff, "sale", 4);
    await move(staff, "return", 1);
    await move(owner, "adjustment", -2);
    expect(await currentStock(product._id)).toBe(5);
    const list = await listProductsWithStock();
    expect(list[0].stock).toBe(5);
    const hist = await productHistory(product._id);
    expect(hist.map((h) => h.balance)).toEqual([5, 7, 6, 10]); // newest first
  });
});

describe("stock can never go negative", () => {
  it("rejects a sale larger than current stock", async () => {
    await move(owner, "purchase", 2);
    await expect(move(staff, "sale", 3)).rejects.toMatchObject({ status: 409 });
    expect(await currentStock(product._id)).toBe(2);
  });

  it("rejects a negative adjustment that would go below zero", async () => {
    await move(owner, "purchase", 1);
    await expect(move(owner, "adjustment", -2)).rejects.toMatchObject({ status: 409 });
  });

  it("two simultaneous sales of the last item -> exactly one succeeds", async () => {
    await move(owner, "purchase", 1);
    const results = await Promise.allSettled([move(staff, "sale", 1), move(staff, "sale", 1)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await currentStock(product._id)).toBe(0);
  });

  it("many parallel sales never oversell", async () => {
    await move(owner, "purchase", 5);
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => move(staff, "sale", 1)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(await currentStock(product._id)).toBe(0);
    expect(await Movement.countDocuments({ type: "sale" })).toBe(5);
  });
});

describe("roles are enforced on the server", () => {
  it("staff can sell and return", async () => {
    await move(owner, "purchase", 3);
    await expect(move(staff, "sale", 1)).resolves.toBeTruthy();
    await expect(move(staff, "return", 1)).resolves.toBeTruthy();
  });

  it("staff cannot record purchases or adjustments", async () => {
    await expect(move(staff, "purchase", 5)).rejects.toMatchObject({ status: 403 });
    await expect(move(staff, "adjustment", 5)).rejects.toMatchObject({ status: 403 });
    expect(await Movement.countDocuments()).toBe(0);
  });
});

describe("input validation", () => {
  const base = { productId: "a".repeat(24), type: "sale", reason: "ok" };
  it("rejects zero / negative / fractional quantities", () => {
    expect(movementSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(movementSchema.safeParse({ ...base, quantity: -3 }).success).toBe(false);
    expect(movementSchema.safeParse({ ...base, quantity: 1.5 }).success).toBe(false);
  });
  it("allows signed adjustments but not zero, and rejects future dates", () => {
    expect(movementSchema.safeParse({ ...base, type: "adjustment", quantity: -3 }).success).toBe(true);
    expect(movementSchema.safeParse({ ...base, type: "adjustment", quantity: 0 }).success).toBe(false);
    expect(movementSchema.safeParse({ ...base, quantity: 1, date: new Date(Date.now() + 864e5 * 3) }).success).toBe(false);
  });
});
