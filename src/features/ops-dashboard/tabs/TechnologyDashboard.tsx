import { Monitor, Smartphone, CreditCard, Camera, AlertCircle, Activity, Wifi } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Status } from "../shared/types"
import { fmt } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { Section, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

const statusColor = (s: Status) =>
  s === "good" ? "text-[hsl(var(--success))]" : s === "bad" ? "text-destructive" : s === "warn" ? "text-[hsl(var(--warning))]" : "text-muted-foreground"

function posUptimeStatus(v: number): Status {
  return v >= 99.5 ? "good" : v >= 98 ? "warn" : "bad"
}
function appAvailabilityStatus(v: number): Status {
  return v >= 99.9 ? "good" : v >= 99 ? "warn" : "bad"
}
function paymentSuccessStatus(v: number): Status {
  return v >= 99 ? "good" : v >= 97 ? "warn" : "bad"
}
function cctvStatus(v: number): Status {
  return v >= 98 ? "good" : v >= 95 ? "warn" : "bad"
}
function integrationErrorStatus(v: number): Status {
  return v <= 2 ? "good" : v <= 5 ? "warn" : "bad"
}

function statusDotColor(s: Status): string {
  if (s === "good") return "bg-[hsl(var(--success))]"
  if (s === "warn") return "bg-[hsl(var(--warning))]"
  if (s === "bad")  return "bg-destructive"
  return "bg-muted-foreground/30"
}

interface MetricCardProps {
  label: string
  value: string
  status: Status
  active: boolean
  onClick: () => void
}

function MetricCard({ label, value, status, active, onClick }: MetricCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden transition-colors cursor-pointer hover:bg-muted/30",
        active && "ring-2 ring-primary ring-offset-1",
        status === "bad"  && "border-destructive/40",
        status === "warn" && "border-[hsl(var(--warning))]/40",
        status === "good" && "border-[hsl(var(--success))]/25",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</p>
          <span className={cn("size-2 rounded-full shrink-0 mt-0.5", statusDotColor(status))} />
        </div>
        <p className={cn("text-2xl font-bold leading-none tabular-nums", statusColor(status))}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function TechnologyView({ d, onDrill, activeDrill }: Props) {
  const techAlerts = d.alerts.filter(a => a.tag === "Technology")

  const posStatus     = posUptimeStatus(d.posUptimePct)
  const appStatus     = appAvailabilityStatus(d.appAvailability)
  const payStatus     = paymentSuccessStatus(d.paymentSuccessRate)
  const cctvSt        = cctvStatus(d.cctvCoverage)
  const apiStatus     = integrationErrorStatus(d.integrationErrorRate)
  const affectedStores = Math.round((100 - d.posUptimePct) / 100 * d.storeCount)
  const onlineCameras  = Math.round(d.cctvCoverage / 100 * d.storeCount * 4)
  const offlineCameras = (d.storeCount * 4) - onlineCameras

  const metrics: {
    id: string
    label: string
    value: string
    status: Status
    content: DrillContent
  }[] = [
    {
      id: "tech:posUptime",
      label: "POS Uptime",
      value: `${d.posUptimePct}%`,
      status: posStatus,
      content: {
        title: "POS Uptime",
        value: `${d.posUptimePct}%`,
        status: posStatus,
        rows: [
          { label: "Fleet uptime",      value: `${d.posUptimePct}%`,        status: posStatus },
          { label: "Affected stores",   value: `${affectedStores} stores`,   status: affectedStores === 0 ? "good" : affectedStores <= 5 ? "warn" : "bad" },
          { label: "SLA target",        value: "99.5%",                      status: "neutral" },
          ...(posStatus === "bad" ? [{ label: "Action", value: "Escalate to IT — P0", status: "bad" as Status }] : []),
        ],
      },
    },
    {
      id: "tech:appAvailability",
      label: "App Availability",
      value: `${d.appAvailability}%`,
      status: appStatus,
      content: {
        title: "App Availability",
        value: `${d.appAvailability}%`,
        status: appStatus,
        rows: [
          { label: "Mobile app",   value: `${d.appAvailability}%`,                                  status: appStatus },
          { label: "Web app",      value: `${Math.min(100, d.appAvailability + 0.05).toFixed(2)}%`,  status: appAvailabilityStatus(Math.min(100, d.appAvailability + 0.05)) },
          { label: "API gateway",  value: `${Math.min(100, d.appAvailability - 0.1).toFixed(2)}%`,   status: appAvailabilityStatus(Math.min(100, d.appAvailability - 0.1)) },
        ],
      },
    },
    {
      id: "tech:paymentSuccess",
      label: "Payment Success",
      value: `${d.paymentSuccessRate}%`,
      status: payStatus,
      content: {
        title: "Payment Success Rate",
        value: `${d.paymentSuccessRate}%`,
        status: payStatus,
        rows: [
          { label: "Card payments",      value: `${d.paymentSuccessRate}%`,                                   status: payStatus },
          { label: "QR/wallet",          value: `${Math.min(100, d.paymentSuccessRate + 0.2).toFixed(1)}%`,   status: paymentSuccessStatus(Math.min(100, d.paymentSuccessRate + 0.2)) },
          { label: "Cash (excluded)",    value: "N/A",                                                        status: "neutral" },
        ],
      },
    },
    {
      id: "tech:cctvCoverage",
      label: "CCTV Online",
      value: `${d.cctvCoverage}%`,
      status: cctvSt,
      content: {
        title: "CCTV Coverage",
        value: `${d.cctvCoverage}%`,
        status: cctvSt,
        rows: [
          { label: "Online cameras",    value: `${onlineCameras} units`,    status: "good" },
          { label: "Offline",           value: `${offlineCameras} units`,   status: offlineCameras === 0 ? "good" : offlineCameras <= 20 ? "warn" : "bad" },
          { label: "Coverage target",  value: "98%",                        status: "neutral" },
        ],
      },
    },
    {
      id: "tech:integrationError",
      label: "API Error Rate",
      value: `${d.integrationErrorRate}/1K`,
      status: apiStatus,
      content: {
        title: "Integration Error Rate",
        value: `${d.integrationErrorRate} / 1000 calls`,
        status: apiStatus,
        rows: [
          { label: "Error rate",    value: `${d.integrationErrorRate} per 1000 calls`,  status: apiStatus },
          { label: "SLA — good",   value: "≤2 per 1000",                                status: "neutral" },
          { label: "SLA — warn",   value: "3–5 per 1000",                               status: "neutral" },
          { label: "SLA — bad",    value: ">5 per 1000",                                status: "neutral" },
        ],
        note: "Integration errors include API gateway, middleware, and third-party connector failures.",
      },
    },
    {
      id: "tech:mobileAppDau",
      label: "Mobile DAU",
      value: fmt(d.mobileAppDau),
      status: "neutral" as Status,
      content: {
        title: "Mobile App DAU",
        value: fmt(d.mobileAppDau),
        status: "neutral" as Status,
        rows: [
          { label: "Daily active users",   value: fmt(d.mobileAppDau),                              status: "neutral" },
          { label: "App availability",     value: `${d.appAvailability}%`,                          status: appStatus },
          { label: "Sessions/user avg",    value: "2.4x",                                           status: "neutral" },
        ],
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Section 1: System Availability */}
      <Section icon={Monitor} label="System Availability" color="bg-[hsl(var(--epic-blue))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map(m => (
            <MetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              status={m.status}
              active={activeDrill === m.id}
              onClick={() => onDrill(m.content)}
            />
          ))}
        </div>
      </Section>

      {/* Section 2: IT Incidents */}
      <Section icon={AlertCircle} label="IT Incidents" color="bg-destructive">
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Severity summary */}
            <div className="grid grid-cols-3 gap-4 pb-4 border-b">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-destructive">{d.itIncidents.sev1}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">SEV1 — Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-[hsl(var(--warning))]">{d.itIncidents.sev2}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">SEV2 — Major</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-muted-foreground">{d.itIncidents.sev3}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">SEV3 — Minor</p>
              </div>
            </div>

            {/* Incidents table */}
            {d.systemIncidents.length > 0 ? (
              <div className="overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-3">Time</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-3">System</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-3">Store</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-3">Downtime</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {d.systemIncidents.map((inc, i) => {
                      const incStatus: Status = inc.status === "open" ? "bad" : "neutral"
                      const isActive = activeDrill === `incident:${inc.system}`
                      return (
                        <tr
                          key={i}
                          onClick={() =>
                            onDrill({
                              title: inc.system,
                              status: incStatus,
                              rows: [
                                { label: "Time",     value: inc.time,                      status: "neutral" },
                                { label: "Store",    value: inc.store ?? "Fleet-wide",      status: "neutral" },
                                { label: "Downtime", value: `${inc.downtime} min`,          status: inc.downtime > 60 ? "bad" : inc.downtime > 20 ? "warn" : "neutral" },
                                { label: "Status",   value: inc.status,                     status: incStatus },
                              ],
                            })
                          }
                          className={cn(
                            "cursor-pointer hover:bg-muted/30 transition-colors",
                            isActive && "bg-muted/40",
                          )}
                        >
                          <td className="py-2.5 pr-3 text-muted-foreground tabular-nums whitespace-nowrap">{inc.time}</td>
                          <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{inc.system}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{inc.store ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums whitespace-nowrap">{inc.downtime}m</td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              inc.status === "open"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]",
                            )}>
                              {inc.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No system incidents in this period</p>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* Section 3: Technology Alerts */}
      {techAlerts.length > 0 && (
        <Section icon={Activity} label="Technology Alerts" color="bg-destructive">
          <div className="space-y-1.5">
            {techAlerts.map((a, i) => (
              <AlertRow key={i} a={a} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

export default TechnologyView
