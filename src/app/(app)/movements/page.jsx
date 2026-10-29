import { getCurrentUser } from "@/lib/auth";
import { listProductsWithStock } from "@/lib/stock";
import RecordPanel from "@/components/RecordPanel";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
  const [user, products] = await Promise.all([getCurrentUser(), listProductsWithStock()]);
  return (
    <div>
      <h1 className="text-3xl font-semibold md:text-4xl">Record movement</h1>
      <p className="mb-6 mt-1 text-muted">{user.role === "owner" ? "Log a sale, purchase, return or stock adjustment." : "Log a sale or a customer return."}</p>
      <RecordPanel products={products} role={user.role} />
    </div>
  );
}
