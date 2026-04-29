import { Check, XCircle, AlertCircle, Clock, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BulkItem, ApprovalStep } from "@/types"
import { OVERALL_CONFIG, STEP_CONFIG } from "../constants"

// ─── Overall status badge ─────────────────────────────────────────────────────

import { deriveOverall } from "../constants"

export function OverallBadge({ item }: { item: BulkItem }) {
  const cfg = OVERALL_CONFIG[deriveOverall(item)]
  return (
    <Badge variant={cfg.variant} className="gap-1 text-[10px] h-5 px-1.5 font-medium shrink-0">
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </Badge>
  )
}

// ─── MDM → SCM step progress bar ─────────────────────────────────────────────

function StepPill({ step }: { step: ApprovalStep }) {
  return (
    <div className={cn(
      "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border",
      step.status === "approved"    && "bg-[hsl(var(--success-subtle))] border-[hsl(var(--success)/0.3)] text-[hsl(var(--success-subtle-foreground))]",
      step.status === "rejected"    && "bg-destructive/10 border-destructive/30 text-destructive",
      step.status === "info_needed" && "bg-[hsl(var(--warning-subtle))] border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning-subtle-foreground))]",
      step.status === "pending"     && "bg-muted border-border text-muted-foreground",
    )}>
      {step.role}
      {step.status === "approved"    && <Check        className="size-2.5" />}
      {step.status === "rejected"    && <XCircle      className="size-2.5" />}
      {step.status === "info_needed" && <AlertCircle  className="size-2.5" />}
      {step.status === "pending"     && <Clock        className="size-2.5 opacity-50" />}
    </div>
  )
}

export function ApprovalStepBar({
  steps, parallel,
}: {
  steps: [ApprovalStep, ApprovalStep]
  parallel: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => (
        <div key={step.role} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-muted-foreground/40 text-[10px] mx-0.5">
              {parallel ? "⇉" : "→"}
            </span>
          )}
          <StepPill step={step} />
        </div>
      ))}
      {parallel && (
        <Badge variant="warning" className="text-[9px] h-4 px-1 gap-0.5 ml-0.5">
          <Zap className="size-2.5" />KHẨN
        </Badge>
      )}
    </div>
  )
}
