"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  X,
  Send,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESET_TEMPLATES, PRESET_SIGNATURES } from "@/lib/email-presets";
import {
  getGmailSetupStatus,
  saveGmailCredentials,
  getEmailTemplates,
  createEmailTemplate,
  getEmailSignatures,
  createEmailSignature,
  sendStageEmail,
} from "@/actions/email";

type Template = { id: string; name: string; subject: string; body: string };
type Signature = { id: string; name: string; content: string };

type Props = {
  leadId: string;
  leadEmail: string;
  leadBusinessName: string;
  onClose: () => void;
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label text-[12px]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function EmailModal({ leadId, leadEmail, leadBusinessName, onClose }: Props) {
  // Loading
  const [loading, setLoading] = useState(true);

  // Credential state
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [gmailForm, setGmailForm] = useState({ gmailSenderEmail: "", gmailAppPassword: "" });
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialError, setCredentialError] = useState("");

  // Main form
  const [to, setTo] = useState(leadEmail);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSignatureId, setSelectedSignatureId] = useState("");

  // Lists
  const [templates, setTemplates] = useState<Template[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  // Inline add-template form
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", body: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");

  // Inline add-signature form
  const [showAddSignature, setShowAddSignature] = useState(false);
  const [newSignature, setNewSignature] = useState({ name: "", content: "" });
  const [savingSignature, setSavingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState("");

  // Send state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const [statusRes, templatesRes, signaturesRes] = await Promise.all([
        getGmailSetupStatus(),
        getEmailTemplates(),
        getEmailSignatures(),
      ]);
      if (statusRes.success) setHasCredentials(statusRes.data.hasCredentials);
      if (templatesRes.success) setTemplates(templatesRes.data);
      if (signaturesRes.success) setSignatures(signaturesRes.data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveCredentials() {
    setCredentialError("");
    setCredentialSaving(true);
    const result = await saveGmailCredentials(gmailForm);
    if (result.success) {
      setHasCredentials(true);
      setEditingCredentials(false);
      setGmailForm({ gmailSenderEmail: "", gmailAppPassword: "" });
    } else {
      setCredentialError(result.error);
    }
    setCredentialSaving(false);
  }

  async function handleAddTemplate() {
    setTemplateError("");
    setSavingTemplate(true);
    const result = await createEmailTemplate(newTemplate);
    if (result.success) {
      setTemplates((prev) => [result.data, ...prev]);
      setSelectedTemplateId(result.data.id);
      setNewTemplate({ name: "", subject: "", body: "" });
      setShowAddTemplate(false);
    } else {
      setTemplateError(result.error);
    }
    setSavingTemplate(false);
  }

  async function handleAddSignature() {
    setSignatureError("");
    setSavingSignature(true);
    const result = await createEmailSignature(newSignature);
    if (result.success) {
      setSignatures((prev) => [result.data, ...prev]);
      setSelectedSignatureId(result.data.id);
      setNewSignature({ name: "", content: "" });
      setShowAddSignature(false);
    } else {
      setSignatureError(result.error);
    }
    setSavingSignature(false);
  }

  async function handleSend() {
    setSendError("");
    setSending(true);
    const result = await sendStageEmail({
      to,
      templateId: selectedTemplateId,
      signatureId: selectedSignatureId,
      leadId,
    });
    if (result.success) {
      setSendSuccess(true);
    } else {
      setSendError(result.error === "NO_CREDENTIALS" ? "Gmail credentials not set up." : result.error);
    }
    setSending(false);
  }

  const isSetupScreen = !loading && (hasCredentials === false || editingCredentials);
  const isComposeScreen = !loading && hasCredentials === true && !editingCredentials && !sendSuccess;
  const isSuccessScreen = !loading && sendSuccess;

  const canSend = to.trim() && selectedTemplateId && selectedSignatureId;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
        <div className="pointer-events-auto bg-white dark:bg-[#111113] rounded-xl shadow-xl border border-[#e4e4e7] dark:border-[#1e1e1e] w-full max-w-lg flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e4e4e7] dark:border-[#1e1e1e] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#71717a]" />
              <h2 className="text-[15px] font-semibold text-[#18181b] dark:text-white">
                {isSetupScreen ? "Gmail Setup Required" : `Email ${leadBusinessName}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f4f4f5] rounded-lg dark:hover:bg-[#1e1e1e] transition-colors"
            >
              <X className="w-4 h-4 text-[#a1a1aa]" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[#a1a1aa] animate-spin" />
              </div>
            )}

            {/* State A — Gmail setup */}
            {isSetupScreen && (
              <div className="p-5 space-y-4">
                <p className="text-[13px] text-[#71717a] leading-relaxed">
                  {editingCredentials
                    ? "Update your Gmail address and App Password below."
                    : <>To send emails, enter your Gmail address and an App Password. Generate one at{" "}
                        <span className="font-medium text-[#3f3f46] dark:text-[#a1a1aa]">
                          myaccount.google.com → Security → 2-Step Verification → App Passwords
                        </span>.</>
                  }
                </p>
                <Field label="Gmail Address" required>
                  <input
                    type="email"
                    className="input-field text-[13px]"
                    placeholder="you@gmail.com"
                    value={gmailForm.gmailSenderEmail}
                    onChange={(e) => setGmailForm((f) => ({ ...f, gmailSenderEmail: e.target.value }))}
                  />
                </Field>
                <Field label="App Password" required>
                  <input
                    type="password"
                    className="input-field text-[13px]"
                    placeholder="16-character app password"
                    value={gmailForm.gmailAppPassword}
                    onChange={(e) => setGmailForm((f) => ({ ...f, gmailAppPassword: e.target.value }))}
                  />
                </Field>
                {credentialError && (
                  <p className="text-[12px] text-red-500">{credentialError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCredentials}
                    disabled={credentialSaving || !gmailForm.gmailSenderEmail || !gmailForm.gmailAppPassword}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                  >
                    {credentialSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingCredentials ? "Update & Continue" : "Save & Continue"}
                  </button>
                  {editingCredentials && (
                    <button
                      onClick={() => { setEditingCredentials(false); setCredentialError(""); setGmailForm({ gmailSenderEmail: "", gmailAppPassword: "" }); }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* State B — Compose */}
            {isComposeScreen && (
              <div className="p-5 space-y-4">
                {/* Gmail credentials edit link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingCredentials(true)}
                    className="text-[11px] text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                  >
                    Edit Gmail credentials
                  </button>
                </div>

                {/* To */}
                <Field label="To" required>
                  <input
                    type="email"
                    className="input-field text-[13px]"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </Field>

                {/* Template */}
                <Field label="Email Template" required>
                  <select
                    className="input-field text-[13px]"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    <option value="">Select a template...</option>
                    <optgroup label="Dodo Presets">
                      {PRESET_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                    {templates.length > 0 && (
                      <optgroup label="My Templates">
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {!showAddTemplate && (
                    <button
                      type="button"
                      onClick={() => setShowAddTemplate(true)}
                      className="text-[12px] text-[#3b82f6] hover:underline mt-1.5 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add template
                    </button>
                  )}
                </Field>

                {/* Inline add-template form */}
                {showAddTemplate && (
                  <div className="bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e] rounded-lg p-3.5 space-y-2.5">
                    <p className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide">New Template</p>
                    <input
                      className="input-field text-[13px]"
                      placeholder="Template name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate((f) => ({ ...f, name: e.target.value }))}
                    />
                    <div>
                      <input
                        className="input-field text-[13px]"
                        placeholder="Subject line"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate((f) => ({ ...f, subject: e.target.value }))}
                      />
                      <p className="text-[11px] text-[#a1a1aa] mt-1">
                        Supports: <span className="font-mono">{"{{businessName}}"}</span>, <span className="font-mono">{"{{stage}}"}</span>
                      </p>
                    </div>
                    <textarea
                      className="input-field text-[13px] min-h-[80px] resize-none"
                      placeholder="Email body..."
                      value={newTemplate.body}
                      onChange={(e) => setNewTemplate((f) => ({ ...f, body: e.target.value }))}
                    />
                    {templateError && (
                      <p className="text-[12px] text-red-500">{templateError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTemplate}
                        disabled={savingTemplate || !newTemplate.name || !newTemplate.subject || !newTemplate.body}
                        className="btn-primary text-[12px] flex items-center gap-1"
                      >
                        {savingTemplate && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save Template
                      </button>
                      <button
                        onClick={() => { setShowAddTemplate(false); setTemplateError(""); setNewTemplate({ name: "", subject: "", body: "" }); }}
                        className="btn-secondary text-[12px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Signature */}
                <Field label="Signature" required>
                  <select
                    className="input-field text-[13px]"
                    value={selectedSignatureId}
                    onChange={(e) => setSelectedSignatureId(e.target.value)}
                  >
                    <option value="">Select a signature...</option>
                    <optgroup label="Dodo Presets">
                      {PRESET_SIGNATURES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                    {signatures.length > 0 && (
                      <optgroup label="My Signatures">
                        {signatures.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {!showAddSignature && (
                    <button
                      type="button"
                      onClick={() => setShowAddSignature(true)}
                      className="text-[12px] text-[#3b82f6] hover:underline mt-1.5 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add signature
                    </button>
                  )}
                </Field>

                {/* Inline add-signature form */}
                {showAddSignature && (
                  <div className="bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e] rounded-lg p-3.5 space-y-2.5">
                    <p className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide">New Signature</p>
                    <input
                      className="input-field text-[13px]"
                      placeholder="Signature name (e.g. Formal)"
                      value={newSignature.name}
                      onChange={(e) => setNewSignature((f) => ({ ...f, name: e.target.value }))}
                    />
                    <textarea
                      className="input-field text-[13px] min-h-[80px] resize-none"
                      placeholder="Signature content..."
                      value={newSignature.content}
                      onChange={(e) => setNewSignature((f) => ({ ...f, content: e.target.value }))}
                    />
                    {signatureError && (
                      <p className="text-[12px] text-red-500">{signatureError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSignature}
                        disabled={savingSignature || !newSignature.name || !newSignature.content}
                        className="btn-primary text-[12px] flex items-center gap-1"
                      >
                        {savingSignature && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save Signature
                      </button>
                      <button
                        onClick={() => { setShowAddSignature(false); setSignatureError(""); setNewSignature({ name: "", content: "" }); }}
                        className="btn-secondary text-[12px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Send button + error */}
                <div className="pt-1 space-y-2">
                  {sendError && (
                    <p className="text-[12px] text-red-500">{sendError}</p>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={sending || !canSend}
                    className={cn(
                      "btn-primary w-full flex items-center justify-center gap-1.5",
                      (!canSend && !sending) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Email
                  </button>
                </div>
              </div>
            )}

            {/* State C — Success */}
            {isSuccessScreen && (
              <div className="p-8 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[15px] font-semibold text-[#18181b] dark:text-white">Email sent</p>
                <p className="text-[13px] text-[#71717a]">Your email was sent to {to}</p>
                <button onClick={onClose} className="btn-secondary mt-2">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
