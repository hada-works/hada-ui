import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search, LayoutList, Kanban } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ISSUES, EPICS, SPRINTS } from "@/features/issues/mock-data"
import { PROJECTS } from "@/features/projects/mock-data"
import { useApp } from "@/store/app-store"
import { STATUS_TABS, type ViewMode, type GroupBy } from "../constants"
import { IssueListView } from "../components/IssueListView"
import { IssueKanbanView } from "../components/IssueKanbanView"

export function IssuesPage() {
  const { projectId }     = useParams<{ projectId?: string }>()
  const { currentTenant } = useApp()
  const navigate          = useNavigate()

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

  const title       = project ? `${project.emoji} ${project.name}` : "All Issues"
  const description = project
    ? `${project.identifier} · ${filtered.length} issues`
    : `${tenantIssues.length} issues across ${tenantProjects.length} projects`

  const relevantSprints = tenantSprints.filter(s => !projectId || s.projectId === projectId)
  const navigateTo      = (id: string) => navigate(`/issues/${id}`)

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

      {viewMode === "list"
        ? <IssueListView
            filtered={filtered}
            tenantEpics={tenantEpics}
            relevantSprints={relevantSprints}
            groupBy={groupBy}
            projectId={projectId}
            onRowClick={navigateTo}
          />
        : <IssueKanbanView
            filtered={filtered}
            tenantEpics={tenantEpics}
            relevantSprints={relevantSprints}
            groupBy={groupBy}
            projectId={projectId}
            onCardClick={navigateTo}
          />
      }
    </div>
  )
}
