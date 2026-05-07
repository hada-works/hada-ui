import { useState } from "react"
import { Target, Activity, BarChart3, Truck, Globe, Monitor, Wallet, ShieldCheck, MapPin, Store } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { PERIODS, MOCK } from "./shared/mock-data"
import type { TabId } from "./shared/types"
import type { DrillContent } from "./shared/primitives"
import { DrillSidebar } from "./shared/primitives"
import { ExecutiveView }   from "./tabs/ExecutiveDashboard"
import { OperationsView }  from "./tabs/OperationsDashboard"
import { CommercialView }  from "./tabs/CommercialDashboard"
import { SupplyChainView } from "./tabs/SupplyChainDashboard"
import { RegionalView }    from "./tabs/RegionalDashboard"
import { TechnologyView }  from "./tabs/TechnologyDashboard"
import { FinanceView }     from "./tabs/FinanceDashboard"
import { FoodSafetyView } from "./tabs/FoodSafetyDashboard"
import { ExpansionView }  from "./tabs/ExpansionDashboard"
import { StoreView }      from "./tabs/StoreDashboard"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "executive",  label: "Executive",    icon: Target    },
  { id: "operations", label: "Operations",   icon: Activity  },
  { id: "commercial", label: "Commercial",   icon: BarChart3 },
  { id: "supply",     label: "Supply Chain", icon: Truck     },
  { id: "regional",    label: "Regional",     icon: Globe     },
  { id: "technology",  label: "Technology",   icon: Monitor   },
  { id: "finance",     label: "Finance",      icon: Wallet    },
  { id: "foodsafety", label: "Food Safety",  icon: ShieldCheck },
  { id: "expansion",  label: "Expansion",    icon: MapPin    },
  { id: "store",      label: "Store View",   icon: Store     },
]

export function DashboardPage() {
  const [period, setPeriod]           = useState<string>("today")
  const [tab, setTab]                 = useState<TabId>("executive")
  const [drillContent, setDrillContent] = useState<DrillContent | null>(null)

  const d = MOCK[period]

  // Alert counts per tab — dùng để hiển thị badge trên tab bar
  const alertsByTab: Record<string, number> = {
    executive:  d.alerts.filter(a => a.level === "critical").length,
    operations: d.alerts.filter(a => a.tag === "Operations" && a.level !== "info").length,
    commercial: d.alerts.filter(a => a.tag === "Commercial" && a.level !== "info").length,
    supply:     d.alerts.filter(a => a.tag === "Supply Chain" && a.level !== "info").length,
    regional:    d.alerts.filter(a => a.tag === "Regional"    && a.level !== "info").length,
    technology:  d.alerts.filter(a => a.tag === "Technology"  && a.level !== "info").length,
    finance:     d.alerts.filter(a => a.tag === "Finance"     && a.level !== "info").length,
    foodsafety:  d.alerts.filter(a => (a.tag === "Operations" && a.msg.toLowerCase().includes("attp")) && a.level !== "info").length,
    expansion:   d.alerts.filter(a => a.msg.toLowerCase().includes("permit") && a.level !== "info").length,
    store:       0,
  }
  const critCount = alertsByTab["executive"]

  const activeDrill = drillContent?.title ?? null

  // Close sidebar when switching tabs
  const handleTabChange = (t: TabId) => {
    setDrillContent(null)
    setTab(t)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Operations Command Center"
        description={`${d.storeCount} cửa hàng · 5 tầng lãnh đạo · pipeline ${d.storePipeline} sites`}
        actions={
          <Select value={period} onValueChange={(v) => { setDrillContent(null); setPeriod(v) }}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Tab bar */}
      <div className="border-b bg-background shrink-0">
        <div className="flex overflow-x-auto px-5">
          {TABS.map(t => {
            const Icon   = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="size-3.5" />
                {t.label}
                {alertsByTab[t.id] > 0 && (
                  <span className={cn(
                    "ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white leading-none",
                    t.id === "executive" ? "bg-destructive" : "bg-[hsl(var(--warning))]",
                  )}>
                    {alertsByTab[t.id]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 max-w-6xl mx-auto">
          {tab === "executive"  && (
            <ExecutiveView
              d={d}
              period={period}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "operations" && (
            <OperationsView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "commercial" && (
            <CommercialView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "supply"     && (
            <SupplyChainView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "regional"   && (
            <RegionalView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "technology" && (
            <TechnologyView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "finance" && (
            <FinanceView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "foodsafety" && (
            <FoodSafetyView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "expansion" && (
            <ExpansionView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
          {tab === "store" && (
            <StoreView
              d={d}
              onDrill={setDrillContent}
              activeDrill={activeDrill}
            />
          )}
        </div>
      </ScrollArea>

      {/* Global drill sidebar — rendered outside ScrollArea so it covers the full viewport */}
      <DrillSidebar
        content={drillContent}
        onClose={() => setDrillContent(null)}
      />
    </div>
  )
}

export default DashboardPage
