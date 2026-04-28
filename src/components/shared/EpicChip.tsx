import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Categorical epic palette — mirrors CSS vars in index.css ─────────────────
const EPIC_BORDER: Record<string, string> = {
  purple:  "border-l-[hsl(var(--epic-purple))]",
  blue:    "border-l-[hsl(var(--epic-blue))]",
  sky:     "border-l-[hsl(var(--epic-sky))]",
  amber:   "border-l-[hsl(var(--epic-amber))]",
  emerald: "border-l-[hsl(var(--epic-emerald))]",
  green:   "border-l-[hsl(var(--epic-green))]",
  cyan:    "border-l-[hsl(var(--epic-cyan))]",
  rose:    "border-l-[hsl(var(--epic-rose))]",
}

interface EpicChipProps {
  title:     string
  color:     string
  className?: string
}

export function EpicChip({ title, color, className }: EpicChipProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 border-l-2 pl-1.5 pr-2 py-0.5 rounded-r-md text-[10px] font-medium",
      "bg-secondary text-secondary-foreground",
      EPIC_BORDER[color] ?? "border-l-border",
      className,
    )}>
      <Layers className="size-2.5 shrink-0" />
      {title}
    </span>
  )
}
