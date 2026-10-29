import { getCurrentUser } from "@/lib/auth";
import { listProductsWithStock } from "@/lib/stock";
import ProductsClient from "@/components/ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [user, products] = await Promise.all([getCurrentUser(), listProductsWithStock()]);
  return <ProductsClient products={products} role={user.role} />;
}
