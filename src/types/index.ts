export interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  plan: "starter" | "pro" | "enterprise"
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "admin" | "member" | "viewer"
  tenantId: string
}

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export type FeedbackStatus = "open" | "under_review" | "planned" | "in_progress" | "completed" | "declined"
export type Priority = "low" | "medium" | "high" | "urgent"

export interface FeedbackBoard {
  id: string
  name: string
  emoji: string
  tenantId: string
  feedbackCount: number
}

export interface Feedback {
  id: string
  title: string
  description: string
  status: FeedbackStatus
  boardId: string
  priority: Priority
  upvotes: number
  authorId: string
  authorName: string
  tenantId: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Issues / Projects ────────────────────────────────────────────────────────

export type IssueStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled"
export type IssueType = "task" | "bug" | "story" | "subtask"
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived"

export interface Epic {
  id: string
  title: string
  color: string        // tailwind color token e.g. "purple"
  projectId: string
  tenantId: string
}

export interface Sprint {
  id: string
  name: string         // e.g. "Sprint 1"
  goal?: string
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
  projectId: string
  tenantId: string
}

export interface Project {
  id: string
  name: string
  description: string
  emoji: string
  identifier: string
  status: ProjectStatus
  progress: number
  ownerId: string
  ownerName: string
  tenantId: string
  issueCount: number
  startDate?: string
  targetDate?: string
  createdAt: string
}

// ─── Purchases / Bulk-buy ────────────────────────────────────────────────────

export type RoleKey    = "MDM" | "SCM"
export type StepStatus = "pending" | "approved" | "rejected" | "info_needed" | "skipped"
export type OverallStatus = "pending_mdm" | "pending_scm" | "approved" | "rejected" | "info_needed" | "parallel"

export interface ApprovalStep {
  role:         RoleKey
  status:       StepStatus
  approvedBy?:  string
  approvedAt?:  string
  reasonGroup?: string
  note?:        string
}

export interface BulkComment {
  id:     string
  author: string
  role:   RoleKey | "Requester"
  text:   string
  time:   string
}

export interface BulkItem {
  id:          string
  sku:         string
  productName: string
  category:    string
  supplier:    string
  requestedBy: string
  requestedAt: string
  // Order
  qtyOrdered:      number
  unitPrice:       number
  orderValue:      number
  expectedArrival: string
  // Inventory at request date
  stockDC:         number
  stockTotal:      number
  // Deal window
  dealStart: string
  dealEnd:   string
  // Velocity & promotion
  projectedDailySales: number
  promotion:           string
  feasibilityNote:     string
  // Sales benchmarks
  avgSales28d:      number
  avgSalesNonPromo: number
  daysStockDC:      number
  daysStockTotal:   number
  // Derived / forecast
  projectedStockAtArrival:  number
  salesFcVsActualDiff:      number
  projectedSellingDays:     number
  projectedDCDaysPostDeal:  number
  totalDaysPostPromo:       number
  scmDeadline:              string
  // Workflow
  steps:    [ApprovalStep, ApprovalStep]
  parallel: boolean
  comments: BulkComment[]
}

export interface Issue {
  id: string
  identifier: string
  title: string
  description: string
  status: IssueStatus
  type: IssueType
  priority: Priority
  assigneeId?: string
  assigneeName?: string
  projectId: string
  epicId?: string
  sprintId?: string
  parentId?: string        // set when type === "subtask"
  tenantId: string
  labels: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}
