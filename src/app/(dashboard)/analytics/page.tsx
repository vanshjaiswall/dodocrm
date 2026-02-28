import { getAnalytics } from "@/actions/analytics";
import { getUsers } from "@/actions/leads";
import { AnalyticsDashboard } from "@/components/analytics/dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const params = await searchParams as any;
  const filters = {
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    ownerId: params.ownerId || undefined,
  };

  const [analytics, users] = await Promise.all([
    getAnalytics(filters),
    getUsers(),
  ]);

  return <AnalyticsDashboard data={analytics} users={users} filters={filters} />;
}
