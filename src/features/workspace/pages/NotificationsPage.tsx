import { useState } from "react"
import { Bell, MessageSquare, Bug, FolderKanban, CheckCheck, Trash2, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/app-store"

type NotifType = "feedback" | "issue" | "project" | "member"

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
  tenantId: string
  actor?: string
}

const ALL_NOTIFS: Notification[] = [
  { id: "n1",  type: "feedback", title: "New feedback submitted",          body: "Sarah Chen submitted \"Dark mode support\" with 142 upvotes.",              time: "2m ago",    read: false, tenantId: "t1", actor: "Sarah Chen" },
  { id: "n2",  type: "issue",    title: "AUTH-1 status changed",           body: "Alex Nguyen moved \"Fix login redirect loop\" to In Progress.",             time: "1h ago",    read: false, tenantId: "t1", actor: "Alex Nguyen" },
  { id: "n3",  type: "project",  title: "Auth System Overhaul at 62%",     body: "Project milestone reached — 4 of 5 issues completed this sprint.",          time: "3h ago",    read: false, tenantId: "t1", actor: "System" },
  { id: "n4",  type: "issue",    title: "AUTH-3 assigned to you",           body: "Sarah Chen assigned \"Implement SAML SSO\" to you.",                       time: "5h ago",    read: true,  tenantId: "t1", actor: "Sarah Chen" },
  { id: "n5",  type: "feedback", title: "Feedback f8 planned",              body: "\"SSO via SAML 2.0\" status changed to Planned by John Doe.",              time: "Yesterday", read: true,  tenantId: "t1", actor: "John Doe" },
  { id: "n6",  type: "member",   title: "New member joined",                body: "Maria Garcia joined the workspace as Viewer.",                             time: "2d ago",    read: true,  tenantId: "t1", actor: "Maria Garcia" },
  { id: "n7",  type: "issue",    title: "DEV-2 marked as Done",             body: "Alex Nguyen completed \"Setup CI/CD pipeline\".",                          time: "3d ago",    read: true,  tenantId: "t1", actor: "Alex Nguyen" },
  { id: "n8",  type: "feedback", title: "Kanban board request trending",    body: "\"Kanban board view\" now has 204 upvotes — highest this month.",          time: "30m ago",   read: false, tenantId: "t2", actor: "System" },
  { id: "n9",  type: "issue",    title: "KAN-3 bug reported",               body: "Anna Schmidt filed \"Fix timezone bug in date picker\" as High priority.", time: "2h ago",    read: false, tenantId: "t2", actor: "Anna Schmidt" },
  { id: "n10", type: "project",  title: "Integrations Hub 71% complete",    body: "INT-2 marked done — weekly email digest worker is live.",                  time: "4h ago",    read: true,  tenantId: "t2", actor: "Ben Taylor" },
  { id: "n11", type: "member",   title: "Invitation sent",                  body: "Priya Patel invited a new guest collaborator.",                            time: "1d ago",    read: true,  tenantId: "t2", actor: "Priya Patel" },
  { id: "n12", type: "issue",    title: "PWA-2 urgent crash report",        body: "Rafael Costa filed a critical crash on Android 13 — needs immediate fix.", time: "15m ago",   read: false, tenantId: "t3", actor: "Rafael Costa" },
  { id: "n13", type: "feedback", title: "Audit log request escalated",      body: "\"Audit log\" feedback now has 162 upvotes. Status: Open.",                time: "1h ago",    read: false, tenantId: "t3", actor: "Sophie Blanc" },
  { id: "n14", type: "project",  title: "Custom Fields & Audit 55%",        body: "AUD-1 moved to In Review by Jake Morrison.",                               time: "6h ago",    read: true,  tenantId: "t3", actor: "Jake Morrison" },
  { id: "n15", type: "issue",    title: "AUD-3 completed",                  body: "Sophie Blanc marked \"Bulk status update endpoint\" as Done.",              time: "2d ago",    read: true,  tenantId: "t3", actor: "Sophie Blanc" },
]

const TYPE_ICONS: Record<NotifType, React.ElementType> = {
  feedback: MessageSquare,
  issue:    Bug,
  project:  FolderKanban,
  member:   Bell,
}

// Icon container colours — map to badge variant palettes via semantic-adjacent tokens
const TYPE_COLORS: Record<NotifType, string> = {
  feedback: "bg-primary/10 text-primary",
  issue:    "bg-destructive/10 text-destructive",
  project:  "bg-secondary text-secondary-foreground",
  member:   "bg-muted text-muted-foreground",
}

// Fixed list panel width — prevents column jump when selecting an item
const LIST_WIDTH = "w-80 min-w-80 lg:w-96 lg:min-w-96"

export function NotificationsPage() {
  const { currentTenant } = useApp()
  const [notifs, setNotifs] = useState(ALL_NOTIFS)
  const [selected, setSelected] = useState<string | null>(null)

  const tenantNotifs = notifs.filter(n => n.tenantId === currentTenant.id)
  const unread = tenantNotifs.filter(n => !n.read).length
  const selectedNotif = tenantNotifs.find(n => n.id === selected) ?? null

  const markAllRead = () => {
    setNotifs(prev => prev.map(n =>
      n.tenantId === currentTenant.id ? { ...n, read: true } : n
    ))
  }

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setSelected(id)
  }

  const deleteNotif = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    if (selected === id) setSelected(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : "You're all caught up"}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: notification list — FIXED width, always rendered ── */}
        <div className={cn(
          "flex flex-col border-r overflow-hidden shrink-0",
          // On mobile: full width when nothing selected, hidden when detail shown
          selected ? "hidden md:flex" : "flex flex-1 md:flex-none",
          // On md+: always fixed width
          "md:" + LIST_WIDTH
        )}>
          <div className="flex h-14 items-center justify-between px-4 border-b bg-muted/20 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              All notifications
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-6 gap-1 text-xs transition-none", unread === 0 && "invisible")}
              onClick={markAllRead}
              tabIndex={unread === 0 ? -1 : 0}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {tenantNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <Bell className="size-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : tenantNotifs.map(notif => {
              const Icon = TYPE_ICONS[notif.type]
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors",
                    selected === notif.id && "bg-muted/60",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full mt-0.5", TYPE_COLORS[notif.type])}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm truncate", !notif.read ? "font-semibold" : "font-medium")}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: detail panel — takes remaining space ── */}
        <div className={cn(
          "flex flex-col flex-1 overflow-hidden min-w-0",
          // Mobile: hidden when nothing selected, full width when detail shown
          !selected ? "hidden md:flex" : "flex"
        )}>
          {selectedNotif ? (
            <>
              <div className="flex h-14 items-center gap-2 px-6 border-b bg-muted/10 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 md:hidden"
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium flex-1 truncate">{selectedNotif.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNotif(selectedNotif.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-lg space-y-4">
                  {/* Type badge */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = TYPE_ICONS[selectedNotif.type]
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          TYPE_COLORS[selectedNotif.type]
                        )}>
                          <Icon className="size-3" />
                          {selectedNotif.type.charAt(0).toUpperCase() + selectedNotif.type.slice(1)}
                        </span>
                      )
                    })()}
                    <span className="text-xs text-muted-foreground">{selectedNotif.time}</span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">{selectedNotif.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selectedNotif.body}</p>
                  </div>

                  {selectedNotif.actor && (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-medium mt-0.5">{selectedNotif.actor}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">View details</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => deleteNotif(selectedNotif.id)}
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
              <Bell className="size-12 opacity-20" />
              <p className="text-sm">Select a notification to read it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
