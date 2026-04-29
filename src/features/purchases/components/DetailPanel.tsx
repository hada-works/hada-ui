import { useState, useEffect } from "react"
import {
  Package, Building2, User, Shield,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { BulkItem, RoleKey } from "@/types"
import { deriveOverall, STEP_CONFIG, fmt, fmtN, fmtPct } from "../constants"
import { OverallBadge, ApprovalStepBar } from "./ApprovalStepBar"
import { ActionForm } from "./ActionForm"
import { CommentSection } from "./CommentSection"

// ─── Utility row ─────────────────────────────────────────────────────────────

function MetaRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1 border-b border-border/50 last:border-0 gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-[11px] font-medium text-right", highlight && "text-primary")}>{value}</span>
    </div>
  )
}

// ─── Approval action block for one role ──────────────────────────────────────

function ApprovalBlock({
  label, canAct, canReset, stepStatus, stepReasonGroup,
  pendingMsg, action, onSetAction, onReset, onSubmit, onCancelAction,
}: {
  label:           string
  canAct:          boolean
  canReset:        boolean
  stepStatus:      string
  stepReasonGroup?: string
  pendingMsg?:     string
  action:          { type: "approve" | "reject" | "info" } | null
  onSetAction:     (type: "approve" | "reject" | "info") => void
  onReset:         () => void
  onSubmit:        (rg: string, note: string) => void
  onCancelAction:  () => void
}) {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Shield className="size-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
        {canReset && !canAct && (
          <button
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            onClick={onReset}
          >
            Duyệt lại
          </button>
        )}
      </div>

      {canAct && !action && (
        <div className="space-y-1.5">
          <Button
            size="sm"
            className="w-full h-9 gap-2 text-xs bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-white"
            onClick={() => onSetAction("approve")}
          >
            <CheckCircle2 className="size-4" />Duyệt
          </Button>
          <div className="flex gap-1.5">
            <Button
              variant="outline" size="sm"
              className="flex-1 h-7 gap-1 text-[11px] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.35)] hover:bg-[hsl(var(--warning-subtle))]"
              onClick={() => onSetAction("info")}
            >
              <AlertCircle className="size-3" />Cần thêm TT
            </Button>
            <Button
              variant="outline" size="sm"
              className="flex-1 h-7 gap-1 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => onSetAction("reject")}
            >
              <XCircle className="size-3" />Từ chối
            </Button>
          </div>
        </div>
      )}

      {canReset && !canAct && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className={cn("text-[11px] font-medium", STEP_CONFIG[stepStatus as keyof typeof STEP_CONFIG]?.color)}>
            {STEP_CONFIG[stepStatus as keyof typeof STEP_CONFIG]?.label}
          </span>
          {stepReasonGroup && (
            <span className="text-[10px] text-muted-foreground truncate">· {stepReasonGroup}</span>
          )}
        </div>
      )}

      {pendingMsg && !canAct && !canReset && (
        <p className="text-[11px] text-muted-foreground/60 italic">{pendingMsg}</p>
      )}

      {action && (
        <ActionForm
          action={action.type}
          onSubmit={onSubmit}
          onCancel={onCancelAction}
        />
      )}
    </div>
  )
}

// ─── Main detail panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  item:         BulkItem
  onStepAction: (id: string, role: RoleKey, action: "approve" | "reject" | "info", reasonGroup: string, note: string) => void
  onStepReset:  (id: string, role: RoleKey) => void
  onComment:    (id: string, text: string) => void
}

export function DetailPanel({ item, onStepAction, onStepReset, onComment }: DetailPanelProps) {
  const [action, setAction] = useState<{ role: RoleKey; type: "approve" | "reject" | "info" } | null>(null)
  useEffect(() => { setAction(null) }, [item.id])

  const overall = deriveOverall(item)

  const canActMDM  = (item.steps[0].status === "pending" || item.steps[0].status === "info_needed") &&
    (overall === "pending_mdm" || overall === "info_needed" || item.parallel)
  const canActSCM  = item.steps[1].status === "pending" &&
    (overall === "pending_scm" || item.parallel)
  const canResetMDM = item.steps[0].status !== "pending" && item.steps[0].status !== "skipped"
  const canResetSCM = item.steps[1].status !== "pending" && item.steps[1].status !== "skipped"

  const showActions = canActMDM || canActSCM || canResetMDM || canResetSCM

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 px-5 py-3.5 border-b space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] text-muted-foreground">{item.sku}</p>
            <h2 className="text-sm font-semibold leading-snug mt-0.5">{item.productName}</h2>
          </div>
          <OverallBadge item={item} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <Package className="size-2.5" />{item.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <Building2 className="size-2.5" />{item.supplier}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <User className="size-2.5" />{item.requestedBy}
          </Badge>
        </div>
        <ApprovalStepBar steps={item.steps} parallel={item.parallel} />
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-auto">
        <div className="px-5 py-4 space-y-5">

          {/* Order summary */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Đơn hàng</p>
            <div className="rounded-lg border overflow-hidden">
              <div className="flex flex-wrap divide-x">
                <div className="flex-1 min-w-[80px] py-2.5 px-3 text-center">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">SL đặt</p>
                  <p className="text-sm font-bold mt-0.5">{fmtN(item.qtyOrdered)}</p>
                </div>
                <div className="flex-1 min-w-[80px] py-2.5 px-3 text-center">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">Đơn giá</p>
                  <p className="text-sm font-bold mt-0.5 truncate">{fmt(item.unitPrice)}</p>
                </div>
                <div className="flex-1 min-w-[96px] py-2.5 px-3 text-center bg-muted/40">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">Giá trị ĐH</p>
                  <p className="text-sm font-bold mt-0.5 text-primary truncate">{fmt(item.orderValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border p-3 flex-1 min-w-[140px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tồn kho tại ngày YC</p>
              <MetaRow label="Tồn DC"          value={fmtN(item.stockDC)} />
              <MetaRow label="Tổng tồn"         value={fmtN(item.stockTotal)} />
              <MetaRow label="Ngày tồn DC"      value={`${item.daysStockDC} ngày`}      highlight={item.daysStockDC < 10} />
              <MetaRow label="Ngày tồn toàn HT" value={`${item.daysStockTotal} ngày`} />
            </div>
            <div className="rounded-lg border p-3 flex-1 min-w-[140px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sức bán</p>
              <MetaRow label="SBTB 28 ngày"      value={fmtN(item.avgSales28d)} />
              <MetaRow label="SBTB không KM"     value={fmtN(item.avgSalesNonPromo)} />
              <MetaRow label="SB dự kiến/ngày"   value={fmtN(item.projectedDailySales)} highlight />
              <MetaRow label="FC vs Actual"       value={fmtPct(item.salesFcVsActualDiff)} highlight={item.salesFcVsActualDiff > 30} />
            </div>
          </div>

          {/* Deal info */}
          <div className="rounded-lg border p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Thông tin Deal</p>
            <MetaRow label="Ngày nhập dự kiến"   value={item.expectedArrival} />
            <MetaRow label="Bắt đầu deal"         value={item.dealStart} />
            <MetaRow label="Bán hết lô"           value={item.dealEnd} />
            <MetaRow label="Số ngày bán dự kiến"  value={`${item.projectedSellingDays} ngày`} />
            <MetaRow label="CTKM Support"          value={item.promotion} />
            <MetaRow label="Deadline SCM Confirm" value={item.scmDeadline} highlight />
          </div>

          {/* Forecast */}
          <div className="rounded-lg border p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Dự báo sau nhập hàng</p>
            <MetaRow label="Tổng tồn dự kiến ngày nhập"    value={fmtN(item.projectedStockAtArrival)} />
            <MetaRow label="Ngày tồn DC (theo SB dự kiến)" value={`${item.projectedDCDaysPostDeal} ngày`} highlight={item.projectedDCDaysPostDeal > 30} />
            <MetaRow label="Ngày tồn toàn HT sau hết KM"   value={`${item.totalDaysPostPromo} ngày`}     highlight={item.totalDaysPostPromo > 45} />
          </div>

          {/* Feasibility note */}
          {item.feasibilityNote && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Giải thích độ khả thi</p>
              <p className="text-xs leading-relaxed">{item.feasibilityNote}</p>
            </div>
          )}

          {/* Approval history */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Lịch sử phê duyệt</p>
            {item.steps.map(step => (
              <div key={step.role} className={cn(
                "rounded-lg border px-3 py-2.5 space-y-1",
                step.status === "approved"    && "bg-[hsl(var(--success-subtle))] border-[hsl(var(--success)/0.3)]",
                step.status === "rejected"    && "bg-destructive/5 border-destructive/20",
                step.status === "info_needed" && "bg-[hsl(var(--warning-subtle))] border-[hsl(var(--warning)/0.3)]",
                step.status === "pending"     && "bg-muted/30",
              )}>
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">{step.role}</span>
                  <span className={cn("text-[10px] font-medium ml-auto", STEP_CONFIG[step.status].color)}>
                    {STEP_CONFIG[step.status].label}
                  </span>
                </div>
                {step.reasonGroup && <p className="text-[11px] font-medium pl-5">{step.reasonGroup}</p>}
                {step.note        && <p className="text-[11px] text-muted-foreground pl-5">{step.note}</p>}
                {step.approvedBy  && (
                  <p className="text-[10px] text-muted-foreground/60 pl-5">
                    bởi {step.approvedBy} · {step.approvedAt}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Approval actions ── */}
          {showActions && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-3 py-2 bg-muted/50 border-b">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phê duyệt</p>
              </div>
              <div className="divide-y">
                {(canActMDM || canResetMDM) && (
                  <ApprovalBlock
                    label="MDM"
                    canAct={canActMDM}
                    canReset={canResetMDM}
                    stepStatus={item.steps[0].status}
                    stepReasonGroup={item.steps[0].reasonGroup}
                    action={action?.role === "MDM" ? action : null}
                    onSetAction={type => setAction({ role: "MDM", type })}
                    onReset={() => { onStepReset(item.id, "MDM"); setAction(null) }}
                    onSubmit={(rg, n) => { onStepAction(item.id, "MDM", action!.type, rg, n); setAction(null) }}
                    onCancelAction={() => setAction(null)}
                  />
                )}
                {(canActSCM || canResetSCM) && (
                  <ApprovalBlock
                    label="SCM"
                    canAct={canActSCM}
                    canReset={canResetSCM}
                    stepStatus={item.steps[1].status}
                    stepReasonGroup={item.steps[1].reasonGroup}
                    pendingMsg="Chờ MDM duyệt trước"
                    action={action?.role === "SCM" ? action : null}
                    onSetAction={type => setAction({ role: "SCM", type })}
                    onReset={() => { onStepReset(item.id, "SCM"); setAction(null) }}
                    onSubmit={(rg, n) => { onStepAction(item.id, "SCM", action!.type, rg, n); setAction(null) }}
                    onCancelAction={() => setAction(null)}
                  />
                )}
              </div>
            </div>
          )}

          <Separator />
          <CommentSection comments={item.comments} onAdd={text => onComment(item.id, text)} />
        </div>
      </div>
    </div>
  )
}
