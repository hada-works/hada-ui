import { useMemo } from "react"
import {
  MapPin, Star, MessageCircle, AlertTriangle,
  CheckCircle2, TrendingUp, Shield, Zap,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { GBP_LOCATIONS, NBA_ACTIONS } from "../constants"
import { HealthBadge } from "../components/HealthBadge"
import { ScoreBar } from "../components/ScoreBar"
import { LocationsTable } from "../components/LocationsTable"
import type { GbpLocation } from "@/types"

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label:  string
  value:  string | number
  sub:    string
  icon:   React.ElementType
  accent: "default" | "destructive" | "warning" | "success" | "info"
}) {
  const color =
    accent === "destructive" ? "text-destructive" :
    accent === "warning"     ? "text-[hsl(var(--warning))]" :
    accent === "success"     ? "text-[hsl(var(--success))]" :
    accent === "info"        ? "text-[hsl(var(--info))]" :
    "text-primary"
  const border =
    accent === "destructive" ? "border-t-destructive" :
    accent === "warning"     ? "border-t-[hsl(var(--warning))]" :
    accent === "success"     ? "border-t-[hsl(var(--success))]" :
    accent === "info"        ? "border-t-[hsl(var(--info))]" :
    "border-t-primary"

  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3.5 border-t-2 transition-shadow hover:shadow-sm", border)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-3.5 shrink-0", color)} />
      </div>
      <div className={cn("text-2xl font-bold leading-none mb-1", color)}>{value}</div>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

// ─── Field completion bar row ─────────────────────────────────────────────────
function CompletionRow({ label, pct }: { label: string; pct: number }) {
  const fill =
    pct >= 80 ? "bg-[hsl(var(--success))]" :
    pct >= 50 ? "bg-[hsl(var(--warning))]" :
                "bg-destructive"
  const color =
    pct >= 80 ? "text-[hsl(var(--success))]" :
    pct >= 50 ? "text-[hsl(var(--warning))]" :
                "text-destructive"
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums w-8 text-right shrink-0", color)}>{pct}%</span>
    </div>
  )
}

// ─── Rating distribution bar ──────────────────────────────────────────────────
function RatingRow({ stars, count, max }: { stars: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const fill = stars >= 4 ? "bg-[hsl(var(--success))]" : stars >= 3 ? "bg-[hsl(var(--warning))]" : "bg-destructive"
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-6 shrink-0">{stars}★</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right shrink-0">
        {count.toLocaleString()}
      </span>
    </div>
  )
}

// ─── NBA action card ──────────────────────────────────────────────────────────
function NbaCard({ action }: { action: typeof NBA_ACTIONS[number] }) {
  const isCritical = action.priority === 1
  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 border-t-2 space-y-3",
      isCritical ? "border-t-destructive" : "border-t-[hsl(var(--warning))]",
    )}>
      <div className="flex items-start gap-2">
        <Badge
          variant={isCritical ? "destructive" : "warning"}
          className="shrink-0 text-[9px] font-bold tracking-wide uppercase"
        >
          {action.label}
        </Badge>
      </div>
      <h3 className="text-sm font-semibold leading-snug">{action.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{action.body}</p>
      <ul className="space-y-1.5">
        {action.actions.map((act, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5 border border-border/50">
            <span className="text-[10px] mt-0.5 shrink-0">▸</span>
            {act}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function GbpDashboardPage() {
  const { currentTenant } = useApp()
  const all = useMemo(
    () => GBP_LOCATIONS.filter(l => l.tenantId === currentTenant.id),
    [currentTenant.id],
  )

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const n = all.length
    if (n === 0) return null

    const critical    = all.filter(l => l.status === "critical")
    const warning     = all.filter(l => l.status === "warning")
    const healthy     = all.filter(l => l.status === "healthy")
    const nameIssues  = all.filter(l => !l.nameIsCorrect)
    const avgScore    = Math.round(all.reduce((s, l) => s + l.healthScore, 0) / n)

    const totalReviews = all.reduce((s, l) => s + l.review.totalCount, 0)
    const avgRating    = totalReviews > 0
      ? all.reduce((s, l) => s + l.review.avgRating * l.review.totalCount, 0) / totalReviews
      : 0
    const avgResp      = Math.round(all.reduce((s, l) => s + l.review.responseRate, 0) / n)

    // Field completion (% of locations that have the field)
    const pct = (fn: (l: GbpLocation) => boolean) => Math.round(all.filter(fn).length / n * 100)
    const completion = {
      website:     pct(l => l.fields.hasWebsite),
      phone:       pct(l => l.fields.hasPhone),
      category:    pct(l => l.fields.hasCategory),
      hours:       pct(l => l.fields.hasHours),
      photos:      pct(l => l.fields.photoCount >= 5),
      description: pct(l => l.fields.hasDescription),
    }

    // Rating distribution totals
    const dist = [0, 0, 0, 0, 0] as [number,number,number,number,number]
    all.forEach(l => l.review.dist.forEach((c, i) => { dist[i] += c }))

    // Sentiment totals
    const posAvg = Math.round(all.reduce((s, l) => s + l.review.positivePct, 0) / n)
    const neuAvg = Math.round(all.reduce((s, l) => s + l.review.neutralPct,  0) / n)
    const negAvg = Math.round(all.reduce((s, l) => s + l.review.negativePct, 0) / n)

    return {
      n, critical, warning, healthy, nameIssues, avgScore,
      totalReviews, avgRating, avgResp, completion, dist,
      posAvg, neuAvg, negAvg,
    }
  }, [all])

  const problemLocs = useMemo(
    () => [...all].filter(l => l.status !== "healthy").sort((a, b) => a.healthScore - b.healthScore).slice(0, 8),
    [all],
  )

  if (!stats) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="GBP Dashboard" description="No locations found for this workspace." />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="GBP Dashboard"
        description={`${stats.n} listings · Last audit May 2025`}
        action={{ label: "Run Audit", onClick: () => {} }}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 space-y-6">

          {/* ── KPI Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Total Locations"  value={stats.n}                        sub="across Vietnam"              icon={MapPin}        accent="default"     />
            <KpiCard label="Avg Health Score" value={`${stats.avgScore}%`}            sub="national average"            icon={TrendingUp}    accent={stats.avgScore < 30 ? "destructive" : stats.avgScore < 60 ? "warning" : "success"} />
            <KpiCard label="Critical"         value={stats.critical.length}           sub="below 30% — need urgent fix" icon={AlertTriangle} accent="destructive" />
            <KpiCard label="Warning"          value={stats.warning.length}            sub="30–59% — needs attention"    icon={Shield}        accent="warning"     />
            <KpiCard label="Healthy"          value={stats.healthy.length}            sub="60%+ — on track"             icon={CheckCircle2}  accent="success"     />
            <KpiCard label="Name Issues"      value={stats.nameIssues.length}         sub="inconsistent brand name"     icon={Zap}           accent="warning"     />
          </div>

          {/* ── Review KPIs ── */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total Reviews"       value={stats.totalReviews.toLocaleString()} sub="across all listings"          icon={MessageCircle} accent="info"    />
            <KpiCard label="Avg Rating"          value={`${stats.avgRating.toFixed(1)} ★`}   sub="weighted by review count"     icon={Star}          accent="warning" />
            <KpiCard label="Avg Response Rate"   value={`${stats.avgResp}%`}                 sub="target: 80%+"                 icon={MessageCircle} accent={stats.avgResp >= 70 ? "success" : stats.avgResp >= 40 ? "warning" : "destructive"} />
          </div>

          {/* ── Middle Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Field Completion + Health Distribution — left 2 cols */}
            <div className="lg:col-span-2 space-y-4">

              {/* Health distribution */}
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-sm font-semibold mb-4">Health Distribution</h2>
                <div className="space-y-3">
                  {(["critical", "warning", "healthy"] as const).map(s => {
                    const count = all.filter(l => l.status === s).length
                    const pct   = Math.round(count / stats.n * 100)
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <HealthBadge status={s} className="w-16 justify-center text-[10px]" />
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              s === "critical" ? "bg-destructive" :
                              s === "warning"  ? "bg-[hsl(var(--warning))]" :
                                                  "bg-[hsl(var(--success))]"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-24 shrink-0 text-right">
                          {count} locations · {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Name inconsistencies</span>
                    <span className="text-xs font-medium text-[hsl(var(--warning))]">
                      {stats.nameIssues.length} / {stats.n} listings
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--warning))]"
                      style={{ width: `${Math.round(stats.nameIssues.length / stats.n * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    GBP name must exactly match "Hada Market" for consistent brand ranking.
                  </p>
                </div>
              </div>

              {/* Field Completion */}
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-sm font-semibold mb-4">Profile Field Completion</h2>
                <div className="space-y-2.5">
                  <CompletionRow label="Website URL"  pct={stats.completion.website}     />
                  <CompletionRow label="Phone number" pct={stats.completion.phone}       />
                  <CompletionRow label="Category"     pct={stats.completion.category}    />
                  <CompletionRow label="Opening hours" pct={stats.completion.hours}      />
                  <CompletionRow label="Photos (≥5)"  pct={stats.completion.photos}      />
                  <CompletionRow label="Description"  pct={stats.completion.description} />
                </div>
              </div>
            </div>

            {/* Review Summary — right col */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-sm font-semibold mb-4">Review & Reputation</h2>

                {/* Big rating */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</span>
                  <span className="text-base text-[hsl(var(--warning))]">★★★★☆</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  {stats.totalReviews.toLocaleString()} reviews · {stats.n} locations
                </p>

                {/* Rating distribution */}
                <div className="space-y-1.5 mb-4">
                  {[5, 4, 3, 2, 1].map(s => (
                    <RatingRow
                      key={s}
                      stars={s}
                      count={stats.dist[s - 1]}
                      max={Math.max(...stats.dist)}
                    />
                  ))}
                </div>

                {/* Response rate */}
                <div className="border-t pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg response rate</span>
                    <span className={cn(
                      "text-sm font-bold",
                      stats.avgResp < 40 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"
                    )}>
                      {stats.avgResp}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--warning))]"
                      style={{ width: `${stats.avgResp}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Target: 80%+ to improve Map pack visibility</p>
                </div>

                {/* Sentiment */}
                <div className="border-t pt-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Sentiment</p>
                  {[
                    { label: "Positive", pct: stats.posAvg, cls: "bg-[hsl(var(--success))]" },
                    { label: "Neutral",  pct: stats.neuAvg, cls: "bg-[hsl(var(--warning))]" },
                    { label: "Negative", pct: stats.negAvg, cls: "bg-destructive" },
                  ].map(({ label, pct, cls }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-14 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", cls)} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right shrink-0">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Next Best Actions ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">Next Best Actions</h2>
              <Badge variant="secondary" className="text-[10px]">{NBA_ACTIONS.length} recommendations</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NBA_ACTIONS.map(action => <NbaCard key={action.id} action={action} />)}
            </div>
          </div>

          {/* ── Problem Locations ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">Critical &amp; Warning Locations</h2>
              <Badge variant="secondary" className="text-[10px]">{problemLocs.length} locations</Badge>
            </div>
            <div className="rounded-lg border bg-card overflow-hidden">
              <LocationsTable locations={problemLocs} compact />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
