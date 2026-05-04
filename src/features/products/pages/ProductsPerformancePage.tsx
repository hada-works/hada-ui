import { useState, useMemo } from "react"
import {
  ChevronRight, TrendingUp, TrendingDown,
  Package, BarChart3, ArrowLeft, Search,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PRODUCT_GROUPS, SKUS } from "../mock-data"
import type { ProductGroup, Sku } from "../mock-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)} tr`
  return n.toLocaleString("vi-VN")
}

// ─── Group Row Card ───────────────────────────────────────────────────────────
function GroupRow({
  group, onClick, depth,
}: { group: ProductGroup; onClick: () => void; depth: number }) {
  const isPositive = group.trendPct >= 0
  const levelColor = [
    "border-l-primary", "border-l-[hsl(var(--info))]",
    "border-l-[hsl(var(--success))]", "border-l-[hsl(var(--warning))]",
    "border-l-muted-foreground", "border-l-destructive",
  ][depth % 6]

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 border-b border-border/40",
        "hover:bg-muted/30 transition-colors text-left group border-l-2",
        levelColor,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold truncate">{group.name}</span>
          <Badge variant="outline" className="text-[9px] font-bold shrink-0">L{group.level}</Badge>
        </div>
        <div className="text-[11px] text-muted-foreground">{group.skuCount} SKUs</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-semibold text-[hsl(var(--success))]">{fmtVnd(group.revenue30d)}</div>
        <div className={cn(
          "flex items-center justify-end gap-0.5 text-[11px] font-semibold",
          isPositive ? "text-[hsl(var(--success))]" : "text-destructive",
        )}>
          {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(group.trendPct)}%
        </div>
      </div>
      <div className="text-right shrink-0 w-14">
        <div className="text-xs font-semibold">{group.marginPct}%</div>
        <div className="text-[11px] text-muted-foreground">margin</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}

// ─── SKU Row ──────────────────────────────────────────────────────────────────
function SkuRow({ sku }: { sku: Sku }) {
  const isPositive = sku.trendPct >= 0
  const statusColor = {
    active: "text-[hsl(var(--success))]", suspended: "text-[hsl(var(--warning))]",
    closed: "text-muted-foreground", pending: "text-[hsl(var(--info))]",
  }[sku.status]
  const statusVariant = {
    active: "success" as const, suspended: "warning" as const,
    closed: "outline" as const, pending: "secondary" as const,
  }[sku.status]

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{sku.name}</span>
          <Badge variant={statusVariant} className="text-[9px] uppercase shrink-0">{sku.status}</Badge>
        </div>
        <div className="text-[11px] text-muted-foreground">{sku.code} · {sku.brand}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn("text-xs font-semibold", statusColor)}>{fmtVnd(sku.revenue30d)}</div>
        <div className={cn(
          "flex items-center justify-end gap-0.5 text-[11px] font-semibold",
          isPositive ? "text-[hsl(var(--success))]" : "text-destructive",
        )}>
          {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(sku.trendPct)}%
        </div>
      </div>
      <div className="text-right shrink-0 w-14">
        <div className="text-xs font-semibold">{sku.marginPct}%</div>
        <div className="text-[11px] text-muted-foreground">margin</div>
      </div>
    </div>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumbs({
  trail, onNavigate,
}: { trail: ProductGroup[]; onNavigate: (idx: number) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap py-3 px-4 border-b bg-muted/20">
      <button
        onClick={() => onNavigate(-1)}
        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        Products
      </button>
      {trail.map((g, i) => (
        <span key={g.id} className="flex items-center gap-1">
          <ChevronRight className="size-3 text-muted-foreground" />
          <button
            onClick={() => onNavigate(i)}
            className={cn(
              "text-[11px] hover:text-foreground transition-colors",
              i === trail.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {g.name}
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProductsPerformancePage() {
  const [trail, setTrail] = useState<ProductGroup[]>([])
  const [search, setSearch] = useState("")

  const currentId = trail.length > 0 ? trail[trail.length - 1].id : null

  const children = useMemo(
    () => PRODUCT_GROUPS.filter(g => g.parentId === currentId),
    [currentId],
  )

  const leafSkus = useMemo(() => {
    if (children.length > 0) return [] // still has sub-groups
    if (currentId === null) return []
    const currentGroup = PRODUCT_GROUPS.find(g => g.id === currentId)
    if (!currentGroup) return []
    return SKUS.filter(s => s.groupPath.includes(currentGroup.name))
  }, [children, currentId])

  const filteredSkus = useMemo(() => {
    if (!search.trim()) return leafSkus
    const q = search.toLowerCase()
    return leafSkus.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q)
    )
  }, [leafSkus, search])

  const allSkusSearch = useMemo(() => {
    if (!search.trim() || currentId !== null) return []
    const q = search.toLowerCase()
    return SKUS.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q)
    )
  }, [search, currentId])

  function drillInto(group: ProductGroup) {
    setTrail(prev => [...prev, group])
    setSearch("")
  }

  function navigateTo(idx: number) {
    if (idx < 0) { setTrail([]); setSearch(""); return }
    setTrail(prev => prev.slice(0, idx + 1))
    setSearch("")
  }

  const currentGroup = trail.length > 0 ? trail[trail.length - 1] : null

  // Summary stats for current level
  const summaryRevenue = currentGroup?.revenue30d ?? PRODUCT_GROUPS.filter(g => g.level === 1).reduce((s, g) => s + g.revenue30d, 0)
  const summarySkus    = currentGroup?.skuCount   ?? PRODUCT_GROUPS.filter(g => g.level === 1).reduce((s, g) => s + g.skuCount, 0)
  const summaryMargin  = currentGroup?.marginPct  ?? parseFloat((PRODUCT_GROUPS.filter(g => g.level === 1).reduce((s, g) => s + g.marginPct, 0) / PRODUCT_GROUPS.filter(g => g.level === 1).length).toFixed(1))
  const summaryTrend   = currentGroup?.trendPct   ?? parseFloat((PRODUCT_GROUPS.filter(g => g.level === 1).reduce((s, g) => s + g.trendPct, 0) / PRODUCT_GROUPS.filter(g => g.level === 1).length).toFixed(1))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Products Performance"
        description="Phân tích hiệu quả kinh doanh theo nhóm sản phẩm (6 cấp)"
      />

      <div className="flex-1 overflow-auto">
        {/* ── KPI Bar ── */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Revenue 30d", value: fmtVnd(summaryRevenue), icon: BarChart3, color: "text-[hsl(var(--success))]" },
              { label: "SKU Count",   value: summarySkus,              icon: Package,  color: "text-primary" },
              { label: "Avg Margin",  value: `${summaryMargin}%`,      icon: BarChart3, color: "text-[hsl(var(--info))]" },
              {
                label: "Trend vs 30d",
                value: `${summaryTrend > 0 ? "+" : ""}${summaryTrend}%`,
                icon: summaryTrend >= 0 ? TrendingUp : TrendingDown,
                color: summaryTrend >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg border bg-card px-3 py-2.5 flex items-center gap-2">
                <Icon className={cn("size-4 shrink-0", color)} />
                <div>
                  <div className={cn("text-sm font-bold", color)}>{value}</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Breadcrumb ── */}
        {trail.length > 0 && (
          <Breadcrumbs trail={trail} onNavigate={navigateTo} />
        )}

        {/* ── Back button (if drilled in) ── */}
        {trail.length > 0 && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <button
              onClick={() => navigateTo(trail.length - 2)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại
            </button>
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={leafSkus.length > 0 ? "Tìm SKU…" : "Tìm nhóm sản phẩm…"}
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>
        </div>

        {/* ── Group List ── */}
        {children.length > 0 && (
          <div className="mx-4 rounded-lg border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nhóm sản phẩm · Level {(currentGroup?.level ?? 0) + 1}
              </h3>
              <Badge variant="secondary" className="text-[10px]">{children.length} nhóm</Badge>
            </div>
            {children
              .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))
              .map(g => (
                <GroupRow key={g.id} group={g} onClick={() => drillInto(g)} depth={g.level - 1} />
              ))}
          </div>
        )}

        {/* ── SKU List (leaf level) ── */}
        {(filteredSkus.length > 0 || allSkusSearch.length > 0) && (
          <div className="mx-4 mt-4 rounded-lg border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Danh sách SKU
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                {(filteredSkus.length || allSkusSearch.length)} SKU
              </Badge>
            </div>
            {/* table header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/10 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              <div className="flex-1">Sản phẩm</div>
              <div className="w-20 text-right">Revenue 30d</div>
              <div className="w-14 text-right">Margin</div>
            </div>
            {(filteredSkus.length > 0 ? filteredSkus : allSkusSearch).map(sku => (
              <SkuRow key={sku.id} sku={sku} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {children.length === 0 && leafSkus.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Không có dữ liệu cho nhóm này</p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}
