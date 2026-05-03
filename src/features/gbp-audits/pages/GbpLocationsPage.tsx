import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { GBP_LOCATIONS } from "../constants"
import { LocationsTable } from "../components/LocationsTable"
import { LocationDetailPanel } from "../components/LocationDetailPanel"
import type { GbpHealthStatus, GbpLocation } from "@/types"

// All cities derived from mock data
const ALL_CITIES = [...new Set(GBP_LOCATIONS.map(l => l.city))].sort()

const MISSING_FIELD_OPTIONS = [
  { value: "all",         label: "All fields"       },
  { value: "website",     label: "Missing website"  },
  { value: "phone",       label: "Missing phone"    },
  { value: "hours",       label: "Missing hours"    },
  { value: "photos",      label: "Low photos (<5)"  },
  { value: "description", label: "No description"   },
]

export function GbpLocationsPage() {
  const { currentTenant } = useApp()

  const [search,   setSearch]   = useState("")
  const [health,   setHealth]   = useState<GbpHealthStatus | "all">("all")
  const [city,     setCity]     = useState("all")
  const [missing,  setMissing]  = useState("all")
  const [selected, setSelected] = useState<GbpLocation | null>(null)

  const base = useMemo(
    () => GBP_LOCATIONS.filter(l => l.tenantId === currentTenant.id),
    [currentTenant.id],
  )

  const filtered = useMemo(() => {
    return base
      .filter(l => health  === "all" || l.status === health)
      .filter(l => city    === "all" || l.city   === city)
      .filter(l => {
        if (missing === "all")         return true
        if (missing === "website")     return !l.fields.hasWebsite
        if (missing === "phone")       return !l.fields.hasPhone
        if (missing === "hours")       return !l.fields.hasHours
        if (missing === "photos")      return l.fields.photoCount < 5
        if (missing === "description") return !l.fields.hasDescription
        return true
      })
      .filter(l => {
        if (!search) return true
        const q = search.toLowerCase()
        return l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
      })
  }, [base, health, city, missing, search])

  const critical   = filtered.filter(l => l.status === "critical").length
  const warning    = filtered.filter(l => l.status === "warning").length
  const healthy    = filtered.filter(l => l.status === "healthy").length
  const nameIssues = filtered.filter(l => !l.nameIsCorrect).length

  const hasFilters = health !== "all" || city !== "all" || missing !== "all" || search !== ""
  const clearFilters = () => {
    setHealth("all"); setCity("all"); setMissing("all"); setSearch("")
  }

  const handleSelect = (loc: GbpLocation) => {
    setSelected(prev => prev?.id === loc.id ? null : loc)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="GBP Locations"
        description={`${base.length} listings · manage and audit Google Business Profiles`}
        action={{ label: "Export CSV", onClick: () => {} }}
      />

      {/* ── Toolbar ── */}
      <div className="border-b bg-background px-6 py-3 shrink-0 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Search by name or address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Health status */}
          <Select value={health} onValueChange={v => setHealth(v as GbpHealthStatus | "all")}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Health status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>

          {/* City */}
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {ALL_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Missing field */}
          <Select value={missing} onValueChange={setMissing}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MISSING_FIELD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
              Clear
            </button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} results</div>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground">Filtered:</span>
          <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{critical} critical</Badge>
          <Badge variant="warning"     className="text-[10px] h-5 px-1.5">{warning} warning</Badge>
          <Badge variant="success"     className="text-[10px] h-5 px-1.5">{healthy} healthy</Badge>
          {nameIssues > 0 && (
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 text-[hsl(var(--warning))] border-[hsl(var(--warning))]")}>
              {nameIssues} name issue{nameIssues > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Split: table + detail panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Table */}
        <div className={cn("flex-1 overflow-auto", selected && "border-r")}>
          <LocationsTable
            locations={filtered}
            compact={false}
            selectedId={selected?.id}
            onSelect={handleSelect}
          />
        </div>

        {/* Detail panel — slides in when a row is selected */}
        {selected && (
          <div className="w-[380px] shrink-0 overflow-hidden flex flex-col">
            <LocationDetailPanel
              location={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
