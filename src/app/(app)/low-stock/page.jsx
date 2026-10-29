import { getCurrentUser } from "@/lib/auth";
import { listProductsWithStock } from "@/lib/stock";
import ProductsClient from "@/components/ProductsClient";

export const dynamic = "force-dynamic";

export default async function LowStockPage() {
  const [user, products] = await Promise.all([getCurrentUser(), listProductsWithStock()]);
  const sorted = [...products].sort((a, b) => a.stock / (a.lowStockThreshold || 1) - b.stock / (b.lowStockThreshold || 1));
  return <ProductsClient products={sorted} role={user.role} title="Low stock" lowOnly />;
}
