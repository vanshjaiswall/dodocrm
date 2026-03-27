"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  emailTemplateSchema,
  saveGmailCredentialsSchema,
  sendEmailSchema,
} from "@/lib/validations";
import { STAGE_LABELS } from "@/lib/utils";
import { findPresetTemplate, isPresetId } from "@/lib/email-presets";
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

// ─── Combined modal data fetch (single round-trip) ───────────────────────────

export async function getEmailModalData(): Promise<ActionResult<{
  hasCredentials: boolean;
  templates: { id: string; name: string; subject: string; body: string }[];
  signatures: { id: string; name: string; content: string }[];
}>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const [templates, signatures] = await Promise.all([
    prisma.emailTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, subject: true, body: true },
    }),
    prisma.emailSignature.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, content: true },
    }),
  ]);

  return {
    success: true,
    data: {
      hasCredentials: !!(user.gmailSenderEmail && user.gmailAppPassword),
      templates,
      signatures,
    },
  };
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

  // Parse
  let parsed: {
    to: string;
    templateId: string;
    leadId: string;
    signatureId?: string;
    subjectOverride?: string;
    bodyOverride?: string;
    signatureHtml?: string;
  };
  try {
    parsed = sendEmailSchema.parse(data);
  } catch (e: any) {
    return { success: false, error: e.errors?.[0]?.message ?? "Invalid email data" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.leadId },
    select: { businessName: true, stage: true },
  });

  if (!lead) return { success: false, error: "Lead not found" };

  let subject: string;
  let bodyText: string;

  // If preview edits were passed, use them directly
  if (parsed.subjectOverride && parsed.bodyOverride) {
    subject = parsed.subjectOverride;
    bodyText = parsed.bodyOverride;
  } else {
    // Fall back to template interpolation
    const dbTemplate = isPresetId(parsed.templateId)
      ? null
      : await prisma.emailTemplate.findUnique({ where: { id: parsed.templateId } });

    const presetTemplate = isPresetId(parsed.templateId)
      ? findPresetTemplate(parsed.templateId)
      : undefined;

    const template = presetTemplate ?? dbTemplate;
    if (!template) return { success: false, error: "Template not found" };

    if (!presetTemplate && (dbTemplate as { userId: string } | null)?.userId !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    const vars = {
      businessName: lead.businessName,
      name: lead.businessName,
      stage: STAGE_LABELS[lead.stage] ?? lead.stage,
    };

    subject = interpolate(template.subject, vars);
    bodyText = interpolate(template.body, vars);
  }

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

    // Convert body text to HTML (preserve line breaks)
    const bodyHtml = bodyText
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br>" : `<p style="margin:0 0 2px 0;font-size:14px;line-height:1.5;color:#222">${line}</p>`))
      .join("\n");

    // Build full HTML email
    let fullHtml = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222">${bodyHtml}`;
    if (parsed.signatureHtml) {
      fullHtml += `<br><br>${parsed.signatureHtml}`;
    }
    fullHtml += `</body></html>`;

    await transporter.sendMail({
      from: user.gmailSenderEmail,
      to: parsed.to,
      subject,
      text: bodyText,
      html: fullHtml,
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

// ─── Email Signatures ────────────────────────────────────────────────────────

export async function createEmailSignature(data: { name: string; content: string }): Promise<ActionResult<any>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!data.name?.trim() || !data.content?.trim()) {
    return { success: false, error: "Name and content are required" };
  }
  const sig = await prisma.emailSignature.create({
    data: { userId: user.id, name: data.name.trim(), content: data.content.trim() },
  });
  return { success: true, data: sig };
}

export async function deleteEmailSignature(id: string): Promise<ActionResult<null>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const sig = await prisma.emailSignature.findUnique({ where: { id }, select: { userId: true } });
  if (!sig) return { success: false, error: "Signature not found" };
  if (sig.userId !== user.id) return { success: false, error: "Not authorized" };
  await prisma.emailSignature.delete({ where: { id } });
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
