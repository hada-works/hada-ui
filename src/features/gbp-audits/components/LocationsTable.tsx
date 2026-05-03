import { cn } from "@/lib/utils"
import type { GbpLocation } from "@/types"
import { HealthBadge } from "./HealthBadge"
import { ScoreBar } from "./ScoreBar"
import { FieldIcon, fieldState, photoState } from "./FieldIcon"

// Star count cell — coloured by tier
function StarCountCell({ count, tier }: { count: number; tier: 1 | 2 | 3 | 4 | 5 }) {
  const cls =
    tier <= 2 ? "text-[hsl(var(--destructive))]" :
    tier === 3 ? "text-muted-foreground" :
    tier === 4 ? "text-[hsl(var(--success)/0.8)]" :
                 "text-[hsl(var(--success))]"
  return (
    <td className="py-2.5 px-2 border-b border-r border-border/60 text-center tabular-nums last:border-r-0">
      <span className={cn("text-xs font-medium", count === 0 ? "text-muted-foreground/40" : cls)}>
        {count}
      </span>
    </td>
  )
}

interface LocationsTableProps {
  locations:   GbpLocation[]
  compact?:    boolean       // fewer columns for dashboard preview
  selectedId?: string
  onSelect?:   (loc: GbpLocation) => void
  className?:  string
}

export function LocationsTable({
  locations,
  compact = false,
  selectedId,
  onSelect,
  className,
}: LocationsTableProps) {
  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No locations match the current filters.
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm border-separate border-spacing-0" style={{ minWidth: compact ? 600 : 1120 }}>
        <thead className="sticky top-0 z-10">
          <tr>
            {["Location", "City", "Score", "Name✓", "Website", "Phone", "Hours", "Photos", "Desc"].map((h, i) => (
              <th
                key={h}
                className={cn(
                  "py-2 px-3 text-left text-[10px] font-semibold text-muted-foreground bg-muted border-b border-r border-border last:border-r-0 whitespace-nowrap",
                  i === 0 && "pl-4",
                  i > 2 && "text-center",
                )}
              >
                {h}
              </th>
            ))}
            {!compact && (
              <>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground bg-muted border-b border-r border-border whitespace-nowrap">Rating</th>
                <th className="py-2 px-2 text-center text-[10px] font-semibold text-[hsl(var(--destructive))] bg-muted border-b border-r border-border whitespace-nowrap">1★</th>
                <th className="py-2 px-2 text-center text-[10px] font-semibold text-[hsl(var(--warning))] bg-muted border-b border-r border-border whitespace-nowrap">2★</th>
                <th className="py-2 px-2 text-center text-[10px] font-semibold text-muted-foreground bg-muted border-b border-r border-border whitespace-nowrap">3★</th>
                <th className="py-2 px-2 text-center text-[10px] font-semibold text-[hsl(var(--success)/0.8)] bg-muted border-b border-r border-border whitespace-nowrap">4★</th>
                <th className="py-2 px-2 text-center text-[10px] font-semibold text-[hsl(var(--success))] bg-muted border-b border-r border-border whitespace-nowrap">5★</th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground bg-muted border-b border-r border-border whitespace-nowrap">Reviews</th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground bg-muted border-b border-border whitespace-nowrap">Resp%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {locations.map((loc, idx) => {
            const isSelected = loc.id === selectedId
            return (
              <tr
                key={loc.id}
                onClick={() => onSelect?.(loc)}
                className={cn(
                  "transition-colors",
                  onSelect && "cursor-pointer",
                  isSelected
                    ? "bg-accent"
                    : idx % 2 === 1
                      ? "bg-muted/20 hover:bg-accent/30"
                      : "hover:bg-accent/30",
                )}
              >
                {/* Location name */}
                <td className="py-2.5 pl-4 pr-3 border-b border-border/60">
                  <div className="flex items-start gap-2">
                    <HealthBadge status={loc.status} className="shrink-0 text-[10px] h-4 px-1.5 mt-0.5" />
                    <div className="min-w-0">
                      <p className={cn("text-xs font-medium truncate max-w-[140px]", !loc.nameIsCorrect && "text-[hsl(var(--warning))]")}>
                        {loc.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{loc.address}</p>
                    </div>
                  </div>
                </td>

                {/* City */}
                <td className="py-2.5 px-3 border-b border-border/60">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{loc.city}</span>
                </td>

                {/* Score */}
                <td className="py-2.5 px-3 border-b border-border/60 min-w-[100px]">
                  <ScoreBar score={loc.healthScore} />
                </td>

                {/* Field icons */}
                {[
                  fieldState(loc.nameIsCorrect),
                  fieldState(loc.fields.hasWebsite),
                  fieldState(loc.fields.hasPhone),
                  fieldState(loc.fields.hasHours),
                  photoState(loc.fields.photoCount),
                  fieldState(loc.fields.hasDescription),
                ].map((state, i) => (
                  <td key={i} className="py-2.5 px-3 border-b border-r border-border/60 last:border-r-0 text-center">
                    <FieldIcon state={state} />
                  </td>
                ))}

                {/* Rating + star dist + Response (full view only) */}
                {!compact && (
                  <>
                    <td className="py-2.5 px-3 border-b border-r border-border/60 text-center">
                      <span className="text-xs font-medium">{loc.review.avgRating.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground ml-0.5">★</span>
                    </td>

                    {/* 1★ – 5★ counts */}
                    {([1, 2, 3, 4, 5] as const).map(tier => (
                      <StarCountCell
                        key={tier}
                        count={loc.review.dist[tier - 1]}
                        tier={tier}
                      />
                    ))}

                    {/* Reviews count */}
                    <td className="py-2.5 px-3 border-b border-r border-border/60 text-center tabular-nums">
                      <span className="text-xs font-medium">{loc.review.totalCount}</span>
                    </td>

                    {/* Response rate */}
                    <td className="py-2.5 px-3 border-b border-border/60 text-center">
                      <span className={cn(
                        "text-xs font-medium",
                        loc.review.responseRate < 40 ? "text-[hsl(var(--warning))]" :
                        loc.review.responseRate < 70 ? "text-foreground" :
                        "text-[hsl(var(--success))]"
                      )}>
                        {loc.review.responseRate}%
                      </span>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
