import { DollarSign, TrendingDown, Clock, BarChart3, AlertTriangle, Layers } from "lucide-react"
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

const agingColor = (bucket: string) =>
  bucket.startsWith("0")  ? "bg-[hsl(var(--success))]" :
  bucket.startsWith("16") ? "bg-[hsl(var(--warning))]" :
  bucket.startsWith("31") ? "bg-orange-500" : "bg-destructive"

// ─── KPI card (finance-local minimal variant) ─────────────────────────────────
function FinKpiCard({
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

// ─── Main component ───────────────────────────────────────────────────────────
export function FinanceView({ d, onDrill, activeDrill }: Props) {
  const finAlerts = d.alerts.filter(a => a.tag === "Finance")

  // ── Status derivations ──
  const apStatus: Status =
    d.apOverdue > 5_000_000_000 ? "bad" :
    d.apOverdue > 2_000_000_000 ? "warn" : "good"

  const cccStatus: Status =
    d.cashConversionCycle <= 14 ? "good" :
    d.cashConversionCycle <= 18 ? "warn" : "bad"

  const dsoStatus: Status =
    d.dsoDays <= 7  ? "good" :
    d.dsoDays <= 14 ? "warn" : "bad"

  const dioStatus: Status =
    d.dioDays <= 18 ? "good" :
    d.dioDays <= 22 ? "warn" : "bad"

  const capExStatus: Status =
    d.capExVsBudget <= 5  ? "good" :
    d.capExVsBudget <= 15 ? "warn" : "bad"

  const ebitdaStatus: Status =
    d.ebitdaPct >= 10 ? "good" :
    d.ebitdaPct >= 8  ? "warn" : "bad"

  const gmStatus: Status =
    d.gmPct >= 25 ? "good" :
    d.gmPct >= 22 ? "warn" : "bad"

  // ── AP aging totals ──
  const agingTotal = d.apAging.reduce((s, b) => s + b.amount, 0)
  const agingMaxAmount = Math.max(...d.apAging.map(b => b.amount), 1)

  return (
    <div className="space-y-6">

      {/* ── Section 1: Working Capital KPIs ─────────────────────────────────── */}
      <Section icon={DollarSign} label="Working Capital KPIs" color="bg-[hsl(var(--epic-violet))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          {/* Cash on Hand */}
          <FinKpiCard
            label="Cash on Hand"
            value={fmtVnd(d.cashOnHand)}
            sub="Tiền mặt hiện có"
            status="neutral"
            active={activeDrill === "cash"}
            onClick={() => onDrill({
              title: "Cash on Hand",
              value: fmtVnd(d.cashOnHand),
              status: "neutral",
              rows: [
                { label: "Cash position",      value: fmtVnd(d.cashOnHand),    status: "neutral" },
                { label: "AP overdue",         value: fmtVnd(d.apOverdue),     status: apStatus },
                { label: "CCC target (≤14d)",  value: "14 ngày",               status: "good" },
                { label: "Runway estimate",    value: `${Math.round(d.cashOnHand / (d.cashOnHand / 30))} ngày`, status: "neutral" },
              ],
            })}
          />

          {/* AP Overdue */}
          <FinKpiCard
            label="AP Overdue"
            value={fmtVnd(d.apOverdue)}
            sub={apStatus === "bad" ? "Cần thanh toán ngay" : apStatus === "warn" ? "Theo dõi chặt" : "Trong kiểm soát"}
            status={apStatus}
            active={activeDrill === "ap"}
            onClick={() => onDrill({
              title: "AP Overdue",
              value: fmtVnd(d.apOverdue),
              status: apStatus,
              rows: [
                { label: "Cash position",     value: fmtVnd(d.cashOnHand),  status: "neutral" },
                { label: "AP overdue",        value: fmtVnd(d.apOverdue),   status: apStatus },
                { label: "CCC target (≤14d)", value: "14 ngày",             status: "good" },
                { label: "Runway estimate",   value: "~30 ngày",            status: "neutral" },
              ],
              note: "AP overdue >5 tỷ cần escalation lên CFO.",
            })}
          />

          {/* Cash Conversion Cycle */}
          <FinKpiCard
            label="Cash Conversion Cycle"
            value={`${d.cashConversionCycle} ngày`}
            sub={`Target ≤14 ngày`}
            status={cccStatus}
            active={activeDrill === "ccc"}
            onClick={() => onDrill({
              title: "Cash Conversion Cycle",
              value: `${d.cashConversionCycle} ngày`,
              status: cccStatus,
              rows: [
                { label: "Days Sales Outstanding", value: `${d.dsoDays} ngày`,            status: dsoStatus },
                { label: "Days Inventory",          value: `${d.dioDays} ngày`,            status: dioStatus },
                { label: "Days Payable",            value: `${d.dioDays + d.dsoDays - d.cashConversionCycle} ngày`, status: "neutral" },
                { label: "Target CCC",              value: "≤14 ngày",                    status: "good" },
              ],
              note: "CCC = DSO + DIO − DPO. Mỗi -1 ngày CCC ≈ giải phóng thêm tiền mặt đáng kể.",
            })}
          />

          {/* DSO */}
          <FinKpiCard
            label="DSO"
            value={`${d.dsoDays} ngày`}
            sub="Days Sales Outstanding"
            status={dsoStatus}
            active={activeDrill === "dso"}
            onClick={() => onDrill({
              title: "Days Sales Outstanding",
              value: `${d.dsoDays} ngày`,
              status: dsoStatus,
              rows: [
                { label: "Days Sales Outstanding", value: `${d.dsoDays} ngày`, status: dsoStatus },
                { label: "Days Inventory",         value: `${d.dioDays} ngày`, status: dioStatus },
                { label: "Days Payable",           value: `${d.dioDays + d.dsoDays - d.cashConversionCycle} ngày`, status: "neutral" },
                { label: "Target CCC",             value: "≤14 ngày",         status: "good" },
              ],
            })}
          />

          {/* DIO */}
          <FinKpiCard
            label="DIO"
            value={`${d.dioDays} ngày`}
            sub="Days Inventory Outstanding"
            status={dioStatus}
            active={activeDrill === "dio"}
            onClick={() => onDrill({
              title: "Days Inventory Outstanding",
              value: `${d.dioDays} ngày`,
              status: dioStatus,
              rows: [
                { label: "Days Sales Outstanding", value: `${d.dsoDays} ngày`, status: dsoStatus },
                { label: "Days Inventory",         value: `${d.dioDays} ngày`, status: dioStatus },
                { label: "Days Payable",           value: `${d.dioDays + d.dsoDays - d.cashConversionCycle} ngày`, status: "neutral" },
                { label: "Target CCC",             value: "≤14 ngày",         status: "good" },
              ],
            })}
          />

          {/* CapEx vs Budget */}
          <FinKpiCard
            label="CapEx vs Budget"
            value={`${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`}
            sub={`Spent: ${fmtVnd(d.capExSpent)}`}
            status={capExStatus}
            active={activeDrill === "capex"}
            onClick={() => onDrill({
              title: "CapEx vs Budget",
              value: `${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`,
              status: capExStatus,
              rows: [
                { label: "Spent",        value: fmtVnd(d.capExSpent),                                    status: "neutral" },
                { label: "Budget",       value: fmtVnd(d.capExSpent / (1 + d.capExVsBudget / 100)),      status: "neutral" },
                { label: "vs Budget",    value: `${d.capExVsBudget >= 0 ? "+" : ""}${d.capExVsBudget}%`, status: capExStatus },
                { label: "New stores",   value: `${d.storeOpening} cửa hàng`,                             status: "neutral" },
                { label: "Reno program", value: `${Math.round(d.storeOpening * 0.4)} stores`,             status: "neutral" },
              ],
              note: "CapEx >15% vs budget cần CFO approval. Ưu tiên cửa hàng mới over reno.",
            })}
          />
        </div>
      </Section>

      {/* ── Section 2: Store-level P&L by Region ─────────────────────────────── */}
      <Section icon={BarChart3} label="Store-level P&L by Region" color="bg-[hsl(var(--epic-emerald))]">
        <Card>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-0 px-4 py-2.5 border-b bg-muted/30">
              {["Region", "Revenue", "Labor%", "Rent%", "GM%", "EBITDA%"].map((h, i) => (
                <p key={h} className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                  i > 0 && "text-right",
                )}>{h}</p>
              ))}
            </div>

            {/* Table rows */}
            <div className="divide-y">
              {d.regionPnL.map(row => {
                const rowEbitdaStatus: Status =
                  row.ebitdaPct >= 10 ? "good" :
                  row.ebitdaPct >= 8  ? "warn" : "bad"

                const rowGmStatus: Status =
                  row.gmPct >= 25 ? "good" :
                  row.gmPct >= 22 ? "warn" : "bad"

                const isActive = activeDrill === `pnl:${row.region}`

                return (
                  <button
                    key={row.region}
                    type="button"
                    onClick={() => onDrill({
                      title: row.region,
                      value: `${row.ebitdaPct}% EBITDA`,
                      status: rowEbitdaStatus,
                      rows: [
                        { label: "Revenue",    value: fmtVnd(row.revenue),             status: "neutral" },
                        { label: "Labor cost", value: `${row.laborCost}%`,             status: row.laborCost <= 15 ? "good" : row.laborCost <= 18 ? "warn" : "bad" },
                        { label: "Rent cost",  value: `${row.rentCost}%`,              status: row.rentCost <= 8  ? "good" : row.rentCost  <= 12 ? "warn" : "bad" },
                        { label: "GM%",        value: `${row.gmPct}%`,                 status: rowGmStatus },
                        { label: "EBITDA%",    value: `${row.ebitdaPct}%`,             status: rowEbitdaStatus },
                      ],
                      note: `P&L chi tiết vùng ${row.region}. EBITDA target: ≥10%. GM target: ≥25%.`,
                    })}
                    className={cn(
                      "w-full grid grid-cols-6 gap-0 px-4 py-3 text-left transition-colors",
                      "hover:bg-muted/30",
                      isActive && "bg-muted/40 ring-1 ring-inset ring-primary/30",
                    )}
                  >
                    <span className="text-xs font-medium truncate">{row.region}</span>
                    <span className="text-xs tabular-nums text-right text-muted-foreground">{fmtVnd(row.revenue)}</span>
                    <span className="text-xs tabular-nums text-right text-muted-foreground">{row.laborCost}%</span>
                    <span className="text-xs tabular-nums text-right text-muted-foreground">{row.rentCost}%</span>
                    <span className={cn("text-xs tabular-nums text-right font-semibold", statusColor(rowGmStatus))}>
                      {row.gmPct}%
                    </span>
                    <span className={cn("text-xs tabular-nums text-right font-semibold", statusColor(rowEbitdaStatus))}>
                      {row.ebitdaPct}%
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/10">
              {[
                { label: "≥10% / ≥25%", cls: "text-[hsl(var(--success))]" },
                { label: "≥8% / ≥22%",  cls: "text-[hsl(var(--warning))]" },
                { label: "<8% / <22%",   cls: "text-destructive" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className={cn("text-[10px] font-bold", l.cls)}>●</span>
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto">EBITDA% / GM%</span>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── Section 3: EBITDA & GM strip ─────────────────────────────────────── */}
      <Section icon={TrendingDown} label="P&L Overview" color="bg-[hsl(var(--epic-rose))]">
        <div className="grid grid-cols-2 gap-3">
          <Card className={cn("border", statusBorder(ebitdaStatus))}>
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground mb-2">EBITDA %</p>
              <p className={cn("text-2xl font-bold tabular-nums", statusColor(ebitdaStatus))}>{d.ebitdaPct}%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Target ≥10%</p>
            </CardContent>
          </Card>
          <Card className={cn("border", statusBorder(gmStatus))}>
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground mb-2">Gross Margin %</p>
              <p className={cn("text-2xl font-bold tabular-nums", statusColor(gmStatus))}>{d.gmPct}%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Target ≥25%</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── Section 4: AP Aging ───────────────────────────────────────────────── */}
      <Section icon={Clock} label="AP Aging" color="bg-[hsl(var(--warning))]">
        <Card>
          <CardContent className="p-4 space-y-4">

            {/* Stacked horizontal bar */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Phân bổ theo bucket (theo giá trị)</p>
              <div className="flex h-5 w-full rounded overflow-hidden gap-px">
                {d.apAging.map(b => {
                  const pct = agingTotal > 0 ? (b.amount / agingTotal) * 100 : 0
                  return (
                    <div
                      key={b.bucket}
                      className={cn("h-full transition-all", agingColor(b.bucket))}
                      style={{ width: `${pct}%` }}
                      title={`${b.bucket}: ${fmtVnd(b.amount)}`}
                    />
                  )
                })}
              </div>
              {/* Bar legend */}
              <div className="flex flex-wrap gap-3 mt-2">
                {d.apAging.map(b => {
                  const pct = agingTotal > 0 ? ((b.amount / agingTotal) * 100).toFixed(1) : "0.0"
                  return (
                    <div key={b.bucket} className="flex items-center gap-1">
                      <span className={cn("inline-block size-2 rounded-sm shrink-0", agingColor(b.bucket))} />
                      <span className="text-[10px] text-muted-foreground">{b.bucket} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Breakdown table */}
            <div>
              {/* Header */}
              <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-muted/30 rounded-t border border-b-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bucket</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Hóa đơn</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Giá trị</span>
              </div>

              {/* Rows */}
              <div className="border rounded-b divide-y">
                {d.apAging.map(b => (
                  <div key={b.bucket} className="grid grid-cols-3 gap-2 px-3 py-2.5 items-center">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block size-2 rounded-sm shrink-0", agingColor(b.bucket))} />
                      <span className="text-xs font-medium">{b.bucket}</span>
                    </div>
                    <span className="text-xs tabular-nums text-right text-muted-foreground">{b.count}</span>
                    <span className={cn(
                      "text-xs tabular-nums text-right font-semibold",
                      b.bucket.startsWith("0")  ? "text-[hsl(var(--success))]" :
                      b.bucket.startsWith("16") ? "text-[hsl(var(--warning))]" :
                      "text-destructive",
                    )}>{fmtVnd(b.amount)}</span>
                  </div>
                ))}

                {/* Total row */}
                <div className="grid grid-cols-3 gap-2 px-3 py-2.5 items-center bg-muted/20">
                  <span className="text-xs font-semibold">Tổng</span>
                  <span className="text-xs tabular-nums text-right font-semibold">
                    {d.apAging.reduce((s, b) => s + b.count, 0)}
                  </span>
                  <span className="text-xs tabular-nums text-right font-semibold">{fmtVnd(agingTotal)}</span>
                </div>
              </div>
            </div>

            {/* AP aging bar chart (relative bars) */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Giá trị theo bucket</p>
              {d.apAging.map(b => (
                <div key={b.bucket} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">{b.bucket}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary">
                    <div
                      className={cn("h-2 rounded-full transition-all", agingColor(b.bucket))}
                      style={{ width: `${(b.amount / agingMaxAmount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-20 text-right shrink-0">{fmtVnd(b.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── Section 5: Finance Alerts ─────────────────────────────────────────── */}
      {finAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Finance Alerts" color="bg-destructive">
          <div className="space-y-1.5">
            {finAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

export default FinanceView
