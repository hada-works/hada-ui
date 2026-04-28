import { Badge } from "@/components/ui/badge"
import { FeedbackStatus, IssueStatus, ProjectStatus } from "@/types"

const FEEDBACK_STATUS_MAP: Record<FeedbackStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  open: { label: "Open", variant: "secondary" },
  under_review: { label: "Under Review", variant: "info" },
  planned: { label: "Planned", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  declined: { label: "Declined", variant: "destructive" },
}

const ISSUE_STATUS_VARIANT: Record<IssueStatus, "secondary" | "outline" | "info" | "warning" | "success" | "destructive"> = {
  backlog:     "outline",
  todo:        "secondary",
  in_progress: "warning",
  in_review:   "info",
  done:        "success",
  cancelled:   "destructive",
}

const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  planning: { label: "Planning", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "info" },
  archived: { label: "Archived", variant: "outline" },
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const { label, variant } = FEEDBACK_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  return <Badge variant={ISSUE_STATUS_VARIANT[status]}>{label}</Badge>
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, variant } = PROJECT_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}
