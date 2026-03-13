import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const Role = { ADMIN: "ADMIN", MEMBER: "MEMBER" } as const;

async function main() {
  console.log("Seeding database (safe mode — will NOT delete existing data)...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const memberHash = await bcrypt.hash("member123", 10);

  // Upsert users — creates if they don't exist, updates password if they do
  const vansh = await prisma.user.upsert({
    where: { email: "vansh@dodopayments.com" },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      name: "Vansh",
      email: "vansh@dodopayments.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const purrvi = await prisma.user.upsert({
    where: { email: "purrvi@dodopayments.com" },
    update: { passwordHash: memberHash, role: Role.MEMBER },
    create: {
      name: "Purrvi",
      email: "purrvi@dodopayments.com",
      passwordHash: memberHash,
      role: Role.MEMBER,
    },
  });

  const aaryan = await prisma.user.upsert({
    where: { email: "aaryan@dodopayments.com" },
    update: { passwordHash: memberHash, role: Role.MEMBER },
    create: {
      name: "Aaryan",
      email: "aaryan@dodopayments.com",
      passwordHash: memberHash,
      role: Role.MEMBER,
    },
  });

  console.log("Users ready:", vansh.name, purrvi.name, aaryan.name);

  // Only create sample leads if the database is empty
  const existingLeads = await prisma.lead.count();
  if (existingLeads > 0) {
    console.log(`\nDatabase already has ${existingLeads} leads — skipping sample data.`);
    console.log("Seed complete (users updated, leads preserved)!");
    return;
  }

  console.log("\nNo existing leads found — creating sample data...");

  const Tier = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" } as const;
  const Stage = {
    MEETING_SCHEDULED: "MEETING_SCHEDULED",
    MEETING_DONE: "MEETING_DONE",
    PRODUCT_VERIFICATION_SUBMITTED: "PRODUCT_VERIFICATION_SUBMITTED",
    PAYOUT_VERIFICATION_SUBMITTED: "PAYOUT_VERIFICATION_SUBMITTED",
    TRANSACTING_BUSINESS: "TRANSACTING_BUSINESS",
  } as const;

  const leadsData = [
    {
      businessId: "bus_0NYuf6nkeJEm9hUDAKgZv",
      businessName: "TechFlow SaaS",
      email: "hello@techflow.io",
      category: "SaaS",
      tier: Tier.HIGH,
      stage: Stage.TRANSACTING_BUSINESS,
      meetingScheduledAt: daysAgo(30),
      painPoints: "Struggling with international payment processing. Current provider has high fees and slow settlement times.",
      questionsAsked: "What currencies do you support? What are settlement times? API documentation availability?",
      nextAction: "Monthly check-in",
      nextActionDueAt: daysFromNow(7),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_3kTpR8mWxQa2vLcY7NjHd",
      businessName: "Shopify Plus - LuxBrand",
      email: "ops@luxbrand.com",
      category: "E-commerce",
      tier: Tier.HIGH,
      stage: Stage.PAYOUT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(14),
      painPoints: "Need multi-currency support and faster payouts to suppliers globally.",
      questionsAsked: "Payout speed to Southeast Asia? Compliance handling for EU transactions?",
      nextAction: "Follow up on payout verification",
      nextActionDueAt: daysFromNow(2),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_7hGfE4sLpMn1bXwK9RqUz",
      businessName: "GameVault Studios",
      email: "biz@gamevault.gg",
      category: "Gaming",
      tier: Tier.HIGH,
      stage: Stage.PRODUCT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(10),
      painPoints: "Microtransaction processing. Need low-latency payment confirmation.",
      questionsAsked: "Webhook reliability? Sub-second confirmation possible? Fraud detection features?",
      nextAction: "Send integration guide",
      nextActionDueAt: daysFromNow(1),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_2wVtA5cDrFj8gYiO6PxSn",
      businessName: "EduLearn Platform",
      email: "finance@edulearn.co",
      category: "EdTech",
      tier: Tier.MEDIUM,
      stage: Stage.MEETING_DONE,
      meetingScheduledAt: daysAgo(5),
      painPoints: "Subscription billing for students across different countries.",
      questionsAsked: "Recurring billing support? Student verification integration?",
      nextAction: "Prepare custom pricing proposal",
      nextActionDueAt: daysFromNow(3),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_9mBnC1eHkLq4tZwJ3FyXa",
      businessName: "CloudKit Tools",
      email: "team@cloudkit.dev",
      category: "Developer Tools",
      tier: Tier.MEDIUM,
      stage: Stage.MEETING_DONE,
      meetingScheduledAt: daysAgo(7),
      painPoints: "Need better developer experience for payment integration.",
      questionsAsked: "SDK languages supported? Sandbox environment?",
      nextAction: "Demo sandbox environment",
      nextActionDueAt: daysFromNow(5),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_5dKpW8rGvNx0eTfM2AhLs",
      businessName: "FreshMart Delivery",
      email: "payments@freshmart.app",
      category: "Food Delivery",
      tier: Tier.MEDIUM,
      stage: Stage.MEETING_SCHEDULED,
      meetingScheduledAt: daysFromNow(2),
      painPoints: null,
      questionsAsked: null,
      nextAction: "Prepare demo for food delivery use case",
      nextActionDueAt: daysFromNow(1),
      ownerId: purrvi.id,
    },
  ];

  const allStages = [
    Stage.MEETING_SCHEDULED,
    Stage.MEETING_DONE,
    Stage.PRODUCT_VERIFICATION_SUBMITTED,
    Stage.PAYOUT_VERIFICATION_SUBMITTED,
    Stage.TRANSACTING_BUSINESS,
  ];

  for (const leadData of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        businessId: leadData.businessId,
        businessName: leadData.businessName,
        email: leadData.email,
        category: leadData.category,
        tier: leadData.tier,
        stage: leadData.stage,
        meetingScheduledAt: leadData.meetingScheduledAt,
        painPoints: leadData.painPoints,
        questionsAsked: leadData.questionsAsked,
        nextAction: leadData.nextAction,
        nextActionDueAt: leadData.nextActionDueAt,
        ownerId: leadData.ownerId,
      },
    });

    const stageIndex = allStages.indexOf(leadData.stage);
    const stagesReached = allStages.slice(0, stageIndex + 1);

    for (let i = 0; i < stagesReached.length; i++) {
      await prisma.leadStageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: i === 0 ? null : stagesReached[i - 1],
          toStage: stagesReached[i],
          changedBy: leadData.ownerId || vansh.id,
          changedAt: daysAgo(30 - i * 5),
        },
      });
    }

    console.log(`  Created lead: ${lead.businessName} (${lead.stage})`);
  }

  console.log("\nSeed complete!");
  console.log("Login credentials:");
  console.log("  Admin:  vansh@dodopayments.com / admin123");
  console.log("  Member: purrvi@dodopayments.com / member123");
  console.log("  Member: aaryan@dodopayments.com / member123");
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
