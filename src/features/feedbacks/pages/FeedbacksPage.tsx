import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronUp, MessageSquare, Search, LayoutList, Kanban } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeedbackStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { FEEDBACKS, FEEDBACK_BOARDS } from "@/store/mock-data"
import { useApp } from "@/store/app-store"
import { Feedback, FeedbackStatus } from "@/types"
import { cn } from "@/lib/utils"

// ─── Kanban columns ───────────────────────────────────────────────────────────
const KANBAN_COLUMNS: { status: FeedbackStatus; label: string }[] = [
  { status: "open",         label: "Open"         },
  { status: "under_review", label: "Under Review"  },
  { status: "planned",      label: "Planned"       },
  { status: "in_progress",  label: "In Progress"   },
  { status: "completed",    label: "Completed"     },
  { status: "declined",     label: "Declined"      },
]

// Decorative dot colours for kanban column headers
const DOT_BG: Record<FeedbackStatus, string> = {
  open:         "bg-muted-foreground/50",
  under_review: "bg-primary/60",
  planned:      "bg-primary/40",
  in_progress:  "bg-[hsl(var(--warning))]",
  completed:    "bg-[hsl(var(--success))]",
  declined:     "bg-destructive/70",
}

const STATUS_TABS = [
  { label: "All",          value: "all" },
  { label: "Open",         value: "open" },
  { label: "Under Review", value: "under_review" },
  { label: "Planned",      value: "planned" },
  { label: "In Progress",  value: "in_progress" },
  { label: "Completed",    value: "completed" },
]

// ─── Upvote button — shared between list row and kanban card ──────────────────
function UpvoteButton({
  feedbackId,
  baseCount,
  upvoted,
  onToggle,
  compact = false,
}: {
  feedbackId: string
  baseCount: number
  upvoted: boolean
  onToggle: (id: string) => void
  compact?: boolean
}) {
  const count = upvoted ? baseCount + 1 : baseCount
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md border px-1.5 py-1 transition-colors shrink-0",
        compact ? "min-w-[30px]" : "min-w-[36px]",
        upvoted
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          : "hover:bg-accent text-muted-foreground"
      )}
      onClick={e => { e.stopPropagation(); onToggle(feedbackId) }}
      title={upvoted ? "Retract upvote" : "Upvote"}
    >
      <ChevronUp className={cn("size-3", upvoted && "text-primary")} />
      <span className={cn("text-[10px] font-semibold tabular-nums leading-none", upvoted && "text-primary")}>
        {count}
      </span>
    </button>
  )
}

// ─── List table header ────────────────────────────────────────────────────────
function TableHead() {
  const base = "py-2.5 px-2 text-left text-xs font-medium text-muted-foreground bg-muted border-b border-r border-border last:border-r-0"
  return (
    <thead className="sticky top-0 z-10">
      <tr>
        <th className={cn(base, "pl-4 pr-2 w-14")}>Votes</th>
        <th className={cn(base)}>Title</th>
        <th className={cn(base, "w-32")}>Status</th>
        <th className={cn(base, "w-24")}>Priority</th>
        <th className={cn(base, "w-40")}>Tags</th>
        <th className={cn(base, "w-28")}>Author</th>
        <th className={cn(base, "pl-2 pr-4 w-24")}>Created</th>
      </tr>
    </thead>
  )
}

// ─── List row ─────────────────────────────────────────────────────────────────
function FeedbackRow({ fb, upvoted, onToggleUpvote, onClick }: {
  fb: Feedback
  upvoted: boolean
  onToggleUpvote: (id: string) => void
  onClick: () => void
}) {
  const cell = "border-b border-border"
  return (
    <tr className="hover:bg-accent/30 cursor-pointer transition-colors" onClick={onClick}>
      <td className={cn(cell, "py-2.5 pl-4 pr-2")}>
        <UpvoteButton feedbackId={fb.id} baseCount={fb.upvotes} upvoted={upvoted} onToggle={onToggleUpvote} />
      </td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <div className="space-y-0.5">
          <span className="font-medium text-sm">{fb.title}</span>
          <p className="text-xs text-muted-foreground line-clamp-1">{fb.description}</p>
        </div>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}><FeedbackStatusBadge status={fb.status} /></td>
      <td className={cn(cell, "py-2.5 px-2")}><PriorityBadge priority={fb.priority} /></td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <div className="flex gap-1 flex-wrap">
          {fb.tags.length > 0
            ? fb.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 font-normal">{tag}</Badge>
              ))
            : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <span className="text-xs text-muted-foreground truncate">{fb.authorName}</span>
      </td>
      <td className={cn("border-b border-border", "py-2.5 pl-2 pr-4")}>
        <span className="text-xs text-muted-foreground">{fb.createdAt}</span>
      </td>
    </tr>
  )
}

// ─── Kanban card ──────────────────────────────────────────────────────────────
function FeedbackCard({ fb, upvoted, onToggleUpvote, onClick }: {
  fb: Feedback
  upvoted: boolean
  onToggleUpvote: (id: string) => void
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/20 hover:border-border transition-colors shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <UpvoteButton
            feedbackId={fb.id}
            baseCount={fb.upvotes}
            upvoted={upvoted}
            onToggle={onToggleUpvote}
            compact
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold leading-snug line-clamp-2">{fb.title}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <FeedbackStatusBadge status={fb.status} />
              <PriorityBadge priority={fb.priority} />
            </div>
            {fb.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {fb.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">by {fb.authorName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// KanbanColumn removed — kanban now uses inline table in render

// ─── Main page ────────────────────────────────────────────────────────────────
export function FeedbacksPage() {
  const { boardId }        = useParams<{ boardId?: string }>()
  const { currentTenant }  = useApp()
  const navigate           = useNavigate()

  const [tab,        setTab]        = useState("all")
  const [search,     setSearch]     = useState("")
  const [sort,       setSort]       = useState("upvotes")
  const [viewMode,   setViewMode]   = useState<"list" | "kanban">("list")
  // Track which feedbacks the current user has upvoted
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())

  const toggleUpvote = (id: string) => {
    setUpvotedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)   // retract
      else next.add(id)                    // upvote
      return next
    })
  }

  const board           = boardId ? FEEDBACK_BOARDS.find(b => b.id === boardId) : undefined
  const tenantFeedbacks = FEEDBACKS.filter(f => f.tenantId === currentTenant.id)

  const filtered = tenantFeedbacks
    .filter(f => !boardId || f.boardId === boardId)
    .filter(f => tab === "all" || f.status === tab)
    .filter(f =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "upvotes") {
        const aCount = a.upvotes + (upvotedIds.has(a.id) ? 1 : 0)
        const bCount = b.upvotes + (upvotedIds.has(b.id) ? 1 : 0)
        return bCount - aCount
      }
      return b.createdAt.localeCompare(a.createdAt)
    })

  const title       = board ? `${board.emoji} ${board.name}` : "Feedbacks"
  const description = board
    ? `${filtered.length} feedbacks in ${board.name}`
    : "All feature requests and improvement ideas"

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={title}
        description={description}
        action={{ label: "New Feedback", onClick: () => {} }}
      />

      {/* ── Toolbar ── */}
      <div className="border-b bg-background px-6 py-3 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">

          {/* Status tabs — list mode only */}
          {viewMode === "list" ? (
            <Tabs value={tab} onValueChange={setTab} className="flex-1 min-w-0">
              <TabsList className="h-8">
                {STATUS_TABS.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs px-2.5 h-7">
                    {t.label}
                    {t.value !== "all" && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] font-normal">
                        {tenantFeedbacks.filter(f =>
                          (!boardId || f.boardId === boardId) && f.status === t.value
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                className="h-8 w-44 pl-8 text-xs"
                placeholder="Search feedbacks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sort — list only */}
            {viewMode === "list" && (
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upvotes">Most Voted</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            )}

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
      </div>

      {/* ── List view ── */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={MessageSquare}
                title="No feedbacks found"
                description="Try adjusting your filters or search query."
              />
            </div>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-0 ring-1 ring-border">
              <TableHead />
              <tbody>
                {filtered.map(fb => (
                  <FeedbackRow
                    key={fb.id}
                    fb={fb}
                    upvoted={upvotedIds.has(fb.id)}
                    onToggleUpvote={toggleUpvote}
                    onClick={() => navigate(`/feedbacks/${fb.id}`)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Kanban view — table layout matching swimlane style ── */}
      {viewMode === "kanban" && (
        <div className="flex-1 overflow-auto">
          <table className="border-separate border-spacing-0 min-w-max w-full ring-1 ring-border">
            <thead className="sticky top-0 z-20">
              <tr>
                {KANBAN_COLUMNS.map(col => (
                  <th
                    key={col.status}
                    className="border-t border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full shrink-0", DOT_BG[col.status])} />
                      {col.label}
                      <Badge variant="secondary" className="ml-1 h-4 min-w-[20px] px-1.5 text-[10px]">
                        {filtered.filter(f => f.status === col.status).length}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                {KANBAN_COLUMNS.map(col => {
                  const colItems = filtered.filter(f => f.status === col.status)
                  return (
                    <td key={col.status} className="border-r border-border last:border-r-0 p-2 min-w-[260px]">
                      {colItems.length === 0 ? (
                        <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/40 select-none">No feedbacks</div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {colItems.map(fb => (
                            <FeedbackCard
                              key={fb.id}
                              fb={fb}
                              upvoted={upvotedIds.has(fb.id)}
                              onToggleUpvote={toggleUpvote}
                              onClick={() => navigate(`/feedbacks/${fb.id}`)}
                            />
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
      )}
    </div>
  )
}
