import { Priority } from "@/types"
import { cn } from "@/lib/utils"
import { AlertCircle, ArrowDown, ArrowUp, Minus } from "lucide-react"

const PRIORITY_MAP: Record<Priority, { label: string; icon: typeof Minus; className: string }> = {
  low:    { label: "Low",    icon: ArrowDown,   className: "text-muted-foreground" },
  medium: { label: "Medium", icon: Minus,        className: "text-primary/70" },
  high:   { label: "High",   icon: ArrowUp,      className: "text-foreground" },
  urgent: { label: "Urgent", icon: AlertCircle,  className: "text-destructive" },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, icon: Icon, className } = PRIORITY_MAP[priority]
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}
