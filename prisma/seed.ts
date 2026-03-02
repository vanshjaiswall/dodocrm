import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const Role = { ADMIN: "ADMIN", MEMBER: "MEMBER" } as const;
const Tier = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" } as const;
const Stage = {
  MEETING_SCHEDULED: "MEETING_SCHEDULED",
  MEETING_DONE: "MEETING_DONE",
  PRODUCT_VERIFICATION_SUBMITTED: "PRODUCT_VERIFICATION_SUBMITTED",
  PAYOUT_VERIFICATION_SUBMITTED: "PAYOUT_VERIFICATION_SUBMITTED",
  TRANSACTING_BUSINESS: "TRANSACTING_BUSINESS",
} as const;

async function main() {
  console.log("Seeding database...");

  await prisma.leadStageHistory.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin123", 10);
  const memberHash = await bcrypt.hash("member123", 10);

  const vansh = await prisma.user.create({
    data: {
      name: "Vansh",
      email: "vansh@dodopayments.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const purrvi = await prisma.user.create({
    data: {
      name: "Purrvi",
      email: "purrvi@dodopayments.com",
      passwordHash: memberHash,
      role: Role.MEMBER,
    },
  });

  console.log("Created users:", vansh.name, purrvi.name);

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
    {
      businessId: "bus_4jRsT6uIyOb3cVfQ1WmZe",
      businessName: "TravelBuddy",
      email: "ops@travelbuddy.io",
      category: "Travel",
      tier: Tier.LOW,
      stage: Stage.MEETING_SCHEDULED,
      meetingScheduledAt: daysFromNow(5),
      painPoints: null,
      questionsAsked: null,
      nextAction: "Send pre-meeting questionnaire",
      nextActionDueAt: daysFromNow(3),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_8aFgH2kNpLx5dWmE0RqYt",
      businessName: "HealthSync",
      email: "admin@healthsync.med",
      category: "HealthTech",
      tier: Tier.HIGH,
      stage: Stage.PRODUCT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(12),
      painPoints: "HIPAA-compliant payment processing. Insurance co-pays and patient billing.",
      questionsAsked: "HIPAA compliance? PCI DSS level? Split payments between insurance and patient?",
      nextAction: "Compliance review meeting",
      nextActionDueAt: daysAgo(2),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_6vCbJ3sUwPy7iXnA9KhTf",
      businessName: "CreatorPay",
      email: "hello@creatorpay.co",
      category: "Creator Economy",
      tier: Tier.MEDIUM,
      stage: Stage.MEETING_SCHEDULED,
      meetingScheduledAt: daysFromNow(1),
      painPoints: null,
      questionsAsked: null,
      nextAction: "Research creator economy payment flows",
      nextActionDueAt: daysFromNow(0),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_1eQrM4gBtVz8jWnD5LpSx",
      businessName: "AutoDeal Motors",
      email: "digital@autodeal.co",
      category: "Automotive",
      tier: Tier.LOW,
      stage: Stage.MEETING_DONE,
      meetingScheduledAt: daysAgo(20),
      painPoints: "Large transaction amounts. Need installment payment support.",
      questionsAsked: "Max transaction limits? Installment plan API?",
      nextAction: "Send case study",
      nextActionDueAt: daysAgo(5),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_0tHkL7wFcRa3nYpG2MxUv",
      businessName: "PetCare Plus",
      email: "support@petcareplus.com",
      category: "Pet Services",
      tier: Tier.LOW,
      stage: Stage.MEETING_SCHEDULED,
      meetingScheduledAt: daysFromNow(7),
      painPoints: null,
      questionsAsked: null,
      nextAction: null,
      nextActionDueAt: null,
      ownerId: null,
    },
    {
      businessId: "bus_3fNqS9dKjEm2bXwP5TrYa",
      businessName: "NeoFinance",
      email: "partnerships@neofinance.io",
      category: "FinTech",
      tier: Tier.HIGH,
      stage: Stage.PAYOUT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(18),
      painPoints: "White-label payment solution. Regulatory compliance across jurisdictions.",
      questionsAsked: "White-label options? Compliance coverage? API rate limits?",
      nextAction: "Legal team review",
      nextActionDueAt: daysFromNow(4),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_8gWvC1hLpNx4tZeR6FyQm",
      businessName: "StreamBox Media",
      email: "biz@streambox.tv",
      category: "Media & Streaming",
      tier: Tier.MEDIUM,
      stage: Stage.TRANSACTING_BUSINESS,
      meetingScheduledAt: daysAgo(45),
      painPoints: "Subscription management and dunning. Better retry logic for failed payments.",
      questionsAsked: "Dunning configuration? Smart retry? Revenue recovery?",
      nextAction: "Quarterly review",
      nextActionDueAt: daysFromNow(14),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_5kBnJ2sUwPy7iXaA9DhTf",
      businessName: "GreenEnergy Co",
      email: "sales@greenenergy.eco",
      category: "Clean Energy",
      tier: Tier.MEDIUM,
      stage: Stage.PRODUCT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(8),
      painPoints: "Recurring utility billing. Variable monthly amounts.",
      questionsAsked: "Variable recurring billing? Metered billing? Customer portal?",
      nextAction: "Technical integration call",
      nextActionDueAt: daysFromNow(2),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_2mRpT4gEcVz8jWnD0LqSx",
      businessName: "Artisan Market",
      email: "hello@artisanmkt.com",
      category: "Marketplace",
      tier: Tier.LOW,
      stage: Stage.MEETING_DONE,
      meetingScheduledAt: daysAgo(3),
      painPoints: "Split payments between marketplace and sellers. Automatic commission handling.",
      questionsAsked: "Split payment API? Seller onboarding? KYC for sellers?",
      nextAction: "Send marketplace integration docs",
      nextActionDueAt: daysFromNow(4),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_7aFgH3kNpLx5dWeE1RqYt",
      businessName: "Nomad Workspace",
      email: "hello@nomadwork.co",
      category: "Co-working",
      tier: Tier.LOW,
      stage: Stage.TRANSACTING_BUSINESS,
      meetingScheduledAt: daysAgo(60),
      painPoints: "Membership billing with day passes and monthly plans.",
      questionsAsked: "Flexible billing? Multi-location support?",
      nextAction: "Expansion discussion",
      nextActionDueAt: daysFromNow(10),
      ownerId: vansh.id,
    },
    {
      businessId: "bus_4vCbJ6sUwPy9iXnA0KhMf",
      businessName: "ByteShift AI",
      email: "ops@byteshift.ai",
      category: "AI/ML",
      tier: Tier.HIGH,
      stage: Stage.MEETING_SCHEDULED,
      meetingScheduledAt: daysFromNow(3),
      painPoints: null,
      questionsAsked: null,
      nextAction: "Prepare AI billing use cases",
      nextActionDueAt: daysFromNow(2),
      ownerId: purrvi.id,
    },
    {
      businessId: "bus_6eQrM8gBtVz1jWnD3LpNx",
      businessName: "QuickLegal",
      email: "team@quicklegal.law",
      category: "LegalTech",
      tier: Tier.MEDIUM,
      stage: Stage.PAYOUT_VERIFICATION_SUBMITTED,
      meetingScheduledAt: daysAgo(9),
      painPoints: "Trust account compliance. Escrow payment handling.",
      questionsAsked: "Escrow support? Trust account segregation?",
      nextAction: "Compliance call with legal team",
      nextActionDueAt: daysFromNow(1),
      ownerId: vansh.id,
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

    if (stageIndex >= 1) {
      const noteAuthors = [vansh.id, purrvi.id];
      const sampleNotes = [
        `Initial meeting completed with ${leadData.businessName}. Good alignment on product needs.`,
        `Sent follow-up email with pricing details and integration timeline.`,
        `${leadData.businessName} team is reviewing our technical documentation. Expected response by end of week.`,
      ];

      for (let n = 0; n < Math.min(stageIndex + 1, sampleNotes.length); n++) {
        await prisma.leadNote.create({
          data: {
            leadId: lead.id,
            content: sampleNotes[n],
            createdBy: noteAuthors[n % noteAuthors.length],
            createdAt: daysAgo(25 - n * 7),
          },
        });
      }
    }

    console.log(`  Created lead: ${lead.businessName} (${lead.stage})`);
  }

  console.log("\nSeed complete!");
  console.log("Login credentials:");
  console.log("  Admin: vansh@dodopayments.com / admin123");
  console.log("  Member: purrvi@dodopayments.com / member123");
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
