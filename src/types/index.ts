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

// ─── GBP Audits ───────────────────────────────────────────────────────────────

export type GbpHealthStatus = "critical" | "warning" | "healthy"

export interface GbpFields {
  hasWebsite:     boolean
  hasPhone:       boolean
  hasCategory:    boolean
  hasHours:       boolean
  photoCount:     number   // < 5 is flagged
  hasDescription: boolean
}

export interface GbpReview {
  totalCount:   number
  avgRating:    number                                          // 1.0–5.0
  responseRate: number                                          // 0–100
  dist:         [number, number, number, number, number]        // [★1 … ★5]
  positivePct:  number
  neutralPct:   number
  negativePct:  number
}

// Full GBP profile — only populated for locations with rich mock data
export interface GbpBusinessHours {
  monday:    string   // "07:00–22:00" | "Closed"
  tuesday:   string
  wednesday: string
  thursday:  string
  friday:    string
  saturday:  string
  sunday:    string
}

export interface GbpAttributes {
  wheelchair:   boolean
  parking:      boolean
  wifi:         boolean
  cashPayment:  boolean
  cardPayment:  boolean
  delivery:     boolean
  dineIn:       boolean
  takeout:      boolean
}

export interface GbpFullProfile {
  primaryCategory:      string
  secondaryCategories:  string[]
  phone:                string
  additionalPhone?:     string
  website:              string
  mapsUrl:              string
  openingDate:          string          // "YYYY-MM"
  shortDescription:     string         // up to 750 chars (Google limit)
  regularHours:         GbpBusinessHours
  hasSpecialHours:      boolean        // holiday / special hours set
  attributes:           GbpAttributes
  postCount:            number         // posts published in last 90 days
  qaCount:              number         // published Q&A pairs
  hasBookingLink:       boolean
  hasMenuLink:          boolean
  hasProductCatalog:    boolean
  logoUploaded:         boolean
  coverPhotoUploaded:   boolean
}

export interface GbpLocation {
  id:            string
  tenantId:      string
  name:          string          // actual GBP name (may differ from brand standard)
  nameIsCorrect: boolean         // matches canonical brand name?
  city:          string
  address:       string
  healthScore:   number          // 0–100
  status:        GbpHealthStatus
  fields:        GbpFields
  review:        GbpReview
  lastAudit:     string          // YYYY-MM-DD
  profile?:      GbpFullProfile  // rich profile — populated for select locations
}

export type GbpReviewSentiment = "positive" | "neutral" | "negative"

export interface GbpReviewItem {
  id:            string
  tenantId:      string
  locationId:    string          // references GbpLocation.id
  reviewerName:  string
  rating:        1 | 2 | 3 | 4 | 5
  text:          string
  date:          string          // YYYY-MM-DD
  sentiment:     GbpReviewSentiment
  responded:     boolean
  response?:     string
  responseDate?: string
}

export interface GbpInsightPoint {
  month:      string    // "YYYY-MM"
  clicks:     number    // location-page / website clicks
  calls:      number    // phone-call clicks
  directions: number    // direction requests
  newReviews: number    // new reviews added that month
  avgRating:  number    // weighted avg rating that month
  r1: number            // new 1-star reviews
  r2: number
  r3: number
  r4: number
  r5: number
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
