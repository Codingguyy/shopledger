import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Movement from "../src/models/Movement.js";

await connectDB();
await Promise.all([User.deleteMany({}), Product.deleteMany({}), Movement.deleteMany({})]);

const hash = await bcrypt.hash("password123", 10);
const [owner, staff] = await User.create([
  { name: "Asha Rawat", email: "owner@shop.test", passwordHash: hash, role: "owner" },
  { name: "Ravi Negi", email: "staff@shop.test", passwordHash: hash, role: "staff" },
]);

const items = [
  ["RICE-5K", "Basmati rice 5 kg", "Grocery", "bag", 640, 10, 40],
  ["ATTA-10", "Whole wheat atta 10 kg", "Grocery", "bag", 480, 8, 25],
  ["DAL-1K", "Toor dal 1 kg", "Grocery", "pack", 165, 15, 60],
  ["OIL-1L", "Mustard oil 1 L", "Grocery", "bottle", 190, 12, 30],
  ["TEA-250", "Assam tea 250 g", "Beverages", "pack", 120, 10, 45],
  ["BISC-GL", "Glucose biscuits", "Snacks", "pack", 10, 40, 200],
  ["SOAP-NM", "Neem soap", "Personal care", "pcs", 38, 20, 80],
  ["TOOTH-P", "Toothpaste 150 g", "Personal care", "pcs", 95, 15, 50],
  ["NOTE-A5", "A5 notebook", "Stationery", "pcs", 45, 20, 70],
  ["PEN-BL", "Blue ball pen", "Stationery", "pcs", 10, 50, 300],
  ["BULB-9W", "LED bulb 9 W", "Hardware", "pcs", 110, 10, 3],
  ["BATT-AA", "AA batteries (4)", "Hardware", "pack", 90, 10, 0],
];
const products = await Product.create(items.map(([sku, name, category, unit, price, lowStockThreshold]) => ({ sku, name, category, unit, price, lowStockThreshold })));

// Every stock level comes from movements, even the seed data.
const day = 86400000;
const movements = [];
products.forEach((p, i) => {
  const [, , , , , , initial] = items[i];
  const base = { product: p._id, user: owner._id, userName: owner.name };
  if (initial > 0) movements.push({ ...base, type: "purchase", quantity: initial + 30, delta: initial + 30, reason: "Opening stock from wholesaler", date: new Date(Date.now() - 20 * day) });
  // some sales over the last 2 weeks, never exceeding what we hold
  let held = initial + 30;
  if (initial === 0) held = 0;
  for (let d = 12; d >= 1 && held > 0; d--) {
    const q = Math.min(held, 1 + ((i * 7 + d * 3) % 5));
    if ((i + d) % 3 === 0) continue;
    held -= q;
    movements.push({ product: p._id, user: staff._id, userName: staff.name, type: "sale", quantity: q, delta: -q, reason: "Counter sale", date: new Date(Date.now() - d * day + (i * 3600000)) });
  }
  // end the seeded stock near the intended "initial" level
  const diff = held - initial;
  if (diff > 0) movements.push({ ...base, type: "adjustment", quantity: -diff, delta: -diff, reason: "Stock count correction", date: new Date(Date.now() - 0.3 * day) });
  if (diff < 0) movements.push({ ...base, type: "purchase", quantity: -diff, delta: -diff, reason: "Restock", date: new Date(Date.now() - 0.3 * day) });
});
// a customer return
movements.push({ product: products[2]._id, user: staff._id, userName: staff.name, type: "return", quantity: 1, delta: 1, reason: "Customer return: sealed pack", date: new Date(Date.now() - 0.5 * day) });
await Movement.insertMany(movements);

console.log(`Seeded ${products.length} products, ${movements.length} movements.`);
console.log("Owner: owner@shop.test / password123\nStaff: staff@shop.test / password123");
await mongoose.disconnect();
