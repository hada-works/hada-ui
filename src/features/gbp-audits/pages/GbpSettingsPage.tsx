import { useState } from "react"
import {
  Shield, RefreshCw, MessageSquareText, CalendarClock,
  ChevronDown, Info, Plus, Trash2, Check, AlertTriangle,
  Globe, Phone, Clock3, Camera, FileText, Tag, Copy,
  ThumbsUp, Minus, ThumbsDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BRAND_CANONICAL_NAME } from "../constants"

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateSentiment = "positive" | "neutral" | "negative"
type TemplateTier      = "5★" | "4★" | "3★" | "1–2★"
type TemplateMatrix    = Record<TemplateTier, Record<TemplateSentiment, string>>

// ─── Default template matrix ──────────────────────────────────────────────────

const DEFAULT_TEMPLATES: TemplateMatrix = {
  "5★": {
    positive: "Thank you so much for the 5-star review! We're thrilled you had a great experience at Hada Market and we look forward to seeing you again soon.",
    neutral:  "Thank you for your 5-star rating! We appreciate you taking the time to share your feedback and hope to see you again soon.",
    negative: "Thank you for your rating. We noticed your comments and want to make things right — please reach out to us directly so we can address your concerns.",
  },
  "4★": {
    positive: "Thanks for the 4-star review! We're glad you had a great experience and will keep working hard to earn that 5th star next time.",
    neutral:  "Thanks for your feedback and the 4-star rating! We appreciate your support and will continue to improve.",
    negative: "Thank you for your rating. We're sorry to hear about the issues you experienced — your feedback helps us improve and we hope to do better for you next time.",
  },
  "3★": {
    positive: "Thank you for visiting Hada Market! We're pleased you had some highlights during your visit and look forward to delivering an even better experience next time.",
    neutral:  "Thank you for your honest review. We take all feedback seriously and will work to improve the areas that fell short of your expectations.",
    negative: "We're sorry your experience didn't meet expectations. Thank you for letting us know — we'll use your feedback to make real improvements.",
  },
  "1–2★": {
    positive: "Thank you for your kind words! We noticed you gave us a low star rating despite your positive comments — if there's anything specific we can improve, please contact us directly. We'd love to make it right.",
    neutral:  "We sincerely apologise for the experience you had. Please contact our support team so we can look into what happened and resolve this for you.",
    negative: "We sincerely apologise for the poor experience. Hada Market is committed to investigating and resolving this immediately. Please contact our hotline so we can assist you directly.",
  },
}

const TIER_DEFS: { tier: TemplateTier; label: string; headerCls: string }[] = [
  { tier: "5★",   label: "5★ — Excellent",        headerCls: "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]"             },
  { tier: "4★",   label: "4★ — Good",              headerCls: "bg-[hsl(var(--success-subtle)/0.5)] text-[hsl(var(--success)/0.8)]"     },
  { tier: "3★",   label: "3★ — Average",           headerCls: "bg-muted/60 text-muted-foreground"                                      },
  { tier: "1–2★", label: "1–2★ — Needs attention", headerCls: "bg-[hsl(var(--destructive)/0.08)] text-[hsl(var(--destructive))]"       },
]

const SENTIMENT_TABS: { key: TemplateSentiment; label: string; icon: React.ElementType; activeCls: string }[] = [
  { key: "positive", label: "Positive", icon: ThumbsUp,   activeCls: "text-[hsl(var(--success))] border-b-2 border-[hsl(var(--success))]"     },
  { key: "neutral",  label: "Neutral",  icon: Minus,      activeCls: "text-foreground border-b-2 border-foreground"                            },
  { key: "negative", label: "Negative", icon: ThumbsDown, activeCls: "text-[hsl(var(--destructive))] border-b-2 border-[hsl(var(--destructive))]" },
]

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon, title, description, badge, children, defaultOpen = true,
}: {
  icon: React.ElementType; title: string; description: string
  badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {badge}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronDown className={cn(
          "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
          !open && "-rotate-90"
        )} />
      </button>
      {open && (
        <>
          <Separator />
          <div className="px-5 py-4">{children}</div>
        </>
      )}
    </div>
  )
}

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn(
        "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      )} />
    </button>
  )
}

// ─── Select pill ──────────────────────────────────────────────────────────────

function SelectPill<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg border overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value} onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 text-[11px] font-medium transition-colors",
            opt.value === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Tag list editor ──────────────────────────────────────────────────────────

function TagListEditor({ label, items, onAdd, onRemove, placeholder }: {
  label: string; items: string[]
  onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder?: string
}) {
  const [draft, setDraft] = useState("")
  const submit = () => {
    const v = draft.trim()
    if (v && !items.includes(v)) { onAdd(v); setDraft("") }
  }
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
            {item}
            <button onClick={() => onRemove(item)} className="text-muted-foreground/60 hover:text-destructive transition-colors">
              <Trash2 className="size-2.5" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[11px] text-muted-foreground/50 italic">No items yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={placeholder ?? "Add new…"}
          className="flex-1 rounded-md border bg-background px-2.5 py-1 text-[12px] outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={submit} disabled={!draft.trim()}
          className="rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-accent transition-colors disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Template matrix card (tier × sentiment) ──────────────────────────────────

function TemplateMatrixCard({
  tierDef, sentimentTemplates, onChange,
}: {
  tierDef: typeof TIER_DEFS[number]
  sentimentTemplates: Record<TemplateSentiment, string>
  onChange: (sentiment: TemplateSentiment, value: string) => void
}) {
  const [activeSentiment, setActiveSentiment] = useState<TemplateSentiment>("positive")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const currentText = sentimentTemplates[activeSentiment]

  const handleSentimentChange = (s: TemplateSentiment) => {
    if (editing) setEditing(false)
    setActiveSentiment(s)
  }

  const handleEdit = () => {
    setDraft(currentText)
    setEditing(true)
  }

  const handleSave = () => {
    onChange(activeSentiment, draft)
    setEditing(false)
  }

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      {/* Tier header */}
      <div className={cn("flex items-center justify-between px-3 py-2 border-b", tierDef.headerCls)}>
        <span className="text-[11px] font-semibold">{tierDef.label}</span>
        <span className="text-[10px] opacity-70">{currentText.length} chars</span>
      </div>

      {/* Sentiment tabs */}
      <div className="flex border-b bg-muted/20">
        {SENTIMENT_TABS.map(({ key, label, icon: Icon, activeCls }) => (
          <button
            key={key}
            onClick={() => handleSentimentChange(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors",
              activeSentiment === key
                ? activeCls
                : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <Icon className="size-3 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Template body */}
      {editing ? (
        <div className="p-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-muted/30 p-2 text-[12px] leading-relaxed outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground/50">{draft.length} chars</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >Cancel</button>
              <button
                onClick={handleSave}
                className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-medium hover:bg-primary/90"
              >Save</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="group relative">
          <p className="px-3 py-3 text-[12px] leading-relaxed text-muted-foreground pr-14">
            {currentText}
          </p>
          <button
            onClick={handleEdit}
            className="absolute right-3 top-3 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Sentiment hint */}
      <div className={cn(
        "px-3 py-1.5 border-t text-[10px]",
        activeSentiment === "positive" ? "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success)/0.8)]" :
        activeSentiment === "neutral"  ? "bg-muted/30 text-muted-foreground/60" :
                                         "bg-[hsl(var(--destructive)/0.06)] text-[hsl(var(--destructive)/0.7)]"
      )}>
        {activeSentiment === "positive" && "Used when AI detects a positive tone — even if the star rating is low"}
        {activeSentiment === "neutral"  && "Used when sentiment is ambiguous or purely factual"}
        {activeSentiment === "negative" && "Used when AI detects dissatisfaction, frustration, or complaint language"}
      </div>
    </div>
  )
}

// ─── Bulk fields ──────────────────────────────────────────────────────────────

const BULK_FIELDS = [
  { icon: Globe,    key: "website",     label: "Location page"    },
  { icon: Phone,    key: "phone",       label: "Phone number"   },
  { icon: Tag,      key: "category",    label: "Category"       },
  { icon: Clock3,   key: "hours",       label: "Business hours" },
  { icon: Camera,   key: "photos",      label: "Photos & media" },
  { icon: FileText, key: "description", label: "Description"    },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export function GbpSettingsPage() {
  // ── Brand standards state ──
  const [enforceCanonicalName, setEnforceCanonicalName] = useState(true)
  const [autoFlagNameMismatch, setAutoFlagNameMismatch]  = useState(true)
  const [allowedVariants, setAllowedVariants] = useState<string[]>(["Hada Market", "Hada Supermarket"])
  const [rejectedVariants, setRejectedVariants] = useState<string[]>(["Hada Mart", "Hada", "Hada VN"])

  // ── Bulk update state ──
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({
    website: true, phone: true, category: false, hours: true, photos: false, description: true,
  })
  const [bulkMode, setBulkMode]           = useState<"selective" | "all">("selective")
  const [requireApproval, setRequireApproval] = useState(true)
  const [dryRunFirst, setDryRunFirst]     = useState(true)

  // ── Auto-response state ──
  const [autoRespondEnabled, setAutoRespondEnabled]         = useState(false)
  const [autoRespondScope, setAutoRespondScope]             = useState<"all" | "positive" | "negative">("positive")
  const [templates, setTemplates] = useState<TemplateMatrix>(DEFAULT_TEMPLATES)

  const handleTemplateChange = (tier: TemplateTier, sentiment: TemplateSentiment, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [tier]: { ...prev[tier], [sentiment]: value },
    }))
  }

  // ── Audit schedule state ──
  const [auditFrequency, setAuditFrequency]           = useState<"daily" | "weekly" | "monthly">("weekly")
  const [auditScope, setAuditScope]                   = useState<"all" | "critical" | "warning">("all")
  const [notifyOnCritical, setNotifyOnCritical]       = useState(true)
  const [notifyOnNameMismatch, setNotifyOnNameMismatch] = useState(true)
  const [notifyOnLowResponse, setNotifyOnLowResponse] = useState(false)
  const [notifyEmails, setNotifyEmails]               = useState<string[]>(["marketing@hadamarket.vn"])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ── */}
      <div className="shrink-0 border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">GBP Settings</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Configure brand standards, bulk update rules, auto-response templates, and audit schedule for your entire GBP portfolio.
            </p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-[12px] font-medium hover:bg-primary/90 transition-colors">
            <Check className="size-3.5" />
            Save all changes
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

          {/* ── 1. Brand Standards ── */}
          <Section
            icon={Shield}
            title="Brand Standards"
            description="Enforce the canonical brand name and detect name mismatches across all GBP listings"
            badge={<Badge variant={enforceCanonicalName ? "success" : "secondary"} className="text-[10px] h-4 px-1.5">
              {enforceCanonicalName ? "Active" : "Inactive"}
            </Badge>}
          >
            <div className="space-y-0">
              <SettingsRow
                label="Canonical brand name"
                description="This name is used as the reference standard for all GBP locations"
              >
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5">
                  <span className="text-[13px] font-semibold">{BRAND_CANONICAL_NAME}</span>
                  <button className="text-muted-foreground/50 hover:text-primary transition-colors">
                    <Copy className="size-3" />
                  </button>
                </div>
              </SettingsRow>
              <SettingsRow
                label="Enforce canonical name"
                description="Automatically flag any location whose GBP name differs from the canonical name"
              >
                <Toggle checked={enforceCanonicalName} onChange={setEnforceCanonicalName} />
              </SettingsRow>
              <SettingsRow
                label="Auto-flag name mismatches"
                description="Show a warning on the dashboard whenever a non-standard name is detected"
              >
                <Toggle checked={autoFlagNameMismatch} onChange={setAutoFlagNameMismatch} />
              </SettingsRow>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <TagListEditor
                label="Accepted name variants"
                items={allowedVariants}
                onAdd={v => setAllowedVariants(a => [...a, v])}
                onRemove={v => setAllowedVariants(a => a.filter(x => x !== v))}
                placeholder="e.g. Hada Market Q3…"
              />
              <TagListEditor
                label="Rejected name variants"
                items={rejectedVariants}
                onAdd={v => setRejectedVariants(a => [...a, v])}
                onRemove={v => setRejectedVariants(a => a.filter(x => x !== v))}
                placeholder="e.g. Hada Mart…"
              />
            </div>

            <div className="mt-4 rounded-lg bg-[hsl(var(--info-subtle))] border border-[hsl(var(--info)/0.3)] px-3 py-2.5 flex gap-2">
              <Info className="size-3.5 text-[hsl(var(--info))] shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Rejected variants are highlighted in orange with a "Name mismatch" badge on the Locations page. Accepted variants will not trigger any warnings.
              </p>
            </div>
          </Section>

          {/* ── 2. Bulk Update ── */}
          <Section
            icon={RefreshCw}
            title="Bulk Update"
            description="Configure which fields can be updated in bulk across all GBP listings"
          >
            <div className="space-y-0">
              <SettingsRow label="Update scope" description="Apply bulk updates to all locations or only to a filtered selection">
                <SelectPill
                  options={[
                    { label: "All locations",    value: "all"       },
                    { label: "Filter by health", value: "selective" },
                  ]}
                  value={bulkMode}
                  onChange={setBulkMode}
                />
              </SettingsRow>
              <SettingsRow
                label="Require approval before applying"
                description="Each bulk update must be confirmed by an admin before being sent to Google"
              >
                <Toggle checked={requireApproval} onChange={setRequireApproval} />
              </SettingsRow>
              <SettingsRow
                label="Run dry-run first"
                description="Preview the full list of changes before applying them to live listings"
              >
                <Toggle checked={dryRunFirst} onChange={setDryRunFirst} />
              </SettingsRow>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-muted-foreground mb-3">Fields allowed for bulk update</p>
              <div className="grid grid-cols-2 gap-2">
                {BULK_FIELDS.map(({ icon: Icon, key, label }) => {
                  const enabled = enabledFields[key] ?? false
                  return (
                    <button
                      key={key}
                      onClick={() => setEnabledFields(f => ({ ...f, [key]: !f[key] }))}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                        enabled
                          ? "border-primary/50 bg-primary/5 text-foreground"
                          : "border-border/50 bg-muted/20 text-muted-foreground/60"
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="text-[12px] font-medium flex-1">{label}</span>
                      <div className={cn(
                        "size-4 rounded border flex items-center justify-center transition-colors",
                        enabled ? "bg-primary border-primary" : "border-border"
                      )}>
                        {enabled && <Check className="size-2.5 text-primary-foreground" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-[hsl(var(--warning-subtle))] border border-[hsl(var(--warning)/0.3)] px-3 py-2.5 flex gap-2">
              <AlertTriangle className="size-3.5 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Bulk updates are pushed directly to the Google Business API. We strongly recommend enabling both Dry-run and Approval to avoid unintended changes to live listings.
              </p>
            </div>
          </Section>

          {/* ── 3. Auto-Response Templates ── */}
          <Section
            icon={MessageSquareText}
            title="Auto-Response Templates"
            description="12 templates covering every combination of star rating (4 tiers) × sentiment (positive / neutral / negative)"
            badge={<Badge variant={autoRespondEnabled ? "success" : "secondary"} className="text-[10px] h-4 px-1.5">
              {autoRespondEnabled ? "Enabled" : "Disabled"}
            </Badge>}
          >
            <div className="space-y-0">
              <SettingsRow
                label="Enable auto-responses"
                description="Automatically send a reply to incoming reviews using the templates below"
              >
                <Toggle checked={autoRespondEnabled} onChange={setAutoRespondEnabled} />
              </SettingsRow>
              {autoRespondEnabled && (
                <SettingsRow label="Auto-response scope" description="Which review types should receive an automated reply">
                  <SelectPill
                    options={[
                      { label: "All reviews",   value: "all"      },
                      { label: "Positive only", value: "positive" },
                      { label: "Negative only", value: "negative" },
                    ]}
                    value={autoRespondScope}
                    onChange={setAutoRespondScope}
                  />
                </SettingsRow>
              )}
            </div>

            {/* Matrix explanation */}
            <div className="mt-4 mb-3 rounded-lg bg-[hsl(var(--info-subtle))] border border-[hsl(var(--info)/0.3)] px-3 py-2.5 flex gap-2">
              <Info className="size-3.5 text-[hsl(var(--info))] shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The reply is chosen by matching <strong>both</strong> the star rating <em>and</em> the AI-detected sentiment. For example, a 1★ review with a positive tone (e.g. the reviewer mis-tapped) gets a different reply than a 1★ review with genuinely negative language.
                <br />
                Supported variables: <code className="text-[10px] bg-muted px-1 rounded">{"{location_name}"}</code> <code className="text-[10px] bg-muted px-1 rounded">{"{reviewer_name}"}</code>
              </p>
            </div>

            {/* 4 × 3 template cards */}
            <div className="space-y-3">
              {TIER_DEFS.map(tierDef => (
                <TemplateMatrixCard
                  key={tierDef.tier}
                  tierDef={tierDef}
                  sentimentTemplates={templates[tierDef.tier]}
                  onChange={(sentiment, value) => handleTemplateChange(tierDef.tier, sentiment, value)}
                />
              ))}
            </div>
          </Section>

          {/* ── 4. Audit Schedule ── */}
          <Section
            icon={CalendarClock}
            title="Audit Schedule"
            description="Schedule recurring audits and configure alerts when issues are detected across your GBP portfolio"
          >
            <div className="space-y-0">
              <SettingsRow label="Audit frequency" description="How often the system runs a full audit across all locations">
                <SelectPill
                  options={[
                    { label: "Daily",   value: "daily"   },
                    { label: "Weekly",  value: "weekly"  },
                    { label: "Monthly", value: "monthly" },
                  ]}
                  value={auditFrequency}
                  onChange={setAuditFrequency}
                />
              </SettingsRow>
              <SettingsRow label="Audit scope" description="Audit all locations or only those with existing issues">
                <SelectPill
                  options={[
                    { label: "All",      value: "all"      },
                    { label: "Critical", value: "critical" },
                    { label: "Warning+", value: "warning"  },
                  ]}
                  value={auditScope}
                  onChange={setAuditScope}
                />
              </SettingsRow>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-muted-foreground mb-3">Alert triggers</p>
              <div className="space-y-0 rounded-lg border overflow-hidden divide-y divide-border/50">
                {[
                  { key: "critical",  label: "Health score drops to critical (< 30%)", value: notifyOnCritical,      onChange: setNotifyOnCritical      },
                  { key: "namematch", label: "Name mismatch detected",                  value: notifyOnNameMismatch,  onChange: setNotifyOnNameMismatch  },
                  { key: "response",  label: "Response rate falls below 40%",           value: notifyOnLowResponse,   onChange: setNotifyOnLowResponse   },
                ].map(({ key, label, value, onChange }) => (
                  <div key={key} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[12px]">{label}</span>
                    <Toggle checked={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <TagListEditor
                label="Alert recipients (email)"
                items={notifyEmails}
                onAdd={v => setNotifyEmails(a => [...a, v])}
                onRemove={v => setNotifyEmails(a => a.filter(x => x !== v))}
                placeholder="email@domain.com"
              />
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
