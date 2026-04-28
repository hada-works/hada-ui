import { useNavigate } from "react-router-dom"
import { FolderKanban, Calendar, Bug } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProjectStatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PROJECTS } from "@/store/mock-data"
import { useApp } from "@/store/app-store"

export function Projects() {
  const { currentTenant } = useApp()
  const navigate = useNavigate()
  const projects = PROJECTS.filter(p => p.tenantId === currentTenant.id)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Projects" description="Organise and track work across your team" action={{ label: "New Project", onClick: () => navigate("/projects/new") }} />
      <ScrollArea className="flex-1">
        <div className="p-6">
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to organise issues." action={{ label: "Create Project", onClick: () => {} }} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col" onClick={() => navigate(`/projects/${p.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground shrink-0 border rounded px-1.5 py-0.5">{p.identifier}</span>
                        <CardTitle className="text-sm leading-snug truncate">{p.name}</CardTitle>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <CardDescription className="text-xs line-clamp-2 mt-1">{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-semibold">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <button
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}
                      >
                        <Bug className="size-3.5" />
                        <span>{p.issueCount} issues</span>
                      </button>
                      {p.targetDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>{p.targetDate}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[10px]">{p.ownerName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{p.ownerName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
