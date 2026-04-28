import { useRef, useCallback } from "react"
import { ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BulkItem } from "@/types"
import { COLS, fmt, fmtN, fmtPct } from "./bulk-buy.constants"
import { ApprovalStepBar } from "./ApprovalStepBar"

// ─── Cell renderer ────────────────────────────────────────────────────────────

function cellValue(item: BulkItem, key: string): React.ReactNode {
  switch (key) {
    case "sku":                     return <span className="font-mono text-[10px] text-muted-foreground">{item.sku}</span>
    case "productName":             return <span className="font-medium text-xs truncate block">{item.productName}</span>
    case "supplier":                return <span className="text-xs text-muted-foreground">{item.supplier}</span>
    case "qtyOrdered":              return <span className="text-xs font-medium">{fmtN(item.qtyOrdered)}</span>
    case "orderValue":              return <span className="text-xs font-semibold text-primary">{fmt(item.orderValue)}</span>
    case "expectedArrival":         return <span className="text-xs">{item.expectedArrival}</span>
    case "stockDC":                 return <span className="text-xs">{fmtN(item.stockDC)}</span>
    case "stockTotal":              return <span className="text-xs">{fmtN(item.stockTotal)}</span>
    case "dealStart":               return <span className="text-xs">{item.dealStart}</span>
    case "dealEnd":                 return <span className="text-xs">{item.dealEnd}</span>
    case "projectedDailySales":     return <span className="text-xs font-medium text-primary">{fmtN(item.projectedDailySales)}</span>
    case "promotion":               return <span className="text-[11px] text-muted-foreground truncate block">{item.promotion}</span>
    case "avgSales28d":             return <span className="text-xs">{fmtN(item.avgSales28d)}</span>
    case "avgSalesNonPromo":        return <span className="text-xs">{fmtN(item.avgSalesNonPromo)}</span>
    case "daysStockDC":             return <span className={cn("text-xs font-medium", item.daysStockDC < 10 && "text-destructive")}>{item.daysStockDC}d</span>
    case "daysStockTotal":          return <span className="text-xs">{item.daysStockTotal}d</span>
    case "projectedStockAtArrival": return <span className="text-xs">{fmtN(item.projectedStockAtArrival)}</span>
    case "salesFcVsActualDiff":     return <span className={cn("text-xs font-medium", item.salesFcVsActualDiff > 30 && "text-[hsl(var(--warning))]")}>{fmtPct(item.salesFcVsActualDiff)}</span>
    case "projectedSellingDays":    return <span className="text-xs">{item.projectedSellingDays}d</span>
    case "projectedDCDaysPostDeal": return <span className={cn("text-xs font-medium", item.projectedDCDaysPostDeal > 30 && "text-destructive")}>{item.projectedDCDaysPostDeal}d</span>
    case "totalDaysPostPromo":      return <span className={cn("text-xs", item.totalDaysPostPromo > 45 && "text-[hsl(var(--warning))]")}>{item.totalDaysPostPromo}d</span>
    case "scmDeadline":             return <span className="text-xs font-medium text-destructive/80">{item.scmDeadline}</span>
    case "steps":                   return <ApprovalStepBar steps={item.steps} parallel={item.parallel} />
    default:                        return null
  }
}

// ─── Pre-compute sticky column offsets ───────────────────────────────────────

const CHECKBOX_W = 40

function computeStickyOffsets(): Record<string, number> {
  const offsets: Record<string, number> = {}
  let acc = CHECKBOX_W
  COLS.forEach(col => {
    if (col.sticky) { offsets[col.key] = acc; acc += col.width }
  })
  return offsets
}

const STICKY_OFFSETS = computeStickyOffsets()
const TOTAL_MIN_W    = COLS.reduce((s, c) => s + c.width, CHECKBOX_W)

// ─── Component ────────────────────────────────────────────────────────────────

interface BulkItemTableProps {
  items:       BulkItem[]
  selectedId:  string | null
  selectedIds: Set<string>
  allChecked:  boolean
  canCheck:    (item: BulkItem) => boolean
  onSelect:    (id: string) => void
  onToggle:    (id: string, e: React.MouseEvent) => void
  onToggleAll: () => void
}

export function BulkItemTable({
  items, selectedId, selectedIds, allChecked,
  canCheck, onSelect, onToggle, onToggleAll,
}: BulkItemTableProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const rowsScrollRef   = useRef<HTMLDivElement>(null)

  const onRowsScroll = useCallback(() => {
    if (headerScrollRef.current && rowsScrollRef.current)
      headerScrollRef.current.scrollLeft = rowsScrollRef.current.scrollLeft
  }, [])

  return (
    <>
      {/* Frozen header — scrollLeft synced from rows */}
      <div ref={headerScrollRef} className="shrink-0 overflow-hidden border-b bg-muted">
        <div className="flex relative" style={{ minWidth: TOTAL_MIN_W + "px" }}>
          {/* Checkbox col — sticky */}
          <div className="shrink-0 w-10 flex items-center justify-center py-2 border-r border-border bg-muted sticky left-0 z-20">
            <input
              type="checkbox"
              className="size-3.5 accent-primary cursor-pointer rounded"
              checked={allChecked}
              onChange={onToggleAll}
            />
          </div>
          {COLS.map(col => (
            <div
              key={col.key}
              className={cn(
                "shrink-0 py-2 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border last:border-r-0 leading-tight bg-muted",
                col.sticky && "sticky z-10",
              )}
              style={{
                width: col.width,
                textAlign: col.align ?? "left",
                ...(col.sticky ? { left: STICKY_OFFSETS[col.key] } : {}),
              }}
            >
              {col.label}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable rows */}
      <div ref={rowsScrollRef} className="flex-1 overflow-auto" onScroll={onRowsScroll}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <ShoppingCart className="size-8 opacity-30" />
            <p className="text-xs">Không có đơn hàng</p>
          </div>
        ) : items.map(item => {
          const isActive  = selectedId === item.id
          const isChecked = selectedIds.has(item.id)
          const checkable = canCheck(item)
          const rowBg = isActive ? "hsl(var(--accent))" : "hsl(var(--background))"

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex border-b cursor-pointer transition-colors group/row",
                isActive ? "bg-accent" : "hover:bg-accent/40",
              )}
              style={{ minWidth: TOTAL_MIN_W + "px" }}
            >
              {/* Checkbox — sticky */}
              <div
                className="shrink-0 w-10 flex items-center justify-center border-r border-border/50 sticky left-0 z-10 transition-colors"
                style={{ background: rowBg }}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary cursor-pointer rounded disabled:opacity-30"
                  checked={isChecked}
                  disabled={!checkable}
                  onChange={() => {}}
                  onClick={e => checkable && onToggle(item.id, e)}
                />
              </div>

              {COLS.map(col => (
                <div
                  key={col.key}
                  className={cn(
                    "shrink-0 py-2 px-2 flex items-center border-r border-border/30 last:border-r-0 overflow-hidden transition-colors",
                    col.sticky && "sticky z-10",
                    col.key === "productName" && "border-r border-border/50",
                  )}
                  style={{
                    width: col.width,
                    justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                    ...(col.sticky ? { left: STICKY_OFFSETS[col.key], background: rowBg } : {}),
                  }}
                >
                  {cellValue(item, col.key)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
