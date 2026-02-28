"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/actions/leads";
import { X, Loader2, Plus, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { STAGE_ORDER, STAGE_LABELS, cn } from "@/lib/utils";

type User = { id: string; name: string; email: string; role: string };

export function CreateLeadModal({
  users,
  onClose,
}: {
  users: User[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    businessId: "",
    businessName: "",
    email: "",
    category: "",
    meetingScheduledAt: "",
    tier: "MEDIUM",
    stage: "MEETING_SCHEDULED",
    nextAction: "",
    nextActionDueAt: "",
    ownerId: "",
    painPoints: "",
    questionsAsked: "",
    website: "",
    businessDetails: "",
  });

  // AI auto-fill state
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState(false);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleParseTranscript() {
    if (!transcriptText.trim()) return;
    setParsing(true);
    setParseError("");
    setParseSuccess(false);
    try {
      const res = await fetch("/api/ai/parse-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to parse (${res.status})`);
      }
      const extracted = await res.json();
      // Merge extracted fields into form — only overwrite non-empty values
      setForm((f) => ({
        ...f,
        ...(extracted.businessName && { businessName: extracted.businessName }),
        ...(extracted.email && { email: extracted.email }),
        ...(extracted.website && { website: extracted.website }),
        ...(extracted.businessDetails && { businessDetails: extracted.businessDetails }),
        ...(extracted.category && { category: extracted.category }),
        ...(extracted.tier && { tier: extracted.tier }),
        ...(extracted.painPoints && { painPoints: extracted.painPoints }),
        ...(extracted.questionsAsked && { questionsAsked: extracted.questionsAsked }),
        ...(extracted.nextAction && { nextAction: extracted.nextAction }),
      }));
      setParseSuccess(true);
      setShowTranscript(false);
    } catch (e: any) {
      setParseError(e.message || "Failed to parse transcript");
    }
    setParsing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createLead({
        ...form,
        meetingScheduledAt: form.meetingScheduledAt || null,
        nextActionDueAt: form.nextActionDueAt || null,
        ownerId: form.ownerId || null,
        businessId: form.businessId || null,
        website: form.website || null,
        businessDetails: form.businessDetails || null,
      });
      startTransition(() => {
        router.refresh();
      });
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to create lead");
    }
    setSaving(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in border-l dark:bg-[#111113] dark:border-[#1e1e1e]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b dark:border-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f4f4f5] flex items-center justify-center dark:bg-[#1e1e1e]">
              <Plus className="w-3.5 h-3.5 text-[#3f3f46] dark:text-[#a1a1aa]" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#18181b] dark:text-white">New Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#f4f4f5] rounded-lg transition-colors dark:hover:bg-[#1e1e1e]"
          >
            <X className="w-4 h-4 text-[#a1a1aa]" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-3.5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg p-3 flex items-center gap-2 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* AI Auto-fill Section */}
          <div className="rounded-lg border border-dashed overflow-hidden dark:border-[#27272a]">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                showTranscript
                  ? "bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400"
                  : "bg-[#fafafa] text-[#52525b] hover:bg-[#f4f4f5] dark:bg-[#0f0f11] dark:text-[#71717a] dark:hover:bg-[#18181b]"
              )}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Auto-fill from meeting notes
              </span>
              {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTranscript && (
              <div className="p-3.5 space-y-2.5 bg-white dark:bg-[#111113]">
                <p className="text-[11px] text-[#a1a1aa]">
                  Paste your meeting transcript or summary from Fireflies, Granola, or any notetaker. AI will extract the lead details automatically.
                </p>
                <textarea
                  className="input-field min-h-[120px] resize-y text-[13px]"
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste your meeting notes here..."
                />
                {parseError && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">{parseError}</p>
                )}
                <button
                  type="button"
                  onClick={handleParseTranscript}
                  disabled={parsing || !transcriptText.trim()}
                  className="btn-primary text-[13px] w-full"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Extracting lead details...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Parse with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {parseSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[13px] rounded-lg p-3 flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-800/30 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Fields auto-filled from meeting notes. Review and edit below.
            </div>
          )}

          <Field label="Business Name" required>
            <input
              className="input-field text-[13px]"
              value={form.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </Field>

          <Field label="Email" required>
            <input
              className="input-field text-[13px]"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="team@acme.com"
              required
            />
          </Field>

          <Field label="Website">
            <input
              className="input-field text-[13px]"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://example.com"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Business ID">
              <input
                className="input-field text-[13px]"
                value={form.businessId}
                onChange={(e) => updateField("businessId", e.target.value)}
                placeholder="biz_xxx"
              />
            </Field>
            <Field label="Category">
              <input
                className="input-field text-[13px]"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="SaaS, E-commerce..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <select
                className="input-field text-[13px]"
                value={form.stage}
                onChange={(e) => updateField("stage", e.target.value)}
              >
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tier">
              <select
                className="input-field text-[13px]"
                value={form.tier}
                onChange={(e) => updateField("tier", e.target.value)}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Meeting Date">
              <input
                className="input-field text-[13px]"
                type="datetime-local"
                value={form.meetingScheduledAt}
                onChange={(e) => updateField("meetingScheduledAt", e.target.value)}
              />
            </Field>
            <Field label="Owner">
              <select
                className="input-field text-[13px]"
                value={form.ownerId}
                onChange={(e) => updateField("ownerId", e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Next Action">
            <input
              className="input-field text-[13px]"
              value={form.nextAction}
              onChange={(e) => updateField("nextAction", e.target.value)}
              placeholder="Follow up, send docs..."
            />
          </Field>

          <Field label="Pain Points">
            <textarea
              className="input-field min-h-[56px] resize-y text-[13px]"
              value={form.painPoints}
              onChange={(e) => updateField("painPoints", e.target.value)}
              placeholder="What problems does this business face?"
            />
          </Field>

          <Field label="Questions Asked">
            <textarea
              className="input-field min-h-[56px] resize-y text-[13px]"
              value={form.questionsAsked}
              onChange={(e) => updateField("questionsAsked", e.target.value)}
              placeholder="Questions during the meeting..."
            />
          </Field>

          <Field label="Business Details">
            <textarea
              className="input-field min-h-[72px] resize-y text-[13px]"
              value={form.businessDetails}
              onChange={(e) => updateField("businessDetails", e.target.value)}
              placeholder="What does this business do? Key details..."
            />
          </Field>

          <div className="sticky bottom-0 pt-3.5 pb-2 bg-white border-t -mx-5 px-5 mt-5 dark:bg-[#111113] dark:border-[#1e1e1e]">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
