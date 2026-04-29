import { cn } from "@/lib/utils"
import type { IssueType } from "@/types"

// ─── Left-border accent mapped to semantic CSS vars ───────────────────────────
export const TYPE_BORDER: Record<IssueType, string> = {
  task:    "border-l-[hsl(var(--info))]",
  bug:     "border-l-destructive",
  story:   "border-l-[hsl(var(--info)/0.6)]",
  subtask: "border-l-[hsl(var(--warning))]",
}

export const TYPE_LABEL: Record<IssueType, string> = {
  task:    "Task",
  bug:     "Bug",
  story:   "Story",
  subtask: "Sub-task",
}

interface IssueTypeBadgeProps {
  type:      IssueType
  className?: string
}

export function IssueTypeBadge({ type, className }: IssueTypeBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center border-l-2 pl-1.5 pr-2 py-0.5 rounded-r-md text-xs font-medium",
      "bg-secondary text-secondary-foreground",
      TYPE_BORDER[type],
      className,
    )}>
      {TYPE_LABEL[type]}
    </span>
  )
}
