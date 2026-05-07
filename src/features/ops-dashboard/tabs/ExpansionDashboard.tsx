import { MapPin, Clock, TrendingUp, DollarSign, AlertTriangle, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Status } from "../shared/types"
import { fmtVnd } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { Section, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColor = (s: Status) =>
  s === "good" ? "text-[hsl(var(--success))]" :
  s === "bad"  ? "text-destructive" :
  s === "warn" ? "text-[hsl(var(--warning))]" :
  "text-muted-foreground"

const statusBorder = (s: Status) =>
  s === "good" ? "border-[hsl(var(--success))]/25" :
  s === "bad"  ? "border-destructive/40" :
  s === "warn" ? "border-[hsl(var(--warning))]/40" :
  "border-border"

// ─── KPI card (expansion-local minimal variant) ───────────────────────────────
function ExpKpiCard({
  label, value, sub, status, active, onClick,
}: {
  label: string
  value: string
  sub?: string
  status: Status
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30",
        active && "ring-2 ring-primary ring-offset-1",
        statusBorder(status),
      )}
    >
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight mb-2">{label}</p>
        <p className={cn("text-xl font-bold leading-none tabular-nums", statusColor(status))}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Project status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "signed" | "construction" | "permit" | "opening" }) {
  const cfg = {
    signed:       { cls: "bg-blue-100 text-blue-700 border-blue-200",   label: "Ký kết" },
    construction: { cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Thi công" },
    permit:       { cls: "bg-orange-100 text-orange-700 border-orange-200", label: "Chờ permit" },
    opening:      { cls: "bg-green-100 text-green-700 border-green-200", label: "Khai trương" },
  }[status]
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
      cfg.cls,
    )}>
      {cfg.label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ExpansionView({ d, onDrill, activeDrill }: Props) {
  // ── Status derivations ──
  const ttoStatus: Status =
    d.timeToOpenDays <= d.timeToOpenTarget       ? "good" :
    d.timeToOpenDays <= d.timeToOpenTarget + 14  ? "warn" : "bad"

  const approvalStatus: Status =
    d.siteApprovalRate >= 75 ? "good" :
    d.siteApprovalRate >= 60 ? "warn" : "bad"

  const paybackStatus: Status =
    d.paybackPeriodMonths <= 18 ? "good" :
    d.paybackPeriodMonths <= 24 ? "warn" : "bad"

  const capExStatus: Status =
    Math.abs(d.capExVsBudget) <= 5  ? "good" :
    Math.abs(d.capExVsBudget) <= 15 ? "warn" : "bad"

  // Expansion-relevant alerts
  const expansionAlerts = d.alerts.filter(a =>
    a.msg.toLowerCase().includes("permit") ||
    a.msg.toLowerCase().includes("pipeline") ||
    a.msg.toLowerCase().includes("khai trương") ||
    a.msg.toLowerCase().includes("site"),
  )

  return (
    <div className="space-y-6">

      {/* ── Section 1: Expansion KPIs ─────────────────────────────────────────── */}
      <Section icon={TrendingUp} label="Expansion KPIs" color="bg-[hsl(var(--epic-emerald))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          {/* Pipeline Total */}
          <ExpKpiCard
            label="Pipeline Total"
            value={`${d.storePipeline} sites`}
            sub={`${d.storePipelineBreak.signed} ký · ${d.storePipelineBreak.construction} thi công · ${d.storePipelineBreak.permit} chờ permit`}
            status="neutral"
            active={activeDrill === "pipeline"}
            onClick={() => onDrill({
              title: "Store Pipeline",
              value: `${d.storePipeline} sites`,
              status: "neutral",
              rows: [
                { label: "Tổng pipeline",      value: `${d.storePipeline} sites`,                    status: "neutral" },
                { label: "Đã ký hợp đồng",     value: `${d.storePipelineBreak.signed} sites`,        status: "good" },
                { label: "Đang thi công",       value: `${d.storePipelineBreak.construction} sites`,  status: "warn" },
                { label: "Chờ permit",          value: `${d.storePipelineBreak.permit} sites`,        status: "warn" },
                { label: "Khai trương kỳ này",  value: `${d.storeOpening} stores`,                   status: "good" },
              ],
              note: "Pipeline bao gồm tất cả sites đã ký đến chưa khai trương.",
            })}
          />

          {/* Time-to-Open */}
          <ExpKpiCard
            label="Time-to-Open"
            value={`${d.timeToOpenDays} ngày`}
            sub={`Target ${d.timeToOpenTarget} ngày · ${d.timeToOpenDays > d.timeToOpenTarget ? "+" + (d.timeToOpenDays - d.timeToOpenTarget) + " ngày chậm" : "on track"}`}
            status={ttoStatus}
            active={activeDrill === "tto"}
            onClick={() => onDrill({
              title: "Time-to-Open",
              value: `${d.timeToOpenDays} ngày`,
              status: ttoStatus,
              rows: [
                { label: "Thực tế TB",        value: `${d.timeToOpenDays} ngày`,       status: ttoStatus },
                { label: "Target",            value: `${d.timeToOpenTarget} ngày`,      status: "good" },
                { label: "Chênh lệch",        value: d.timeToOpenDays > d.timeToOpenTarget ? `+${d.timeToOpenDays - d.timeToOpenTarget} ngày chậm` : "On track", status: ttoStatus },
                { label: "Phases: Ký → Permit", value: "~30 ngày TB",                 status: "neutral" },
                { label: "Phases: Permit → Thi công", value: "~15 ngày TB",           status: "neutral" },
                { label: "Phases: Thi công → Khai trương", value: `~${Math.max(0, d.timeToOpenDays - 45)} ngày TB`, status: "neutral" },
              ],
              note: "Time-to-open tính từ ngày ký hợp đồng thuê đến ngày khai trương chính thức.",
            })}
          />

          {/* Site Approval Rate */}
          <ExpKpiCard
            label="Site Approval Rate"
            value={`${d.siteApprovalRate}%`}
            sub={`Target ≥75% · ${approvalStatus === "good" ? "Đạt mục tiêu" : approvalStatus === "warn" ? "Cần cải thiện" : "Dưới ngưỡng"}`}
            status={approvalStatus}
            active={activeDrill === "approval"}
            onClick={() => onDrill({
              title: "Site Approval Rate",
              value: `${d.siteApprovalRate}%`,
              status: approvalStatus,
              rows: [
                { label: "Tỷ lệ phê duyệt",   value: `${d.siteApprovalRate}%`,  status: approvalStatus },
                { label: "Target ≥75%",        value: "75%",                      status: "good" },
                { label: "Sites submitted",    value: `${Math.round(d.storePipeline / (d.siteApprovalRate / 100))} sites`, status: "neutral" },
                { label: "Sites approved",     value: `${d.storePipeline} sites`, status: "neutral" },
              ],
              note: "Tỷ lệ sites được hội đồng phê duyệt so với tổng số sites đề xuất.",
            })}
          />

          {/* Payback Period */}
          <ExpKpiCard
            label="Payback Period"
            value={`${d.paybackPeriodMonths} tháng`}
            sub={`Target ≤18 tháng · ${paybackStatus === "good" ? "Đạt mục tiêu" : paybackStatus === "warn" ? "Cần theo dõi" : "Vượt ngưỡng"}`}
            status={paybackStatus}
            active={activeDrill === "payback"}
            onClick={() => onDrill({
              title: "Payback Period",
              value: `${d.paybackPeriodMonths} tháng`,
              status: paybackStatus,
              rows: [
                { label: "Payback TB",          value: `${d.paybackPeriodMonths} tháng`,  status: paybackStatus },
                { label: "Target",              value: "≤18 tháng",                        status: "good" },
                { label: "Chênh lệch vs target", value: d.paybackPeriodMonths > 18 ? `+${d.paybackPeriodMonths - 18} tháng` : "On track", status: paybackStatus },
                { label: "CapEx TB/store",      value: fmtVnd(d.capExSpent / Math.max(d.storeOpening, 1)), status: "neutral" },
              ],
              note: "Payback period tính từ ngày khai trương đến khi thu hồi toàn bộ CapEx đầu tư.",
            })}
          />

          {/* CapEx vs Budget */}
          <ExpKpiCard
            label="CapEx vs Budget"
            value={`${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`}
            sub={`${capExStatus === "good" ? "Trong kiểm soát" : capExStatus === "warn" ? "Cần theo dõi" : "Vượt ngưỡng — cần CFO approval"}`}
            status={capExStatus}
            active={activeDrill === "capex"}
            onClick={() => onDrill({
              title: "CapEx vs Budget",
              value: `${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`,
              status: capExStatus,
              rows: [
                { label: "vs Budget",      value: `${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`, status: capExStatus },
                { label: "Spent",          value: fmtVnd(d.capExSpent),                                    status: "neutral" },
                { label: "Budget estimate", value: fmtVnd(d.capExSpent / (1 + d.capExVsBudget / 100)),     status: "neutral" },
                { label: "Stores mở kỳ này", value: `${d.storeOpening} cửa hàng`,                         status: "neutral" },
              ],
              note: "CapEx >15% vs budget cần CFO approval trước khi tiếp tục.",
            })}
          />

          {/* CapEx Spent */}
          <ExpKpiCard
            label="CapEx Spent"
            value={fmtVnd(d.capExSpent)}
            sub={`${d.storeOpening} stores khai trương kỳ này`}
            status="neutral"
            active={activeDrill === "capex-spent"}
            onClick={() => onDrill({
              title: "CapEx Spent",
              value: fmtVnd(d.capExSpent),
              status: "neutral",
              rows: [
                { label: "Tổng CapEx chi",       value: fmtVnd(d.capExSpent),                                   status: "neutral" },
                { label: "vs Budget",             value: `${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`, status: capExStatus },
                { label: "TB CapEx/store",        value: fmtVnd(d.capExSpent / Math.max(d.storeOpening, 1)),      status: "neutral" },
                { label: "Stores khai trương",    value: `${d.storeOpening} cửa hàng`,                           status: "good" },
                { label: "Pipeline còn lại",      value: `${d.storePipeline} sites`,                             status: "neutral" },
              ],
            })}
          />
        </div>
      </Section>

      {/* ── Section 2: Project Tracker ────────────────────────────────────────── */}
      <Section icon={MapPin} label="Project Tracker" color="bg-[hsl(var(--epic-blue))]">
        <Card>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto_1fr_1.5fr_auto] gap-x-3 px-4 py-2.5 border-b bg-muted/30">
              {["Project", "Region", "Cluster", "Status", "Target Open", "Milestone", "Delay"].map((h, i) => (
                <p key={h} className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                  i >= 4 && "text-right",
                )}>{h}</p>
              ))}
            </div>

            {/* Table rows */}
            {d.expansionProjects.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Không có dự án nào trong kỳ này
              </div>
            ) : (
              <div className="divide-y">
                {d.expansionProjects.map(p => {
                  const isActive = activeDrill === `project:${p.id}`
                  const projStatus: Status = p.daysDelayed > 0 ? "bad" : "good"

                  const drillRows = [
                    { label: "Region",              value: p.region,                                          status: "neutral" as Status },
                    { label: "Cluster",             value: p.cluster,                                         status: "neutral" as Status },
                    { label: "Status",              value: p.status,                                          status: "neutral" as Status },
                    { label: "Ngày bắt đầu",        value: p.startDate,                                       status: "neutral" as Status },
                    { label: "Target khai trương",  value: p.targetOpenDate,                                  status: "neutral" as Status },
                    { label: "Lease cost/sqm/tháng", value: fmtVnd(p.leaseCostSqm),                          status: (p.leaseCostSqm <= 400_000 ? "good" : p.leaseCostSqm <= 500_000 ? "warn" : "bad") as Status },
                    { label: "CapEx budget",        value: fmtVnd(p.capEx),                                   status: "neutral" as Status },
                    { label: "Delay",               value: p.daysDelayed > 0 ? `+${p.daysDelayed} ngày` : "On track", status: projStatus },
                  ]

                  const drillSections: DrillContent["sections"] = p.daysDelayed > 0 ? [
                    {
                      label: "Action required",
                      rows: [
                        { label: "Escalation",   value: "Report to COO trong 24h",            status: "bad" as Status },
                        { label: "Root cause",   value: "Xác định nguyên nhân chậm tiến độ",  status: "warn" as Status },
                        { label: "Recovery plan", value: "Lập kế hoạch bù tiến độ",           status: "warn" as Status },
                        { label: "Delay",        value: `+${p.daysDelayed} ngày`,              status: "bad" as Status },
                      ],
                    },
                  ] : undefined

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onDrill({
                        title: p.name,
                        value: p.milestone,
                        status: projStatus,
                        rows: drillRows,
                        sections: drillSections,
                      })}
                      className={cn(
                        "w-full grid grid-cols-[1.5fr_1fr_1fr_auto_1fr_1.5fr_auto] gap-x-3 px-4 py-3 text-left transition-colors items-center",
                        "hover:bg-muted/30",
                        isActive && "bg-muted/40 ring-1 ring-inset ring-primary/30",
                      )}
                    >
                      <span className="text-xs font-medium truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{p.region}</span>
                      <span className="text-xs text-muted-foreground truncate">{p.cluster}</span>
                      <StatusBadge status={p.status} />
                      <span className="text-xs tabular-nums text-right text-muted-foreground">{p.targetOpenDate}</span>
                      <span className="text-xs text-right text-muted-foreground truncate">{p.milestone}</span>
                      <span className={cn(
                        "text-xs tabular-nums text-right font-semibold whitespace-nowrap",
                        p.daysDelayed > 0 ? "text-destructive" : "text-[hsl(var(--success))]",
                      )}>
                        {p.daysDelayed > 0 ? `+${p.daysDelayed} ngày` : "On track"}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* ── Section 3: Pipeline theo vùng ─────────────────────────────────────── */}
      <Section icon={Building2} label="Pipeline theo vùng" color="bg-[hsl(var(--epic-purple))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {d.regions.map(r => {
            const pipelineStatus: Status =
              r.pipeline >= 15 ? "good" :
              r.pipeline >= 8  ? "warn" : "neutral"

            const pipelineColor =
              r.pipeline >= 15 ? "text-[hsl(var(--success))]" :
              r.pipeline >= 8  ? "text-[hsl(var(--warning))]" :
              "text-muted-foreground"

            return (
              <Card key={r.name} className={cn("overflow-hidden", statusBorder(pipelineStatus))}>
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 truncate">{r.name}</p>
                  <p className={cn("text-2xl font-bold tabular-nums leading-none", pipelineColor)}>
                    {r.pipeline}
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">sites</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Lease: <span className="font-medium">{fmtVnd(r.leaseCostSqm)}/sqm/tháng</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hiện tại: <span className="font-medium">{r.stores} stores</span>
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* ── Section 4: Expansion Alerts ───────────────────────────────────────── */}
      {expansionAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Expansion Alerts" color="bg-destructive">
          <div className="space-y-1.5">
            {expansionAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}

    </div>
  )
}

export default ExpansionView
