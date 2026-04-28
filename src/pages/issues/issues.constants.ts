import type { IssueStatus } from "@/types"

// ─── Decorative status dot colours — mirror badge variant hues ────────────────
export const STATUS_DOT: Record<IssueStatus, string> = {
  backlog:     "bg-muted-foreground/40",
  todo:        "bg-muted-foreground/60",
  in_progress: "bg-[hsl(var(--warning))]",
  in_review:   "bg-primary/50",
  done:        "bg-[hsl(var(--success))]",
  cancelled:   "bg-muted-foreground/30",
}

export const STATUS_TABS = [
  { label: "All",         value: "all"         },
  { label: "Backlog",     value: "backlog"      },
  { label: "Todo",        value: "todo"         },
  { label: "In Progress", value: "in_progress"  },
  { label: "In Review",   value: "in_review"    },
  { label: "Done",        value: "done"         },
]

export const KANBAN_COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: "backlog",     label: "Backlog"     },
  { status: "todo",        label: "Todo"        },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review",   label: "In Review"   },
  { status: "done",        label: "Done"        },
]

export type ViewMode = "list" | "kanban"
export type GroupBy  = "none" | "sprint" | "epic"
