"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STAGE_ORDER } from "@/lib/utils";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getAnalytics(filters?: {
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
}) {
  await getSessionUser();

  const leadWhere: any = {};
  const historyWhere: any = {};

  if (filters?.ownerId) {
    leadWhere.ownerId = filters.ownerId;
  }
  if (filters?.dateFrom) {
    leadWhere.createdAt = { ...(leadWhere.createdAt || {}), gte: new Date(filters.dateFrom) };
    historyWhere.changedAt = { ...(historyWhere.changedAt || {}), gte: new Date(filters.dateFrom) };
  }
  if (filters?.dateTo) {
    leadWhere.createdAt = { ...(leadWhere.createdAt || {}), lte: new Date(filters.dateTo) };
    historyWhere.changedAt = { ...(historyWhere.changedAt || {}), lte: new Date(filters.dateTo) };
  }

  // Total leads
  const totalLeads = await prisma.lead.count({ where: leadWhere });

  // Leads by stage
  const leadsByStage = await prisma.lead.groupBy({
    by: ["stage"],
    _count: { id: true },
    where: leadWhere,
  });

  const stageCountsMap: Record<string, number> = {};
  for (const s of STAGE_ORDER) stageCountsMap[s] = 0;
  for (const row of leadsByStage) stageCountsMap[row.stage] = row._count.id;

  // Conversion funnel
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    count: stageCountsMap[stage] || 0,
  }));

  // Average time in stage (from stage history)
  const stageHistories = await prisma.leadStageHistory.findMany({
    where: historyWhere,
    orderBy: { changedAt: "asc" },
    select: {
      leadId: true,
      fromStage: true,
      toStage: true,
      changedAt: true,
    },
  });

  // Group histories by lead
  const historyByLead: Record<string, typeof stageHistories> = {};
  for (const h of stageHistories) {
    if (!historyByLead[h.leadId]) historyByLead[h.leadId] = [];
    historyByLead[h.leadId].push(h);
  }

  // Calculate time spent in each stage
  const stageTimeMs: Record<string, number[]> = {};
  for (const s of STAGE_ORDER) stageTimeMs[s] = [];

  for (const leadId in historyByLead) {
    const records = historyByLead[leadId];
    for (let i = 0; i < records.length; i++) {
      const current = records[i];
      const next = records[i + 1];
      if (next) {
        const duration = new Date(next.changedAt).getTime() - new Date(current.changedAt).getTime();
        stageTimeMs[current.toStage]?.push(duration);
      } else {
        // Still in this stage: measure from changedAt to now
        const duration = Date.now() - new Date(current.changedAt).getTime();
        stageTimeMs[current.toStage]?.push(duration);
      }
    }
  }

  const avgTimePerStage = STAGE_ORDER.map((stage) => {
    const times = stageTimeMs[stage] || [];
    const avg = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
    return {
      stage,
      avgDays: Math.round((avg / (1000 * 60 * 60 * 24)) * 10) / 10,
    };
  });

  // Leads created per week (last 12 weeks)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const recentLeads = await prisma.lead.findMany({
    where: {
      ...leadWhere,
      createdAt: { gte: twelveWeeksAgo },
    },
    select: { createdAt: true },
  });

  const weekBuckets: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (11 - i) * 7);
    const key = weekStart.toISOString().slice(0, 10);
    weekBuckets[key] = 0;
  }

  for (const lead of recentLeads) {
    const d = new Date(lead.createdAt);
    // Find which week bucket
    const weekKeys = Object.keys(weekBuckets);
    for (let i = weekKeys.length - 1; i >= 0; i--) {
      if (d >= new Date(weekKeys[i])) {
        weekBuckets[weekKeys[i]]++;
        break;
      }
    }
  }

  const leadsPerWeek = Object.entries(weekBuckets).map(([week, count]) => ({
    week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count,
  }));

  // At-risk leads: overdue next action OR stuck in stage > 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const atRiskLeads = await prisma.lead.findMany({
    where: {
      ...leadWhere,
      OR: [
        { nextActionDueAt: { lt: new Date() } },
        { updatedAt: { lt: fourteenDaysAgo } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });

  // Leads by tier
  const leadsByTier = await prisma.lead.groupBy({
    by: ["tier"],
    _count: { id: true },
    where: leadWhere,
  });

  // Leads by category
  const leadsByCategory = await prisma.lead.groupBy({
    by: ["category"],
    _count: { id: true },
    where: leadWhere,
  });

  return {
    totalLeads,
    stageCounts: STAGE_ORDER.map((s) => ({ stage: s, count: stageCountsMap[s] || 0 })),
    funnel,
    avgTimePerStage,
    leadsPerWeek,
    atRiskLeads,
    leadsByTier: leadsByTier.map((r) => ({ tier: r.tier, count: r._count.id })),
    leadsByCategory: leadsByCategory
      .filter((r) => r.category && r.category.trim() !== "")
      .map((r) => ({ category: r.category, count: r._count.id }))
      .sort((a, b) => b.count - a.count),
  };
}
