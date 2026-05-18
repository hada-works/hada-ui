import { ShoppingBag, Users, AlertOctagon, CheckSquare, MessageSquare, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Status } from "../shared/types"
import { fmtVnd, fmt } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { Section, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

// ─── Section 1: Daily Revenue ─────────────────────────────────────────────────
function RevenueSection({ d, onDrill, activeDrill }: Props) {
  const attainmentPct = d.storeDailyTarget > 0
    ? (d.storeDailyActual / d.storeDailyTarget) * 100
    : 0

  const status: Status =
    attainmentPct >= 100 ? "good" :
    attainmentPct >= 90  ? "warn" : "bad"

  const statusCls =
    status === "good" ? "text-[hsl(var(--success))]" :
    status === "warn" ? "text-[hsl(var(--warning))]" :
    "text-destructive"

  const hourlyWithData = d.hourlyRevenue.filter(h => h.actual > 0)
  const maxActual = hourlyWithData.length > 0
    ? Math.max(...hourlyWithData.map(h => h.actual))
    : 1

  const highestHour = hourlyWithData.length > 0
    ? hourlyWithData.reduce((best, h) => h.actual > best.actual ? h : best, hourlyWithData[0])
    : null

  const drillContent: DrillContent = {
    title: "Doanh thu hôm nay",
    value: fmtVnd(d.storeDailyActual),
    status,
    rows: [
      { label: "Doanh thu thực tế",  value: fmtVnd(d.storeDailyActual),                  status },
      { label: "Mục tiêu hôm nay",   value: fmtVnd(d.storeDailyTarget),                  status: "neutral" },
      { label: "Tỷ lệ hoàn thành",   value: `${attainmentPct.toFixed(1)}%`,               status },
      ...(highestHour
        ? [{ label: "Giờ doanh thu cao nhất", value: `${highestHour.hour}h — ${fmtVnd(highestHour.actual)}`, status: "good" as Status }]
        : []),
    ],
  }

  const isActive = activeDrill === "Doanh thu hôm nay"

  return (
    <Section icon={TrendingUp} label="Doanh thu hôm nay" color="bg-[hsl(var(--epic-emerald))]">
      <Card
        onClick={() => onDrill(drillContent)}
        className={cn(
          "overflow-hidden cursor-pointer transition-colors hover:bg-muted/30",
          isActive && "ring-2 ring-primary ring-offset-1",
          status === "good" && "border-[hsl(var(--success))]/25",
          status === "warn" && "border-[hsl(var(--warning))]/40",
          status === "bad"  && "border-destructive/40",
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Big KPI */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Thực tế hôm nay</p>
              <p className="text-3xl font-bold tabular-nums leading-none">{fmtVnd(d.storeDailyActual)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mục tiêu: <span className="font-medium text-foreground">{fmtVnd(d.storeDailyTarget)}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-2xl font-bold tabular-nums", statusCls)}>
                {attainmentPct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground">hoàn thành</p>
            </div>
          </div>

          {/* Hourly bar chart */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Doanh thu theo giờ
            </p>
            {hourlyWithData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Không có dữ liệu giờ</p>
            ) : (
              <div className="space-y-1.5">
                {hourlyWithData.map(h => {
                  const barPct = (h.actual / maxActual) * 100
                  const isOnTarget = h.actual >= h.target
                  return (
                    <div key={h.hour} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums w-6 shrink-0 text-right">
                        {h.hour}h
                      </span>
                      <div className="relative flex-1 h-4">
                        {/* Actual bar */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 h-full rounded-sm transition-all",
                            isOnTarget ? "bg-[hsl(var(--success))]/70" : "bg-amber-400/70",
                          )}
                          style={{ width: `${barPct}%` }}
                        />
                        {/* Target marker — thin gray vertical line */}
                        {h.target > 0 && maxActual > 0 && (
                          <div
                            className="absolute top-0 h-full w-[2px] bg-muted-foreground/30 rounded-full"
                            style={{ left: `${Math.min(100, (h.target / maxActual) * 100)}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground w-16 shrink-0 text-right">
                        {fmtVnd(h.actual)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ─── Section 2: Staffing ──────────────────────────────────────────────────────
function StaffingSection({ d, onDrill, activeDrill }: Props) {
  const isFullyStaffed = d.staffOnFloor >= d.staffScheduled
  const missing = d.staffScheduled - d.staffOnFloor
  const status: Status = isFullyStaffed ? "good" : "warn"

  const drillContent: DrillContent = {
    title: "Nhân sự ca này",
    value: `${d.staffOnFloor}/${d.staffScheduled}`,
    status,
    rows: [
      { label: "Nhân viên đang có mặt",   value: String(d.staffOnFloor),    status },
      { label: "Nhân viên theo lịch",     value: String(d.staffScheduled),  status: "neutral" },
      { label: "Trạng thái",
        value: isFullyStaffed ? "Đủ nhân sự" : `Thiếu ${missing} người`,
        status },
    ],
  }

  const isActive = activeDrill === "Nhân sự ca này"

  return (
    <Section icon={Users} label="Nhân sự ca này" color="bg-[hsl(var(--epic-blue))]">
      <Card
        onClick={() => onDrill(drillContent)}
        className={cn(
          "overflow-hidden cursor-pointer transition-colors hover:bg-muted/30",
          isActive && "ring-2 ring-primary ring-offset-1",
          status === "good" && "border-[hsl(var(--success))]/25",
          status === "warn" && "border-[hsl(var(--warning))]/40",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Nhân viên trên sàn</p>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {d.staffOnFloor}
                <span className="text-lg text-muted-foreground font-normal">/{d.staffScheduled}</span>
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                isFullyStaffed
                  ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                  : "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]",
              )}>
                {isFullyStaffed ? "Đủ nhân sự" : `Thiếu ${missing} người`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

// ─── Section 3: Low Stock Alerts ──────────────────────────────────────────────
function LowStockSection({ d, onDrill, activeDrill }: Props) {
  const sorted = [...d.lowStockAlerts].sort((a, b) =>
    a.urgency === "critical" && b.urgency !== "critical" ? -1 :
    b.urgency === "critical" && a.urgency !== "critical" ? 1 : 0
  )

  const makeSkuDrill = (sku: { sku: string; currentQty: number; minQty: number; urgency: "critical" | "warn" }): DrillContent => ({
    title: `Hàng tồn: ${sku.sku}`,
    value: `${sku.currentQty} / ${sku.minQty} tối thiểu`,
    status: sku.urgency === "critical" ? "bad" : "warn",
    rows: [
      { label: "SKU",                value: sku.sku,                        status: "neutral" },
      { label: "Số lượng hiện tại",  value: String(sku.currentQty),         status: sku.urgency === "critical" ? "bad" : "warn" },
      { label: "Mức tối thiểu",      value: String(sku.minQty),             status: "neutral" },
      { label: "Mức độ khẩn cấp",    value: sku.urgency === "critical" ? "Khẩn cấp" : "Cảnh báo", status: sku.urgency === "critical" ? "bad" : "warn" },
    ],
  })

  if (sorted.length === 0) {
    return (
      <Section icon={AlertOctagon} label="Cảnh báo hàng tồn" color="bg-destructive">
        <Card className="border-[hsl(var(--success))]/25">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[hsl(var(--success))]">Không có cảnh báo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tất cả SKU đều ổn định</p>
          </CardContent>
        </Card>
      </Section>
    )
  }

  return (
    <Section icon={AlertOctagon} label="Cảnh báo hàng tồn" color="bg-destructive">
      <div className="space-y-2">
        {sorted.map((alert, i) => {
          const isCritical = alert.urgency === "critical"
          const drillKey = `stock-${alert.sku}`
          const isActive = activeDrill === drillKey
          return (
            <Card
              key={i}
              onClick={() => onDrill(makeSkuDrill(alert))}
              className={cn(
                "overflow-hidden cursor-pointer transition-colors hover:bg-muted/30",
                isActive && "ring-2 ring-primary ring-offset-1",
                isCritical ? "border-destructive/40" : "border-[hsl(var(--warning))]/40",
              )}
            >
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{alert.sku}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {alert.currentQty} / {alert.minQty} tối thiểu
                    </p>
                  </div>
                  <span className={cn(
                    "inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    isCritical
                      ? "bg-destructive/15 text-destructive"
                      : "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]",
                  )}>
                    {isCritical ? "Khẩn cấp" : "Cảnh báo"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Section 4: Task Checklist ────────────────────────────────────────────────
function TaskSection({ d, onDrill, activeDrill }: Props) {
  const total = d.taskChecklist.length
  const done  = d.taskChecklist.filter(t => t.status === "done").length
  const hasOverdue = d.taskChecklist.some(t => t.status === "overdue")

  const status: Status = total === 0 ? "neutral" : hasOverdue ? "bad" : done === total ? "good" : "warn"

  const drillContent: DrillContent = {
    title: "Task Checklist",
    value: `${done}/${total} xong`,
    status,
    rows: d.taskChecklist.map(t => ({
      label: `${t.task} (${t.owner})`,
      value: t.status === "done" ? "Xong" : t.status === "overdue" ? "Quá hạn" : "Chờ",
      status: (t.status === "done" ? "good" : t.status === "overdue" ? "bad" : "warn") as Status,
    })),
  }

  const isActive = activeDrill === "Task Checklist"

  return (
    <Section icon={CheckSquare} label="Task checklist hôm nay" color="bg-[hsl(var(--epic-violet))]">
      <Card
        onClick={() => onDrill(drillContent)}
        className={cn(
          "overflow-hidden cursor-pointer transition-colors hover:bg-muted/30",
          isActive && "ring-2 ring-primary ring-offset-1",
          status === "bad"  && "border-destructive/40",
          status === "warn" && "border-[hsl(var(--warning))]/40",
          status === "good" && "border-[hsl(var(--success))]/25",
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Hoàn thành</p>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {done}
                <span className="text-base text-muted-foreground font-normal">/{total}</span>
              </p>
            </div>
            {hasOverdue && (
              <span className="inline-block rounded-full bg-destructive/15 text-destructive text-xs font-semibold px-2.5 py-1">
                {d.taskChecklist.filter(t => t.status === "overdue").length} quá hạn
              </span>
            )}
          </div>

          {/* Task list */}
          {total > 0 && (
            <div className="space-y-1.5">
              {d.taskChecklist.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm shrink-0 leading-none",
                    t.status === "done"    ? "text-[hsl(var(--success))]" :
                    t.status === "overdue" ? "text-destructive" :
                    "text-muted-foreground/50",
                  )}>
                    {t.status === "done" ? "✓" : t.status === "overdue" ? "⚠" : "○"}
                  </span>
                  <span className={cn(
                    "text-xs flex-1 truncate",
                    t.status === "done"    ? "line-through text-muted-foreground" :
                    t.status === "overdue" ? "text-destructive font-medium" :
                    "text-foreground",
                  )}>
                    {t.task}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{t.owner}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}

// ─── Section 5: Customer Complaints ──────────────────────────────────────────
function ComplaintsSection({ d, onDrill, activeDrill }: Props) {
  const isActive = activeDrill === "Khiếu nại khách hàng"

  if (d.customerComplaints.length === 0) {
    return (
      <Section icon={MessageSquare} label="Khiếu nại khách hàng" color="bg-[hsl(var(--warning))]">
        <Card className="border-[hsl(var(--success))]/25">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[hsl(var(--success))]">Không có khiếu nại hôm nay</p>
            <p className="text-xs text-muted-foreground mt-0.5">Khách hàng hài lòng</p>
          </CardContent>
        </Card>
      </Section>
    )
  }

  const totalNew = d.customerComplaints.filter(c => c.status === "new").reduce((sum, c) => sum + c.count, 0)

  const drillContent: DrillContent = {
    title: "Khiếu nại khách hàng",
    value: `${totalNew} mới`,
    status: totalNew > 0 ? "warn" : "good",
    rows: d.customerComplaints.map(c => ({
      label: c.category,
      value: `${c.count} khiếu nại`,
      status: (c.status === "new" ? "warn" : "good") as Status,
      sub: c.status === "new" ? "Chưa xử lý" : "Đã giải quyết",
    })),
  }

  return (
    <Section icon={MessageSquare} label="Khiếu nại khách hàng" color="bg-[hsl(var(--warning))]">
      <div className="space-y-2">
        {d.customerComplaints.map((c, i) => {
          const isNew = c.status === "new"
          return (
            <Card
              key={i}
              onClick={() => onDrill(drillContent)}
              className={cn(
                "overflow-hidden cursor-pointer transition-colors hover:bg-muted/30",
                isActive && "ring-2 ring-primary ring-offset-1",
                isNew ? "border-[hsl(var(--warning))]/40" : "border-[hsl(var(--success))]/25",
              )}
            >
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{c.category}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.count} khiếu nại</p>
                  </div>
                  <span className={cn(
                    "inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    isNew
                      ? "bg-destructive/15 text-destructive"
                      : "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
                  )}>
                    {isNew ? "Mới" : "Đã giải quyết"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function StoreView({ d, onDrill, activeDrill }: Props) {
  return (
    <div className="space-y-6 pb-4">
      <RevenueSection  d={d} onDrill={onDrill} activeDrill={activeDrill} />
      <StaffingSection d={d} onDrill={onDrill} activeDrill={activeDrill} />
      <LowStockSection d={d} onDrill={onDrill} activeDrill={activeDrill} />
      <TaskSection     d={d} onDrill={onDrill} activeDrill={activeDrill} />
      <ComplaintsSection d={d} onDrill={onDrill} activeDrill={activeDrill} />
    </div>
  )
}

export default StoreView
