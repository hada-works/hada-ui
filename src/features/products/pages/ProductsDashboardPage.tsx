import { useState } from "react"
import { Package, CheckCircle2, XCircle, PauseCircle, Clock, TrendingUp, TrendingDown, BarChart3, AlertTriangle, DollarSign, Activity, ShoppingCart } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SKUS, PRODUCT_STATS, APPROVAL_REQUESTS, INVENTORY_STATUS, AVAILABILITY_BY_RANK, AVAILABILITY_BY_REGION, AVAILABILITY_TREND, OOS_TREND, VENDOR_AVAILABILITY } from "../mock-data"
import type { SkuStatus } from "../mock-data"

function fmtVnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`
  return n.toLocaleString("vi-VN")
}
function fmtK(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)
}

const STATUS_META: Record<SkuStatus, { label: string; color: string; border: string; icon: React.ElementType }> = {
  active:    { label: "Active",    color: "text-[hsl(var(--success))]", border: "border-t-[hsl(var(--success))]", icon: CheckCircle2 },
  suspended: { label: "Suspended", color: "text-[hsl(var(--warning))]", border: "border-t-[hsl(var(--warning))]", icon: PauseCircle  },
  closed:    { label: "Closed",    color: "text-muted-foreground",       border: "border-t-muted-foreground",       icon: XCircle      },
  pending:   { label: "Pending",   color: "text-[hsl(var(--info))]",    border: "border-t-[hsl(var(--info))]",    icon: Clock        },
}

// ─── Mini KPI card ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; accent: "default"|"success"|"warning"|"destructive"|"info"; trend?: number
}) {
  const c = { default:"text-primary", success:"text-[hsl(var(--success))]", warning:"text-[hsl(var(--warning))]", destructive:"text-destructive", info:"text-[hsl(var(--info))]" }[accent]
  const b = { default:"border-t-primary", success:"border-t-[hsl(var(--success))]", warning:"border-t-[hsl(var(--warning))]", destructive:"border-t-destructive", info:"border-t-[hsl(var(--info))]" }[accent]
  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3.5 border-t-2 hover:shadow-sm transition-shadow", b)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-4 shrink-0", c)} />
      </div>
      <div className={cn("text-2xl font-bold leading-none mb-1.5", c)}>{value}</div>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-semibold ml-auto", trend >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Horizontal bar row ───────────────────────────────────────────────────────
function HBar({ label, value, max, color, suffix = "%" }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-12 text-right shrink-0">{value}{suffix}</span>
    </div>
  )
}

// ─── Trend sparkline (CSS only) ───────────────────────────────────────────────
function Sparkline({ data, field }: { data: { availability: number; availabilityExVendor: number; date: string }[]; field: "availability" | "availabilityExVendor" }) {
  const vals = data.map(d => d[field])
  const min = Math.min(...vals) - 1
  const max = Math.max(...vals) + 1
  const range = max - min
  const w = 100 / (vals.length - 1)
  const points = vals.map((v, i) => `${i * w},${100 - ((v - min) / range) * 100}`).join(" ")
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" points={points} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── OOS stacked bar ─────────────────────────────────────────────────────────
function OosBar({ newOos, remainOos, solved, maxTotal }: { newOos: number; remainOos: number; solved: number; maxTotal: number }) {
  const total = newOos + remainOos
  return (
    <div className="flex flex-col gap-0.5 items-center">
      <div className="w-5 flex flex-col justify-end" style={{ height: 56 }}>
        <div className="w-full rounded-t" style={{ height: `${(newOos / maxTotal) * 56}px`, background: "hsl(var(--info))" }} />
        <div className="w-full" style={{ height: `${(remainOos / maxTotal) * 56}px`, background: "hsl(var(--warning))" }} />
      </div>
      <div className="w-full h-1 rounded" style={{ background: "hsl(var(--success))", opacity: solved / maxTotal }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProductsDashboardPage() {
  const [showExVendor, setShowExVendor] = useState(false)
  const pendingApprovals = APPROVAL_REQUESTS.filter(r => r.status === "pending")
  const topRevenue = [...SKUS].filter(s => s.status === "active").sort((a, b) => b.revenue30d - a.revenue30d).slice(0, 5)
  const weakSkus   = [...SKUS].filter(s => s.status === "active" && s.trendPct < -10).sort((a, b) => a.trendPct - b.trendPct).slice(0, 4)
  const activeSkus = SKUS.filter(s => s.status === "active")
  const revenuePerSku = activeSkus.length ? Math.round(activeSkus.reduce((s, x) => s + x.revenue30d, 0) / activeSkus.length) : 0
  const maxOos = Math.max(...OOS_TREND.map(d => d.newOos + d.remainOos))
  const latest = AVAILABILITY_TREND[AVAILABILITY_TREND.length - 1]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Products Dashboard" description="Tình hình sức khoẻ & hiệu quả vận hành danh mục sản phẩm" action={{ label: "Export", onClick: () => {} }} />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 space-y-6">

          {/* ── Row 1: SKU Status KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Tổng SKU"     value={PRODUCT_STATS.totalSkus}           sub="đang quản lý"     icon={Package}       accent="default"  />
            <KpiCard label="Active"        value={PRODUCT_STATS.active}              sub="đang kinh doanh"  icon={CheckCircle2}  accent="success"  />
            <KpiCard label="Suspended"     value={PRODUCT_STATS.suspended}           sub="tạm khóa"         icon={PauseCircle}   accent="warning"  />
            <KpiCard label="Closed"        value={PRODUCT_STATS.closed}              sub="đã đóng mã"       icon={XCircle}       accent="default"  />
            <KpiCard label="Pending"       value={PRODUCT_STATS.pending}             sub="chờ duyệt"        icon={Clock}         accent="info"     />
            <KpiCard label="Cần xem xét"  value={PRODUCT_STATS.pendingApprovals}    sub="approval chờ"     icon={AlertTriangle} accent="warning"  />
          </div>

          {/* ── Row 2: Revenue + Availability KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Revenue 30d"       value={fmtVnd(PRODUCT_STATS.totalRevenue30d)} sub="tổng active SKU"        icon={DollarSign} accent="success" />
            <KpiCard label="Avg Margin"         value={`${PRODUCT_STATS.avgMarginPct}%`}       sub="biên lợi nhuận tb"     icon={BarChart3}  accent="default" />
            <KpiCard label="Fill Rate"          value={`${PRODUCT_STATS.avgAvailability}%`}    sub="availability hiện tại" icon={Activity}   accent="success" trend={1.8} />
            <KpiCard label="OOS Rate"           value={`${PRODUCT_STATS.oosRate}%`}            sub={`${fmtK(PRODUCT_STATS.oosLines)} dòng OOS`} icon={ShoppingCart} accent="warning" trend={-0.9} />
          </div>

          {/* ── Row 3: Inventory Status + Availability Trend ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Inventory Status Donut-style */}
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold mb-4">Inventory Status</h2>
              <div className="space-y-2.5">
                {[
                  { label: "In Stock",      value: INVENTORY_STATUS.inStock,     color: "bg-[hsl(var(--success))]" },
                  { label: "Below Min",     value: INVENTORY_STATUS.belowMin,    color: "bg-[hsl(var(--warning))]" },
                  { label: "Above Max",     value: INVENTORY_STATUS.aboveMax,    color: "bg-[hsl(var(--info))]"    },
                  { label: "OOS",           value: INVENTORY_STATUS.oos,         color: "bg-destructive"           },
                  { label: "OOS Vendor",    value: INVENTORY_STATUS.oosVendor,   color: "bg-[hsl(var(--epic-rose))]" },
                  { label: "OOS Shipped",   value: INVENTORY_STATUS.oosShipped,  color: "bg-muted-foreground"      },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={cn("size-3 rounded-sm shrink-0", row.color)} />
                    <span className="text-sm flex-1">{row.label}</span>
                    <span className="text-sm font-bold tabular-nums">{row.value}%</span>
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xs text-muted-foreground">Revenue/SKU</div><div className="text-sm font-bold">{fmtVnd(revenuePerSku)}</div></div>
                <div><div className="text-xs text-muted-foreground">Slow-moving</div><div className="text-sm font-bold text-[hsl(var(--warning))]">{PRODUCT_STATS.slowMovingCount} SKU</div></div>
                <div><div className="text-xs text-muted-foreground">New SKU rev%</div><div className="text-sm font-bold text-[hsl(var(--info))]">{PRODUCT_STATS.newSkuContribPct}%</div></div>
              </div>
            </div>

            {/* Availability Trend */}
            <div className="lg:col-span-2 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">% Availability by Date</h2>
                  <p className="text-xs text-muted-foreground">8 tuần gần nhất · {latest.date}: <span className="font-semibold">{latest.availability}%</span> | OOS Lines: <span className="font-semibold">{fmtK(latest.oosLines)}</span></p>
                </div>
                <button onClick={() => setShowExVendor(v => !v)} className={cn("px-2 py-1 text-xs rounded border transition-colors", showExVendor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  Ex-Vendor
                </button>
              </div>
              {/* Sparkline */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><span className="size-2 rounded-full bg-[hsl(var(--success))] inline-block" /> Fill Rate</p>
                  <div className={cn("text-[hsl(var(--success))]")}><Sparkline data={AVAILABILITY_TREND} field="availability" /></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><span className="size-2 rounded-full bg-[hsl(var(--info))] inline-block" /> OOS Trend (nghìn dòng)</p>
                  {/* OOS bars */}
                  <div className="flex items-end gap-1 h-12">
                    {OOS_TREND.map(d => (
                      <OosBar key={d.date} newOos={d.newOos} remainOos={d.remainOos} solved={d.solved} maxTotal={maxOos} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Date labels */}
              <div className="flex justify-between">
                {AVAILABILITY_TREND.map(d => (
                  <span key={d.date} className="text-[10px] text-muted-foreground">{d.date}</span>
                ))}
              </div>
              {/* OOS legend */}
              <div className="flex gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="size-2 rounded-sm bg-[hsl(var(--info))] inline-block"/>New</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="size-2 rounded-sm bg-[hsl(var(--warning))] inline-block"/>Remain</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="size-2 rounded-sm bg-[hsl(var(--success))] inline-block"/>Solved</span>
              </div>
            </div>
          </div>

          {/* ── Row 4: Availability by Rank + Region ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">% Availability by Rank</h2>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[hsl(var(--success))] inline-block"/>Tổng</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[hsl(var(--info))] inline-block"/>Ex-Vendor</span>
                </div>
              </div>
              <div className="space-y-3">
                {AVAILABILITY_BY_RANK.map(r => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground">{r.availability}% / {r.availabilityExVendor}%</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-[hsl(var(--success))] transition-all" style={{ width: `${((r.availability - 75) / 25) * 100}%` }} />
                      </div>
                      <div className="flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-[hsl(var(--info))] transition-all" style={{ width: `${((r.availabilityExVendor - 75) / 25) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold mb-4">% Availability by Region</h2>
              <div className="space-y-2.5">
                {[...AVAILABILITY_BY_REGION].sort((a, b) => b.availability - a.availability).map(r => (
                  <HBar key={r.name} label={r.name} value={r.availability} max={100} color="bg-[hsl(var(--success))]" />
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 5: Vendor OOS + Top Revenue + Weak SKU ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Vendor OOS */}
            <div className="rounded-lg border bg-card p-4 border-t-2 border-t-[hsl(var(--warning))]">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="size-4 text-[hsl(var(--warning))]" />
                <h2 className="text-base font-semibold">OOS Rate by Vendor</h2>
              </div>
              <div className="space-y-2.5">
                {[...VENDOR_AVAILABILITY].sort((a, b) => b.oosRate - a.oosRate).map(v => (
                  <HBar key={v.vendor} label={v.vendor} value={v.oosRate} max={30} color={v.oosRate > 10 ? "bg-destructive" : v.oosRate > 5 ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--success))]"} />
                ))}
              </div>
            </div>

            {/* Top Revenue SKUs */}
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold mb-4">Top SKU Revenue 30 ngày</h2>
              <div className="space-y-3">
                {topRevenue.map((sku, i) => (
                  <div key={sku.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{sku.name}</div>
                      <div className="text-xs text-muted-foreground">{sku.code}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-[hsl(var(--success))]">{fmtVnd(sku.revenue30d)}</div>
                      <div className={cn("text-xs flex items-center justify-end gap-0.5", sku.trendPct >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
                        {sku.trendPct >= 0 ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>}{Math.abs(sku.trendPct)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak SKUs + Pending Approvals */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4 border-t-2 border-t-destructive">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="size-4 text-destructive" />
                  <h2 className="text-sm font-semibold">SKU Performance Yếu</h2>
                  <Badge variant="destructive" className="ml-auto">{weakSkus.length}</Badge>
                </div>
                <div className="space-y-2">
                  {weakSkus.map(sku => (
                    <div key={sku.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{sku.name}</div>
                        <div className="text-xs text-muted-foreground">{sku.code}</div>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0 flex items-center gap-0.5">
                        <TrendingDown className="size-3.5" />{Math.abs(sku.trendPct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4 border-t-2 border-t-[hsl(var(--info))]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-[hsl(var(--info))]" />
                  <h2 className="text-sm font-semibold">Approval Chờ Xử Lý</h2>
                  <Badge variant="info" className="ml-auto">{pendingApprovals.length}</Badge>
                </div>
                <div className="space-y-2">
                  {pendingApprovals.map(req => (
                    <div key={req.id} className="flex items-start gap-2">
                      <Badge variant={req.type === "out" ? "warning" : "secondary"} className="uppercase shrink-0 mt-0.5">{req.type}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{req.skuName}</div>
                        <div className="text-xs text-muted-foreground truncate">{req.reason.slice(0, 50)}…</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 6: Recent SKU Activity ── */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">SKU cập nhật gần đây</h2>
              <Badge variant="secondary">{SKUS.length} SKU</Badge>
            </div>
            <div className="divide-y">
              {[...SKUS].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 6).map(sku => {
                const meta = STATUS_META[sku.status]
                const Icon = meta.icon
                return (
                  <div key={sku.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <Icon className={cn("size-4 shrink-0", meta.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{sku.name}</div>
                      <div className="text-xs text-muted-foreground">{sku.code} · {sku.brand}</div>
                    </div>
                    <Badge variant={sku.status === "active" ? "success" : sku.status === "suspended" ? "warning" : sku.status === "pending" ? "secondary" : "outline"} className="uppercase shrink-0">{meta.label}</Badge>
                    <div className="text-xs text-muted-foreground tabular-nums shrink-0">{new Date(sku.lastUpdated).toLocaleDateString("vi-VN")}</div>
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
