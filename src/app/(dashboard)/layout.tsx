import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
