import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listProductsWithStock, stockStatus } from "@/lib/stock";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await connectDB();
  const lowCount = (await listProductsWithStock()).filter((p) => stockStatus(p) !== "ok").length;
  return (
    <AppShell user={user} lowCount={lowCount}>
      {children}
    </AppShell>
  );
}
