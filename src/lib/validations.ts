import { z } from "zod";

export const leadSchema = z.object({
  businessId: z.string().optional().nullable(),
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email"),
  category: z.string().default(""),
  meetingScheduledAt: z.string().optional().nullable(),
  painPoints: z.string().optional().nullable(),
  questionsAsked: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  businessDetails: z.string().optional().nullable(),
  tier: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  stage: z.enum([
    "MEETING_SCHEDULED",
    "MEETING_DONE",
    "PRODUCT_VERIFICATION_SUBMITTED",
    "PAYOUT_VERIFICATION_SUBMITTED",
    "TRANSACTING_BUSINESS",
  ]).default("MEETING_SCHEDULED"),
  nextAction: z.string().optional().nullable(),
  nextActionDueAt: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});

export const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  leadId: z.string().uuid(),
});

export const stageChangeSchema = z.object({
  leadId: z.string().uuid(),
  newStage: z.enum([
    "MEETING_SCHEDULED",
    "MEETING_DONE",
    "PRODUCT_VERIFICATION_SUBMITTED",
    "PAYOUT_VERIFICATION_SUBMITTED",
    "TRANSACTING_BUSINESS",
  ]),
});

export type LeadFormData = z.infer<typeof leadSchema>;
export type NoteFormData = z.infer<typeof noteSchema>;
export type StageChangeData = z.infer<typeof stageChangeSchema>;

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export const emailSignatureSchema = z.object({
  name: z.string().min(1, "Signature name is required"),
  content: z.string().min(1, "Signature content is required"),
});

export const saveGmailCredentialsSchema = z.object({
  gmailSenderEmail: z.string().email("Invalid Gmail address"),
  gmailAppPassword: z.string().min(16, "App password must be at least 16 characters"),
});

export const sendEmailSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  templateId: z.string().uuid(),
  signatureId: z.string().uuid(),
  leadId: z.string().uuid(),
});

export type EmailTemplateData = z.infer<typeof emailTemplateSchema>;
export type EmailSignatureData = z.infer<typeof emailSignatureSchema>;
export type SendEmailData = z.infer<typeof sendEmailSchema>;
