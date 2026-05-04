import {
  Package, CheckCircle2, XCircle, PauseCircle, Clock,
  TrendingUp, TrendingDown, BarChart3, AlertTriangle, DollarSign,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SKUS, PRODUCT_STATS, APPROVAL_REQUESTS } from "../mock-data"
import type { SkuStatus } from "../mock-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)} tr`
  return n.toLocaleString("vi-VN")
}

const STATUS_META: Record<SkuStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:    { label: "Active",    color: "text-[hsl(var(--success))]",  bg: "border-t-[hsl(var(--success))]",  icon: CheckCircle2 },
  suspended: { label: "Suspended", color: "text-[hsl(var(--warning))]",  bg: "border-t-[hsl(var(--warning))]",  icon: PauseCircle  },
  closed:    { label: "Closed",    color: "text-muted-foreground",        bg: "border-t-muted-foreground",        icon: XCircle      },
  pending:   { label: "Pending",   color: "text-[hsl(var(--info))]",      bg: "border-t-[hsl(var(--info))]",      icon: Clock        },
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label: string; value: string | number; sub: string
  icon: React.ElementType
  accent: "default" | "success" | "warning" | "destructive" | "info"
  trend?: number
}) {
  const colorMap = {
    default: "text-primary", success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]", destructive: "text-destructive",
    info: "text-[hsl(var(--info))]",
  }
  const borderMap = {
    default: "border-t-primary", success: "border-t-[hsl(var(--success))]",
    warning: "border-t-[hsl(var(--warning))]", destructive: "border-t-destructive",
    info: "border-t-[hsl(var(--info))]",
  }
  const color  = colorMap[accent]
  const border = borderMap[accent]

  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3.5 border-t-2 hover:shadow-sm transition-shadow", border)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-3.5 shrink-0", color)} />
      </div>
      <div className={cn("text-2xl font-bold leading-none mb-1", color)}>{value}</div>
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] text-muted-foreground">{sub}</p>
        {trend !== undefined && (
          <span className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold ml-auto",
            trend >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
          )}>
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
function StatusBar({ status, count, total }: { status: SkuStatus; count: number; total: number }) {
  const { label, color, icon: Icon } = STATUS_META[status]
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const barColor = {
    active: "bg-[hsl(var(--success))]", suspended: "bg-[hsl(var(--warning))]",
    closed: "bg-muted-foreground", pending: "bg-[hsl(var(--info))]",
  }[status]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0">
        <Icon className={cn("size-3.5 shrink-0", color)} />
        <span className={cn("text-xs font-medium", color)}>{label}</span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">
        {count} SKU · {pct}%
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProductsDashboardPage() {
  const pendingApprovals = APPROVAL_REQUESTS.filter(r => r.status === "pending")
  const recentSkus = [...SKUS].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ).slice(0, 8)

  const topRevenue = [...SKUS]
    .filter(s => s.status === "active")
    .sort((a, b) => b.revenue30d - a.revenue30d)
    .slice(0, 6)

  const weakSkus = [...SKUS]
    .filter(s => s.status === "active" && s.trendPct < -10)
    .sort((a, b) => a.trendPct - b.trendPct)
    .slice(0, 5)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Products Dashboard"
        description="Tình hình sức khoẻ danh mục sản phẩm đang vận hành"
        action={{ label: "Export Report", onClick: () => {} }}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 space-y-6">

          {/* ── KPI Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Tổng SKU"       value={PRODUCT_STATS.totalSkus}                          sub="đang quản lý"            icon={Package}      accent="default"     />
            <KpiCard label="Active"          value={PRODUCT_STATS.active}                             sub="đang kinh doanh"          icon={CheckCircle2} accent="success"     />
            <KpiCard label="Suspended"       value={PRODUCT_STATS.suspended}                          sub="đang tạm khóa"            icon={PauseCircle}  accent="warning"     />
            <KpiCard label="Closed"          value={PRODUCT_STATS.closed}                             sub="đã đóng mã"               icon={XCircle}      accent="default"     />
            <KpiCard label="Pending Duyệt"   value={PRODUCT_STATS.pending}                            sub="chờ xét duyệt"            icon={Clock}        accent="info"        />
            <KpiCard label="Cần xem xét"     value={PRODUCT_STATS.pendingApprovals}                   sub="approval đang chờ"        icon={AlertTriangle} accent="warning"    />
          </div>

          {/* ── Revenue & Margin KPI ── */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Revenue 30 ngày"  value={fmtVnd(PRODUCT_STATS.totalRevenue30d)} sub="tổng SKU active" icon={DollarSign}  accent="success" />
            <KpiCard label="Avg Margin"        value={`${PRODUCT_STATS.avgMarginPct}%`}       sub="biên lợi nhuận trung bình" icon={BarChart3} accent="default" />
          </div>

          {/* ── Middle Section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Status Distribution */}
            <div className="lg:col-span-1 rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold mb-4">Phân bố trạng thái SKU</h2>
              <div className="space-y-3">
                {(["active", "suspended", "pending", "closed"] as SkuStatus[]).map(s => (
                  <StatusBar
                    key={s}
                    status={s}
                    count={SKUS.filter(x => x.status === s).length}
                    total={PRODUCT_STATS.totalSkus}
                  />
                ))}
              </div>
            </div>

            {/* Top Revenue SKUs */}
            <div className="lg:col-span-2 rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold mb-4">Top SKU Revenue 30 ngày</h2>
              <div className="space-y-2">
                {topRevenue.map((sku, idx) => (
                  <div key={sku.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{sku.name}</div>
                      <div className="text-[11px] text-muted-foreground">{sku.code} · {sku.brand}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-[hsl(var(--success))]">{fmtVnd(sku.revenue30d)}</div>
                      <div className={cn(
                        "flex items-center justify-end gap-0.5 text-[11px]",
                        sku.trendPct >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
                      )}>
                        {sku.trendPct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {Math.abs(sku.trendPct)}%
                      </div>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--success))]"
                        style={{ width: `${(sku.revenue30d / topRevenue[0].revenue30d) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Weak SKU Alert + Pending Approvals ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Weak SKUs */}
            <div className="rounded-lg border bg-card p-4 border-t-2 border-t-[hsl(var(--warning))]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-[hsl(var(--warning))]" />
                <h2 className="text-sm font-semibold">SKU Performance Yếu (Active)</h2>
                <Badge variant="warning" className="text-[10px] ml-auto">{weakSkus.length} SKU</Badge>
              </div>
              <div className="space-y-2">
                {weakSkus.map(sku => (
                  <div key={sku.id} className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{sku.name}</div>
                      <div className="text-[11px] text-muted-foreground">{sku.code}</div>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-bold text-destructive shrink-0">
                      <TrendingDown className="size-3" />
                      {Math.abs(sku.trendPct)}%
                    </div>
                  </div>
                ))}
                {weakSkus.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Không có SKU nào yếu hiện tại</p>
                )}
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="rounded-lg border bg-card p-4 border-t-2 border-t-[hsl(var(--info))]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-[hsl(var(--info))]" />
                <h2 className="text-sm font-semibold">Approval Đang Chờ Xử Lý</h2>
                <Badge variant="secondary" className="text-[10px] ml-auto">{pendingApprovals.length} yêu cầu</Badge>
              </div>
              <div className="space-y-2">
                {pendingApprovals.map(req => (
                  <div key={req.id} className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
                    <Badge
                      variant={req.type === "out" ? "warning" : "secondary"}
                      className="text-[9px] font-bold uppercase mt-0.5 shrink-0"
                    >
                      {req.type === "out" ? "OUT" : "IN"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{req.skuName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{req.reason.slice(0, 60)}…</div>
                    </div>
                  </div>
                ))}
                {pendingApprovals.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Không có yêu cầu nào đang chờ</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">SKU cập nhật gần đây</h2>
              <Badge variant="secondary" className="text-[10px]">{recentSkus.length} SKU</Badge>
            </div>
            <div className="divide-y">
              {recentSkus.map(sku => {
                const meta = STATUS_META[sku.status]
                const StatusIcon = meta.icon
                return (
                  <div key={sku.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <StatusIcon className={cn("size-3.5 shrink-0", meta.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{sku.name}</div>
                      <div className="text-[11px] text-muted-foreground">{sku.code} · {sku.brand}</div>
                    </div>
                    <Badge
                      variant={
                        sku.status === "active" ? "success" :
                        sku.status === "suspended" ? "warning" :
                        sku.status === "pending" ? "secondary" : "outline"
                      }
                      className="text-[9px] font-bold uppercase shrink-0"
                    >
                      {meta.label}
                    </Badge>
                    <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {new Date(sku.lastUpdated).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
