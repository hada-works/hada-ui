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
