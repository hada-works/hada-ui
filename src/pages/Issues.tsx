import * as React from "react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Bug, Search, LayoutList, Kanban, Layers, Zap, ChevronDown, ChevronRight } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IssueStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ISSUES, PROJECTS, EPICS, SPRINTS } from "@/store/mock-data"
import { useApp } from "@/store/app-store"
import { Issue, IssueStatus, IssueType } from "@/types"
import { cn } from "@/lib/utils"

// ─── Issue type — left-border accent mapped to semantic CSS vars ──────────────
const TYPE_BORDER: Record<IssueType, string> = {
  task:    "border-l-[hsl(var(--info))]",
  bug:     "border-l-destructive",
  story:   "border-l-[hsl(var(--info)/0.6)]",
  subtask: "border-l-[hsl(var(--warning))]",
}

const TYPE_LABEL: Record<IssueType, string> = {
  task:    "Task",
  bug:     "Bug",
  story:   "Story",
  subtask: "Sub-task",
}

// Epic chips: categorical palette mapped to CSS vars (design token compliant)
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

// Kanban status dot — these are purely decorative accent dots, not semantic text
// Decorative status dots — small colour hints, not semantic text
// Decorative dots — mirror badge variant hues (purely visual, small size)
const STATUS_DOT: Record<IssueStatus, string> = {
  backlog:     "bg-muted-foreground/40",
  todo:        "bg-muted-foreground/60",
  in_progress: "bg-[hsl(var(--warning))]",
  in_review:   "bg-primary/50",
  done:        "bg-[hsl(var(--success))]",
  cancelled:   "bg-muted-foreground/30",
}

const STATUS_TABS = [
  { label: "All",         value: "all" },
  { label: "Backlog",     value: "backlog" },
  { label: "Todo",        value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "In Review",   value: "in_review" },
  { label: "Done",        value: "done" },
]

const KANBAN_COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: "backlog",     label: "Backlog"     },
  { status: "todo",        label: "Todo"        },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review",   label: "In Review"   },
  { status: "done",        label: "Done"        },
]

type ViewMode = "list" | "kanban"
type GroupBy  = "none" | "sprint" | "epic"

// ─── Shared table header row ──────────────────────────────────────────────────
function TableHead({ sticky = false }: { sticky?: boolean }) {
  const base = "py-2.5 px-2 text-left text-xs font-medium text-muted-foreground bg-muted border-b border-r border-border last:border-r-0"
  return (
    <thead className={sticky ? "sticky top-0 z-10" : undefined}>
      <tr>
        <th className={cn(base, "pl-4 pr-2 w-24")}>ID</th>
        <th className={cn(base)}>Title</th>
        <th className={cn(base, "w-28")}>Status</th>
        <th className={cn(base, "w-24")}>Priority</th>
        <th className={cn(base, "w-24")}>Type</th>
        <th className={cn(base, "w-32")}>Assignee</th>
        <th className={cn(base, "pl-2 pr-4 w-24")}>Updated</th>
      </tr>
    </thead>
  )
}

// ─── Epic chip — token-safe ───────────────────────────────────────────────────
function EpicChip({ title, color }: { title: string; color: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 border-l-2 pl-1.5 pr-2 py-0.5 rounded-r-md text-[10px] font-medium",
      "bg-secondary text-secondary-foreground",
      EPIC_BORDER[color] ?? "border-l-border"
    )}>
      <Layers className="size-2.5 shrink-0" />
      {title}
    </span>
  )
}

// ─── Issue row ────────────────────────────────────────────────────────────────
function IssueRow({ issue, epics, onClick }: {
  issue: Issue
  epics: typeof EPICS
  onClick: () => void
}) {
  const epic = epics.find(e => e.id === issue.epicId)
  const cell = "border-b border-border"
  return (
    <tr
      className="hover:bg-accent/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className={cn(cell, "py-2.5 pl-4 pr-2")}>
        <span className="font-mono text-xs text-muted-foreground">{issue.identifier}</span>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <div className="space-y-1">
          <span className="font-medium text-sm">{issue.title}</span>
          {(epic || issue.labels.length > 0) && (
            <div className="flex gap-1 flex-wrap items-center">
              {epic && <EpicChip title={epic.title} color={epic.color} />}
              {issue.labels.map(l => (
                <Badge key={l} variant="outline" className="text-[10px] h-4 px-1.5 font-normal">{l}</Badge>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}><IssueStatusBadge status={issue.status} /></td>
      <td className={cn(cell, "py-2.5 px-2")}><PriorityBadge priority={issue.priority} /></td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <span className={cn(
          "inline-flex items-center border-l-2 pl-1.5 pr-2 py-0.5 rounded-r-md text-xs font-medium",
          "bg-secondary text-secondary-foreground",
          TYPE_BORDER[issue.type]
        )}>
          {TYPE_LABEL[issue.type]}
        </span>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}>
        {issue.assigneeName ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">
                {issue.assigneeName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs truncate max-w-[80px]">{issue.assigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className={cn("border-b border-border", "py-2.5 pl-2 pr-4")}>
        <span className="text-xs text-muted-foreground">{issue.updatedAt}</span>
      </td>
    </tr>
  )
}

// ─── Issue kanban card ────────────────────────────────────────────────────────
function IssueCard({ issue, epics, onClick }: {
  issue: Issue
  epics: typeof EPICS
  onClick: () => void
}) {
  const epic = epics.find(e => e.id === issue.epicId)
  return (
    <div
      className="rounded-md border bg-card text-card-foreground p-3 cursor-pointer hover:bg-accent/20 hover:border-border transition-colors space-y-2 shadow-sm"
      onClick={onClick}
    >
      {epic && <EpicChip title={epic.title} color={epic.color} />}
      <p className="text-xs font-medium leading-snug line-clamp-3">{issue.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">{issue.identifier}</span>
          <PriorityBadge priority={issue.priority} />
        </div>
        {issue.assigneeName && (
          <Avatar className="size-5 shrink-0">
            <AvatarFallback className="text-[10px]">
              {issue.assigneeName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanCol({ status, label, items, epics, onCardClick }: {
  status: IssueStatus
  label: string
  items: Issue[]
  epics: typeof EPICS
  onCardClick: (id: string) => void
}) {
  return (
    <div className="flex flex-col w-64 shrink-0 rounded-lg border bg-muted/30">
      {/* Column header — all semantic tokens */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/60 rounded-t-lg shrink-0">
        <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[status])} />
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <Badge variant="secondary" className="ml-auto h-4 min-w-[20px] px-1.5 text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-14 text-[11px] text-muted-foreground/50 select-none">
            Empty
          </div>
        ) : items.map(issue => (
          <IssueCard key={issue.id} issue={issue} epics={epics} onClick={() => onCardClick(issue.id)} />
        ))}
      </div>
    </div>
  )
}

// ─── Sprint group header ──────────────────────────────────────────────────────
function SprintBadge({ status }: { status: string }) {
  const variant =
    status === "active"    ? "success" as const :
    status === "completed" ? "secondary" as const : "outline" as const
  return <Badge variant={variant} className="text-[10px] h-4 px-1.5 capitalize">{status}</Badge>
}

function SprintGroup({ sprint, issues, epics, onRowClick }: {
  sprint: { id: string; name: string; goal?: string; status: string } | null
  issues: Issue[]
  epics: typeof EPICS
  onRowClick: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const label = sprint ? sprint.name : "No Sprint"

  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 mb-2 w-full text-left py-1 rounded hover:bg-accent/30 px-1 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        {collapsed
          ? <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown  className="size-3.5 text-muted-foreground shrink-0" />}
        <Zap className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold">{label}</span>
        {sprint && <SprintBadge status={sprint.status} />}
        {sprint?.goal && (
          <span className="text-xs text-muted-foreground truncate max-w-xs">— {sprint.goal}</span>
        )}
        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{issues.length}</Badge>
      </button>

      {!collapsed && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <TableHead />
            <tbody>
              {issues.map(issue => (
                <IssueRow key={issue.id} issue={issue} epics={epics} onClick={() => onRowClick(issue.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Epic group header ────────────────────────────────────────────────────────
function EpicGroup({ epic, issues, epics, onRowClick }: {
  epic: typeof EPICS[0] | null
  issues: Issue[]
  epics: typeof EPICS
  onRowClick: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 mb-2 w-full text-left py-1 rounded hover:bg-accent/30 px-1 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        {collapsed
          ? <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown  className="size-3.5 text-muted-foreground shrink-0" />}
        {epic
          ? <EpicChip title={epic.title} color={epic.color} />
          : <span className="text-xs font-semibold text-muted-foreground">No Epic</span>}
        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{issues.length}</Badge>
      </button>

      {!collapsed && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <TableHead />
            <tbody>
              {issues.map(issue => (
                <IssueRow key={issue.id} issue={issue} epics={epics} onClick={() => onRowClick(issue.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Sprint Swimlane — table layout with resizable first column ───────────────
function SprintSwimlane({ sprintRows, filtered, tenantEpics, relevantSprints, onCardClick }: {
  sprintRows: (typeof relevantSprints[0] | null)[]
  filtered: Issue[]
  tenantEpics: typeof EPICS
  relevantSprints: typeof SPRINTS
  onCardClick: (id: string) => void
}) {
  const [labelW, setLabelW] = React.useState(160)
  const isDragging = React.useRef(false)
  const startX    = React.useRef(0)
  const startW    = React.useRef(160)
  const thRef     = React.useRef<HTMLTableCellElement>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startW.current = labelW
    document.body.style.cursor     = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const next = Math.max(100, Math.min(320, startW.current + ev.clientX - startX.current))
      setLabelW(next)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor     = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="border-separate border-spacing-0 min-w-max w-full">
        {/* ── Header ── */}
        <thead className="sticky top-0 z-20">
          <tr>
            {/* Resizable sprint column — sticky left, highest z so it covers both row cells and scrolled column headers */}
            <th
              ref={thRef}
              style={{ width: labelW, minWidth: labelW }}
              className="relative bg-muted border-b border-r border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground select-none sticky left-0 z-30 shadow-[2px_0_4px_-1px_hsl(var(--border))]"
            >
              Sprint
              {/* Drag handle */}
              <div
                onMouseDown={onMouseDown}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize group z-10"
              >
                <div className="absolute inset-y-0 right-0 w-[3px] rounded-full opacity-0 group-hover:opacity-100 bg-primary/40 transition-opacity duration-150" />
              </div>
            </th>
            {KANBAN_COLUMNS.map(col => (
              <th key={col.status} className="border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[col.status])} />
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Rows ── */}
        <tbody>
          {sprintRows.map((sprint, rowIdx) => {
            const sid       = sprint?.id ?? "__none__"
            const rowIssues = filtered.filter(i => (i.sprintId ?? "__none__") === sid)
            const label     = sprint ? sprint.name : "No Sprint"
            const isLast    = rowIdx === sprintRows.length - 1
            return (
              <tr key={sid} className="align-top">
                {/* Sprint label cell — sticky left, z-10 so it stays above body cells but below header */}
                <td
                  style={{ width: labelW, minWidth: labelW }}
                  className={cn(
                    "bg-background border-r border-border px-3 py-3 sticky left-0 z-10 shadow-[2px_0_4px_-1px_hsl(var(--border))]",
                    !isLast && "border-b"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="size-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </div>
                  {sprint && <SprintBadge status={sprint.status} />}
                  <p className="text-[10px] text-muted-foreground mt-1">{rowIssues.length} issues</p>
                </td>

                {/* Status cells */}
                {KANBAN_COLUMNS.map(col => {
                  const cellItems = rowIssues.filter(i => i.status === col.status)
                  return (
                    <td key={col.status} className={cn(
                      "border-r border-border last:border-r-0 p-2 min-w-[200px]",
                      !isLast && "border-b"
                    )}>
                      {cellItems.length === 0 ? (
                        <div className="flex items-center justify-center h-10 text-[10px] text-muted-foreground/30 select-none">—</div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {cellItems.map(issue => (
                            <IssueCard key={issue.id} issue={issue} epics={tenantEpics} onClick={() => onCardClick(issue.id)} />
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Epic Swimlane — same table layout as SprintSwimlane ─────────────────────
function EpicSwimlane({ epicRows, filtered, tenantEpics, onCardClick }: {
  epicRows: (typeof EPICS[0] | null)[]
  filtered: Issue[]
  tenantEpics: typeof EPICS
  onCardClick: (id: string) => void
}) {
  const [labelW, setLabelW] = React.useState(180)
  const isDragging = React.useRef(false)
  const startX    = React.useRef(0)
  const startW    = React.useRef(180)
  const thRef     = React.useRef<HTMLTableCellElement>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startW.current = labelW
    document.body.style.cursor     = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const next = Math.max(120, Math.min(360, startW.current + ev.clientX - startX.current))
      setLabelW(next)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor     = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="border-separate border-spacing-0 min-w-max w-full">
        <thead className="sticky top-0 z-20">
          <tr>
            <th
              ref={thRef}
              style={{ width: labelW, minWidth: labelW }}
              className="relative bg-muted border-b border-r border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground select-none sticky left-0 z-30 shadow-[2px_0_4px_-1px_hsl(var(--border))]"
            >
              Epic
              <div onMouseDown={onMouseDown} className="absolute right-0 top-0 h-full w-1 cursor-col-resize group z-10">
                <div className="absolute inset-y-0 right-0 w-[3px] rounded-full opacity-0 group-hover:opacity-100 bg-primary/40 transition-opacity duration-150" />
              </div>
            </th>
            {KANBAN_COLUMNS.map(col => (
              <th key={col.status} className="border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[col.status])} />
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {epicRows.map((epic, rowIdx) => {
            const eid       = epic?.id ?? "__none__"
            const rowIssues = filtered.filter(i => (i.epicId ?? "__none__") === eid)
            const isLast    = rowIdx === epicRows.length - 1
            return (
              <tr key={eid} className="align-top">
                {/* Epic label cell — sticky left */}
                <td
                  style={{ width: labelW, minWidth: labelW }}
                  className={cn(
                    "bg-background border-r border-border px-3 py-3 sticky left-0 z-10 shadow-[2px_0_4px_-1px_hsl(var(--border))]",
                    !isLast && "border-b"
                  )}
                >
                  {epic
                    ? <EpicChip title={epic.title} color={epic.color} />
                    : <span className="text-xs font-semibold text-muted-foreground">No Epic</span>
                  }
                  <p className="text-[10px] text-muted-foreground mt-1.5">{rowIssues.length} issues</p>
                </td>
                {KANBAN_COLUMNS.map(col => {
                  const cellItems = rowIssues.filter(i => i.status === col.status)
                  return (
                    <td key={col.status} className={cn(
                      "border-r border-border last:border-r-0 p-2 min-w-[200px]",
                      !isLast && "border-b"
                    )}>
                      {cellItems.length === 0 ? (
                        <div className="flex items-center justify-center h-10 text-[10px] text-muted-foreground/30 select-none">—</div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {cellItems.map(issue => (
                            <IssueCard key={issue.id} issue={issue} epics={tenantEpics} onClick={() => onCardClick(issue.id)} />
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Issues page ─────────────────────────────────────────────────────────
export function Issues() {
  const { projectId } = useParams<{ projectId?: string }>()
  const { currentTenant } = useApp()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState("all")
  const [search,   setSearch]   = useState("")
  const [priority, setPriority] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [groupBy,  setGroupBy]  = useState<GroupBy>("none")

  const project        = projectId ? PROJECTS.find(p => p.id === projectId) : undefined
  const tenantIssues   = ISSUES.filter(i => i.tenantId === currentTenant.id)
  const tenantEpics    = EPICS.filter(e => e.tenantId === currentTenant.id)
  const tenantSprints  = SPRINTS.filter(s => s.tenantId === currentTenant.id)
  const tenantProjects = PROJECTS.filter(p => p.tenantId === currentTenant.id)

  const filtered = tenantIssues
    .filter(i => !projectId || i.projectId === projectId)
    .filter(i => tab === "all" || i.status === tab)
    .filter(i => priority === "all" || i.priority === priority)
    .filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.identifier.toLowerCase().includes(search.toLowerCase())
    )

  const title = project
    ? `${project.emoji} ${project.name}`
    : "All Issues"
  const description = project
    ? `${project.identifier} · ${filtered.length} issues`
    : `${tenantIssues.length} issues across ${tenantProjects.length} projects`

  const relevantSprints = tenantSprints.filter(s => !projectId || s.projectId === projectId)

  // ── Kanban ───────────────────────────────────────────────────────────────────
  const renderKanban = () => {
    if (groupBy === "sprint") {
      const orderedSprints = [...relevantSprints].sort((a, b) => {
        const o = { active: 0, upcoming: 1, completed: 2 } as Record<string, number>
        return (o[a.status] ?? 3) - (o[b.status] ?? 3)
      })
      const usedSprintIds = new Set(filtered.map(i => i.sprintId ?? "__none__"))
      const sprintRows = [
        ...orderedSprints.filter(s => usedSprintIds.has(s.id)),
        ...(usedSprintIds.has("__none__") ? [null] : []),
      ]
      return <SprintSwimlane sprintRows={sprintRows} filtered={filtered} tenantEpics={tenantEpics} relevantSprints={relevantSprints} onCardClick={id => navigate(`/issues/${id}`)} />
    }

    if (groupBy === "epic") {
      const scopedEpics = tenantEpics.filter(e => !projectId || e.projectId === projectId)
      const usedEpicIds = new Set(filtered.map(i => i.epicId ?? "__none__"))
      const epicRows = [
        ...scopedEpics.filter(e => usedEpicIds.has(e.id)),
        ...(usedEpicIds.has("__none__") ? [null] : []),
      ] as (typeof EPICS[0] | null)[]
      return <EpicSwimlane epicRows={epicRows} filtered={filtered} tenantEpics={tenantEpics} onCardClick={id => navigate(`/issues/${id}`)} />
    }

    // No group — table with one row, columns = status
    return (
      <div className="flex-1 overflow-auto">
        <table className="border-separate border-spacing-0 min-w-max w-full ring-1 ring-border">
          <thead className="sticky top-0 z-20">
            <tr>
              {KANBAN_COLUMNS.map(col => (
                <th
                  key={col.status}
                  className="border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[col.status])} />
                    {col.label}
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[20px] px-1.5 text-[10px]">
                      {filtered.filter(i => i.status === col.status).length}
                    </Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              {KANBAN_COLUMNS.map(col => {
                const cellItems = filtered.filter(i => i.status === col.status)
                return (
                  <td key={col.status} className="border-r border-border last:border-r-0 p-2 min-w-[220px]">
                    {cellItems.length === 0 ? (
                      <div className="flex items-center justify-center h-14 text-[11px] text-muted-foreground/40 select-none">Empty</div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {cellItems.map(issue => (
                          <IssueCard key={issue.id} issue={issue} epics={tenantEpics} onClick={() => navigate(`/issues/${issue.id}`)} />
                        ))}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  const renderList = () => {
    if (groupBy === "sprint") {
      const ordered = [...relevantSprints].sort((a, b) => {
        const o = { active: 0, upcoming: 1, completed: 2 } as Record<string, number>
        return (o[a.status] ?? 3) - (o[b.status] ?? 3)
      })
      const usedIds       = new Set(filtered.map(i => i.sprintId))
      const noSprintItems = filtered.filter(i => !i.sprintId)
      const groups = [
        ...ordered.filter(s => usedIds.has(s.id)).map(s => ({
          key: s.id,
          sprint: s as typeof relevantSprints[0] | null,
          items: filtered.filter(i => i.sprintId === s.id),
        })),
        ...(noSprintItems.length > 0 ? [{ key: "__none__", sprint: null as typeof relevantSprints[0] | null, items: noSprintItems }] : []),
      ]

      return (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-separate border-spacing-0 ring-1 ring-border">
            <TableHead sticky />
            <tbody>
              {groups.map(({ key, sprint, items }) => (
                <React.Fragment key={key}>
                  <tr className="bg-muted/40">
                    <td colSpan={7} className="py-2 pl-4 pr-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Zap className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold">
                          {sprint ? sprint.name : "No Sprint"}
                        </span>
                        {sprint && <SprintBadge status={sprint.status} />}
                        {sprint?.goal && (
                          <span className="text-xs text-muted-foreground truncate">— {sprint.goal}</span>
                        )}
                        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{items.length}</Badge>
                      </div>
                    </td>
                  </tr>
                  {items.map(issue => (
                    <IssueRow key={issue.id} issue={issue} epics={tenantEpics} onClick={() => navigate(`/issues/${issue.id}`)} />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (groupBy === "epic") {
      const scopedEpics = tenantEpics.filter(e => !projectId || e.projectId === projectId)
      const usedEpicIds = new Set(filtered.map(i => i.epicId))
      const noEpicItems = filtered.filter(i => !i.epicId)
      const groups = [
        ...scopedEpics.filter(e => usedEpicIds.has(e.id)).map(e => ({
          key: e.id,
          epic: e as typeof EPICS[0] | null,
          items: filtered.filter(i => i.epicId === e.id),
        })),
        ...(noEpicItems.length > 0 ? [{ key: "__none__", epic: null as typeof EPICS[0] | null, items: noEpicItems }] : []),
      ]

      return (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <TableHead sticky />
            <tbody>
              {groups.map(({ key, epic, items }) => (
                <React.Fragment key={key}>
                  <tr className="bg-muted/40">
                    <td colSpan={7} className="py-2 pl-4 pr-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        {epic
                          ? <EpicChip title={epic.title} color={epic.color} />
                          : <span className="text-xs font-semibold text-muted-foreground">No Epic</span>}
                        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{items.length}</Badge>
                      </div>
                    </td>
                  </tr>
                  {items.map(issue => (
                    <IssueRow key={issue.id} issue={issue} epics={tenantEpics} onClick={() => navigate(`/issues/${issue.id}`)} />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // No group — flat table with sticky header
    return (
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Bug}
              title="No issues found"
              description="Adjust your filters or create a new issue."
              action={{ label: "Create Issue", onClick: () => {} }}
            />
          </div>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-0 ring-1 ring-border">
            <TableHead sticky />
            <tbody>
              {filtered.map(issue => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  epics={tenantEpics}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={title} description={description} action={{ label: "New Issue", onClick: () => {} }} />

      {/* ── Toolbar ── */}
      <div className="border-b bg-background px-6 py-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status tabs — only in flat (no-group) list view */}
          {viewMode === "list" && groupBy === "none" ? (
            <Tabs value={tab} onValueChange={setTab} className="flex-1 min-w-0">
              <TabsList className="h-8">
                {STATUS_TABS.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs px-2.5 h-7">
                    {t.label}
                    {t.value !== "all" && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] font-normal">
                        {tenantIssues.filter(i =>
                          (!projectId || i.projectId === projectId) && i.status === t.value
                        ).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <div className="flex-1" />
          )}

          {/* Group by */}
          <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Group</SelectItem>
              <SelectItem value="sprint">Group: Sprint</SelectItem>
              <SelectItem value="epic">Group: Epic</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 w-40 pl-8 text-xs"
              placeholder="Search issues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Priority filter */}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-muted/40 p-0.5 gap-0.5">
            <Button
              variant={viewMode === "list"   ? "secondary" : "ghost"}
              size="icon" className="h-7 w-7"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="icon" className="h-7 w-7"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? renderList() : renderKanban()}
    </div>
  )
}
