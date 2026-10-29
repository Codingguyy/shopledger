import { z } from "zod";

const int = (label) => z.coerce.number({ invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const productSchema = z.object({
  sku: z.string().trim().min(2, "SKU needs at least 2 characters").max(32, "SKU is too long").regex(/^[A-Za-z0-9-_]+$/, "SKU can only use letters, numbers, - and _"),
  name: z.string().trim().min(1, "Enter a product name").max(120),
  category: z.string().trim().min(1, "Enter a category").max(60),
  unit: z.string().trim().min(1, "Enter a unit, e.g. pcs or kg").max(20),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).min(0, "Price can't be negative").max(10000000),
  lowStockThreshold: int("Low-stock threshold").min(0, "Threshold can't be negative").max(1000000),
});

export const movementSchema = z
  .object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid product"),
    type: z.enum(["purchase", "sale", "return", "adjustment"], { errorMap: () => ({ message: "Choose a movement type" }) }),
    quantity: int("Quantity").refine((n) => Math.abs(n) <= 1000000, "Quantity is too large"),
    reason: z.string().trim().min(2, "Give a short reason").max(200),
    date: z.coerce.date({ invalid_type_error: "Enter a valid date" }).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "adjustment") {
      if (v.quantity === 0) ctx.addIssue({ code: "custom", path: ["quantity"], message: "Adjustment can't be zero. Use + or - to add or remove stock" });
    } else if (v.quantity <= 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "Quantity must be at least 1" });
    }
    if (v.date && v.date.getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "Date can't be in the future" });
    }
  });
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
