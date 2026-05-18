import { useRef, useState, useEffect, useCallback } from "react"
import {
  ArrowUp, ArrowDown, Minus, ChevronRight, X,
  AlertCircle, AlertTriangle, Activity, GripVertical,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Trend, Status, KPI, DrillRow } from "./types"

const SIDEBAR_WIDTH_KEY = "ops-drill-sidebar-width"
const SIDEBAR_MIN = 300
const SIDEBAR_MAX = 720
const SIDEBAR_DEFAULT = 380

// ─── Trend icon ───────────────────────────────────────────────────────────────
export function TIcon({ trend, className }: { trend?: Trend; className?: string }) {
  if (trend === "up")   return <ArrowUp   className={cn("size-3 shrink-0", className)} />
  if (trend === "down") return <ArrowDown className={cn("size-3 shrink-0", className)} />
  return <Minus className={cn("size-3 shrink-0", className)} />
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
export function trendCls(trend?: Trend, status?: Status): string {
  if (!trend || trend === "flat") return "text-muted-foreground"
  if (status === "good") return "text-[hsl(var(--success))]"
  if (status === "bad")  return "text-destructive"
  if (status === "warn") return "text-[hsl(var(--warning))]"
  return trend === "up" ? "text-[hsl(var(--success))]" : "text-destructive"
}

export function statusDot(s?: Status): string {
  if (s === "good") return "bg-[hsl(var(--success))]"
  if (s === "warn") return "bg-[hsl(var(--warning))]"
  if (s === "bad")  return "bg-destructive"
  return "bg-muted-foreground/30"
}

// ─── Drill sidebar content type ───────────────────────────────────────────────
export interface DrillContent {
  title: string
  value?: string
  status?: Status
  rows: DrillRow[]
  note?: string
  /** Optional extra sections shown below the main rows list */
  sections?: { label: string; rows: DrillRow[]; note?: string }[]
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
export function KpiCard({ kpi, onClick, active }: { kpi: KPI; onClick?: () => void; active?: boolean }) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30",
        active && "ring-2 ring-primary ring-offset-1",
        kpi.status === "bad"  && "border-destructive/40",
        kpi.status === "warn" && "border-[hsl(var(--warning))]/40",
        kpi.status === "good" && "border-[hsl(var(--success))]/25",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">{kpi.label}</p>
          {onClick && <ChevronRight className={cn("size-3 shrink-0 mt-0.5 transition-colors", active ? "text-primary" : "text-muted-foreground/40")} />}
        </div>
        <p className="text-2xl font-bold leading-none tabular-nums">{kpi.value}</p>
        {kpi.trendLabel && (
          <div className="flex items-center gap-1 mt-2">
            {kpi.trend && <TIcon trend={kpi.trend} className={trendCls(kpi.trend, kpi.status)} />}
            <span className={cn("text-[11px] font-medium", trendCls(kpi.trend, kpi.status))}>{kpi.trendLabel}</span>
          </div>
        )}
        {kpi.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
        {kpi.alert && (
          <p className={cn(
            "text-[11px] font-semibold mt-1.5",
            kpi.status === "bad"  ? "text-destructive" :
            kpi.status === "warn" ? "text-[hsl(var(--warning))]" : "text-muted-foreground",
          )}>{kpi.alert}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Drill sidebar (right slide-in panel, resizable) ─────────────────────────
export function DrillSidebar({
  content,
  onClose,
}: {
  content: DrillContent | null
  onClose: () => void
}) {
  const isOpen = content !== null

  // Restore saved width, clamp to valid range
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
      if (saved) {
        const n = parseInt(saved, 10)
        if (!isNaN(n)) return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, n))
      }
    } catch {}
    return SIDEBAR_DEFAULT
  })

  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = width
    document.body.style.cursor    = "ew-resize"
    document.body.style.userSelect = "none"
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      // Drag left = wider, drag right = narrower
      const delta  = startX.current - e.clientX
      const newW   = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta))
      setWidth(newW)
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor    = ""
      document.body.style.userSelect = ""
      // Persist after drag ends
      setWidth(w => {
        try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w)) } catch {}
        return w
      })
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup",   onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup",   onMouseUp)
    }
  }, [])

  // Clamp width to viewport on resize
  useEffect(() => {
    const clamp = () => {
      const maxVw = Math.floor(window.innerWidth * 0.92)
      setWidth(w => Math.min(w, maxVw))
    }
    window.addEventListener("resize", clamp)
    return () => window.removeEventListener("resize", clamp)
  }, [])

  const maxVw = typeof window !== "undefined" ? Math.floor(window.innerWidth * 0.92) : SIDEBAR_MAX
  const clampedWidth = Math.min(width, maxVw)

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-40 bg-background border-l shadow-xl",
          "flex flex-col transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        style={{ width: clampedWidth }}
      >
        {/* Drag handle — left edge of panel */}
        <div
          onMouseDown={onMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 z-50 cursor-ew-resize group",
            "flex items-center justify-center",
            "hover:bg-primary/20 active:bg-primary/30 transition-colors",
          )}
          title="Kéo để thay đổi kích thước"
        >
          <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-primary/60 pointer-events-none" />
        </div>

        {content && (
          <>
            {/* Header */}
            <div className={cn(
              "flex items-start gap-3 pl-4 pr-5 py-4 border-b shrink-0",
              content.status === "bad"  ? "bg-destructive/[0.04]" :
              content.status === "warn" ? "bg-[hsl(var(--warning-subtle))]" :
              content.status === "good" ? "bg-[hsl(var(--success-subtle))]/30" : "bg-muted/20",
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{content.title}</p>
                {content.value && (
                  <p className={cn(
                    "text-3xl font-bold tabular-nums mt-1 leading-none",
                    content.status === "bad"  ? "text-destructive" :
                    content.status === "warn" ? "text-[hsl(var(--warning))]" :
                    content.status === "good" ? "text-[hsl(var(--success))]" : "text-foreground",
                  )}>{content.value}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-muted/60 transition-colors shrink-0 mt-0.5"
                aria-label="Đóng"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
              <div className="pb-6">
                {/* Main rows */}
                <DrillRows rows={content.rows} note={content.note} />

                {/* Extra sections */}
                {content.sections?.map((s, i) => (
                  <div key={i} className="mt-4">
                    <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-y bg-muted/20">
                      {s.label}
                    </p>
                    <DrillRows rows={s.rows} note={s.note} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </>
  )
}

// Internal: shared row renderer used by sidebar
function DrillRows({ rows, note }: { rows: DrillRow[]; note?: string }) {
  return (
    <div className="divide-y">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn("size-1.5 rounded-full shrink-0", statusDot(r.status))} />
            <span className="text-xs text-foreground truncate">{r.label}</span>
          </div>
          <div className="text-right shrink-0">
            <p className={cn(
              "text-xs font-semibold tabular-nums",
              r.status === "bad"  ? "text-destructive" :
              r.status === "warn" ? "text-[hsl(var(--warning))]" :
              r.status === "good" ? "text-[hsl(var(--success))]" : "text-foreground",
            )}>{r.value}</p>
            {r.sub && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px] text-right">{r.sub}</p>}
          </div>
        </div>
      ))}
      {note && (
        <div className="px-5 py-3 bg-muted/30">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{note}</p>
        </div>
      )}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
export function Section({ icon: Icon, label, color, children }: {
  icon: React.ElementType
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("flex size-5 items-center justify-center rounded shrink-0", color)}>
          <Icon className="size-3 text-white" />
        </div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
export function MiniBar({
  value, max = 100, color = "bg-primary",
}: {
  value: number
  max?: number
  color?: string
}) {
  const pct = Math.min(100, (value / Math.max(max, 0.01)) * 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary">
      <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Alert row ────────────────────────────────────────────────────────────────
export function AlertRow({
  a,
}: {
  a: { level: "critical" | "warn" | "info"; msg: string; time: string; tag: string }
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border px-3 py-2.5",
      a.level === "critical" && "border-destructive/30 bg-destructive/[0.04]",
      a.level === "warn"     && "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning-subtle))]",
      a.level === "info"     && "border-border bg-muted/20",
    )}>
      {a.level === "critical" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 shrink-0">
          <AlertCircle className="size-2.5" />P0
        </span>
      )}
      {a.level === "warn" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))] text-[10px] font-bold px-1.5 py-0.5 shrink-0">
          <AlertTriangle className="size-2.5" />P1
        </span>
      )}
      {a.level === "info" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))] text-[10px] font-bold px-1.5 py-0.5 shrink-0">
          <Activity className="size-2.5" />P2
        </span>
      )}
      <span className="flex-1 text-xs font-medium">{a.msg}</span>
      <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:flex">{a.tag}</Badge>
      {a.time !== "–" && (
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{a.time}</span>
      )}
    </div>
  )
}
