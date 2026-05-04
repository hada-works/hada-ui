import { useState, useMemo } from "react"
import {
  Package, Search, ChevronRight,
  Tag, AlignLeft, Hash, Building2,
  Filter, X,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SKUS, PRODUCT_GROUPS } from "../mock-data"
import type { SkuStatus, Sku, ProductGroup } from "../mock-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)} tr`
  return n.toLocaleString("vi-VN")
}

const STATUS_META: Record<SkuStatus, { label: string; variant: "success" | "warning" | "outline" | "secondary" }> = {
  active:    { label: "Active",    variant: "success"   },
  suspended: { label: "Suspended", variant: "warning"   },
  closed:    { label: "Closed",    variant: "outline"   },
  pending:   { label: "Pending",   variant: "secondary" },
}

// ─── Group Tree (left panel) ──────────────────────────────────────────────────
function GroupTree({
  groups, selected, onSelect, depth = 0,
}: {
  groups: ProductGroup[]
  selected: string | null
  onSelect: (id: string | null) => void
  depth?: number
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(["g1", "g1-1"]))

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const rootGroups = groups.filter(g => g.level === depth + 1 && (depth === 0 ? !g.parentId : true))

  if (depth === 0) {
    // render root children
    const level1 = groups.filter(g => g.level === 1)
    return (
      <div className="space-y-0.5">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors",
            selected === null ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          <Package className="size-3.5 shrink-0" />
          Tất cả danh mục
        </button>
        {level1.map(g => <GroupNode key={g.id} group={g} groups={groups} selected={selected} onSelect={onSelect} open={open} toggle={toggle} />)}
      </div>
    )
  }
  return null
}

function GroupNode({
  group, groups, selected, onSelect, open, toggle,
}: {
  group: ProductGroup
  groups: ProductGroup[]
  selected: string | null
  onSelect: (id: string | null) => void
  open: Set<string>
  toggle: (id: string) => void
}) {
  const children = groups.filter(g => g.parentId === group.id)
  const hasChildren = children.length > 0
  const isOpen     = open.has(group.id)
  const isSelected = selected === group.id
  const indent     = (group.level - 1) * 12

  return (
    <div>
      <button
        onClick={() => { onSelect(group.id); if (hasChildren) toggle(group.id) }}
        className={cn(
          "w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors",
          isSelected ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {hasChildren ? (
          <ChevronRight className={cn("size-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
        ) : (
          <span className="size-3 shrink-0" />
        )}
        <span className="truncate flex-1">{group.name}</span>
        <span className={cn(
          "text-[9px] tabular-nums shrink-0 px-1 rounded",
          isSelected ? "bg-primary-foreground/20" : "bg-muted",
        )}>
          {group.skuCount}
        </span>
      </button>
      {hasChildren && isOpen && (
        <div>
          {children.map(c => (
            <GroupNode key={c.id} group={c} groups={groups} selected={selected} onSelect={onSelect} open={open} toggle={toggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SKU Detail Panel ─────────────────────────────────────────────────────────
function SkuDetail({ sku, onClose }: { sku: Sku; onClose: () => void }) {
  const { label, variant } = STATUS_META[sku.status]
  return (
    <div className="flex flex-col h-full border-l bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <h3 className="text-sm font-semibold flex-1 truncate">{sku.name}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-20 shrink-0">Mã SKU</span>
            <span className="font-mono font-semibold">{sku.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-20 shrink-0">Thương hiệu</span>
            <span className="font-medium">{sku.brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground w-20 shrink-0">Trạng thái</span>
            <Badge variant={variant} className="text-[9px] uppercase">{label}</Badge>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Danh mục</div>
          <div className="flex flex-wrap gap-1">
            {sku.groupPath.map((g, i) => (
              <span key={i} className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px]">{g}</Badge>
                {i < sku.groupPath.length - 1 && <ChevronRight className="size-2.5 text-muted-foreground" />}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Giá</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">Giá nhập</div>
              <div className="font-semibold">{fmtVnd(sku.unitCost)}</div>
            </div>
            <div className="rounded border bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">Giá bán lẻ</div>
              <div className="font-semibold">{fmtVnd(sku.retailPrice)}</div>
            </div>
            <div className="rounded border bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">Margin</div>
              <div className="font-semibold">{sku.marginPct}%</div>
            </div>
            <div className="rounded border bg-muted/30 px-3 py-2">
              <div className="text-[10px] text-muted-foreground">Đã bán 30d</div>
              <div className="font-semibold">{sku.unitsSold30d.toLocaleString()} đvt</div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Hiệu quả</div>
          <div className="rounded border bg-muted/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Revenue 30d</span>
              <span className="font-semibold text-[hsl(var(--success))]">{fmtVnd(sku.revenue30d)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Xu hướng</span>
              <span className={cn("font-semibold", sku.trendPct >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
                {sku.trendPct > 0 ? "+" : ""}{sku.trendPct}%
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Lịch sử</div>
          <div className="flex items-center gap-2">
            <AlignLeft className="size-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Ngày vào:</span>
            <span>{new Date(sku.inDate).toLocaleDateString("vi-VN")}</span>
          </div>
          {sku.outDate && (
            <div className="flex items-center gap-2">
              <AlignLeft className="size-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Ngày đóng:</span>
              <span className="text-destructive">{new Date(sku.outDate).toLocaleDateString("vi-VN")}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <AlignLeft className="size-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Cập nhật:</span>
            <span>{new Date(sku.lastUpdated).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProductsAssortmentsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedSku, setSelectedSku]     = useState<Sku | null>(null)
  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState<SkuStatus | "all">("all")

  const filteredSkus = useMemo(() => {
    let skus = SKUS
    if (selectedGroup) {
      const g = PRODUCT_GROUPS.find(x => x.id === selectedGroup)
      if (g) skus = skus.filter(s => s.groupPath.includes(g.name))
    }
    if (statusFilter !== "all") skus = skus.filter(s => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      skus = skus.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q),
      )
    }
    return skus
  }, [selectedGroup, statusFilter, search])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Assortments"
        description="Quản lý thông tin chi tiết & danh mục sản phẩm"
      />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Category Tree ── */}
        <div className="w-56 shrink-0 border-r bg-muted/20 overflow-auto">
          <div className="px-3 py-3 border-b">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Danh mục sản phẩm</div>
            <GroupTree groups={PRODUCT_GROUPS} selected={selectedGroup} onSelect={setSelectedGroup} />
          </div>
        </div>

        {/* ── Center: SKU List ── */}
        <div className={cn("flex flex-col flex-1 overflow-hidden", selectedSku ? "border-r" : "")}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm SKU, mã, thương hiệu…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border/50 rounded focus:outline-none focus:border-primary focus:bg-background transition-all"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="size-3.5 text-muted-foreground" />
              {(["all", "active", "suspended", "pending", "closed"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-medium rounded transition-colors capitalize",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {s === "all" ? "All" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/10 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0">
            <div className="flex-1">Sản phẩm</div>
            <div className="w-20 text-right shrink-0">Revenue 30d</div>
            <div className="w-16 text-right shrink-0">Margin</div>
            <div className="w-20 text-right shrink-0">Trạng thái</div>
          </div>

          {/* SKU rows */}
          <div className="flex-1 overflow-auto divide-y">
            {filteredSkus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Không tìm thấy SKU phù hợp</p>
              </div>
            ) : (
              filteredSkus.map(sku => {
                const { label, variant } = STATUS_META[sku.status]
                return (
                  <button
                    key={sku.id}
                    onClick={() => setSelectedSku(prev => prev?.id === sku.id ? null : sku)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors",
                      selectedSku?.id === sku.id && "bg-muted/40 border-l-2 border-l-primary",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{sku.name}</div>
                      <div className="text-[11px] text-muted-foreground">{sku.code} · {sku.brand}</div>
                    </div>
                    <div className="text-xs font-semibold text-[hsl(var(--success))] tabular-nums w-20 text-right shrink-0">
                      {fmtVnd(sku.revenue30d)}
                    </div>
                    <div className="text-xs font-semibold tabular-nums w-16 text-right shrink-0">
                      {sku.marginPct}%
                    </div>
                    <div className="w-20 text-right shrink-0">
                      <Badge variant={variant} className="text-[9px] uppercase">{label}</Badge>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer count */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 text-[11px] text-muted-foreground shrink-0">
            <span>{filteredSkus.length} SKU</span>
            {selectedSku && (
              <button onClick={() => setSelectedSku(null)} className="text-primary hover:underline">
                Đóng chi tiết
              </button>
            )}
          </div>
        </div>

        {/* ── Right: SKU Detail ── */}
        {selectedSku && (
          <div className="w-72 shrink-0 overflow-hidden">
            <SkuDetail sku={selectedSku} onClose={() => setSelectedSku(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
