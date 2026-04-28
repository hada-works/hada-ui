import { useState } from "react"
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  Zap, ShoppingCart, AlertTriangle, BarChart3, Users,
  ArrowUp, ArrowDown, Minus, ChevronRight,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Mock analytics data ──────────────────────────────────────────────────────

const MONTHS = [
  { label: "Tháng 4/2026", value: "2026-04" },
  { label: "Tháng 3/2026", value: "2026-03" },
  { label: "Tháng 2/2026", value: "2026-02" },
  { label: "Q1/2026",      value: "q1-2026" },
]

const KPI_DATA = {
  "2026-04": {
    totalRequests: 48,
    approved: 31,
    rejected: 9,
    infoNeeded: 4,
    pending: 4,
    autoApproved: 12,
    totalOrderValue: 4_820_000_000,
    autoApprovedValue: 940_000_000,
    avgMdmDays: 1.2,
    avgScmDays: 2.8,
    poolBudget: 2_000_000_000,
    poolUsed: 940_000_000,
    prevApproved: 27,
    prevRejected: 11,
    prevAvgScmDays: 3.5,
  },
  "2026-03": {
    totalRequests: 41,
    approved: 27,
    rejected: 11,
    infoNeeded: 2,
    pending: 1,
    autoApproved: 8,
    totalOrderValue: 3_950_000_000,
    autoApprovedValue: 680_000_000,
    avgMdmDays: 1.4,
    avgScmDays: 3.5,
    poolBudget: 2_000_000_000,
    poolUsed: 680_000_000,
    prevApproved: 24,
    prevRejected: 13,
    prevAvgScmDays: 4.1,
  },
  "2026-02": {
    totalRequests: 35,
    approved: 24,
    rejected: 8,
    infoNeeded: 2,
    pending: 1,
    autoApproved: 5,
    totalOrderValue: 3_200_000_000,
    autoApprovedValue: 420_000_000,
    avgMdmDays: 1.6,
    avgScmDays: 4.1,
    poolBudget: 1_500_000_000,
    poolUsed: 420_000_000,
    prevApproved: 20,
    prevRejected: 10,
    prevAvgScmDays: 4.8,
  },
  "q1-2026": {
    totalRequests: 124,
    approved: 82,
    rejected: 28,
    infoNeeded: 8,
    pending: 6,
    autoApproved: 25,
    totalOrderValue: 11_970_000_000,
    autoApprovedValue: 2_040_000_000,
    avgMdmDays: 1.4,
    avgScmDays: 3.5,
    poolBudget: 5_500_000_000,
    poolUsed: 2_040_000_000,
    prevApproved: 71,
    prevRejected: 32,
    prevAvgScmDays: 4.3,
  },
}

const REJECTION_REASONS = [
  { reason: "Tồn kho quá cao", count: 4, pct: 44 },
  { reason: "Sức bán không đủ khả thi", count: 3, pct: 33 },
  { reason: "Giá vượt ngưỡng cho phép", count: 1, pct: 11 },
  { reason: "Deal window quá ngắn", count: 1, pct: 11 },
]

const MONTHLY_VOLUME = [
  { month: "T10", requests: 28, approved: 19 },
  { month: "T11", requests: 32, approved: 22 },
  { month: "T12", requests: 29, approved: 20 },
  { month: "T1",  requests: 35, approved: 24 },
  { month: "T2",  requests: 35, approved: 24 },
  { month: "T3",  requests: 41, approved: 27 },
  { month: "T4",  requests: 48, approved: 31 },
]

const PENDING_ATTENTION = [
  { id: "BB-047", sku: "SKU-1182", name: "Dầu ăn Neptune 5L", supplier: "Kido Foods", value: 285_000_000, waitingDays: 4, stage: "SCM", overdue: true },
  { id: "BB-046", sku: "SKU-0891", name: "Mì Hảo Hảo thùng 30g", supplier: "Acecook", value: 142_000_000, waitingDays: 3, stage: "SCM", overdue: true },
  { id: "BB-048", sku: "SKU-2210", name: "Nước mắm Chin-su 1L", supplier: "Masan", value: 98_000_000, waitingDays: 2, stage: "MDM", overdue: false },
  { id: "BB-049", sku: "SKU-3301", name: "Bánh Oreo hộp thiếc", supplier: "Mondelez", value: 76_000_000, waitingDays: 1, stage: "MDM", overdue: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBig = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " tr"
  return n.toLocaleString("vi-VN")
}

function Trend({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
      value === 0 ? "text-muted-foreground" : good ? "text-[hsl(var(--success))]" : "text-destructive"
    )}>
      <Icon className="size-3" />
      {Math.abs(value)}
    </span>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconColor, trend, trendLabel, inverse,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconColor: string
  trend?: number
  trendLabel?: string
  inverse?: boolean
}) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn("size-7 rounded-md flex items-center justify-center", iconColor)}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trend value={trend} inverse={inverse} />
          <span>{trendLabel}</span>
        </div>
      )}
    </Card>
  )
}

function VelocityBar({ label, days, maxDays, color }: { label: string; days: number; maxDays: number; color: string }) {
  const pct = Math.min((days / maxDays) * 100, 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{days} ngày trung bình</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PurchasesDashboard() {
  const [month, setMonth] = useState("2026-04")
  const d = KPI_DATA[month as keyof typeof KPI_DATA]

  const approveRate = Math.round((d.approved / d.totalRequests) * 100)
  const rejectRate  = Math.round((d.rejected / d.totalRequests) * 100)
  const autoRate    = Math.round((d.autoApproved / d.totalRequests) * 100)
  const poolPct     = Math.round((d.poolUsed / d.poolBudget) * 100)

  const approveRateDiff = approveRate - Math.round((d.prevApproved / (d.prevApproved + d.prevRejected + 2)) * 100)
  const scmDaysDiff     = +(d.prevAvgScmDays - d.avgScmDays).toFixed(1)

  const maxVolume = Math.max(...MONTHLY_VOLUME.map(m => m.requests))

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Purchases Dashboard"
        description="Theo dõi hiệu quả quy trình duyệt mua hàng để hỗ trợ ra quyết định nhanh và chính xác"
        actions={
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Tổng Requests"
            value={d.totalRequests}
            sub={`${d.pending} đang chờ xử lý`}
            icon={ShoppingCart}
            iconColor="bg-blue-500/10 text-blue-600"
            trend={d.totalRequests - (KPI_DATA["2026-03"]?.totalRequests ?? d.totalRequests)}
            trendLabel="so tháng trước"
          />
          <KpiCard
            label="Tỷ lệ Approve"
            value={`${approveRate}%`}
            sub={`${d.approved} / ${d.totalRequests} requests`}
            icon={CheckCircle2}
            iconColor="bg-emerald-500/10 text-emerald-600"
            trend={approveRateDiff}
            trendLabel="điểm % so tháng trước"
          />
          <KpiCard
            label="Avg. Thời gian Duyệt (SCM)"
            value={`${d.avgScmDays} ngày`}
            sub={`MDM: ${d.avgMdmDays} ngày`}
            icon={Clock}
            iconColor="bg-amber-500/10 text-amber-600"
            trend={scmDaysDiff}
            trendLabel="ngày so tháng trước"
            inverse
          />
          <KpiCard
            label="Auto-Approved"
            value={`${autoRate}%`}
            sub={`${fmtBig(d.autoApprovedValue)} tiết kiệm thời gian`}
            icon={Zap}
            iconColor="bg-purple-500/10 text-purple-600"
            trend={autoRate - 15}
            trendLabel="điểm % so tháng trước"
          />
        </div>

        {/* ── Row 2: Volume chart + Rejection breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Volume over time */}
          <Card className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-semibold text-sm">Khối lượng Requests</div>
                <div className="text-xs text-muted-foreground mt-0.5">6 tháng gần nhất</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-primary inline-block" />Tổng</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[hsl(var(--success))] inline-block" />Approved</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-36">
              {MONTHLY_VOLUME.map((m, i) => {
                const totalH = (m.requests / maxVolume) * 100
                const approvedH = (m.approved / maxVolume) * 100
                const isLast = i === MONTHLY_VOLUME.length - 1
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-28 relative">
                      <div
                        className={cn("flex-1 rounded-t-sm transition-all", isLast ? "bg-primary" : "bg-primary/20")}
                        style={{ height: `${totalH}%` }}
                        title={`${m.requests} requests`}
                      />
                      <div
                        className={cn("flex-1 rounded-t-sm transition-all", isLast ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--success))]/20")}
                        style={{ height: `${approvedH}%` }}
                        title={`${m.approved} approved`}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Rejection reasons */}
          <Card className="lg:col-span-2 p-5">
            <div className="font-semibold text-sm mb-1">Lý do Reject</div>
            <div className="text-xs text-muted-foreground mb-4">{d.rejected} requests bị từ chối</div>
            <div className="space-y-4">
              {REJECTION_REASONS.map(r => (
                <div key={r.reason}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground">{r.reason}</span>
                    <span className="text-muted-foreground font-medium">{r.count} ({r.pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-destructive/70"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row 3: Approval velocity + Budget pool ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Approval velocity by stage */}
          <Card className="p-5">
            <div className="font-semibold text-sm mb-1">Tốc độ Duyệt theo Stage</div>
            <div className="text-xs text-muted-foreground mb-5">Thời gian trung bình từ khi nhận đến khi có quyết định</div>
            <div className="space-y-4">
              <VelocityBar label="MDM Review" days={d.avgMdmDays} maxDays={5} color="bg-blue-500" />
              <VelocityBar label="SCM Confirm" days={d.avgScmDays} maxDays={5} color="bg-amber-500" />
              <VelocityBar label="Tổng chu kỳ" days={+(d.avgMdmDays + d.avgScmDays).toFixed(1)} maxDays={10} color="bg-primary" />
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold">{d.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-destructive">{d.rejected}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">{d.infoNeeded}</div>
                <div className="text-xs text-muted-foreground">Cần bổ sung</div>
              </div>
            </div>
          </Card>

          {/* Budget pool usage */}
          <Card className="p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="font-semibold text-sm">Budget Pool Auto-Approve</div>
                <div className="text-xs text-muted-foreground mt-0.5">Ngân sách pool tháng này</div>
              </div>
              <Badge variant={poolPct > 80 ? "destructive" : poolPct > 60 ? "warning" : "success"} className="text-xs">
                {poolPct}% đã dùng
              </Badge>
            </div>

            <div className="mt-6 mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Đã auto-approve: <strong className="text-foreground">{fmtBig(d.poolUsed)}</strong></span>
                <span>Pool: <strong className="text-foreground">{fmtBig(d.poolBudget)}</strong></span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500",
                    poolPct > 80 ? "bg-destructive" : poolPct > 60 ? "bg-amber-500" : "bg-[hsl(var(--success))]"
                  )}
                  style={{ width: `${poolPct}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-6">
              Còn lại: <strong className="text-foreground">{fmtBig(d.poolBudget - d.poolUsed)}</strong> có thể auto-approve trong tháng
            </div>

            <Separator className="mb-4" />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="size-3.5 text-purple-500" />
                  Auto-approved requests
                </div>
                <span className="font-medium">{d.autoApproved} requests</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-3.5 text-blue-500" />
                  Cần duyệt thủ công
                </div>
                <span className="font-medium">{d.totalRequests - d.autoApproved} requests</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="size-3.5 text-emerald-500" />
                  Tổng giá trị đơn tháng
                </div>
                <span className="font-medium">{fmtBig(d.totalOrderValue)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Pending attention ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Cần xử lý ngay
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Requests đang chờ duyệt quá SLA hoặc gần deadline</div>
            </div>
            <Badge variant="warning" className="text-xs">{PENDING_ATTENTION.filter(p => p.overdue).length} quá hạn</Badge>
          </div>

          <div className="space-y-0">
            {PENDING_ATTENTION.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 py-3">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                      {item.overdue && <Badge variant="destructive" className="text-[10px] px-1 py-0">Quá hạn</Badge>}
                    </div>
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.sku} · {item.supplier}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{fmtBig(item.value)}</div>
                    <div className="text-xs text-muted-foreground">Chờ {item.stage}</div>
                  </div>
                  <div className={cn(
                    "text-right shrink-0 text-sm font-medium",
                    item.overdue ? "text-destructive" : "text-amber-600"
                  )}>
                    {item.waitingDays}d
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
