import { useState } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GbpLocation, GbpHealthStatus } from "@/types"
import { HealthBadge } from "./HealthBadge"
import { ScoreBar } from "./ScoreBar"
import { FieldIcon, fieldState, photoState } from "./FieldIcon"

// ─── Sort / group types ───────────────────────────────────────────────────────

type SortKey =
  | "location" | "city" | "score" | "rating"
  | "star1" | "star2" | "star3" | "star4" | "star5"
  | "reviews" | "resp"
type SortDir = "asc" | "desc"
export type GroupBy = "none" | "city" | "status"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<GbpHealthStatus, number> = { critical: 0, warning: 1, healthy: 2 }

function sortLocs(locs: GbpLocation[], key: SortKey | null, dir: SortDir): GbpLocation[] {
  if (!key) return locs
  const f = dir === "asc" ? 1 : -1
  return [...locs].sort((a, b) => {
    switch (key) {
      case "location": {
        const sd = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        return f * (sd !== 0 ? sd : a.name.localeCompare(b.name))
      }
      case "city":    return f * a.city.localeCompare(b.city)
      case "score":   return f * (a.healthScore - b.healthScore)
      case "rating":  return f * (a.review.avgRating - b.review.avgRating)
      case "star1":   return f * (a.review.dist[0] - b.review.dist[0])
      case "star2":   return f * (a.review.dist[1] - b.review.dist[1])
      case "star3":   return f * (a.review.dist[2] - b.review.dist[2])
      case "star4":   return f * (a.review.dist[3] - b.review.dist[3])
      case "star5":   return f * (a.review.dist[4] - b.review.dist[4])
      case "reviews": return f * (a.review.totalCount - b.review.totalCount)
      case "resp":    return f * (a.review.responseRate - b.review.responseRate)
      default:        return 0
    }
  })
}

interface AggData {
  count:        number
  healthScore:  number   // avg
  avgRating:    number   // avg
  dist:         [number, number, number, number, number]  // sum
  totalCount:   number   // sum
  responseRate: number   // avg
}

function aggLocs(locs: GbpLocation[]): AggData {
  const n = locs.length || 1
  return {
    count:        locs.length,
    healthScore:  Math.round(locs.reduce((s, l) => s + l.healthScore, 0) / n),
    avgRating:    locs.reduce((s, l) => s + l.review.avgRating, 0) / n,
    dist:         [0, 1, 2, 3, 4].map(i =>
                    locs.reduce((s, l) => s + l.review.dist[i], 0)
                  ) as [number, number, number, number, number],
    totalCount:   locs.reduce((s, l) => s + l.review.totalCount, 0),
    responseRate: Math.round(locs.reduce((s, l) => s + l.review.responseRate, 0) / n),
  }
}

// ─── Column header components ─────────────────────────────────────────────────

const TH_BASE =
  "py-2 px-3 text-[10px] font-semibold text-muted-foreground bg-muted border-b border-r border-border last:border-r-0 whitespace-nowrap"

function SimpleTh({ children, center = false, className }: {
  children: React.ReactNode; center?: boolean; className?: string
}) {
  return (
    <th className={cn(TH_BASE, center && "text-center", className)}>
      {children}
    </th>
  )
}

function SortTh({ label, sk, active, dir, onSort, center = false, className }: {
  label: React.ReactNode; sk: SortKey; active: boolean; dir: SortDir
  onSort: (k: SortKey) => void; center?: boolean; className?: string
}) {
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <th
      onClick={() => onSort(sk)}
      className={cn(
        TH_BASE,
        "cursor-pointer select-none group hover:bg-muted/70 transition-colors",
        center && "text-center",
        className,
      )}
    >
      <div className={cn("inline-flex items-center gap-0.5", center && "justify-center w-full")}>
        <span className={active ? "text-foreground" : ""}>{label}</span>
        <Icon className={cn(
          "size-3 shrink-0 transition-opacity",
          active ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-40",
        )} />
      </div>
    </th>
  )
}

// ─── Star count cell ──────────────────────────────────────────────────────────

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

// ─── Group header row ─────────────────────────────────────────────────────────

function GroupHeaderRow({ label, agg, groupBy, compact, status }: {
  label: string; agg: AggData; groupBy: GroupBy; compact: boolean; status?: GbpHealthStatus
}) {
  const respCls =
    agg.responseRate < 40 ? "text-[hsl(var(--warning))]" :
    agg.responseRate < 70 ? "text-foreground" :
                             "text-[hsl(var(--success))]"
  return (
    <tr className="bg-muted/40">
      {/* Location */}
      <td className="py-2 pl-4 pr-3 border-y border-r border-border/60">
        <div className="flex items-center gap-2">
          {status && (
            <HealthBadge status={status} className="text-[10px] h-4 px-1.5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{agg.count}</Badge>
        </div>
      </td>
      {/* City */}
      <td className="py-2 px-3 border-y border-r border-border/60">
        <span className="text-[11px] text-muted-foreground">
          {groupBy === "city" ? label : ""}
        </span>
      </td>
      {/* Score avg */}
      <td className="py-2 px-3 border-y border-r border-border/60 min-w-[100px]">
        <ScoreBar score={agg.healthScore} />
      </td>
      {/* Boolean field columns — blank */}
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-2 px-3 border-y border-r border-border/60 last:border-r-0" />
      ))}
      {/* Full-view aggregated columns */}
      {!compact && (
        <>
          {/* Rating avg */}
          <td className="py-2 px-3 border-y border-r border-border/60 text-center">
            <span className="text-xs font-semibold">{agg.avgRating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground ml-0.5">★</span>
          </td>
          {/* 1★–5★ sums */}
          {([1, 2, 3, 4, 5] as const).map(tier => (
            <StarCountCell key={tier} count={agg.dist[tier - 1]} tier={tier} />
          ))}
          {/* Reviews sum */}
          <td className="py-2 px-3 border-y border-r border-border/60 text-center tabular-nums">
            <span className="text-xs font-semibold">{agg.totalCount}</span>
          </td>
          {/* Resp% avg */}
          <td className="py-2 px-3 border-y border-border/60 text-center">
            <span className={cn("text-xs font-semibold", respCls)}>{agg.responseRate}%</span>
          </td>
        </>
      )}
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LocationsTableProps {
  locations:  GbpLocation[]
  compact?:   boolean
  groupBy?:   GroupBy
  selectedId?: string
  onSelect?:  (loc: GbpLocation) => void
  className?: string
}

export function LocationsTable({
  locations,
  compact  = false,
  groupBy  = "none",
  selectedId,
  onSelect,
  className,
}: LocationsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("asc") }
  }
  const s = (k: SortKey) => ({ sk: k, active: sortKey === k, dir: sortDir, onSort: toggleSort })

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No locations match the current filters.
      </div>
    )
  }

  // ── Build render rows ──────────────────────────────────────────────────────

  type RenderRow =
    | { type: "group"; label: string; agg: AggData; status?: GbpHealthStatus }
    | { type: "item";  loc: GbpLocation; stripe: boolean }

  const sorted = sortLocs(locations, sortKey, sortDir)

  const rows: RenderRow[] = (() => {
    if (groupBy === "none") {
      return sorted.map((loc, i) => ({ type: "item" as const, loc, stripe: i % 2 === 1 }))
    }

    if (groupBy === "city") {
      const map = new Map<string, GbpLocation[]>()
      for (const loc of sorted) {
        if (!map.has(loc.city)) map.set(loc.city, [])
        map.get(loc.city)!.push(loc)
      }
      const result: RenderRow[] = []
      for (const city of [...map.keys()].sort()) {
        const locs = map.get(city)!
        result.push({ type: "group", label: city, agg: aggLocs(locs) })
        locs.forEach((loc, i) => result.push({ type: "item", loc, stripe: i % 2 === 1 }))
      }
      return result
    }

    // groupBy === "status"
    const result: RenderRow[] = []
    for (const status of ["critical", "warning", "healthy"] as GbpHealthStatus[]) {
      const locs = sorted.filter(l => l.status === status)
      if (locs.length === 0) continue
      const label = status.charAt(0).toUpperCase() + status.slice(1)
      result.push({ type: "group", label, agg: aggLocs(locs), status })
      locs.forEach((loc, i) => result.push({ type: "item", loc, stripe: i % 2 === 1 }))
    }
    return result
  })()

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table
        className="w-full text-sm border-separate border-spacing-0"
        style={{ minWidth: compact ? 600 : 1120 }}
      >
        {/* ── Headers ── */}
        <thead className="sticky top-0 z-10">
          <tr>
            <SortTh label="Location"   {...s("location")} className="pl-4" />
            <SortTh label="City"       {...s("city")}     />
            <SortTh label="Score"      {...s("score")}    />
            {/* Non-sortable boolean field columns */}
            <SimpleTh center>Name✓</SimpleTh>
            <SimpleTh center>Location page</SimpleTh>
            <SimpleTh center>Phone</SimpleTh>
            <SimpleTh center>Hours</SimpleTh>
            <SimpleTh center>Photos</SimpleTh>
            <SimpleTh center>Desc</SimpleTh>
            {!compact && (
              <>
                <SortTh label="Rating"  {...s("rating")}  center />
                <SortTh label="1★"      {...s("star1")}   center className="text-[hsl(var(--destructive))]" />
                <SortTh label="2★"      {...s("star2")}   center className="text-[hsl(var(--warning))]" />
                <SortTh label="3★"      {...s("star3")}   center />
                <SortTh label="4★"      {...s("star4")}   center className="text-[hsl(var(--success)/0.8)]" />
                <SortTh label="5★"      {...s("star5")}   center className="text-[hsl(var(--success))]" />
                <SortTh label="Reviews" {...s("reviews")} center />
                <SortTh label="Resp%"   {...s("resp")}    center />
              </>
            )}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {rows.map((row, rowIdx) => {
            if (row.type === "group") {
              return (
                <GroupHeaderRow
                  key={`group-${row.label}`}
                  label={row.label}
                  agg={row.agg}
                  groupBy={groupBy}
                  compact={compact}
                  status={row.status}
                />
              )
            }

            const { loc, stripe } = row
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
                    : stripe
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

                {/* Boolean field icons */}
                {([
                  fieldState(loc.nameIsCorrect),
                  fieldState(loc.fields.hasWebsite),
                  fieldState(loc.fields.hasPhone),
                  fieldState(loc.fields.hasHours),
                  photoState(loc.fields.photoCount),
                  fieldState(loc.fields.hasDescription),
                ] as const).map((state, i) => (
                  <td key={i} className="py-2.5 px-3 border-b border-r border-border/60 last:border-r-0 text-center">
                    <FieldIcon state={state} />
                  </td>
                ))}

                {/* Full-view columns */}
                {!compact && (
                  <>
                    <td className="py-2.5 px-3 border-b border-r border-border/60 text-center">
                      <span className="text-xs font-medium">{loc.review.avgRating.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground ml-0.5">★</span>
                    </td>

                    {([1, 2, 3, 4, 5] as const).map(tier => (
                      <StarCountCell key={tier} count={loc.review.dist[tier - 1]} tier={tier} />
                    ))}

                    <td className="py-2.5 px-3 border-b border-r border-border/60 text-center tabular-nums">
                      <span className="text-xs font-medium">{loc.review.totalCount}</span>
                    </td>

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
