import { Badge } from "@/components/ui/badge"
import type { GbpHealthStatus } from "@/types"

interface HealthBadgeProps {
  status:     GbpHealthStatus
  score?:     number   // optional — shows "72%" alongside label
  className?: string
}

const CONFIG: Record<GbpHealthStatus, { variant: "destructive" | "warning" | "success"; label: string }> = {
  critical: { variant: "destructive", label: "Critical" },
  warning:  { variant: "warning",     label: "Warning"  },
  healthy:  { variant: "success",     label: "Healthy"  },
}

export function HealthBadge({ status, score, className }: HealthBadgeProps) {
  const { variant, label } = CONFIG[status]
  return (
    <Badge variant={variant} className={className}>
      {label}{score !== undefined ? ` · ${score}%` : ""}
    </Badge>
  )
}
