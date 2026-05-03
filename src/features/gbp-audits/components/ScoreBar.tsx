import { cn } from "@/lib/utils"
import { HEALTH_CRITICAL_MAX, HEALTH_WARNING_MAX } from "../constants"

interface ScoreBarProps {
  score:      number   // 0–100
  className?: string
  showLabel?: boolean  // default true
}

export function ScoreBar({ score, className, showLabel = true }: ScoreBarProps) {
  const fill =
    score < HEALTH_CRITICAL_MAX ? "bg-destructive" :
    score < HEALTH_WARNING_MAX  ? "bg-[hsl(var(--warning))]" :
                                   "bg-[hsl(var(--success))]"
  const label =
    score < HEALTH_CRITICAL_MAX ? "text-destructive" :
    score < HEALTH_WARNING_MAX  ? "text-[hsl(var(--warning))]" :
                                   "text-[hsl(var(--success))]"
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", fill)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-semibold tabular-nums w-8 text-right shrink-0", label)}>
          {score}%
        </span>
      )}
    </div>
  )
}
