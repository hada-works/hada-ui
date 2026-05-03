import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Search } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { GBP_LOCATIONS } from "../mock-data"
import { LocationsTable } from "../components/LocationsTable"
import { LocationDetailPanel } from "../components/LocationDetailPanel"
import type { GbpHealthStatus, GbpLocation } from "@/types"
import type { GroupBy } from "../components/LocationsTable"

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_DEFAULT = 380
const PANEL_MIN     = 260
const PANEL_MAX     = 680

const ALL_CITIES = [...new Set(GBP_LOCATIONS.map(l => l.city))].sort()

const MISSING_FIELD_OPTIONS = [
  { value: "all",         label: "All fields"       },
  { value: "website",     label: "Missing website"  },
  { value: "phone",       label: "Missing phone"    },
  { value: "hours",       label: "Missing hours"    },
  { value: "photos",      label: "Low photos (<5)"  },
  { value: "description", label: "No description"   },
]

// ─── Resizable panel hook ─────────────────────────────────────────────────────

function useResizablePanel(defaultWidth: number) {
  const [width, setWidth] = useState(defaultWidth)
  const dragging  = useRef(false)
  const startX    = useRef(0)
  const startW    = useRef(0)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    // Panel is on the right → dragging handle left increases width
    const delta  = startX.current - e.clientX
    const newW   = Math.min(PANEL_MAX, Math.max(PANEL_MIN, startW.current + delta))
    setWidth(newW)
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    document.body.style.cursor    = ""
    document.body.style.userSelect = ""
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup",   onMouseUp)
  }, [onMouseMove])

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current              = true
    startX.current                = e.clientX
    startW.current                = width
    document.body.style.cursor    = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup",   onMouseUp)
  }, [width, onMouseMove, onMouseUp])

  // Cleanup on unmount
  useEffect(() => () => {
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup",   onMouseUp)
  }, [onMouseMove, onMouseUp])

  return { width, onHandleMouseDown }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GbpLocationsPage() {
  const { currentTenant } = useApp()

  const [search,   setSearch]   = useState("")
  const [health,   setHealth]   = useState<GbpHealthStatus | "all">("all")
  const [city,     setCity]     = useState("all")
  const [missing,  setMissing]  = useState("all")
  const [groupBy,  setGroupBy]  = useState<GroupBy>("none")
  const [selected, setSelected] = useState<GbpLocation | null>(null)

  const { width: panelWidth, onHandleMouseDown } = useResizablePanel(PANEL_DEFAULT)

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
  const clearFilters = () => { setHealth("all"); setCity("all"); setMissing("all"); setSearch("") }

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
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Search by name or address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select value={health} onValueChange={v => setHealth(v as GbpHealthStatus | "all")}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Health status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {ALL_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

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

          <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-8 w-40 text-xs ml-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No group</SelectItem>
              <SelectItem value="city">Group by City</SelectItem>
              <SelectItem value="status">Group by Status</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground">{filtered.length} results</div>
        </div>

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

      {/* ── Split: table + resize handle + detail panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Table — overflow-auto here so the horizontal scrollbar sits at viewport bottom */}
        <div className={cn(
          "flex-1 overflow-auto min-w-0",
          "[&::-webkit-scrollbar]:h-[5px]",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-border",
          "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40",
        )}>
          <LocationsTable
            locations={filtered}
            compact={false}
            groupBy={groupBy}
            selectedId={selected?.id}
            onSelect={handleSelect}
          />
        </div>

        {/* Resize handle — only rendered when panel is open */}
        {selected && (
          <div
            onMouseDown={onHandleMouseDown}
            className="group relative w-[5px] shrink-0 cursor-col-resize bg-border/60 hover:bg-primary/40 active:bg-primary/60 transition-colors"
          >
            {/* Grip dots centred on handle */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="size-[3px] rounded-full bg-primary/70" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div
            className="shrink-0 overflow-hidden flex flex-col border-l"
            style={{ width: panelWidth }}
          >
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
