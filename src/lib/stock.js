import mongoose from "mongoose";
import Product from "../models/Product.js";
import Movement from "../models/Movement.js";

export class StockError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const ROLE_MOVEMENTS = {
  owner: ["purchase", "sale", "return", "adjustment"],
  staff: ["sale", "return"],
};
export function computeDelta(type, quantity) {
  if (type === "sale") return -Math.abs(quantity);
  if (type === "adjustment") return quantity;
  return Math.abs(quantity);
}
export async function currentStock(productId, session = null) {
  const rows = await Movement.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, total: { $sum: "$delta" } } },
  ]).session(session);
  return rows[0]?.total ?? 0;
}
export async function stockMap() {
  const rows = await Movement.aggregate([{ $group: { _id: "$product", total: { $sum: "$delta" } } }]);
  return new Map(rows.map((r) => [String(r._id), r.total]));
}

export async function listProductsWithStock() {
  const [products, map] = await Promise.all([Product.find().sort({ name: 1 }).lean(), stockMap()]);
  return products.map((p) => ({
    id: String(p._id),
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: p.price,
    lowStockThreshold: p.lowStockThreshold,
    stock: map.get(String(p._id)) ?? 0,
  }));
}

export function stockStatus(p) {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.lowStockThreshold) return "low";
  return "ok";
}
export async function recordMovement({ productId, type, quantity, reason, date, user }) {
  if (!ROLE_MOVEMENTS[user.role]?.includes(type)) {
    throw new StockError(403, `Staff can only record sales and returns. "${type}" needs the owner.`);
  }
  const delta = computeDelta(type, quantity);
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const product = await Product.findOneAndUpdate({ _id: productId }, { $inc: { lockVersion: 1 } }, { session, new: true });
      if (!product) throw new StockError(404, "That product doesn't exist");
      const stock = await currentStock(productId, session);
      if (stock + delta < 0) {
        throw new StockError(409, `Not enough stock. Only ${stock} ${product.unit} available, you tried to remove ${Math.abs(delta)}.`);
      }
      [created] = await Movement.create(
        [{ product: productId, type, quantity, delta, reason, date: date ?? new Date(), user: user.id, userName: user.name }],
        { session }
      );
    });
    return created;
  } finally {
    await session.endSession();
  }
}


export async function productHistory(productId) {
  const rows = await Movement.find({ product: productId }).sort({ date: 1, createdAt: 1 }).lean();
  let balance = 0;
  const withBalance = rows.map((m) => {
    balance += m.delta;
    return { id: String(m._id), type: m.type, quantity: m.quantity, delta: m.delta, reason: m.reason, date: m.date.toISOString(), userName: m.userName, balance };
  });
  return withBalance.reverse();
}
export async function dailyFlow(days = 14) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const rows = await Movement.aggregate([
    { $match: { date: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, in: { $sum: { $cond: [{ $gt: ["$delta", 0] }, "$delta", 0] } }, out: { $sum: { $cond: [{ $lt: ["$delta", 0] }, { $abs: "$delta" }, 0] } } } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, in: map.get(key)?.in ?? 0, out: map.get(key)?.out ?? 0 });
  }
  return out;
}
