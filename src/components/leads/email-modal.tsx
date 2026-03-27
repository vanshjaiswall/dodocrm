"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  X,
  Send,
  Plus,
  Loader2,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Eye,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESET_TEMPLATES, PRESET_SIGNATURES } from "@/lib/email-presets";
import {
  getEmailModalData,
  saveGmailCredentials,
  createEmailTemplate,
  deleteEmailTemplate,
  createEmailSignature,
  deleteEmailSignature,
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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-medium text-[#18181b] dark:text-[#e4e4e7] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function interpolate(str: string, businessName: string) {
  return str
    .replace(/\{\{businessName\}\}/g, businessName)
    .replace(/\{\{name\}\}/g, businessName);
}

// Hidden presets stored in memory per session (resets on page reload)
let hiddenPresetIds: Set<string> = new Set();

export function EmailModal({ leadId, leadEmail, leadBusinessName, onClose }: Props) {
  const [loading, setLoading] = useState(true);

  // Credentials
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [gmailForm, setGmailForm] = useState({ gmailSenderEmail: "", gmailAppPassword: "" });
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialError, setCredentialError] = useState("");

  // Data
  const [templates, setTemplates] = useState<Template[]>([]);
  const [visiblePresets, setVisiblePresets] = useState<Template[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  // Compose
  const [to, setTo] = useState(leadEmail);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSignatureId, setSelectedSignatureId] = useState("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");

  // Add template
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", body: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Add signature
  const [showAddSignature, setShowAddSignature] = useState(false);
  const [newSignature, setNewSignature] = useState({ name: "", content: "" });
  const [savingSignature, setSavingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState("");
  const [deletingSignatureId, setDeletingSignatureId] = useState<string | null>(null);

  // Send
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  // Load hidden presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dodo-hidden-presets");
      if (stored) hiddenPresetIds = new Set(JSON.parse(stored));
    } catch {}
    setVisiblePresets(PRESET_TEMPLATES.filter((t) => !hiddenPresetIds.has(t.id)));
  }, []);

  // Single round-trip fetch on open
  useEffect(() => {
    getEmailModalData().then((res) => {
      if (res.success) {
        setHasCredentials(res.data.hasCredentials);
        setTemplates(res.data.templates);
        setSignatures(res.data.signatures);
        // Auto-select first preset signature if user has none
        if (res.data.signatures.length === 0 && PRESET_SIGNATURES.length > 0) {
          setSelectedSignatureId(PRESET_SIGNATURES[0].id);
        } else if (res.data.signatures.length > 0) {
          setSelectedSignatureId(res.data.signatures[0].id);
        }
      }
      setLoading(false);
    });
  }, []);

  function hidePreset(id: string) {
    hiddenPresetIds.add(id);
    try {
      localStorage.setItem("dodo-hidden-presets", JSON.stringify([...hiddenPresetIds]));
    } catch {}
    setVisiblePresets(PRESET_TEMPLATES.filter((t) => !hiddenPresetIds.has(t.id)));
    if (selectedTemplateId === id) setSelectedTemplateId("");
  }

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

  async function handleDeleteTemplate(id: string) {
    setDeletingTemplateId(id);
    const result = await deleteEmailTemplate(id);
    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) setSelectedTemplateId("");
    }
    setDeletingTemplateId(null);
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

  async function handleDeleteSignature(id: string) {
    setDeletingSignatureId(id);
    const result = await deleteEmailSignature(id);
    if (result.success) {
      setSignatures((prev) => prev.filter((s) => s.id !== id));
      if (selectedSignatureId === id) setSelectedSignatureId("");
    }
    setDeletingSignatureId(null);
  }

  function getSelectedSignatureContent(): string {
    const preset = PRESET_SIGNATURES.find((s) => s.id === selectedSignatureId);
    if (preset) return preset.content;
    const custom = signatures.find((s) => s.id === selectedSignatureId);
    return custom?.content || "";
  }

  function getSelectedSignatureHtml(): string {
    const preset = PRESET_SIGNATURES.find((s) => s.id === selectedSignatureId);
    if (preset) return preset.contentHtml;
    // Custom signatures don't have HTML, wrap plain text
    const custom = signatures.find((s) => s.id === selectedSignatureId);
    if (custom?.content) {
      return `<div style="color:#555;font-size:13px">${custom.content.replace(/\n/g, "<br>")}</div>`;
    }
    return "";
  }

  function handleOpenPreview() {
    const allTemplates: Template[] = [...visiblePresets, ...templates];
    const tpl = allTemplates.find((t) => t.id === selectedTemplateId);
    if (tpl) {
      setPreviewSubject(interpolate(tpl.subject, leadBusinessName));
      let body = interpolate(tpl.body, leadBusinessName);
      const sigContent = getSelectedSignatureContent();
      if (sigContent) {
        body += `\n\n--\n${sigContent}`;
      }
      setPreviewBody(body);
    }
    setShowPreview(true);
  }

  async function handleSend() {
    setSendError("");
    setSending(true);

    // Strip the plain-text signature from body before sending
    // (the HTML version will be appended server-side)
    const sigContent = getSelectedSignatureContent();
    let cleanBody = previewBody;
    if (sigContent) {
      const sigBlock = `\n\n--\n${sigContent}`;
      if (cleanBody.endsWith(sigBlock)) {
        cleanBody = cleanBody.slice(0, -sigBlock.length);
      }
    }

    const result = await sendStageEmail({
      to,
      templateId: selectedTemplateId,
      leadId,
      subjectOverride: previewSubject,
      bodyOverride: cleanBody,
      signatureHtml: getSelectedSignatureHtml() || undefined,
    });

    if (result.success) {
      setSendSuccess(true);
    } else {
      setSendError(
        result.error === "NO_CREDENTIALS" ? "Gmail credentials not set up." : result.error
      );
    }
    setSending(false);
  }

  const allTemplates: Template[] = [...visiblePresets, ...templates];
  const canPreview = to.trim() && selectedTemplateId;

  const isSetupScreen = !loading && (hasCredentials === false || editingCredentials);
  const isComposeScreen = !loading && hasCredentials === true && !editingCredentials && !sendSuccess && !showPreview;
  const isPreviewScreen = !loading && hasCredentials === true && !editingCredentials && !sendSuccess && showPreview;
  const isSuccessScreen = !loading && sendSuccess;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
        <div className="pointer-events-auto bg-white dark:bg-[#111113] rounded-2xl shadow-xl border border-[#e4e4e7] dark:border-[#1e1e1e] w-full max-w-lg flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e4e7] dark:border-[#1e1e1e] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {isPreviewScreen && (
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-[#f4f4f5] rounded-md dark:hover:bg-[#1e1e1e] transition-colors mr-0.5"
                >
                  <ChevronLeft className="w-4 h-4 text-[#71717a]" />
                </button>
              )}
              <Mail className="w-4 h-4 text-[#71717a]" />
              <h2 className="text-[15px] font-semibold text-[#18181b] dark:text-white">
                {isSetupScreen
                  ? "Gmail Setup"
                  : isPreviewScreen
                  ? "Preview & Edit"
                  : `Email ${leadBusinessName}`}
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
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-[#a1a1aa] animate-spin" />
              </div>
            )}

            {/* Gmail Setup */}
            {isSetupScreen && (
              <div className="p-5 space-y-4">
                <p className="text-[13px] text-[#71717a] leading-relaxed">
                  {editingCredentials
                    ? "Update your Gmail address and App Password."
                    : <>Enter your Gmail address and an App Password. Generate one at{" "}
                        <span className="font-medium text-[#3f3f46] dark:text-[#a1a1aa]">
                          myaccount.google.com → Security → App Passwords
                        </span>.</>}
                </p>
                <div>
                  <Label required>Gmail Address</Label>
                  <input
                    type="email"
                    className="input-field text-[13px]"
                    placeholder="you@gmail.com"
                    value={gmailForm.gmailSenderEmail}
                    onChange={(e) => setGmailForm((f) => ({ ...f, gmailSenderEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label required>App Password</Label>
                  <input
                    type="password"
                    className="input-field text-[13px]"
                    placeholder="16-character app password"
                    value={gmailForm.gmailAppPassword}
                    onChange={(e) => setGmailForm((f) => ({ ...f, gmailAppPassword: e.target.value }))}
                  />
                </div>
                {credentialError && <p className="text-[12px] text-red-500">{credentialError}</p>}
                <div className="flex gap-2 pt-1">
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

            {/* Compose */}
            {isComposeScreen && (
              <div className="p-5 space-y-5">
                {/* Edit credentials link */}
                <div className="flex justify-end -mb-1">
                  <button
                    onClick={() => setEditingCredentials(true)}
                    className="text-[12px] text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                  >
                    Edit Gmail credentials
                  </button>
                </div>

                {/* To */}
                <div>
                  <Label required>To</Label>
                  <input
                    type="email"
                    className="input-field text-[13px]"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>

                {/* Email Template */}
                <div>
                  <Label required>Email Template</Label>
                  <div className="relative">
                    <select
                      className="input-field text-[13px] appearance-none pr-8"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                    >
                      <option value="">Select a template...</option>
                      {visiblePresets.length > 0 && (
                        <optgroup label="Dodo Presets">
                          {visiblePresets.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {templates.length > 0 && (
                        <optgroup label="My Templates">
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa] pointer-events-none" />
                  </div>

                  {/* All templates list with delete/hide buttons */}
                  {(visiblePresets.length > 0 || templates.length > 0) && (
                    <div className="mt-2 space-y-1">
                      {/* Preset templates — hideable */}
                      {visiblePresets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-medium text-[#a1a1aa] bg-[#e4e4e7] dark:bg-[#27272a] px-1 py-0.5 rounded flex-shrink-0">PRESET</span>
                            <span className="text-[12px] text-[#52525b] dark:text-[#a1a1aa] truncate">{t.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => hidePreset(t.id)}
                            className="ml-2 p-1 text-[#a1a1aa] hover:text-red-500 transition-colors flex-shrink-0"
                            title="Remove preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Custom templates — deleteable */}
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e]">
                          <span className="text-[12px] text-[#52525b] dark:text-[#a1a1aa] truncate">{t.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(t.id)}
                            disabled={deletingTemplateId === t.id}
                            className="ml-2 p-1 text-[#a1a1aa] hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            {deletingTemplateId === t.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showAddTemplate && (
                    <button
                      type="button"
                      onClick={() => setShowAddTemplate(true)}
                      className="text-[12px] text-[#3b82f6] hover:underline mt-2 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add template
                    </button>
                  )}

                  {showAddTemplate && (
                    <div className="mt-3 bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e] rounded-lg p-3.5 space-y-2.5">
                      <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wide">New Template</p>
                      <input
                        className="input-field text-[13px]"
                        placeholder="Template name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate((f) => ({ ...f, name: e.target.value }))}
                      />
                      <input
                        className="input-field text-[13px]"
                        placeholder="Subject — supports {{businessName}}"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate((f) => ({ ...f, subject: e.target.value }))}
                      />
                      <textarea
                        className="input-field text-[13px] min-h-[80px] resize-none"
                        placeholder="Email body..."
                        value={newTemplate.body}
                        onChange={(e) => setNewTemplate((f) => ({ ...f, body: e.target.value }))}
                      />
                      {templateError && <p className="text-[12px] text-red-500">{templateError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddTemplate}
                          disabled={savingTemplate || !newTemplate.name || !newTemplate.subject || !newTemplate.body}
                          className="btn-primary text-[12px] flex items-center gap-1"
                        >
                          {savingTemplate && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
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
                </div>

                {/* Signature */}
                <div>
                  <Label>Signature</Label>
                  <div className="relative">
                    <select
                      className="input-field text-[13px] appearance-none pr-8"
                      value={selectedSignatureId}
                      onChange={(e) => setSelectedSignatureId(e.target.value)}
                    >
                      <option value="">No signature</option>
                      {PRESET_SIGNATURES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      {signatures.length > 0 && (
                        <optgroup label="My Signatures">
                          {signatures.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa] pointer-events-none" />
                  </div>

                  {/* Manage custom signatures */}
                  {signatures.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {signatures.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e]">
                          <span className="text-[12px] text-[#52525b] dark:text-[#a1a1aa] truncate">{s.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSignature(s.id)}
                            disabled={deletingSignatureId === s.id}
                            className="ml-2 p-1 text-[#a1a1aa] hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            {deletingSignatureId === s.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showAddSignature && (
                    <button
                      type="button"
                      onClick={() => setShowAddSignature(true)}
                      className="text-[12px] text-[#3b82f6] hover:underline mt-2 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add signature
                    </button>
                  )}

                  {showAddSignature && (
                    <div className="mt-3 bg-[#fafafa] dark:bg-[#0f0f11] border border-[#e4e4e7] dark:border-[#1e1e1e] rounded-lg p-3.5 space-y-2.5">
                      <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wide">New Signature</p>
                      <input
                        className="input-field text-[13px]"
                        placeholder="Signature name (e.g. Work)"
                        value={newSignature.name}
                        onChange={(e) => setNewSignature((f) => ({ ...f, name: e.target.value }))}
                      />
                      <textarea
                        className="input-field text-[13px] min-h-[80px] resize-none font-mono"
                        placeholder="Your Name&#10;Title&#10;Company&#10;Phone"
                        value={newSignature.content}
                        onChange={(e) => setNewSignature((f) => ({ ...f, content: e.target.value }))}
                      />
                      {signatureError && <p className="text-[12px] text-red-500">{signatureError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddSignature}
                          disabled={savingSignature || !newSignature.name || !newSignature.content}
                          className="btn-primary text-[12px] flex items-center gap-1"
                        >
                          {savingSignature && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
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
                </div>

                {sendError && <p className="text-[12px] text-red-500">{sendError}</p>}
              </div>
            )}

            {/* Preview & Edit */}
            {isPreviewScreen && (
              <div className="p-5 space-y-4">
                <p className="text-[12px] text-[#a1a1aa]">
                  Review and edit the email before sending. Changes only apply to this send.
                </p>

                {/* To (read-only) */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] dark:bg-[#0f0f11] rounded-lg border border-[#e4e4e7] dark:border-[#1e1e1e]">
                  <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wide w-12 flex-shrink-0">To</span>
                  <span className="text-[13px] text-[#18181b] dark:text-white">{to}</span>
                </div>

                {/* Subject — editable */}
                <div>
                  <Label>Subject</Label>
                  <input
                    className="input-field text-[13px]"
                    value={previewSubject}
                    onChange={(e) => setPreviewSubject(e.target.value)}
                  />
                </div>

                {/* Body — editable */}
                <div>
                  <Label>Body</Label>
                  <textarea
                    className="input-field text-[13px] min-h-[260px] resize-y font-mono leading-relaxed"
                    value={previewBody}
                    onChange={(e) => setPreviewBody(e.target.value)}
                  />
                </div>

                {sendError && <p className="text-[12px] text-red-500">{sendError}</p>}
              </div>
            )}

            {/* Success */}
            {isSuccessScreen && (
              <div className="p-8 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[15px] font-semibold text-[#18181b] dark:text-white">Email sent</p>
                <p className="text-[13px] text-[#71717a]">Your email was sent to {to}</p>
                <button onClick={onClose} className="btn-secondary mt-2">Close</button>
              </div>
            )}
          </div>

          {/* Footer — Compose: Preview button / Preview: Send button */}
          {isComposeScreen && (
            <div className="px-5 py-4 border-t border-[#e4e4e7] dark:border-[#1e1e1e] flex-shrink-0">
              <button
                onClick={handleOpenPreview}
                disabled={!canPreview}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-colors",
                  canPreview
                    ? "bg-[#3f3f46] hover:bg-[#27272a] text-white dark:bg-[#e4e4e7] dark:hover:bg-white dark:text-[#18181b]"
                    : "bg-[#a1a1aa] text-white cursor-not-allowed dark:bg-[#3f3f46] dark:text-[#71717a]"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview & Send
              </button>
            </div>
          )}

          {isPreviewScreen && (
            <div className="px-5 py-4 border-t border-[#e4e4e7] dark:border-[#1e1e1e] flex-shrink-0">
              <button
                onClick={handleSend}
                disabled={sending || !previewSubject.trim() || !previewBody.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-colors",
                  !sending && previewSubject.trim() && previewBody.trim()
                    ? "bg-[#3f3f46] hover:bg-[#27272a] text-white dark:bg-[#e4e4e7] dark:hover:bg-white dark:text-[#18181b]"
                    : "bg-[#a1a1aa] text-white cursor-not-allowed dark:bg-[#3f3f46] dark:text-[#71717a]"
                )}
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
                Send Email
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
