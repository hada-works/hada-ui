import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, ChevronUp, Calendar, User, Tag,
  MessageSquare, Pencil, Share2, Flag, Layers,
  Send, Plus, Link2, X, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FeedbackStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { IssueStatusBadge } from "@/components/shared/StatusBadge"
import { FEEDBACKS, FEEDBACK_BOARDS, ISSUES, PROJECTS, CURRENT_USER } from "@/store/mock-data"
import { FeedbackStatus, IssueStatus, IssueType, Priority } from "@/types"
import { cn } from "@/lib/utils"

const ACTIVITY = [
  { actor: "Alex Nguyen", detail: "changed status to Planned",                                         time: "2 days ago" },
  { actor: "Sarah Chen",  detail: "This would also help our accessibility compliance effort.",           time: "3 days ago" },
  { actor: "System",      detail: "reached 100 upvotes milestone",                                      time: "5 days ago" },
  { actor: "Sarah Chen",  detail: "submitted this feedback",                                            time: "Apr 1, 2025" },
]

// ─── Comment form ─────────────────────────────────────────────────────────────
function CommentForm() {
  const [text, setText] = useState("")
  const [comments, setComments] = useState<{ actor: string; detail: string; time: string }[]>([])

  const submit = () => {
    if (!text.trim()) return
    setComments(prev => [{ actor: CURRENT_USER.name, detail: text.trim(), time: "Just now" }, ...prev])
    setText("")
  }

  return (
    <div className="space-y-4">
      {comments.map((c, i) => (
        <div key={i} className="flex items-start gap-3">
          <Avatar className="size-6 mt-0.5 shrink-0">
            <AvatarFallback className="text-[9px]">
              {c.actor.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs"><span className="font-medium">{c.actor}</span>{" "}<span className="text-muted-foreground">{c.detail}</span></p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{c.time}</p>
          </div>
        </div>
      ))}
      <div className="flex items-start gap-3">
        <Avatar className="size-6 mt-0.5 shrink-0">
          <AvatarFallback className="text-[9px]">
            {CURRENT_USER.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            className="min-h-[72px] text-xs resize-none"
            placeholder="Leave a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit() }}
          />
          <div className="flex justify-end">
            <Button size="sm" className="h-7 gap-1.5 text-xs" disabled={!text.trim()} onClick={submit}>
              <Send className="size-3" />Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Issue modal ───────────────────────────────────────────────────────
function CreateIssueModal({
  feedbackTitle,
  tenantId,
  onClose,
  onCreated,
}: {
  feedbackTitle: string
  tenantId: string
  onClose: () => void
  onCreated: (identifier: string, title: string) => void
}) {
  const tenantProjects = PROJECTS.filter(p => p.tenantId === tenantId)
  const [projectId, setProjectId] = useState("")
  const [title,     setTitle]     = useState(feedbackTitle)
  const [type,      setType]      = useState<IssueType>("story")
  const [priority,  setPriority]  = useState<Priority>("medium")
  const [status,    setStatus]    = useState<IssueStatus>("backlog")

  const project = tenantProjects.find(p => p.id === projectId)

  const handleCreate = () => {
    if (!project || !title.trim()) return
    const identifier = `${project.identifier}-NEW`
    onCreated(identifier, title.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Create Issue from Feedback</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Project — required */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Project <span className="text-destructive">*</span>
            </label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className={cn("h-8 text-xs", !projectId && "text-muted-foreground")}>
                <SelectValue placeholder="Select a project…" />
              </SelectTrigger>
              <SelectContent>
                {tenantProjects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.emoji} {p.name}
                    <span className="ml-1.5 font-mono text-muted-foreground text-[10px]">{p.identifier}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!projectId && (
              <p className="text-[11px] text-muted-foreground">Every issue must belong to a project.</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              className="h-8 text-xs"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={type} onValueChange={v => setType(v as IssueType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["task","bug","story","subtask"] as IssueType[]).map(t => (
                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["urgent","high","medium","low"] as Priority[]).map(p => (
                    <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Initial Status</label>
            <Select value={status} onValueChange={v => setStatus(v as IssueStatus)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["backlog","todo","in_progress","in_review","done","cancelled"] as IssueStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm" className="h-8 text-xs"
            disabled={!projectId || !title.trim()}
            onClick={handleCreate}
          >
            Create Issue
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Link Issue modal ─────────────────────────────────────────────────────────
function LinkIssueModal({
  tenantId,
  linkedIds,
  onClose,
  onLinked,
}: {
  tenantId: string
  linkedIds: string[]
  onClose: () => void
  onLinked: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const tenantIssues = ISSUES.filter(i => i.tenantId === tenantId && !linkedIds.includes(i.id))
  const filtered = tenantIssues.filter(i =>
    i.identifier.toLowerCase().includes(search.toLowerCase()) ||
    i.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Link Existing Issue</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Search by identifier or title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
              No issues found
            </div>
          ) : (
            filtered.map(issue => (
              <button
                key={issue.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                onClick={() => onLinked(issue.id)}
              >
                <span className="font-mono text-[11px] text-muted-foreground w-16 shrink-0">{issue.identifier}</span>
                <IssueStatusBadge status={issue.status} />
                <span className="text-xs truncate flex-1">{issue.title}</span>
                <PriorityBadge priority={issue.priority} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FeedbackDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const feedback = FEEDBACKS.find(f => f.id === id)
  const [upvoted, setUpvoted] = useState(false)
  const upvoteCount = feedback ? feedback.upvotes + (upvoted ? 1 : 0) : 0

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLinkModal,   setShowLinkModal]   = useState(false)
  const [linkedIssueIds,  setLinkedIssueIds]  = useState<string[]>([])
  const [createdIssues,   setCreatedIssues]   = useState<{ identifier: string; title: string }[]>([])

  if (!feedback) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="size-10" />
        <p className="text-sm">Feedback not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/feedbacks")}>Back to Feedbacks</Button>
      </div>
    )
  }

  const board = FEEDBACK_BOARDS.find(b => b.id === feedback.boardId)
  const related = ISSUES.filter(i =>
    i.tenantId === feedback.tenantId &&
    feedback.tags.some(t => i.labels.includes(t))
  ).slice(0, 3)

  const linkedIssues = ISSUES.filter(i => linkedIssueIds.includes(i.id))

  const handleIssueCreated = (identifier: string, title: string) => {
    setCreatedIssues(prev => [...prev, { identifier, title }])
    setShowCreateModal(false)
  }

  const handleIssueLinked = (issueId: string) => {
    setLinkedIssueIds(prev => [...prev, issueId])
    setShowLinkModal(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/feedbacks")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">Feedbacks</span>
        {board && <>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">{board.name}</span>
        </>}
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium truncate max-w-xs">{feedback.title}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="size-4" /></Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl px-8 py-8">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setUpvoted(v => !v)}
                title={upvoted ? "Retract upvote" : "Upvote"}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-colors min-w-[52px]",
                  upvoted
                    ? "border-primary bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-accent"
                )}
              >
                <ChevronUp className={cn("size-4", upvoted ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-bold tabular-nums", upvoted && "text-primary")}>{upvoteCount}</span>
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold leading-snug">{feedback.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <FeedbackStatusBadge status={feedback.status} />
                  <PriorityBadge priority={feedback.priority} />
                  {board && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Layers className="size-3" />{board.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <p className="text-sm leading-relaxed text-foreground">{feedback.description}</p>
              <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                This feedback is being reviewed by the product team. Upvote to signal priority, or add a comment to share your use case.
              </p>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="text-sm font-semibold mb-4">Activity</h2>
              <div className="space-y-4">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Avatar className="size-6 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {a.actor === "System" ? "SY" : a.actor.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs"><span className="font-medium">{a.actor}</span>{" "}<span className="text-muted-foreground">{a.detail}</span></p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Comments */}
            <div>
              <h2 className="text-sm font-semibold mb-4">Comments</h2>
              <CommentForm />
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar */}
        <div className="hidden lg:flex w-72 flex-col border-l">
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                <Select defaultValue={feedback.status}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["open","under_review","planned","in_progress","completed","declined"] as FeedbackStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue actions */}
              <div className="space-y-2">
                <Button
                  variant="outline" size="sm"
                  className="w-full h-8 gap-1.5 text-xs justify-start"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="size-3.5" />Create Issue
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="w-full h-8 gap-1.5 text-xs justify-start"
                  onClick={() => setShowLinkModal(true)}
                >
                  <Link2 className="size-3.5" />Link Issue
                </Button>
              </div>

              <Separator />
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Submitted by</p>
                    <p className="text-xs font-medium">{feedback.authorName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Layers className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Board</p>
                    <p className="text-xs font-medium">{board?.name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Created</p>
                    <p className="text-xs font-medium">{feedback.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Flag className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Priority</p>
                    <PriorityBadge priority={feedback.priority} />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {feedback.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Linked issues — includes tag-matched + explicitly linked */}
              {(related.length > 0 || linkedIssues.length > 0 || createdIssues.length > 0) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linked Issues</p>
                    <div className="space-y-2">
                      {/* Explicitly linked */}
                      {linkedIssues.map(issue => (
                        <button key={issue.id} className="w-full text-left rounded-md border p-2 hover:bg-accent transition-colors" onClick={() => navigate(`/issues/${issue.id}`)}>
                          <p className="text-[11px] font-mono text-muted-foreground">{issue.identifier}</p>
                          <p className="text-xs font-medium truncate">{issue.title}</p>
                        </button>
                      ))}
                      {/* Created from this feedback */}
                      {createdIssues.map((ci, i) => (
                        <div key={i} className="rounded-md border p-2 bg-primary/5 border-primary/30">
                          <p className="text-[11px] font-mono text-primary/70">{ci.identifier}</p>
                          <p className="text-xs font-medium truncate">{ci.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Created from this feedback</p>
                        </div>
                      ))}
                      {/* Tag-matched related */}
                      {related.filter(r => !linkedIssueIds.includes(r.id)).map(issue => (
                        <button key={issue.id} className="w-full text-left rounded-md border p-2 hover:bg-accent transition-colors" onClick={() => navigate(`/issues/${issue.id}`)}>
                          <p className="text-[11px] font-mono text-muted-foreground">{issue.identifier}</p>
                          <p className="text-xs font-medium truncate">{issue.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateIssueModal
          feedbackTitle={feedback.title}
          tenantId={feedback.tenantId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleIssueCreated}
        />
      )}
      {showLinkModal && (
        <LinkIssueModal
          tenantId={feedback.tenantId}
          linkedIds={[...linkedIssueIds, ...related.map(r => r.id)]}
          onClose={() => setShowLinkModal(false)}
          onLinked={handleIssueLinked}
        />
      )}
    </div>
  )
}
