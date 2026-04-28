import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft, Calendar, User, Tag, Bug,
  Pencil, Share2, Clock, GitBranch, Plus, CheckSquare, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IssueStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { IssueTypeBadge } from "@/components/shared/IssueTypeBadge"
import { ISSUES, PROJECTS, CURRENT_USER } from "@/store/mock-data"
import { IssueStatus, IssueType, Priority } from "@/types"
import { cn } from "@/lib/utils"

const ACTIVITY = [
  { type: "status",   actor: "Alex Nguyen",  detail: "changed status to In Progress", time: "1 day ago" },
  { type: "assign",   actor: "Sarah Chen",   detail: "assigned to Alex Nguyen",        time: "2 days ago" },
  { type: "comment",  actor: "John Doe",     detail: "Confirmed reproduction on staging. The `redirect_uri` is missing from the callback handler.", time: "3 days ago" },
  { type: "label",    actor: "Alex Nguyen",  detail: 'added label "critical"',          time: "4 days ago" },
  { type: "created",  actor: "Alex Nguyen",  detail: "created this issue",             time: "Apr 20, 2025" },
]

// ─── Sub-task inline form ─────────────────────────────────────────────────────
function AddSubtaskForm({ onSave, onCancel }: { onSave: (title: string, priority: Priority) => void; onCancel: () => void }) {
  const [title, setTitle]       = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const commit = () => {
    if (!title.trim()) return
    onSave(title.trim(), priority)
    setTitle("")          // reset — keep form open for next entry
    inputRef.current?.focus()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-dashed border-border">
      <span className="font-mono text-xs text-muted-foreground/40 w-20 shrink-0 select-none">—</span>
      <input
        ref={inputRef}
        className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
        placeholder="Sub-task title… (Enter to save, Esc to close)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") onCancel()
        }}
      />
      <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
        <SelectTrigger className="h-6 w-24 text-xs border-0 bg-transparent shadow-none px-1 gap-1 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["urgent","high","medium","low"] as Priority[]).map(p => (
            <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-6 px-2 text-xs" disabled={!title.trim()} onClick={commit}>
          Save
        </Button>
      </div>
    </div>
  )
}

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

export function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const issue = ISSUES.find(i => i.id === id)

  const [showSubtaskForm, setShowSubtaskForm] = useState(false)
  const [localSubtasks, setLocalSubtasks]     = useState<typeof ISSUES>([])

  if (!issue) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Bug className="size-10" />
        <p className="text-sm">Issue not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/issues")}>Back to Issues</Button>
      </div>
    )
  }

  const project = PROJECTS.find(p => p.id === issue.projectId)

  // Sub-tasks: children of this issue (mock data + locally added)
  const persistedSubTasks = ISSUES.filter(i => i.parentId === issue.id)
  const subTasks = [...persistedSubTasks, ...localSubtasks]
  // Parent issue: when this is a sub-task
  const parentIssue = issue.parentId ? ISSUES.find(i => i.id === issue.parentId) : undefined

  const doneCount = subTasks.filter(i => i.status === "done").length

  const handleAddSubtask = (title: string, priority: Priority) => {
    const newSt = {
      id: `local-${Date.now()}`,
      identifier: `${issue.identifier}-ST${localSubtasks.length + 1}`,
      title,
      description: "",
      status: "todo" as IssueStatus,
      type: "subtask" as IssueType,
      priority,
      projectId: issue.projectId,
      tenantId: issue.tenantId,
      parentId: issue.id,
      labels: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    setLocalSubtasks(prev => [...prev, newSt])
    // form stays open — user can keep adding; Escape to close
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/issues")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">Issues</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-mono text-muted-foreground">{issue.identifier}</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium truncate max-w-xs">{issue.title}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="size-4" /></Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl px-8 py-8">
            {/* Title */}
            <div className="flex items-start gap-3 mb-4">
              <IssueTypeBadge type={issue.type} className="shrink-0 mt-0.5" />
              <h1 className="text-xl font-semibold leading-snug">{issue.title}</h1>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <IssueStatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-xs font-mono text-muted-foreground">{issue.identifier}</span>
              {issue.labels.map(l => (
                <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
              ))}
            </div>

            <Separator className="mb-6" />

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold mb-3">Description</h2>
              <p className="text-sm leading-relaxed text-foreground">{issue.description}</p>
              {issue.dueDate && (
                <div className="flex items-center gap-1.5 mt-4 text-xs text-destructive/80">
                  <Clock className="size-3.5" />
                  <span>Due {issue.dueDate}</span>
                </div>
              )}
            </div>

            {/* Parent issue — shown when this is a sub-task */}
            {parentIssue && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-sm font-semibold mb-3">Parent Issue</h2>
                  <div className="rounded-lg border overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/issues/${parentIssue.id}`)}
                    >
                      <IssueTypeBadge type={parentIssue.type} className="shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{parentIssue.identifier}</span>
                      <IssueStatusBadge status={parentIssue.status} />
                      <span className="text-xs truncate flex-1">{parentIssue.title}</span>
                      <PriorityBadge priority={parentIssue.priority} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Sub-tasks — shown when this issue has children */}
            {(subTasks.length > 0 || issue.type !== "subtask") && (
              <>
                <Separator className="my-6" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold">Sub-tasks</h2>
                      {subTasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {doneCount}/{subTasks.length} done
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                      onClick={() => setShowSubtaskForm(v => !v)}
                    >
                      <Plus className="size-3" />
                      Add sub-task
                    </Button>
                  </div>

                  {subTasks.length > 0 ? (
                    <>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((doneCount / subTasks.length) * 100)}%` }}
                        />
                      </div>
                      <div className="rounded-lg border">
                        {subTasks.map((st, idx) => (
                          <button
                            key={st.id}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors",
                              idx !== 0 && "border-t"
                            )}
                            onClick={() => st.id.startsWith("local-") ? undefined : navigate(`/issues/${st.id}`)}
                          >
                            <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{st.identifier}</span>
                            <IssueStatusBadge status={st.status} />
                            <span className={cn("text-xs truncate flex-1", st.status === "done" && "line-through text-muted-foreground")}>
                              {st.title}
                            </span>
                            {st.assigneeName && (
                              <Avatar className="size-5 shrink-0">
                                <AvatarFallback className="text-[9px]">
                                  {st.assigneeName.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <PriorityBadge priority={st.priority} />
                          </button>
                        ))}
                        {showSubtaskForm && (
                          <AddSubtaskForm
                            onSave={handleAddSubtask}
                            onCancel={() => setShowSubtaskForm(false)}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {!showSubtaskForm && (
                        <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                          <p className="text-xs text-muted-foreground">No sub-tasks yet. Break this issue into smaller pieces.</p>
                        </div>
                      )}
                      {showSubtaskForm && (
                        <div className="rounded-lg border">
                          <AddSubtaskForm
                            onSave={handleAddSubtask}
                            onCancel={() => setShowSubtaskForm(false)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            <Separator className="my-6" />

            {/* Activity */}
            <div>
              <h2 className="text-sm font-semibold mb-4">Activity</h2>
              <div className="space-y-4">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Avatar className="size-6 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {a.actor.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs">
                        <span className="font-medium">{a.actor}</span>{" "}
                        <span className="text-muted-foreground">{a.detail}</span>
                      </p>
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

        {/* Sidebar metadata */}
        <div className="hidden lg:flex w-72 flex-col border-l">
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                <Select defaultValue={issue.status}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["backlog","todo","in_progress","in_review","done","cancelled"] as IssueStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Priority</p>
                <Select defaultValue={issue.priority}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["urgent","high","medium","low"] as Priority[]).map(p => (
                      <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Meta */}
              <div className="space-y-3">
                {issue.assigneeName && (
                  <div className="flex items-start gap-2">
                    <User className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Assignee</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[9px]">
                            {issue.assigneeName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium">{issue.assigneeName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {project && (
                  <div className="flex items-start gap-2">
                    <GitBranch className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Project</p>
                      <p className="text-xs font-medium">{project.name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Created</p>
                    <p className="text-xs font-medium">{issue.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Last updated</p>
                    <p className="text-xs font-medium">{issue.updatedAt}</p>
                  </div>
                </div>

                {issue.dueDate && (
                  <div className="flex items-start gap-2">
                    <Clock className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Due date</p>
                      <p className="text-xs font-medium text-destructive/80">{issue.dueDate}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Labels */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map(l => (
                    <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
