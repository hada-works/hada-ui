import { ShieldCheck, AlertTriangle, Thermometer, FileText, Clipboard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Status } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { Section, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function auditPassStatus(v: number): Status {
  return v >= 95 ? "good" : v >= 90 ? "warn" : "bad"
}
function tempLogStatus(v: number): Status {
  return v >= 98 ? "good" : v >= 95 ? "warn" : "bad"
}
function expiryWasteStatus(v: number): Status {
  return v <= 0.1 ? "good" : v <= 0.15 ? "warn" : "bad"
}
function nearMissStatus(v: number): Status {
  return v === 0 ? "good" : v <= 3 ? "warn" : "bad"
}
function correctiveActionsStatus(v: number): Status {
  return v <= 10 ? "good" : v <= 25 ? "warn" : "bad"
}

function scoreStatus(score: number): Status {
  return score >= 90 ? "good" : score >= 75 ? "warn" : "bad"
}
function scoreColor(score: number): string {
  return score >= 90
    ? "text-[hsl(var(--success))]"
    : score >= 75
    ? "text-[hsl(var(--warning))]"
    : "text-destructive"
}

function statusBadgeCls(s: "pass" | "fail" | "pending"): string {
  if (s === "pass")    return "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]"
  if (s === "fail")    return "bg-destructive/10 text-destructive"
  return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
}

function kpiStatusColor(s: Status): string {
  if (s === "good") return "text-[hsl(var(--success))]"
  if (s === "bad")  return "text-destructive"
  if (s === "warn") return "text-[hsl(var(--warning))]"
  return "text-muted-foreground"
}

function statusDotColor(s: Status): string {
  if (s === "good") return "bg-[hsl(var(--success))]"
  if (s === "warn") return "bg-[hsl(var(--warning))]"
  if (s === "bad")  return "bg-destructive"
  return "bg-muted-foreground/30"
}

// ─── Mini KPI card for Section 1 ─────────────────────────────────────────────
interface KpiMiniProps {
  label: string
  value: string
  status: Status
  active: boolean
  onClick: () => void
}

function KpiMini({ label, value, status, active, onClick }: KpiMiniProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden transition-colors cursor-pointer hover:bg-muted/30",
        active && "ring-2 ring-primary ring-offset-1",
        status === "bad"  && "border-destructive/40",
        status === "warn" && "border-[hsl(var(--warning))]/40",
        status === "good" && "border-[hsl(var(--success))]/25",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</p>
          <span className={cn("size-2 rounded-full shrink-0 mt-0.5", statusDotColor(status))} />
        </div>
        <p className={cn("text-2xl font-bold leading-none tabular-nums", kpiStatusColor(status))}>{value}</p>
      </CardContent>
    </Card>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function FoodSafetyView({ d, onDrill, activeDrill }: Props) {
  const fsAlerts = d.alerts.filter(a =>
    a.msg.toLowerCase().includes("attp") ||
    a.msg.toLowerCase().includes("food") ||
    a.msg.toLowerCase().includes("corrective") ||
    a.msg.toLowerCase().includes("hsd"),
  )

  // ── Section 1: Fleet-level KPI definitions ────────────────────────────────
  const kpis: {
    id: string
    label: string
    value: string
    status: Status
    content: DrillContent
  }[] = [
    {
      id: "fs:auditPass",
      label: "Audit Pass Rate",
      value: `${d.foodSafetyPass}%`,
      status: auditPassStatus(d.foodSafetyPass),
      content: {
        title: "Audit Pass Rate",
        value: `${d.foodSafetyPass}%`,
        status: auditPassStatus(d.foodSafetyPass),
        rows: [
          { label: "Pass rate hiện tại", value: `${d.foodSafetyPass}%`, status: auditPassStatus(d.foodSafetyPass) },
          { label: "Target",             value: "≥95%",                 status: "neutral" as Status },
          { label: "Stores fail",        value: `${d.auditHistory.filter(s => s.status === "fail").length} stores`, status: d.auditHistory.filter(s => s.status === "fail").length === 0 ? "good" as Status : "bad" as Status },
          { label: "Stores pending",     value: `${d.auditHistory.filter(s => s.status === "pending").length} stores`, status: "warn" as Status },
        ],
        note: "Internal audit 2 lần/tháng. Stores fail bị tạm ngừng đến khi pass re-audit trong 48h.",
        sections: [{
          label: "Thresholds",
          rows: [
            { label: "Good",  value: "≥95%",     status: "good" as Status },
            { label: "Warn",  value: "90–94%",   status: "warn" as Status },
            { label: "Bad",   value: "<90%",      status: "bad"  as Status },
          ],
        }],
      },
    },
    {
      id: "fs:tempLog",
      label: "Temp Log Compliance",
      value: `${d.tempLogCompliance}%`,
      status: tempLogStatus(d.tempLogCompliance),
      content: {
        title: "Temperature Log Compliance",
        value: `${d.tempLogCompliance}%`,
        status: tempLogStatus(d.tempLogCompliance),
        rows: [
          { label: "Compliance rate", value: `${d.tempLogCompliance}%`, status: tempLogStatus(d.tempLogCompliance) },
          { label: "Target",          value: "≥98%",                    status: "neutral" as Status },
          { label: "Non-compliant stores", value: `${Math.round((100 - d.tempLogCompliance) / 100 * d.storeCount)} stores`, status: tempLogStatus(d.tempLogCompliance) },
        ],
        note: "Nhiệt độ log 4 lần/ngày cho tủ lạnh và kho đông. Thiết bị IoT tự động ghi nhận. Nếu thiết bị offline → log thủ công bắt buộc.",
        sections: [{
          label: "Thresholds",
          rows: [
            { label: "Good",  value: "≥98%",     status: "good" as Status },
            { label: "Warn",  value: "95–97%",   status: "warn" as Status },
            { label: "Bad",   value: "<95%",      status: "bad"  as Status },
          ],
        }],
      },
    },
    {
      id: "fs:expiryWaste",
      label: "Expiry Waste",
      value: `${d.expiryWastePct}%`,
      status: expiryWasteStatus(d.expiryWastePct),
      content: {
        title: "Expiry Waste % Perishable COGS",
        value: `${d.expiryWastePct}%`,
        status: expiryWasteStatus(d.expiryWastePct),
        rows: [
          { label: "Expiry waste rate", value: `${d.expiryWastePct}%`, status: expiryWasteStatus(d.expiryWastePct) },
          { label: "Target",            value: "≤0.1% COGS",           status: "neutral" as Status },
          { label: "Warn threshold",    value: "≤0.15%",                status: "neutral" as Status },
        ],
        note: "Waste tính trên perishable COGS. Nguyên nhân chính: ordering inaccuracy, nhận hàng gần HSD, display quá lâu.",
        sections: [{
          label: "Thresholds",
          rows: [
            { label: "Good",  value: "≤0.1%",       status: "good" as Status },
            { label: "Warn",  value: "0.1–0.15%",   status: "warn" as Status },
            { label: "Bad",   value: ">0.15%",       status: "bad"  as Status },
          ],
        }],
      },
    },
    {
      id: "fs:nearMiss",
      label: "Near-miss Incidents",
      value: `${d.nearMissCount}`,
      status: nearMissStatus(d.nearMissCount),
      content: {
        title: "Near-miss Incidents",
        value: `${d.nearMissCount}`,
        status: nearMissStatus(d.nearMissCount),
        rows: [
          { label: "Near-miss count", value: `${d.nearMissCount}`, status: nearMissStatus(d.nearMissCount) },
          { label: "Open incidents",  value: `${d.nearMissLog.filter(l => l.status === "open").length}`,   status: d.nearMissLog.filter(l => l.status === "open").length > 0 ? "warn" as Status : "good" as Status },
          { label: "Closed",         value: `${d.nearMissLog.filter(l => l.status === "closed").length}`, status: "good" as Status },
        ],
        note: "Near-miss = sự cố gần gây mất an toàn thực phẩm nhưng được phát hiện kịp thời. Mọi near-miss cần báo cáo trong 24h.",
        sections: [{
          label: "Thresholds",
          rows: [
            { label: "Good",  value: "0 incidents", status: "good" as Status },
            { label: "Warn",  value: "1–3",          status: "warn" as Status },
            { label: "Bad",   value: ">3",           status: "bad"  as Status },
          ],
        }],
      },
    },
    {
      id: "fs:correctiveActions",
      label: "Corrective Actions Pending",
      value: `${d.correctiveActionsPending}`,
      status: correctiveActionsStatus(d.correctiveActionsPending),
      content: {
        title: "Corrective Actions Pending",
        value: `${d.correctiveActionsPending}`,
        status: correctiveActionsStatus(d.correctiveActionsPending),
        rows: [
          { label: "Pending actions",   value: `${d.correctiveActionsPending}`, status: correctiveActionsStatus(d.correctiveActionsPending) },
          { label: "Target",            value: "≤10 actions",                   status: "neutral" as Status },
          { label: "Warn threshold",    value: "≤25",                           status: "neutral" as Status },
        ],
        note: "Corrective actions phát sinh từ audit findings và near-miss incidents. Actions >30 ngày chưa đóng → escalate AM.",
        sections: [{
          label: "Thresholds",
          rows: [
            { label: "Good",  value: "≤10",   status: "good" as Status },
            { label: "Warn",  value: "11–25", status: "warn" as Status },
            { label: "Bad",   value: ">25",   status: "bad"  as Status },
          ],
        }],
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Section 1: Fleet-level KPIs ─────────────────────────────────────── */}
      <Section icon={ShieldCheck} label="Fleet-level KPIs" color="bg-[hsl(var(--epic-emerald))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map(k => (
            <KpiMini
              key={k.id}
              label={k.label}
              value={k.value}
              status={k.status}
              active={activeDrill === k.id}
              onClick={() => onDrill(k.content)}
            />
          ))}
        </div>
      </Section>

      {/* ── Section 2: Store Audit History ──────────────────────────────────── */}
      <Section icon={FileText} label="Store Audit History" color="bg-[hsl(var(--epic-blue))]">
        <Card>
          <CardContent className="p-0">
            {d.auditHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Không có dữ liệu audit</p>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-2">Store</span>
                  <span className="col-span-1 text-right">Last Audit</span>
                  <span className="col-span-1 text-right">Score</span>
                  <span className="col-span-1 text-center">Status</span>
                  <span className="col-span-1 text-right">Actions Open</span>
                </div>

                {/* Table rows */}
                <div className="divide-y">
                  {d.auditHistory.map(store => {
                    const storeStatus: Status =
                      store.status === "fail"    ? "bad"  :
                      store.status === "pass"    ? "good" : "warn"
                    const openActions = store.correctiveActions.filter(ca => ca.status === "open").length
                    const isActive = activeDrill === `audit:${store.storeId}`

                    return (
                      <button
                        key={store.storeId}
                        className={cn(
                          "w-full grid grid-cols-6 gap-2 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors",
                          isActive && "bg-muted/40",
                        )}
                        onClick={() =>
                          onDrill({
                            title: store.storeName,
                            value: `${store.score}/100 — ${store.status}`,
                            status: storeStatus,
                            rows: [
                              { label: "Last audit date",       value: store.lastAuditDate, status: "neutral" as Status },
                              { label: "Score",                 value: `${store.score}/100`, status: scoreStatus(store.score) },
                              { label: "Status",                value: store.status,         status: storeStatus },
                              { label: "Findings",              value: `${store.findings.length} findings`, status: store.findings.length === 0 ? "good" as Status : store.findings.length <= 2 ? "warn" as Status : "bad" as Status },
                              { label: "Open corrective actions", value: `${openActions}`, status: openActions === 0 ? "good" as Status : openActions <= 3 ? "warn" as Status : "bad" as Status },
                            ],
                            sections: [
                              ...(store.findings.length > 0 ? [{
                                label: "Phát hiện trong audit",
                                rows: store.findings.map(finding => ({
                                  label: finding,
                                  value: "",
                                  status: "warn" as Status,
                                })),
                              }] : []),
                              {
                                label: "Corrective Actions",
                                rows: store.correctiveActions.map(ca => ({
                                  label: ca.action,
                                  value: `${ca.dueDate} · ${ca.owner}`,
                                  sub: `Status: ${ca.status}`,
                                  status: (ca.status === "open" ? "warn" : "good") as Status,
                                })),
                              },
                            ],
                          })
                        }
                      >
                        {/* Store name */}
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs font-medium truncate">{store.storeName}</p>
                          <p className="text-[10px] text-muted-foreground">{store.storeId}</p>
                        </div>

                        {/* Last audit date */}
                        <p className="col-span-1 text-[11px] text-muted-foreground tabular-nums text-right self-center">
                          {store.lastAuditDate}
                        </p>

                        {/* Score */}
                        <p className={cn(
                          "col-span-1 text-xs font-bold tabular-nums text-right self-center",
                          scoreColor(store.score),
                        )}>
                          {store.score}
                        </p>

                        {/* Status badge */}
                        <div className="col-span-1 flex justify-center items-center">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            statusBadgeCls(store.status),
                          )}>
                            {store.status}
                          </span>
                        </div>

                        {/* Open actions count */}
                        <p className={cn(
                          "col-span-1 text-xs font-semibold tabular-nums text-right self-center",
                          openActions === 0
                            ? "text-[hsl(var(--success))]"
                            : openActions <= 3
                            ? "text-[hsl(var(--warning))]"
                            : "text-destructive",
                        )}>
                          {openActions}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* ── Section 3: Near-miss Log ─────────────────────────────────────────── */}
      <Section icon={AlertTriangle} label="Near-miss Log" color="bg-destructive">
        {d.nearMissLog.length === 0 ? (
          <Card className="border-[hsl(var(--success))]/25">
            <CardContent className="p-4">
              <p className="text-xs text-[hsl(var(--success))] font-medium text-center">
                Không có near-miss incidents
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {d.nearMissLog.map((log, i) => {
              const isActive = activeDrill === `nearmiss:${log.storeId}`
              return (
                <Card
                  key={i}
                  onClick={() =>
                    onDrill({
                      title: `Near-miss — ${log.storeName}`,
                      value: log.category,
                      status: log.status === "open" ? "bad" : "neutral",
                      rows: [
                        { label: "Store",       value: log.storeName,  status: "neutral" as Status },
                        { label: "Time",        value: log.time,       status: "neutral" as Status },
                        { label: "Category",    value: log.category,   status: "neutral" as Status },
                        { label: "Description", value: log.description, status: "neutral" as Status },
                        { label: "Status",      value: log.status,     status: (log.status === "open" ? "bad" : "good") as Status },
                      ],
                    })
                  }
                  className={cn(
                    "overflow-hidden transition-colors cursor-pointer hover:bg-muted/30",
                    isActive && "ring-2 ring-primary ring-offset-1",
                    log.status === "open"
                      ? "border-destructive/30"
                      : "border-[hsl(var(--success))]/25",
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold truncate">{log.storeName}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{log.time}</span>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{log.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">
                          {log.category}
                        </span>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          log.status === "open"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]",
                        )}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Section 4: Food Safety Alerts ────────────────────────────────────── */}
      {fsAlerts.length > 0 && (
        <Section icon={Clipboard} label="Food Safety Alerts" color="bg-destructive">
          <div className="space-y-1.5">
            {fsAlerts.map((a, i) => (
              <AlertRow key={i} a={a} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

export default FoodSafetyView
