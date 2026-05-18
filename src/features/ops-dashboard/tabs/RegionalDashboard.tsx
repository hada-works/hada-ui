import { Globe, AlertTriangle, Layers, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Status } from "../shared/types"
import { fmtVnd } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { Section, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

export function RegionalView({ d, onDrill, activeDrill }: Props) {
  const regAlerts = d.alerts.filter(a => a.tag === "Regional")

  return (
    <div className="space-y-6">
      <Section icon={Globe} label="Hiệu suất theo vùng địa lý" color="bg-[hsl(var(--epic-blue))]">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <span>Vùng</span>
          <span className="text-right w-20">Rev/store</span>
          <span className="text-right w-16">vs Plan</span>
          <span className="text-right w-12">SSS</span>
          <span className="text-right w-14">OOS Rate</span>
          <span className="text-right w-14">Health</span>
        </div>

        <div className="space-y-1 mt-1">
          {d.regions.map((r) => {
            const revStatus: Status = r.revVsPlan >= 2 ? "good" : r.revVsPlan >= -1 ? "warn" : "bad"
            const isActive = activeDrill === `region:${r.name}`

            const drillContent: DrillContent = {
              title: r.name,
              value: `${r.revVsPlan >= 0 ? "+" : ""}${r.revVsPlan}% vs plan`,
              status: revStatus,
              rows: [
                { label: "Rev/store/ngày",  value: fmtVnd(r.revPerStore), sub: `Fleet avg: ${fmtVnd(Math.round(d.totalRevenue / d.storeCount))}`, status: (r.revPerStore >= Math.round(d.totalRevenue / d.storeCount) ? "good" : "warn") as Status },
                { label: "Cửa hàng",       value: `${r.stores}${r.newStores > 0 ? ` (${r.newStores} mới)` : ""}`, status: "neutral" as Status },
                { label: "SSS growth",     value: `+${r.sss}%`,      status: (r.sss >= 5 ? "good" : r.sss >= 3 ? "warn" : "bad") as Status },
                { label: "OOS rate",       value: `${r.oosRate}%`,   status: (r.oosRate <= 3.5 ? "good" : r.oosRate <= 5 ? "warn" : "bad") as Status },
                { label: "Health ≥ target",value: `${r.healthGreen}%`, status: (r.healthGreen >= 65 ? "good" : r.healthGreen >= 50 ? "warn" : "bad") as Status },
                { label: "Labor cost % rev",value: `${r.laborPct}%`, status: (r.laborPct <= 14.0 ? "good" : r.laborPct <= 14.5 ? "warn" : "bad") as Status },
                { label: "Shrinkage",      value: `${r.shrinkage}%`, status: (r.shrinkage <= 0.5 ? "good" : r.shrinkage <= 0.65 ? "warn" : "bad") as Status },
                { label: "Pipeline sites", value: `${r.pipeline}`, status: "neutral" as Status },
                { label: "Lease cost/sqm/tháng", value: fmtVnd(r.leaseCostSqm), status: (r.leaseCostSqm <= 400_000 ? "good" : r.leaseCostSqm <= 500_000 ? "warn" : "bad") as Status },
              ],
              sections: [
                {
                  label: "Hành động",
                  rows: revStatus === "bad" ? [
                    { label: "Priority", value: "Root cause báo cáo trong 24h", status: "bad" as Status },
                    { label: "Check",    value: `OOS ${r.oosRate}% — kiểm tra supplier coverage`, status: "warn" as Status },
                    { label: "Escalate", value: "Regional Director cần action plan", status: "bad" as Status },
                  ] : revStatus === "good" && r.revVsPlan >= 3 ? [
                    { label: "Best practice", value: "Nhân rộng playbook sang vùng khác", status: "good" as Status },
                    { label: "OOS",           value: `${r.oosRate}% — dưới ngưỡng tốt`, status: "good" as Status },
                    { label: "Labor",         value: `${r.laborPct}% — trong target`, status: r.laborPct <= 14.0 ? "good" as Status : "warn" as Status },
                  ] : [
                    { label: "Trạng thái", value: "Theo dõi — trong khoảng bình thường", status: "neutral" as Status },
                    { label: "OOS",        value: `${r.oosRate}%`, status: (r.oosRate <= 3.5 ? "good" : "warn") as Status },
                    { label: "Labor",      value: `${r.laborPct}%`, status: (r.laborPct <= 14.0 ? "good" : "warn") as Status },
                  ],
                },
              ],
            }

            return (
              <button
                key={r.name}
                className={cn(
                  "w-full grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 text-left",
                  "rounded-lg border overflow-hidden transition-colors hover:bg-muted/30",
                  revStatus === "bad"  ? "border-destructive/25" :
                  revStatus === "warn" ? "border-[hsl(var(--warning))]/25" : "border-border",
                  isActive && "ring-2 ring-primary ring-offset-1",
                )}
                onClick={() => onDrill(drillContent)}
              >
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.stores} stores{r.newStores > 0 ? ` · ${r.newStores} mới` : ""}
                  </p>
                </div>
                <p className={cn(
                  "text-xs font-semibold tabular-nums text-right w-20",
                  r.revPerStore >= Math.round(d.totalRevenue / d.storeCount) ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]",
                )}>
                  {fmtVnd(r.revPerStore)}
                </p>
                <p className={cn(
                  "text-sm font-bold tabular-nums text-right w-16",
                  r.revVsPlan >= 2 ? "text-[hsl(var(--success))]" :
                  r.revVsPlan >= -1 ? "text-[hsl(var(--warning))]" : "text-destructive",
                )}>
                  {r.revVsPlan >= 0 ? "+" : ""}{r.revVsPlan}%
                </p>
                <p className={cn(
                  "text-sm font-bold tabular-nums text-right w-12",
                  r.sss >= 5 ? "text-[hsl(var(--success))]" :
                  r.sss >= 3 ? "text-[hsl(var(--warning))]" : "text-destructive",
                )}>
                  +{r.sss}%
                </p>
                <p className={cn(
                  "text-sm font-bold tabular-nums text-right w-14",
                  r.oosRate <= 3.5 ? "text-[hsl(var(--success))]" :
                  r.oosRate <= 5   ? "text-[hsl(var(--warning))]" : "text-destructive",
                )}>
                  {r.oosRate}%
                </p>
                <p className={cn(
                  "text-sm font-bold tabular-nums text-right w-14",
                  r.healthGreen >= 65 ? "text-[hsl(var(--success))]" :
                  r.healthGreen >= 50 ? "text-[hsl(var(--warning))]" : "text-destructive",
                )}>
                  {r.healthGreen}%
                </p>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Fleet percentile distribution */}
      <Section icon={Layers} label="Fleet performance distribution" color="bg-[hsl(var(--epic-emerald))]">
        <Card>
          <CardContent className="p-4">
            <div className="flex h-4 w-full rounded-full overflow-hidden mb-3">
              <div className="bg-[hsl(var(--success))]"      title="Stars"    style={{ width: `${d.storeBands.p80}%` }} />
              <div className="bg-[hsl(var(--success))]/50"   title="Strong"   style={{ width: `${d.storeBands.p60}%` }} />
              <div className="bg-muted-foreground/30"        title="Core"     style={{ width: `${d.storeBands.p40}%` }} />
              <div className="bg-[hsl(var(--warning))]"      title="Under"    style={{ width: `${d.storeBands.p20}%` }} />
              <div className="bg-destructive rounded-r-full" title="Critical" style={{ width: `${d.storeBands.p0}%` }} />
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { l: "Stars",    p: d.storeBands.p80, c: "text-[hsl(var(--success))]" },
                { l: "Strong",   p: d.storeBands.p60, c: "text-[hsl(var(--success))]" },
                { l: "Core",     p: d.storeBands.p40, c: "text-foreground" },
                { l: "Under",    p: d.storeBands.p20, c: "text-[hsl(var(--warning))]" },
                { l: "Critical", p: d.storeBands.p0,  c: "text-destructive" },
              ].map(b => (
                <div key={b.l}>
                  <p className={cn("text-sm font-bold tabular-nums", b.c)}>{b.p}%</p>
                  <p className="text-[10px] text-muted-foreground">{b.l}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Click vào vùng ở trên để xem chi tiết từng region
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Expansion Pipeline */}
      <Section icon={MapPin} label="Expansion Pipeline" color="bg-[hsl(var(--epic-violet))]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {d.regions.map((r) => (
            <Card key={r.name}>
              <CardContent className="p-4 space-y-1.5">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className={cn(
                  "text-xl font-bold tabular-nums",
                  r.pipeline >= 15 ? "text-[hsl(var(--success))]" :
                  r.pipeline >= 8  ? "text-[hsl(var(--warning))]" : "text-muted-foreground",
                )}>
                  {r.pipeline} sites
                </p>
                <p className="text-[11px] text-muted-foreground">{r.stores} stores hiện tại</p>
                <p className="text-[11px] text-muted-foreground">{fmtVnd(r.leaseCostSqm)}/sqm/tháng</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Cluster Format Performance */}
      <Section icon={Layers} label="Cluster Format Performance" color="bg-[hsl(var(--epic-blue))]">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Cluster</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Stores</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">SSS</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">vs Plan</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Avg Basket</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {d.clusterPerf.map((c) => (
                    <tr key={c.cluster} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{c.cluster}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{c.stores}</td>
                      <td className={cn(
                        "px-4 py-2.5 text-right tabular-nums font-semibold",
                        c.sss >= 8 ? "text-[hsl(var(--success))]" :
                        c.sss >= 5 ? "text-[hsl(var(--warning))]" : "text-destructive",
                      )}>
                        +{c.sss}%
                      </td>
                      <td className={cn(
                        "px-4 py-2.5 text-right tabular-nums font-semibold",
                        c.revVsPlan >= 3 ? "text-[hsl(var(--success))]" :
                        c.revVsPlan >= 0 ? "text-[hsl(var(--warning))]" : "text-destructive",
                      )}>
                        {c.revVsPlan >= 0 ? "+" : ""}{c.revVsPlan}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmtVnd(c.avgBasket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {regAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Alerts regional" color="bg-destructive">
          <div className="space-y-1.5">
            {regAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

export default RegionalView
