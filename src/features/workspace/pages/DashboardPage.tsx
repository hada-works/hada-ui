import { MessageSquare, Bug, FolderKanban, TrendingUp, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FeedbackStatusBadge, IssueStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { FEEDBACKS } from "@/features/feedbacks/mock-data"
import { ISSUES } from "@/features/issues/mock-data"
import { PROJECTS } from "@/features/projects/mock-data"
import { useApp } from "@/store/app-store"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const { currentTenant } = useApp()

  const feedbacks = FEEDBACKS.filter(f => f.tenantId === currentTenant.id)
  const issues    = ISSUES.filter(i => i.tenantId === currentTenant.id)
  const projects  = PROJECTS.filter(p => p.tenantId === currentTenant.id)

  const openIssues   = issues.filter(i => i.status !== "done" && i.status !== "cancelled").length
  const urgentIssues = issues.filter(i => i.priority === "urgent").length
  const activeProjects = projects.filter(p => p.status === "active").length
  const completedFb  = feedbacks.filter(f => f.status === "completed").length
  const resolutionRate = feedbacks.length > 0 ? Math.round((completedFb / feedbacks.length) * 100) : 0

  const STATS = [
    { label: "Total Feedbacks",  value: String(feedbacks.length), change: `${feedbacks.filter(f => f.status === "open").length} open`,   icon: MessageSquare, color: "text-primary",            bg: "bg-primary/10" },
    { label: "Open Issues",      value: String(openIssues),       change: `${urgentIssues} urgent`,                                       icon: Bug,           color: "text-destructive",        bg: "bg-destructive/10" },
    { label: "Active Projects",  value: String(activeProjects),   change: `${projects.length} total`,                                     icon: FolderKanban,  color: "text-muted-foreground",   bg: "bg-muted" },
    { label: "Resolution Rate",  value: `${resolutionRate}%`,     change: `${completedFb} resolved`,                                      icon: TrendingUp,    color: "text-primary",            bg: "bg-primary/10" },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={`${currentTenant.name} Dashboard`}
        description="Overview of your workspace activity"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{stat.change}</p>
                      </div>
                      <div className={cn("rounded-lg p-2", stat.bg)}>
                        <Icon className={cn("size-4", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Feedbacks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recent Feedbacks</CardTitle>
                  <Link to="/feedbacks" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    View all <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <CardDescription>Latest feature requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedbacks.slice(0, 4).map((fb) => (
                  <Link key={fb.id} to={`/feedbacks/${fb.id}`} className="block">
                    <div className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fb.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{fb.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <FeedbackStatusBadge status={fb.status} />
                          <span className="text-xs text-muted-foreground">↑ {fb.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recent Issues</CardTitle>
                  <Link to="/issues" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    View all <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <CardDescription>Active tasks and bugs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {issues.slice(0, 4).map((issue) => (
                  <Link key={issue.id} to={`/issues/${issue.id}`} className="block">
                    <div className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{issue.identifier}</span>
                          <PriorityBadge priority={issue.priority} />
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{issue.title}</p>
                        <div className="mt-2"><IssueStatusBadge status={issue.status} /></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Projects */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Projects</CardTitle>
                <Link to="/projects" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">{p.issueCount} issues</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
