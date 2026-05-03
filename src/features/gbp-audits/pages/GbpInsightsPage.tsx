import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { MousePointerClick, Phone, Navigation, Star, TrendingUp, TrendingDown, Minus, ChevronDown, Check, Search } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/app-store"
import { GBP_LOCATIONS, GBP_INSIGHTS } from "../mock-data"
import type { GbpInsightPoint } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeKey = "1M" | "3M" | "6M" | "1Y" | "ALL"
const RANGE_N: Record<RangeKey, number | null> = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "ALL": null }

// ─── Data helpers ─────────────────────────────────────────────────────────────

function aggregatePoints(series: GbpInsightPoint[][]): GbpInsightPoint[] {
  if (series.length === 0) return []
  const months = series[0].map(p => p.month)
  return months.map((month, mi) => {
    const pts = series.map(s => s[mi]).filter(Boolean)
    const sum = (k: keyof GbpInsightPoint) => pts.reduce((a, p) => a + (p[k] as number), 0)
    const r1 = sum("r1"), r2 = sum("r2"), r3 = sum("r3"), r4 = sum("r4"), r5 = sum("r5")
    const total = r1 + r2 + r3 + r4 + r5 || 1
    return {
      month,
      clicks:     sum("clicks"),
      calls:      sum("calls"),
      directions: sum("directions"),
      newReviews: sum("newReviews"),
      avgRating:  Math.round((r5 * 5 + r4 * 4 + r3 * 3 + r2 * 2 + r1) / total * 10) / 10,
      r1, r2, r3, r4, r5,
    }
  })
}

function sliceRange(data: GbpInsightPoint[], n: number | null) {
  return n === null ? data : data.slice(-n)
}
function priorSlice(data: GbpInsightPoint[], n: number | null) {
  if (n === null || data.length < n * 2) return data.slice(0, n ?? data.length)
  return data.slice(-(2 * n), -n)
}

function sumField(pts: GbpInsightPoint[], k: keyof GbpInsightPoint): number {
  return pts.reduce((a, p) => a + (p[k] as number), 0)
}
function avgField(pts: GbpInsightPoint[], k: keyof GbpInsightPoint): number {
  return pts.length === 0 ? 0 : sumField(pts, k) / pts.length
}

function pctDiff(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round((curr - prev) / prev * 100)
}
function fmtK(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(0)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n))
}
function fmtMonth(m: string): string {
  const [y, mo] = m.split("-")
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+mo - 1]} '${y.slice(2)}`
}
function xLabelStep(n: number) { return n <= 4 ? 1 : n <= 12 ? 2 : n <= 24 ? 3 : 6 }

// ─── SVG geometry ─────────────────────────────────────────────────────────────

const W  = 600
const PL = 54, PR = 20, PT = 20, PB = 38
const PW = W - PL - PR

function pH(svgH: number) { return svgH - PT - PB }
function xAt(i: number, n: number) { return PL + (n <= 1 ? PW / 2 : (i / (n - 1)) * PW) }
function yAt(v: number, lo: number, hi: number, svgH: number) {
  const norm = hi === lo ? 0.5 : (v - lo) / (hi - lo)
  return PT + (1 - norm) * pH(svgH)
}
function niceRange(lo: number, hi: number, pad = 0.08): [number, number] {
  const p = (hi - lo) * pad || 1
  return [Math.max(0, lo - p), hi + p]
}
function yTicks(lo: number, hi: number, count = 5): number[] {
  return Array.from({ length: count }, (_, i) => lo + (i / (count - 1)) * (hi - lo))
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  clicks:     "hsl(var(--info))",           // design token
  calls:      "hsl(var(--warning))",        // design token
  directions: "hsl(var(--success))",        // design token
  reviews:    "hsl(var(--info))",           // design token
  rating:     "hsl(var(--warning))",        // design token
  r5:         "hsl(var(--success))",        // design token — exact match
  r4:         "hsl(152 56% 46%)",           // chart-only tint (no token for lighter success)
  r3:         "hsl(var(--warning))",        // design token
  r2:         "hsl(20 88% 52%)",            // chart-only tint (no token for orange-red)
  r1:         "hsl(var(--destructive))",    // design token
}

// ─── LineChart ────────────────────────────────────────────────────────────────

interface ChartSeries { data: number[]; color: string; label: string; strokeWidth?: number }
interface LineChartProps {
  id:       string
  series:   ChartSeries[]
  labels:   string[]
  svgH?:    number
  yDomain?: [number, number]
  formatY?: (v: number) => string
  showArea?: boolean
}

function LineChart({ id, series, labels, svgH = 180, yDomain, formatY = fmtK, showArea = true }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const n = labels.length
  const H = svgH

  const allVals = series.flatMap(s => s.data)
  const [lo, hi] = yDomain ?? niceRange(Math.min(...allVals), Math.max(...allVals))
  const x = useCallback((i: number) => xAt(i, n), [n])
  const y = useCallback((v: number) => yAt(v, lo, hi, H), [lo, hi, H])

  const ticks = yTicks(lo, hi)
  const step  = xLabelStep(n)

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - r.left) / r.width * W - PL
    if (relX < 0 || relX > PW) { setHovered(null); return }
    setHovered(Math.max(0, Math.min(n - 1, Math.round(relX / PW * (n - 1)))))
  }, [n])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" onMouseMove={onMouseMove} onMouseLeave={() => setHovered(null)}
      style={{ overflow: "visible", display: "block", fontFamily: "inherit" }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`${id}-g${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
          </linearGradient>
        ))}
      </defs>

      {/* Y grid + ticks */}
      {ticks.map((t, ti) => (
        <g key={ti}>
          <line x1={PL} y1={y(t)} x2={PL + PW} y2={y(t)}
            stroke="hsl(var(--border))" strokeWidth={ti === 0 ? 1 : 0.5} />
          <text x={PL - 5} y={y(t) + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">
            {formatY(t)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {labels.map((l, i) => i % step === 0 && (
        <text key={i} x={x(i)} y={PT + pH(H) + 26} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
          {fmtMonth(l)}
        </text>
      ))}

      {/* Area + line */}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")
        const area = `M ${x(0)},${PT + pH(H)} ${s.data.map((v, i) => `L ${x(i)},${y(v)}`).join(" ")} L ${x(n - 1)},${PT + pH(H)} Z`
        return (
          <g key={si}>
            {showArea && <path d={area} fill={`url(#${id}-g${si})`} />}
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={s.strokeWidth ?? 2} strokeLinejoin="round" />
          </g>
        )
      })}

      {/* Hover guideline + dots */}
      {hovered !== null && (
        <>
          <line x1={x(hovered)} y1={PT} x2={x(hovered)} y2={PT + pH(H)}
            stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 3" />
          {series.map((s, si) => (
            <circle key={si} cx={x(hovered)} cy={y(s.data[hovered])} r={4}
              fill={s.color} stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
          {/* Tooltip */}
          {(() => {
            const tx   = x(hovered)
            const tipW = series.length > 1 ? 140 : 110
            const tipH = series.length * 18 + 24
            const isR  = hovered < n * 0.65
            const tipX = isR ? tx + 10 : tx - 10 - tipW
            const tipY = PT + 4
            return (
              <g>
                <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={4}
                  fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={1} />
                <text x={tipX + 8} y={tipY + 14} fontSize={11} fontWeight="600" fill="hsl(var(--popover-foreground))">
                  {fmtMonth(labels[hovered])}
                </text>
                {series.map((s, si) => (
                  <g key={si}>
                    <rect x={tipX + 8}  y={tipY + 22 + si * 18} width={8} height={8} rx={2} fill={s.color} />
                    <text x={tipX + 20} y={tipY + 30 + si * 18} fontSize={10} fill="hsl(var(--popover-foreground))">
                      {s.label}: {formatY(s.data[hovered])}
                    </text>
                  </g>
                ))}
              </g>
            )
          })()}
        </>
      )}
    </svg>
  )
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

interface BarChartProps { data: number[]; labels: string[]; color: string; label: string; svgH?: number; formatY?: (v: number) => string }

function BarChart({ data, labels, color, label, svgH = 160, formatY = fmtK }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const n = labels.length
  const H = svgH
  const [lo, hi] = niceRange(0, Math.max(...data))
  const y  = (v: number) => yAt(v, lo, hi, H)
  const bw = Math.max(2, PW / n * 0.72)
  const bx = (i: number) => xAt(i, n) - bw / 2

  const ticks = yTicks(lo, hi)
  const step  = xLabelStep(n)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
      onMouseLeave={() => setHovered(null)}
      style={{ overflow: "visible", display: "block", fontFamily: "inherit" }}>
      {ticks.map((t, ti) => (
        <g key={ti}>
          <line x1={PL} y1={y(t)} x2={PL + PW} y2={y(t)}
            stroke="hsl(var(--border))" strokeWidth={ti === 0 ? 1 : 0.5} />
          <text x={PL - 5} y={y(t) + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">
            {formatY(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) => i % step === 0 && (
        <text key={i} x={xAt(i, n)} y={PT + pH(H) + 26} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
          {fmtMonth(l)}
        </text>
      ))}
      {data.map((v, i) => (
        <rect key={i} x={bx(i)} y={y(v)} width={bw} height={Math.max(0, PT + pH(H) - y(v))}
          fill={color} opacity={hovered === null || hovered === i ? 1 : 0.45} rx={2}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
      ))}
      {hovered !== null && (() => {
        const tx   = xAt(hovered, n)
        const tipW = 110; const tipH = 40
        const tipX = hovered < n * 0.65 ? tx + 10 : tx - 10 - tipW
        return (
          <g>
            <rect x={tipX} y={PT + 4} width={tipW} height={tipH} rx={4}
              fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={tipX + 8} y={PT + 17} fontSize={11} fontWeight="600" fill="hsl(var(--popover-foreground))">
              {fmtMonth(labels[hovered])}
            </text>
            <rect x={tipX + 8}  y={PT + 24} width={8} height={8} rx={2} fill={color} />
            <text x={tipX + 20} y={PT + 32} fontSize={10} fill="hsl(var(--popover-foreground))">
              {label}: {formatY(data[hovered])}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

// ─── StackedBarChart (rating distribution %) ─────────────────────────────────

const STAR_COLORS = [C.r1, C.r2, C.r3, C.r4, C.r5]
const STAR_LABELS = ["1★", "2★", "3★", "4★", "5★"]

function StackedBarChart({ points, labels }: { points: GbpInsightPoint[]; labels: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const n  = labels.length
  const H  = 160
  const bw = Math.max(2, PW / n * 0.78)
  const by = PT + pH(H)
  const step = xLabelStep(n)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
      onMouseLeave={() => setHovered(null)}
      style={{ overflow: "visible", display: "block", fontFamily: "inherit" }}>
      <line x1={PL} y1={PT} x2={PL + PW} y2={PT} stroke="hsl(var(--border))" strokeWidth={0.5} />
      <line x1={PL} y1={by} x2={PL + PW} y2={by} stroke="hsl(var(--border))" strokeWidth={1} />
      {[0, 25, 50, 75, 100].map(pct => {
        const yy = PT + pH(H) * (1 - pct / 100)
        return (
          <g key={pct}>
            {pct > 0 && pct < 100 && <line x1={PL} y1={yy} x2={PL + PW} y2={yy} stroke="hsl(var(--border))" strokeWidth={0.4} />}
            <text x={PL - 5} y={yy + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">{pct}%</text>
          </g>
        )
      })}
      {labels.map((l, i) => i % step === 0 && (
        <text key={i} x={xAt(i, n)} y={by + 26} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
          {fmtMonth(l)}
        </text>
      ))}
      {points.map((pt, i) => {
        const vals  = [pt.r1, pt.r2, pt.r3, pt.r4, pt.r5]
        const total = vals.reduce((a, v) => a + v, 0) || 1
        const cx    = xAt(i, n)
        let cumPct  = 0
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {vals.map((v, si) => {
              const pct = v / total * 100
              const barH = pH(H) * pct / 100
              const barY = by - pH(H) * (cumPct + pct) / 100
              cumPct += pct
              return (
                <rect key={si} x={cx - bw / 2} y={barY} width={bw} height={barH}
                  fill={STAR_COLORS[si]} opacity={hovered === null || hovered === i ? 1 : 0.45} />
              )
            })}
          </g>
        )
      })}
      {hovered !== null && (() => {
        const pt    = points[hovered]
        const vals  = [pt.r1, pt.r2, pt.r3, pt.r4, pt.r5]
        const total = vals.reduce((a, v) => a + v, 0) || 1
        const cx    = xAt(hovered, n)
        const tipW  = 120; const tipH = 5 * 18 + 26
        const tipX  = hovered < n * 0.65 ? cx + 10 : cx - 10 - tipW
        return (
          <g>
            <rect x={tipX} y={PT + 4} width={tipW} height={tipH} rx={4}
              fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={tipX + 8} y={PT + 18} fontSize={11} fontWeight="600" fill="hsl(var(--popover-foreground))">
              {fmtMonth(labels[hovered])}
            </text>
            {[4,3,2,1,0].map((si, ri) => (
              <g key={si}>
                <rect x={tipX + 8} y={PT + 26 + ri * 18} width={8} height={8} rx={2} fill={STAR_COLORS[si]} />
                <text x={tipX + 20} y={PT + 34 + ri * 18} fontSize={10} fill="hsl(var(--popover-foreground))">
                  {STAR_LABELS[si]}: {vals[si]} ({Math.round(vals[si] / total * 100)}%)
                </text>
              </g>
            ))}
          </g>
        )
      })()}
    </svg>
  )
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────

interface SearchableOption { value: string; label: string; sub?: string }

function SearchableSelect({
  value, onValueChange, options, placeholder = "Select…", width = "w-56",
}: {
  value:          string
  onValueChange:  (v: string) => void
  options:        SearchableOption[]
  placeholder?:   string
  width?:         string
}) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState("")
  const inputRef            = useRef<HTMLInputElement>(null)

  // Focus search input when popover opens
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  // Clear query on close
  useEffect(() => { if (!open) setQuery("") }, [open])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return q ? options.filter(o =>
      o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q)
    ) : options
  }, [options, query])

  const selected = options.find(o => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex h-8 items-center justify-between gap-1.5 rounded-md border bg-background px-3 text-xs",
          "hover:bg-accent transition-colors", width,
        )}>
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("p-0", width)} style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        {/* Search */}
        <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-6 border-0 p-0 text-xs shadow-none focus-visible:ring-0 bg-transparent"
          />
        </div>
        {/* Options list */}
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">No results</div>
          ) : (
            filtered.map(o => (
              <button key={o.value}
                onClick={() => { onValueChange(o.value); setOpen(false) }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors",
                  value === o.value && "bg-accent",
                )}>
                <Check className={cn("size-3 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.sub && <span className="block truncate text-muted-foreground">{o.sub}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, diff, sub }: {
  icon:  React.ElementType; label: string; value: string
  diff?: number | null;     sub:   string
}) {
  const positive = diff !== null && diff !== undefined && diff >  2
  const negative = diff !== null && diff !== undefined && diff < -2
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3.5 shrink-0" /> {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="flex items-center gap-1 text-[11px]">
        {diff == null ? (
          <Minus className="size-3 text-muted-foreground" />
        ) : positive ? (
          <TrendingUp className="size-3 text-[hsl(var(--success))]" />
        ) : negative ? (
          <TrendingDown className="size-3 text-destructive" />
        ) : (
          <Minus className="size-3 text-muted-foreground" />
        )}
        <span className={cn("font-medium",
          positive ? "text-[hsl(var(--success))]" : negative ? "text-destructive" : "text-muted-foreground")}>
          {diff == null ? "—" : `${diff > 0 ? "+" : ""}${diff}%`}
        </span>
        <span className="text-muted-foreground">{sub}</span>
      </div>
    </div>
  )
}

// ─── ChartCard ────────────────────────────────────────────────────────────────

function ChartCard({ title, legend, children }: { title: string; legend?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{title}</span>
        {legend}
      </div>
      {children}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GbpInsightsPage() {
  const { currentTenant } = useApp()
  const [range,  setRange]  = useState<RangeKey>("1Y")
  const [city,   setCity]   = useState("all")
  const [locId,  setLocId]  = useState("all")

  const locs = useMemo(
    () => GBP_LOCATIONS.filter(l => l.tenantId === currentTenant.id),
    [currentTenant.id],
  )

  const allCities = useMemo(
    () => [...new Set(locs.map(l => l.city))].sort(),
    [locs],
  )

  /** Locations visible in the location dropdown (city-scoped). */
  const cityLocs = useMemo(
    () => city === "all" ? locs : locs.filter(l => l.city === city),
    [locs, city],
  )

  /** Changing city resets the per-location selection. */
  const handleCityChange = (c: string) => { setCity(c); setLocId("all") }

  /** Full time-series for selected scope. */
  const fullSeries = useMemo<GbpInsightPoint[]>(() => {
    if (locId === "all") {
      return aggregatePoints(cityLocs.map(l => GBP_INSIGHTS[l.id]).filter(Boolean))
    }
    return GBP_INSIGHTS[locId] ?? []
  }, [cityLocs, locId])

  const n        = RANGE_N[range]
  const curr     = useMemo(() => sliceRange(fullSeries, n), [fullSeries, n])
  const prior    = useMemo(() => priorSlice(fullSeries, n), [fullSeries, n])
  const labels   = curr.map(p => p.month)

  // KPI totals
  const kpi = useMemo(() => ({
    clicks:     sumField(curr,  "clicks"),
    calls:      sumField(curr,  "calls"),
    directions: sumField(curr,  "directions"),
    reviews:    sumField(curr,  "newReviews"),
    avgRating:  avgField(curr,  "avgRating"),
  }), [curr])

  const prev = useMemo(() => ({
    clicks:     sumField(prior, "clicks"),
    calls:      sumField(prior, "calls"),
    directions: sumField(prior, "directions"),
    reviews:    sumField(prior, "newReviews"),
  }), [prior])

  const compLabel = range === "ALL" ? "" : `vs prior ${RANGE_N[range]!} mo`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="GBP Insights"
        description="Historical performance analytics across all Google Business Profile locations"
        action={{ label: "Export CSV", onClick: () => {} }}
      />

      {/* ── Toolbar ── */}
      <div className="border-b bg-background px-6 py-3 shrink-0 flex items-center gap-2 flex-wrap">
        {/* Date range pills */}
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {(["1M","3M","6M","1Y","ALL"] as RangeKey[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                range === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {r}
            </button>
          ))}
        </div>

        {/* City selector */}
        <Select value={city} onValueChange={handleCityChange}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {allCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Location selector — searchable, scoped to selected city */}
        <SearchableSelect
          value={locId}
          onValueChange={setLocId}
          width="w-56"
          options={[
            {
              value: "all",
              label: `All locations (${cityLocs.length}${city !== "all" ? ` in ${city}` : ""})`,
            },
            ...cityLocs.map(l => ({ value: l.id, label: l.name, sub: l.city })),
          ]}
        />

        <div className="ml-auto text-[11px] text-muted-foreground">
          {curr.length} months · {curr[0] ? `${fmtMonth(curr[0].month)} → ${fmtMonth(curr[curr.length-1].month)}` : "—"}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={MousePointerClick} label="Location page clicks"
            value={fmtK(kpi.clicks)}   diff={pctDiff(kpi.clicks,     prev.clicks)}     sub={compLabel} />
          <KpiCard icon={Phone}           label="Phone calls"
            value={fmtK(kpi.calls)}    diff={pctDiff(kpi.calls,      prev.calls)}      sub={compLabel} />
          <KpiCard icon={Navigation}      label="Direction requests"
            value={fmtK(kpi.directions)} diff={pctDiff(kpi.directions, prev.directions)} sub={compLabel} />
          <KpiCard icon={Star}            label="New reviews"
            value={fmtK(kpi.reviews)}  diff={pctDiff(kpi.reviews,    prev.reviews)}    sub={compLabel} />
        </div>

        {/* Traffic overview */}
        <ChartCard title="Traffic Overview"
          legend={
            <div className="flex items-center gap-3">
              <LegendDot color={C.clicks}     label="Clicks" />
              <LegendDot color={C.calls}      label="Calls" />
              <LegendDot color={C.directions} label="Directions" />
            </div>
          }>
          <LineChart id="traffic" svgH={200}
            series={[
              { data: curr.map(p => p.clicks),     color: C.clicks,     label: "Clicks"     },
              { data: curr.map(p => p.calls),       color: C.calls,       label: "Calls"      },
              { data: curr.map(p => p.directions),  color: C.directions,  label: "Directions" },
            ]}
            labels={labels} />
        </ChartCard>

        {/* Reviews + Rating side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="New Reviews per Month">
            <BarChart data={curr.map(p => p.newReviews)} labels={labels}
              color={C.reviews} label="Reviews" svgH={160} />
          </ChartCard>

          <ChartCard title="Average Rating Trend">
            <LineChart id="rating" svgH={160}
              series={[{ data: curr.map(p => p.avgRating), color: C.rating, label: "Avg rating" }]}
              labels={labels}
              yDomain={[
                Math.max(1, Math.min(...curr.map(p => p.avgRating)) - 0.3),
                Math.min(5, Math.max(...curr.map(p => p.avgRating)) + 0.3),
              ]}
              formatY={v => v.toFixed(1)}
              showArea={false} />
          </ChartCard>
        </div>

        {/* Rating distribution */}
        <ChartCard title="Rating Distribution Over Time"
          legend={
            <div className="flex items-center gap-3">
              {[4,3,2,1,0].map(si => <LegendDot key={si} color={STAR_COLORS[si]} label={STAR_LABELS[si]} />)}
            </div>
          }>
          <StackedBarChart points={curr} labels={labels} />
        </ChartCard>

      </div>
    </div>
  )
}
