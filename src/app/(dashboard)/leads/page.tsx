import { getLeads, getUsers } from "@/actions/leads";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeadsView } from "@/components/leads/leads-view";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const params = await searchParams as any;
  const filters = {
    stage: params.stage || undefined,
    tier: params.tier || undefined,
    ownerId: params.ownerId || undefined,
    search: params.search || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  const [leads, users, session] = await Promise.all([
    getLeads(filters),
    getUsers(),
    getServerSession(authOptions),
  ]);

  return (
    <LeadsView
      leads={leads}
      users={users}
      filters={filters}
      currentUserRole={session?.user?.role}
    />
  );
}
