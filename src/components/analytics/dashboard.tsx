"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { STAGE_LABELS, TIER_COLORS, formatDate, cn } from "@/lib/utils";

const STAGE_CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#f97316",
  "#22c55e",
];

const CATEGORY_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
  "#06b6d4", "#eab308", "#ef4444", "#22c55e", "#64748b",
];

type User = { id: string; name: string; email: string; role: string };

type AnalyticsData = {
  totalLeads: number;
  stageCounts: { stage: string; count: number }[];
  funnel: { stage: string; count: number }[];
  avgTimePerStage: { stage: string; avgDays: number }[];
  leadsPerWeek: { week: string; count: number }[];
  atRiskLeads: any[];
  leadsByTier: { tier: string; count: number }[];
  leadsByCategory: { category: string; count: number }[];
};

export function AnalyticsDashboard({
  data,
  users,
  filters,
}: {
  data: AnalyticsData;
  users: User[];
  filters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/analytics?${params.toString()}`);
    },
    [router, searchParams]
  );

  const stageBarData = data.stageCounts.map((s) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    count: s.count,
  }));

  const funnelData = data.funnel.map((s, i) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    value: s.count,
    fill: STAGE_CHART_COLORS[i],
  }));

  const avgTimeData = data.avgTimePerStage.map((s) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    days: s.avgDays,
  }));

  const categoryData = (data.leadsByCategory || []).map((c, i) => ({
    name: c.category,
    value: c.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#18181b] tracking-tight dark:text-white">Analytics</h1>
          <p className="text-[13px] text-[#71717a] font-sub">Pipeline overview and insights</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input-field w-auto text-[13px] py-1.5"
            value={filters.ownerId || ""}
            onChange={(e) => updateFilter("ownerId", e.target.value)}
          >
            <option value="">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input type="date" className="input-field w-auto text-[13px] py-1.5" value={filters.dateFrom || ""} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
          <input type="date" className="input-field w-auto text-[13px] py-1.5" value={filters.dateTo || ""} onChange={(e) => updateFilter("dateTo", e.target.value)} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KPICard icon={Users} label="Total Leads" value={data.totalLeads} iconColor="#3b82f6" iconBg="bg-blue-50 dark:bg-blue-950/30" />
        <KPICard icon={TrendingUp} label="Transacting" value={data.stageCounts.find((s) => s.stage === "TRANSACTING_BUSINESS")?.count || 0} iconColor="#22c55e" iconBg="bg-green-50 dark:bg-green-950/30" />
        <KPICard icon={Clock} label="In Pipeline" value={data.totalLeads - (data.stageCounts.find((s) => s.stage === "TRANSACTING_BUSINESS")?.count || 0)} iconColor="#f59e0b" iconBg="bg-amber-50 dark:bg-amber-950/30" />
        <KPICard icon={AlertTriangle} label="At Risk" value={data.atRiskLeads.length} iconColor="#ef4444" iconBg="bg-red-50 dark:bg-red-950/30" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Stage */}
        <div className="card p-5">
          <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Leads by Stage</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#71717a" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stageBarData.map((_, i) => (
                    <Cell key={i} fill={STAGE_CHART_COLORS[i % STAGE_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="card p-5">
          <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Conversion Funnel</h3>
          <div className="space-y-2.5">
            {funnelData.map((stage, i) => {
              const maxCount = Math.max(...funnelData.map((s) => s.value), 1);
              const pct = Math.round((stage.value / maxCount) * 100);
              const dropoff =
                i > 0 && funnelData[i - 1].value > 0
                  ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100)
                  : null;
              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#52525b] dark:text-[#71717a]">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{stage.value}</span>
                      {dropoff !== null && dropoff > 0 && (
                        <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded dark:bg-red-950/30">-{dropoff}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[#f4f4f5] rounded-full h-6 dark:bg-[#1e1e1e]">
                    <div
                      className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${pct}%`, backgroundColor: stage.fill, minWidth: stage.value > 0 ? "24px" : "0" }}
                    >
                      {pct > 15 && <span className="text-[10px] text-white font-semibold">{pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Avg Time per Stage */}
        <div className="card p-5">
          <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Avg. Days in Stage</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <Tooltip formatter={(v: any) => [`${v} days`, "Avg. Time"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {avgTimeData.map((_, i) => (
                    <Cell key={i} fill={STAGE_CHART_COLORS[i % STAGE_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads per Week */}
        <div className="card p-5">
          <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Leads Created per Week</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.leadsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 3: Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Pie Chart */}
          <div className="card p-5">
            <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 flex items-center gap-2 dark:text-[#a1a1aa]">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Leads by Category
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: "#a1a1aa", strokeWidth: 1 }}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="card p-5">
            <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 dark:text-[#a1a1aa]">Category Breakdown</h3>
            <div className="space-y-2.5">
              {categoryData.map((cat) => {
                const maxCat = Math.max(...categoryData.map((c) => c.value), 1);
                const pct = Math.round((cat.value / maxCat) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }} />
                        <span className="text-[13px] font-medium text-[#3f3f46] dark:text-[#a1a1aa]">{cat.name}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#18181b] dark:text-white">{cat.value}</span>
                    </div>
                    <div className="w-full bg-[#f4f4f5] rounded-full h-1.5 dark:bg-[#1e1e1e]">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* At Risk Leads */}
      <div className="card p-5">
        <h3 className="text-[13px] font-medium text-[#3f3f46] mb-4 flex items-center gap-2 dark:text-[#a1a1aa]">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          At-Risk Leads
          <span className="text-[11px] text-[#a1a1aa] font-normal">
            (overdue action or stuck &gt;14 days)
          </span>
        </h3>
        {data.atRiskLeads.length === 0 ? (
          <p className="text-[13px] text-[#a1a1aa] py-4 text-center">No at-risk leads. Great job!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[#71717a] border-b dark:border-[#1e1e1e]">
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Business</th>
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Stage</th>
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Category</th>
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Next Action Due</th>
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Last Updated</th>
                  <th className="pb-2.5 font-medium text-[11px] uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#1e1e1e]">
                {data.atRiskLeads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-[#fafafa] dark:hover:bg-[#111113]">
                    <td className="py-2.5 font-medium text-[#18181b] dark:text-white">{lead.businessName}</td>
                    <td className="py-2.5"><span className="text-[12px] text-[#52525b] dark:text-[#71717a]">{STAGE_LABELS[lead.stage]}</span></td>
                    <td className="py-2.5">
                      {lead.category ? (
                        <span className="text-[11px] px-1.5 py-0.5 bg-[#f4f4f5] text-[#52525b] rounded dark:bg-[#1e1e1e] dark:text-[#71717a]">{lead.category}</span>
                      ) : (
                        <span className="text-[12px] text-[#a1a1aa]">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {lead.nextActionDueAt ? (
                        <span className={cn("text-[12px]", new Date(lead.nextActionDueAt) < new Date() ? "text-red-600 font-medium" : "text-[#71717a]")}>
                          {formatDate(lead.nextActionDueAt)}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#a1a1aa]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-[12px] text-[#71717a]">{formatDate(lead.updatedAt)}</td>
                    <td className="py-2.5 text-[12px] text-[#71717a]">{lead.owner?.name || "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, iconColor, iconBg }: { icon: any; label: string; value: number; iconColor: string; iconBg: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-[12px] text-[#71717a]">{label}</p>
          <p className="text-xl font-semibold text-[#18181b] dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
