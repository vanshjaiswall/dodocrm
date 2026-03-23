"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  emailTemplateSchema,
  emailSignatureSchema,
  saveGmailCredentialsSchema,
  sendEmailSchema,
} from "@/lib/validations";
import { STAGE_LABELS } from "@/lib/utils";
import { findPresetTemplate, findPresetSignature, isPresetId } from "@/lib/email-presets";
import nodemailer from "nodemailer";

type ActionResult<T = any> = { success: true; data: T } | { success: false; error: string };

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      gmailSenderEmail: true,
      gmailAppPassword: true,
    },
  });
  if (!dbUser) return null;
  return dbUser;
}

// ─── Gmail Setup Status ──────────────────────────────────────────────────────

export async function getGmailSetupStatus(): Promise<ActionResult<{ hasCredentials: boolean }>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };
  return {
    success: true,
    data: { hasCredentials: !!(user.gmailSenderEmail && user.gmailAppPassword) },
  };
}

export async function saveGmailCredentials(data: unknown): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let parsed: { gmailSenderEmail: string; gmailAppPassword: string };
  try {
    parsed = saveGmailCredentialsSchema.parse(data);
  } catch (e: any) {
    return { success: false, error: e.errors?.[0]?.message ?? "Invalid credentials" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      gmailSenderEmail: parsed.gmailSenderEmail,
      gmailAppPassword: parsed.gmailAppPassword,
    },
  });

  return { success: true, data: null };
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export async function getEmailTemplates(): Promise<ActionResult<any[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const templates = await prisma.emailTemplate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: templates };
}

export async function createEmailTemplate(data: unknown): Promise<ActionResult<any>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let parsed: { name: string; subject: string; body: string };
  try {
    parsed = emailTemplateSchema.parse(data);
  } catch (e: any) {
    return { success: false, error: e.errors?.[0]?.message ?? "Invalid template data" };
  }

  const template = await prisma.emailTemplate.create({
    data: { userId: user.id, ...parsed },
  });

  return { success: true, data: template };
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!template) return { success: false, error: "Template not found" };
  if (template.userId !== user.id) return { success: false, error: "Not authorized" };

  await prisma.emailTemplate.delete({ where: { id } });
  return { success: true, data: null };
}

// ─── Email Signatures ────────────────────────────────────────────────────────

export async function getEmailSignatures(): Promise<ActionResult<any[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const signatures = await prisma.emailSignature.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: signatures };
}

export async function createEmailSignature(data: unknown): Promise<ActionResult<any>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let parsed: { name: string; content: string };
  try {
    parsed = emailSignatureSchema.parse(data);
  } catch (e: any) {
    return { success: false, error: e.errors?.[0]?.message ?? "Invalid signature data" };
  }

  const signature = await prisma.emailSignature.create({
    data: { userId: user.id, ...parsed },
  });

  return { success: true, data: signature };
}

export async function deleteEmailSignature(id: string): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const signature = await prisma.emailSignature.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!signature) return { success: false, error: "Signature not found" };
  if (signature.userId !== user.id) return { success: false, error: "Not authorized" };

  await prisma.emailSignature.delete({ where: { id } });
  return { success: true, data: null };
}

// ─── Send Email ──────────────────────────────────────────────────────────────

function interpolate(str: string, vars: Record<string, string>) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function sendStageEmail(data: unknown): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!user.gmailSenderEmail || !user.gmailAppPassword) {
    return { success: false, error: "NO_CREDENTIALS" };
  }

  let parsed: { to: string; templateId: string; signatureId: string; leadId: string };
  try {
    parsed = sendEmailSchema.parse(data);
  } catch (e: any) {
    return { success: false, error: e.errors?.[0]?.message ?? "Invalid email data" };
  }

  const [lead, dbTemplate, dbSignature] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: parsed.leadId },
      select: { businessName: true, stage: true },
    }),
    isPresetId(parsed.templateId)
      ? Promise.resolve(null)
      : prisma.emailTemplate.findUnique({ where: { id: parsed.templateId } }),
    isPresetId(parsed.signatureId)
      ? Promise.resolve(null)
      : prisma.emailSignature.findUnique({ where: { id: parsed.signatureId } }),
  ]);

  if (!lead) return { success: false, error: "Lead not found" };

  const presetTemplate = isPresetId(parsed.templateId) ? findPresetTemplate(parsed.templateId) : undefined;
  const presetSignature = isPresetId(parsed.signatureId) ? findPresetSignature(parsed.signatureId) : undefined;

  const template = presetTemplate ?? dbTemplate;
  const signature = presetSignature ?? dbSignature;

  if (!template) return { success: false, error: "Template not found" };
  if (!signature) return { success: false, error: "Signature not found" };

  if (!presetTemplate && (dbTemplate as { userId: string } | null)?.userId !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  if (!presetSignature && (dbSignature as { userId: string } | null)?.userId !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const vars = {
    businessName: lead.businessName,
    name: lead.businessName,
    stage: STAGE_LABELS[lead.stage] ?? lead.stage,
  };

  const subject = interpolate(template.subject, vars);
  const bodyText = interpolate(template.body, vars) + "\n\n" + ("content" in signature ? signature.content : (signature as any).content);

  const useHtml = presetSignature && "contentHtml" in presetSignature;
  const bodyHtml = useHtml
    ? `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">${interpolate(template.body, vars)}</div><br>${presetSignature!.contentHtml}`
    : undefined;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: user.gmailSenderEmail,
        pass: user.gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: user.gmailSenderEmail,
      to: parsed.to,
      subject,
      text: bodyText,
      ...(bodyHtml ? { html: bodyHtml } : {}),
    });
  } catch (e: any) {
    return { success: false, error: e.message ?? "Failed to send email" };
  }

  await prisma.emailLog.create({
    data: {
      leadId: parsed.leadId,
      sentBy: user.id,
      to: parsed.to,
      subject,
      body: bodyText,
    },
  });

  return { success: true, data: null };
}

// ─── Email History ───────────────────────────────────────────────────────────

export async function getEmailHistory(leadId: string): Promise<ActionResult<any[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const logs = await prisma.emailLog.findMany({
    where: { leadId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  return { success: true, data: logs };
}
