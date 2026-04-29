import { useState, useRef, useCallback, useEffect } from "react"
import { ShoppingCart, CheckCircle2, XCircle } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { BulkItem, RoleKey, StepStatus, ApprovalStep } from "@/types"
import { MOCK_ITEMS } from "@/store/mock-data"
import {
  deriveOverall, MONTH_FILTERS, STATUS_FILTERS,
  CURRENT_NAME, CURRENT_ROLE, mkDefaultItem, fmt,
} from "./bulk-buy/bulk-buy.constants"
import { BulkItemTable } from "./bulk-buy/BulkItemTable"
import { DetailPanel }   from "./bulk-buy/DetailPanel"
import { PasteModal }    from "./bulk-buy/PasteModal"

// ─── Main page ────────────────────────────────────────────────────────────────

export function BulkBuyApproval() {
  const [items,        setItems]        = useState<BulkItem[]>(MOCK_ITEMS)
  const [selectedId,   setSelectedId]   = useState<string | null>(MOCK_ITEMS[0].id)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter,  setMonthFilter]  = useState("2026-04")
  const [showPaste,    setShowPaste]    = useState(false)

  // ── Resizable splitter ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftPct, setLeftPct] = useState(62)
  const isDragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor     = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setLeftPct(Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100)))
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor     = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────
  const monthFiltered = items.filter(i =>
    monthFilter === "all" || i.requestedAt.startsWith(monthFilter)
  )
  const filtered = monthFiltered.filter(i =>
    statusFilter === "all" || deriveOverall(i) === statusFilter
  )
  const selected = items.find(i => i.id === selectedId) ?? null
  const approvedThisMonth = monthFiltered
    .filter(i => deriveOverall(i) === "approved")
    .reduce((s, i) => s + i.orderValue, 0)

  // ── Bulk selection ────────────────────────────────────────────────────────
  const canCheck = (i: BulkItem) => {
    const o = deriveOverall(i)
    return o === "pending_mdm" || o === "parallel" || o === "info_needed"
  }
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const checkableInView = filtered.filter(canCheck)
  const allChecked      = checkableInView.length > 0 && checkableInView.every(i => selectedIds.has(i.id))
  const toggleAll       = () => setSelectedIds(allChecked ? new Set() : new Set(checkableInView.map(i => i.id)))

  // ── Step handlers ─────────────────────────────────────────────────────────
  const handleStepAction = (
    id: string, role: RoleKey,
    type: "approve" | "reject" | "info",
    reasonGroup: string, note: string,
  ) => {
    const statusMap: Record<typeof type, StepStatus> = {
      approve: "approved", reject: "rejected", info: "info_needed",
    }
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const steps = [...item.steps] as [ApprovalStep, ApprovalStep]
      const idx = role === "MDM" ? 0 : 1
      steps[idx] = {
        ...steps[idx],
        status:      statusMap[type],
        reasonGroup: reasonGroup || undefined,
        note:        note        || undefined,
        approvedBy:  CURRENT_NAME,
        approvedAt:  new Date().toISOString().slice(0, 10),
      }
      return { ...item, steps }
    }))
  }

  const handleStepReset = (id: string, role: RoleKey) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const steps = [...item.steps] as [ApprovalStep, ApprovalStep]
      steps[role === "MDM" ? 0 : 1] = { role, status: "pending" }
      if (role === "MDM" && !item.parallel) steps[1] = { role: "SCM", status: "pending" }
      return { ...item, steps }
    }))
  }

  const handleComment = (id: string, text: string) => {
    setItems(prev => prev.map(item => item.id !== id ? item : {
      ...item,
      comments: [...item.comments, {
        id:     `c${Date.now()}`,
        author: CURRENT_NAME,
        role:   CURRENT_ROLE,
        text,
        time:   new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }),
      }],
    }))
  }

  // ── Bulk approve / reject ─────────────────────────────────────────────────
  const bulkApprove = () => {
    Array.from(selectedIds).forEach(id => handleStepAction(id, "MDM", "approve", "Đủ điều kiện — chuẩn quy trình", ""))
    setSelectedIds(new Set())
  }
  const bulkReject = () => {
    Array.from(selectedIds).forEach(id => handleStepAction(id, "MDM", "reject", "Lý do khác", "Bulk reject"))
    setSelectedIds(new Set())
  }

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = (rows: Partial<BulkItem>[]) => {
    const newItems = rows.map((r, i) => mkDefaultItem(r, i))
    setItems(prev => [...newItems, ...prev])
    if (newItems.length > 0) setSelectedId(newItems[0].id)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Bulkbuy approval"
        description="Phê duyệt đơn mua hàng lô / gói — MDM → SCM"
        action={{ label: "Paste hàng loạt", onClick: () => setShowPaste(true) }}
      />

      {/* ── Toolbar ── */}
      <div className="shrink-0 border-b bg-background flex items-center">
        <div className="flex items-center gap-1 overflow-x-auto shrink min-w-0 px-4">
          {STATUS_FILTERS.map(f => {
            const count = f.value === "all"
              ? monthFiltered.length
              : monthFiltered.filter(i => deriveOverall(i) === f.value).length
            const isActive = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="shrink-0 flex items-center gap-3 px-4 py-1.5 border-l ml-auto">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tổng duyệt: <strong className="text-[hsl(var(--success))] font-semibold">{fmt(approvedThisMonth)}</strong>
          </span>

          {selectedIds.size > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-primary font-medium">{selectedIds.size} dòng</span>
              <Button size="sm" className="h-6 text-xs px-2 gap-1" onClick={bulkApprove}>
                <CheckCircle2 className="size-3" />MDM Duyệt
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs px-2 gap-1 text-destructive border-destructive/30" onClick={bulkReject}>
                <XCircle className="size-3" />Từ chối
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Two-column resizable layout ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        <div className="flex flex-col overflow-hidden border-r" style={{ width: `${leftPct}%` }}>
          <BulkItemTable
            items={filtered}
            selectedId={selectedId}
            selectedIds={selectedIds}
            allChecked={allChecked}
            canCheck={canCheck}
            onSelect={setSelectedId}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
          />
        </div>

        <div
          onMouseDown={onMouseDown}
          className="w-1 shrink-0 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative group"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
        </div>

        <div className="flex-1 overflow-hidden bg-background min-w-[300px]">
          {selected ? (
            <DetailPanel
              key={selected.id}
              item={selected}
              onStepAction={handleStepAction}
              onStepReset={handleStepReset}
              onComment={handleComment}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <ShoppingCart className="size-10 opacity-20" />
              <p className="text-sm">Chọn một dòng để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {showPaste && <PasteModal onClose={() => setShowPaste(false)} onImport={handleImport} />}
    </div>
  )
}
