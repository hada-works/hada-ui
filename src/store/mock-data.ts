import { Tenant, User, FeedbackBoard, Feedback, Issue, Project, Epic, Sprint } from "@/types"

export const TENANTS: Tenant[] = [
  { id: "t1", name: "Acme Corp",  slug: "acme",  plan: "enterprise" },
  { id: "t2", name: "Beta Inc",   slug: "beta",  plan: "pro" },
  { id: "t3", name: "Gamma LLC",  slug: "gamma", plan: "starter" },
]

export const CURRENT_USER: User = {
  id: "u1", name: "Alex Nguyen", email: "alex@acme.com",
  role: "admin", tenantId: "t1",
}

// ─── FEEDBACK BOARDS ─────────────────────────────────────────────────────────

export const FEEDBACK_BOARDS: FeedbackBoard[] = [
  // t1
  { id: "b1", name: "Product",        emoji: "📦", tenantId: "t1", feedbackCount: 3 },
  { id: "b2", name: "Design & UX",    emoji: "🎨", tenantId: "t1", feedbackCount: 2 },
  { id: "b3", name: "Infrastructure", emoji: "🏗️", tenantId: "t1", feedbackCount: 2 },
  { id: "b4", name: "Security",       emoji: "🔒", tenantId: "t1", feedbackCount: 2 },
  // t2
  { id: "b5", name: "Product",        emoji: "📦", tenantId: "t2", feedbackCount: 3 },
  { id: "b6", name: "Integrations",   emoji: "🔌", tenantId: "t2", feedbackCount: 2 },
  { id: "b7", name: "Access & Perms", emoji: "🛡️", tenantId: "t2", feedbackCount: 1 },
  // t3
  { id: "b8",  name: "Product",       emoji: "📦", tenantId: "t3", feedbackCount: 2 },
  { id: "b9",  name: "Compliance",    emoji: "📋", tenantId: "t3", feedbackCount: 2 },
  { id: "b10", name: "Mobile",        emoji: "📱", tenantId: "t3", feedbackCount: 1 },
]

// ─── FEEDBACKS ────────────────────────────────────────────────────────────────

export const FEEDBACKS: Feedback[] = [
  // t1
  { id: "f1",  title: "Dark mode support",         description: "Would love a dark mode for the entire dashboard. A system-level toggle that persists per user would be ideal.", status: "planned",      boardId: "b2", priority: "high",   upvotes: 142, authorId: "u2", authorName: "Sarah Chen",      tenantId: "t1", tags: ["ui","accessibility"], createdAt: "2025-04-01", updatedAt: "2025-04-10" },
  { id: "f2",  title: "Bulk CSV export",           description: "Allow exporting any filtered table view as CSV. Right now we copy-paste data manually which is error-prone.",  status: "under_review", boardId: "b1", priority: "medium", upvotes: 89,  authorId: "u3", authorName: "John Doe",        tenantId: "t1", tags: ["export","data"],      createdAt: "2025-04-05", updatedAt: "2025-04-12" },
  { id: "f3",  title: "Webhook notifications",     description: "Send webhook events whenever a feedback or issue status changes. Pipe events into Slack or PagerDuty.",        status: "in_progress",  boardId: "b3", priority: "high",   upvotes: 76,  authorId: "u4", authorName: "Maria Garcia",    tenantId: "t1", tags: ["integrations"],       createdAt: "2025-04-08", updatedAt: "2025-04-15" },
  { id: "f4",  title: "Two-factor authentication", description: "Add TOTP-based 2FA. With enterprise clients this is a compliance requirement for SOC 2.",                      status: "completed",    boardId: "b4", priority: "urgent", upvotes: 201, authorId: "u5", authorName: "James Park",      tenantId: "t1", tags: ["security","auth"],    createdAt: "2025-03-15", updatedAt: "2025-04-20" },
  { id: "f5",  title: "Mobile app",               description: "Native mobile app for iOS and Android. Field teams need on-the-go access.",                                    status: "open",         boardId: "b1", priority: "medium", upvotes: 315, authorId: "u6", authorName: "Emma Wilson",     tenantId: "t1", tags: ["mobile"],             createdAt: "2025-04-10", updatedAt: "2025-04-10" },
  { id: "f6",  title: "API rate limit increase",  description: "Current 100 req/min limit is too restrictive for our automated pipelines.",                                   status: "declined",     boardId: "b3", priority: "low",    upvotes: 23,  authorId: "u7", authorName: "Tom Brown",       tenantId: "t1", tags: ["api"],                createdAt: "2025-04-12", updatedAt: "2025-04-18" },
  { id: "f7",  title: "Custom dashboard widgets", description: "Let admins add/remove/reorder widgets. Drag-and-drop layout builder similar to Notion.",                       status: "open",         boardId: "b2", priority: "medium", upvotes: 58,  authorId: "u8", authorName: "Lin Wei",         tenantId: "t1", tags: ["ui","dashboard"],     createdAt: "2025-04-18", updatedAt: "2025-04-18" },
  { id: "f8",  title: "SSO via SAML 2.0",        description: "IT policy mandates SSO for all SaaS tools. SAML 2.0 with Okta and Azure AD would unblock our full rollout.",  status: "planned",      boardId: "b4", priority: "urgent", upvotes: 178, authorId: "u9", authorName: "David Kim",       tenantId: "t1", tags: ["auth","enterprise"],  createdAt: "2025-03-28", updatedAt: "2025-04-22" },
  // t2
  { id: "f9",  title: "Kanban board view",        description: "Kanban-style board for issues. Cards draggable between columns with WIP limits.",                              status: "planned",      boardId: "b5", priority: "high",   upvotes: 204, authorId: "u10", authorName: "Priya Patel",    tenantId: "t2", tags: ["ui","productivity"],  createdAt: "2025-04-02", updatedAt: "2025-04-14" },
  { id: "f10", title: "Time tracking per issue",  description: "Built-in timer or manual time-log on each issue so we can report billable hours.",                             status: "under_review", boardId: "b5", priority: "medium", upvotes: 97,  authorId: "u11", authorName: "Carlos Ruiz",    tenantId: "t2", tags: ["billing","tracking"], createdAt: "2025-04-07", updatedAt: "2025-04-16" },
  { id: "f11", title: "Recurring tasks",          description: "Support recurring issues (daily standups, weekly reports). Auto-create on cron schedule.",                     status: "open",         boardId: "b5", priority: "medium", upvotes: 61,  authorId: "u12", authorName: "Yuki Tanaka",    tenantId: "t2", tags: ["automation"],         createdAt: "2025-04-11", updatedAt: "2025-04-11" },
  { id: "f12", title: "Slack integration",        description: "Post issue updates to a Slack channel. Two-way: allow responding to comments from Slack.",                     status: "in_progress",  boardId: "b6", priority: "high",   upvotes: 143, authorId: "u13", authorName: "Anna Schmidt",   tenantId: "t2", tags: ["integrations","slack"], createdAt: "2025-04-03", updatedAt: "2025-04-19" },
  { id: "f13", title: "Guest collaborator access",description: "Invite external stakeholders as read-only guests without giving them a full seat.",                            status: "open",         boardId: "b7", priority: "low",    upvotes: 39,  authorId: "u14", authorName: "Ben Taylor",     tenantId: "t2", tags: ["permissions"],        createdAt: "2025-04-15", updatedAt: "2025-04-15" },
  { id: "f14", title: "Email digest",             description: "Weekly email summary of open feedbacks, critical issues, project progress. Configurable per user.",            status: "completed",    boardId: "b6", priority: "low",    upvotes: 28,  authorId: "u15", authorName: "Mei Lin",        tenantId: "t2", tags: ["notifications"],      createdAt: "2025-03-20", updatedAt: "2025-04-05" },
  // t3
  { id: "f15", title: "Offline mode",             description: "Allow reading and triaging issues without internet. Sync when connection is restored.",                        status: "open",         boardId: "b10",priority: "high",   upvotes: 87,  authorId: "u16", authorName: "Omar Hassan",    tenantId: "t3", tags: ["mobile","offline"],   createdAt: "2025-04-09", updatedAt: "2025-04-09" },
  { id: "f16", title: "PDF report export",        description: "Export project status report as a branded PDF to send to clients.",                                            status: "under_review", boardId: "b8", priority: "medium", upvotes: 54,  authorId: "u17", authorName: "Fatima Al-Zahra",tenantId: "t3", tags: ["export","reports"],   createdAt: "2025-04-13", updatedAt: "2025-04-20" },
  { id: "f17", title: "Custom issue fields",      description: "Configurable custom fields per issue type (e.g. client name, contract ID).",                                   status: "planned",      boardId: "b8", priority: "high",   upvotes: 119, authorId: "u18", authorName: "Jake Morrison",  tenantId: "t3", tags: ["customization"],      createdAt: "2025-04-06", updatedAt: "2025-04-17" },
  { id: "f18", title: "Audit log",                description: "History of all changes to issues, feedbacks, and project settings for compliance.",                            status: "open",         boardId: "b9", priority: "urgent", upvotes: 162, authorId: "u19", authorName: "Sophie Blanc",   tenantId: "t3", tags: ["security","compliance"], createdAt: "2025-04-04", updatedAt: "2025-04-04" },
  { id: "f19", title: "Bulk status update",       description: "Select multiple issues and change status in one action. Very tedious to do one-by-one.",                       status: "in_progress",  boardId: "b9", priority: "medium", upvotes: 76,  authorId: "u20", authorName: "Rafael Costa",   tenantId: "t3", tags: ["ux","bulk"],          createdAt: "2025-04-16", updatedAt: "2025-04-23" },
]

// ─── PROJECTS (with emoji) ────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
  // t1
  { id: "p1", name: "Auth System Overhaul",   emoji: "🔐", identifier: "AUTH", description: "Rebuild authentication: OAuth2, SAML SSO, 2FA, session management.",                  status: "active",   progress: 62, ownerId: "u1", ownerName: "Alex Nguyen",       tenantId: "t1", issueCount: 5, startDate: "2025-04-01", targetDate: "2025-05-31", createdAt: "2025-03-28" },
  { id: "p2", name: "Developer Portal v2",    emoji: "📖", identifier: "DEV",  description: "New API docs site with OpenAPI explorer, sandbox, and changelog.",                   status: "active",   progress: 35, ownerId: "u2", ownerName: "Sarah Chen",        tenantId: "t1", issueCount: 3, startDate: "2025-04-15", targetDate: "2025-06-30", createdAt: "2025-04-10" },
  { id: "p3", name: "Mobile App Beta",        emoji: "📱", identifier: "MOB",  description: "iOS and Android beta release targeting field operations teams.",                     status: "planning", progress: 5,  ownerId: "u3", ownerName: "John Doe",          tenantId: "t1", issueCount: 2, targetDate: "2025-08-01",                          createdAt: "2025-04-25" },
  // t2
  { id: "p4", name: "Kanban + Time Tracking", emoji: "🗂️", identifier: "KAN",  description: "Visual Kanban board with drag-and-drop and built-in time logging per issue.",        status: "active",   progress: 48, ownerId: "u10", ownerName: "Priya Patel",      tenantId: "t2", issueCount: 4, startDate: "2025-04-05", targetDate: "2025-06-15", createdAt: "2025-04-01" },
  { id: "p5", name: "Integrations Hub",       emoji: "🔌", identifier: "INT",  description: "Slack, email digest, and webhook integrations. One unified settings page.",          status: "active",   progress: 71, ownerId: "u11", ownerName: "Carlos Ruiz",      tenantId: "t2", issueCount: 3, startDate: "2025-03-20", targetDate: "2025-05-20", createdAt: "2025-03-15" },
  { id: "p6", name: "Guest Access",           emoji: "👥", identifier: "GST",  description: "Read-only guest roles for external stakeholders. No billing exposure.",              status: "planning", progress: 10, ownerId: "u12", ownerName: "Yuki Tanaka",      tenantId: "t2", issueCount: 1, targetDate: "2025-07-01",                          createdAt: "2025-04-20" },
  // t3
  { id: "p7", name: "Offline-First PWA",      emoji: "📡", identifier: "PWA",  description: "Service Worker + IndexedDB cache layer. Full CRUD while offline, background sync.", status: "active",   progress: 40, ownerId: "u16", ownerName: "Omar Hassan",      tenantId: "t3", issueCount: 4, startDate: "2025-04-10", targetDate: "2025-06-30", createdAt: "2025-04-08" },
  { id: "p8", name: "Custom Fields & Audit",  emoji: "🗃️", identifier: "AUD",  description: "JSONB custom fields per issue type + append-only audit log for compliance.",        status: "active",   progress: 55, ownerId: "u17", ownerName: "Fatima Al-Zahra", tenantId: "t3", issueCount: 3, startDate: "2025-04-05", targetDate: "2025-05-31", createdAt: "2025-04-03" },
  { id: "p9", name: "PDF Reporting Suite",    emoji: "📄", identifier: "PDF",  description: "Branded PDF exports for project status reports. Puppeteer-based generation.",       status: "planning", progress: 8,  ownerId: "u18", ownerName: "Jake Morrison",    tenantId: "t3", issueCount: 1, targetDate: "2025-07-15",                          createdAt: "2025-04-22" },
]

// ─── EPICS ────────────────────────────────────────────────────────────────────

export const EPICS: Epic[] = [
  // p1 AUTH
  { id: "e1", title: "Identity & Access", color: "purple", projectId: "p1", tenantId: "t1" },
  { id: "e2", title: "Developer Experience", color: "blue",   projectId: "p1", tenantId: "t1" },
  // p2 DEV
  { id: "e3", title: "API Docs",           color: "sky",    projectId: "p2", tenantId: "t1" },
  // p4 KAN
  { id: "e4", title: "Kanban Core",        color: "amber",  projectId: "p4", tenantId: "t2" },
  { id: "e5", title: "Time Tracking",      color: "emerald",projectId: "p4", tenantId: "t2" },
  // p5 INT
  { id: "e6", title: "Slack Integration",  color: "green",  projectId: "p5", tenantId: "t2" },
  // p7 PWA
  { id: "e7", title: "Offline Support",    color: "cyan",   projectId: "p7", tenantId: "t3" },
  // p8 AUD
  { id: "e8", title: "Audit & Compliance", color: "rose",   projectId: "p8", tenantId: "t3" },
]

// ─── SPRINTS ──────────────────────────────────────────────────────────────────

export const SPRINTS: Sprint[] = [
  // t1 — p1 AUTH
  { id: "s1", name: "Sprint 1", goal: "Core auth flows",         startDate: "2025-04-01", endDate: "2025-04-14", status: "completed", projectId: "p1", tenantId: "t1" },
  { id: "s2", name: "Sprint 2", goal: "SSO & session hardening", startDate: "2025-04-15", endDate: "2025-04-28", status: "active",    projectId: "p1", tenantId: "t1" },
  { id: "s3", name: "Sprint 3", goal: "A11y & cleanup",          startDate: "2025-04-29", endDate: "2025-05-12", status: "upcoming",  projectId: "p1", tenantId: "t1" },
  // t1 — p2 DEV
  { id: "s4", name: "Sprint 1", goal: "API docs & CI",           startDate: "2025-04-01", endDate: "2025-04-21", status: "completed", projectId: "p2", tenantId: "t1" },
  { id: "s5", name: "Sprint 2", goal: "Sandbox & polish",        startDate: "2025-04-22", endDate: "2025-05-12", status: "active",    projectId: "p2", tenantId: "t1" },
  // t2 — p4 KAN
  { id: "s6", name: "Sprint 1", goal: "Board UI & DnD",          startDate: "2025-04-05", endDate: "2025-04-18", status: "completed", projectId: "p4", tenantId: "t2" },
  { id: "s7", name: "Sprint 2", goal: "Time logs & bug fixes",   startDate: "2025-04-19", endDate: "2025-05-02", status: "active",    projectId: "p4", tenantId: "t2" },
  // t2 — p5 INT
  { id: "s8", name: "Sprint 1", goal: "Slack OAuth & digest",    startDate: "2025-03-20", endDate: "2025-04-03", status: "completed", projectId: "p5", tenantId: "t2" },
  { id: "s9", name: "Sprint 2", goal: "Webhook schema v2",       startDate: "2025-04-04", endDate: "2025-04-25", status: "active",    projectId: "p5", tenantId: "t2" },
  // t3 — p7 PWA
  { id: "s10", name: "Sprint 1", goal: "IndexedDB cache",        startDate: "2025-04-10", endDate: "2025-04-23", status: "active",    projectId: "p7", tenantId: "t3" },
  { id: "s11", name: "Sprint 2", goal: "Conflict resolution",    startDate: "2025-04-24", endDate: "2025-05-07", status: "upcoming",  projectId: "p7", tenantId: "t3" },
  // t3 — p8 AUD
  { id: "s12", name: "Sprint 1", goal: "Custom fields schema",   startDate: "2025-04-05", endDate: "2025-04-18", status: "completed", projectId: "p8", tenantId: "t3" },
  { id: "s13", name: "Sprint 2", goal: "Audit log & bulk API",   startDate: "2025-04-19", endDate: "2025-05-02", status: "active",    projectId: "p8", tenantId: "t3" },
]

// ─── ISSUES ───────────────────────────────────────────────────────────────────

export const ISSUES: Issue[] = [
  // p1 AUTH
  { id: "i1",  identifier: "AUTH-1", title: "Fix login redirect loop",            description: "Users stuck in infinite redirect loop after OAuth with Google. Missing redirect_uri validation on callback.", status: "in_progress", type: "bug",         priority: "urgent", assigneeId: "u1",  assigneeName: "Alex Nguyen",       epicId: "e1", sprintId: "s2", projectId: "p1", tenantId: "t1", labels: ["auth","critical"],     dueDate: "2025-05-05", createdAt: "2025-04-20", updatedAt: "2025-04-27" },
  { id: "i2",  identifier: "AUTH-2", title: "Implement tenant settings page",     description: "Full tenant settings UI: general info, billing, members, danger zone. Design ready in Figma.",             status: "todo",        type: "story",     priority: "high",   assigneeId: "u2",  assigneeName: "Sarah Chen",        epicId: "e2", sprintId: "s2", projectId: "p1", tenantId: "t1", labels: ["settings","ui"],       dueDate: "2025-05-15", createdAt: "2025-04-18", updatedAt: "2025-04-25" },
  { id: "i3",  identifier: "AUTH-3", title: "Implement SAML SSO",                description: "SAML 2.0 SP-initiated SSO with Okta and Azure AD.",                                                        status: "todo",        type: "story",     priority: "urgent", assigneeId: "u2",  assigneeName: "Sarah Chen",        epicId: "e1", sprintId: "s2", projectId: "p1", tenantId: "t1", labels: ["auth","enterprise"],   dueDate: "2025-05-20", createdAt: "2025-04-22", updatedAt: "2025-04-28" },
  { id: "i4",  identifier: "AUTH-4", title: "WCAG 2.1 AA accessibility audit",   description: "Run axe-core on all pages. Fix colour contrast, keyboard nav, screen reader labels.",                     status: "backlog",     type: "task", priority: "medium",                                                    epicId: "e2", sprintId: "s3", projectId: "p1", tenantId: "t1", labels: ["a11y","ui"],           createdAt: "2025-04-24", updatedAt: "2025-04-24" },
  { id: "i5",  identifier: "AUTH-5", title: "Session token rotation",            description: "Rotate refresh tokens on every use. Invalidate all sessions on password change.",                          status: "backlog",     type: "task", priority: "high",                                                      epicId: "e1", sprintId: "s3", projectId: "p1", tenantId: "t1", labels: ["auth","security"],     createdAt: "2025-04-26", updatedAt: "2025-04-26" },
  // p2 DEV
  { id: "i6",  identifier: "DEV-1",  title: "Write API documentation",            description: "Document all public endpoints with OpenAPI 3.1. Host under /docs.",                                       status: "in_review",   type: "task",        priority: "medium", assigneeId: "u3",  assigneeName: "John Doe",          epicId: "e3", sprintId: "s4", projectId: "p2", tenantId: "t1", labels: ["docs"],                createdAt: "2025-04-10", updatedAt: "2025-04-26" },
  { id: "i7",  identifier: "DEV-2",  title: "Setup CI/CD pipeline",              description: "GitHub Actions for auto testing on PR, deploy to staging on merge.",                                      status: "done",        type: "task",        priority: "high",   assigneeId: "u1",  assigneeName: "Alex Nguyen",       epicId: "e3", sprintId: "s4", projectId: "p2", tenantId: "t1", labels: ["devops"],              createdAt: "2025-04-01", updatedAt: "2025-04-22" },
  { id: "i8",  identifier: "DEV-3",  title: "OpenAPI sandbox environment",        description: "Interactive API sandbox where devs can test endpoints with real responses.",                               status: "backlog",     type: "story",     priority: "medium",                                                    epicId: "e3", sprintId: "s5", projectId: "p2", tenantId: "t1", labels: ["api","dx"],            createdAt: "2025-04-25", updatedAt: "2025-04-25" },
  // p3 MOB
  { id: "i9",  identifier: "MOB-1",  title: "React Native project bootstrap",     description: "Expo setup, navigation, auth flow wired to existing API.",                                                status: "todo",        type: "task",        priority: "high",                                                                        projectId: "p3", tenantId: "t1", labels: ["mobile"],              createdAt: "2025-04-25", updatedAt: "2025-04-25" },
  { id: "i10", identifier: "MOB-2",  title: "Offline issue triage screen",        description: "Cache issue list in AsyncStorage. Allow status change offline, sync on reconnect.",                       status: "backlog",     type: "story",     priority: "medium",                                                                      projectId: "p3", tenantId: "t1", labels: ["mobile","offline"],    createdAt: "2025-04-25", updatedAt: "2025-04-25" },
  // p4 KAN
  { id: "i11", identifier: "KAN-1",  title: "Kanban board component",             description: "Drag-and-drop board using @dnd-kit. Columns map to IssueStatus. Cards support priority colour.",          status: "in_progress", type: "story",     priority: "high",   assigneeId: "u10", assigneeName: "Priya Patel",      epicId: "e4", sprintId: "s7", projectId: "p4", tenantId: "t2", labels: ["ui","dnd"],            dueDate: "2025-05-10", createdAt: "2025-04-05", updatedAt: "2025-04-26" },
  { id: "i12", identifier: "KAN-2",  title: "Time-log API endpoint",              description: "POST /issues/:id/timelogs — duration (min) + note. Aggregate total per issue.",                           status: "todo",        type: "story",     priority: "medium", assigneeId: "u11", assigneeName: "Carlos Ruiz",      epicId: "e5", sprintId: "s7", projectId: "p4", tenantId: "t2", labels: ["api","billing"],       createdAt: "2025-04-08", updatedAt: "2025-04-21" },
  { id: "i13", identifier: "KAN-3",  title: "Fix timezone bug in date picker",    description: "Due dates shift ±1 day depending on browser timezone. API stores UTC but picker uses local.",            status: "in_progress", type: "bug",         priority: "high",   assigneeId: "u13", assigneeName: "Anna Schmidt",     epicId: "e4", sprintId: "s7", projectId: "p4", tenantId: "t2", labels: ["bug","dates"],         createdAt: "2025-04-19", updatedAt: "2025-04-27" },
  { id: "i14", identifier: "KAN-4",  title: "WIP limit enforcement",              description: "Block drag-and-drop when column exceeds configured WIP limit. Show visual warning.",                      status: "backlog",     type: "story",     priority: "low",                                                       epicId: "e4", sprintId: "s7", projectId: "p4", tenantId: "t2", labels: ["ui"],                  createdAt: "2025-04-20", updatedAt: "2025-04-20" },
  // p5 INT
  { id: "i15", identifier: "INT-1",  title: "Slack OAuth app registration",       description: "Register Slack app, OAuth 2.0 install flow, store bot tokens per workspace.",                            status: "in_review",   type: "story",     priority: "high",   assigneeId: "u12", assigneeName: "Yuki Tanaka",      epicId: "e6", sprintId: "s9", projectId: "p5", tenantId: "t2", labels: ["integrations"],        createdAt: "2025-04-03", updatedAt: "2025-04-25" },
  { id: "i16", identifier: "INT-2",  title: "Weekly email digest worker",         description: "Cron job (Sunday 07:00 UTC) that compiles digest and sends via SendGrid.",                                status: "done",        type: "task",        priority: "low",    assigneeId: "u14", assigneeName: "Ben Taylor",       epicId: "e6", sprintId: "s8", projectId: "p5", tenantId: "t2", labels: ["notifications"],       createdAt: "2025-03-25", updatedAt: "2025-04-10" },
  { id: "i17", identifier: "INT-3",  title: "Webhook event schema v2",            description: "Define versioned JSON schema for all webhook payloads. Publish changelog.",                                status: "backlog",     type: "task", priority: "medium",                                                    epicId: "e6", sprintId: "s9", projectId: "p5", tenantId: "t2", labels: ["api"],                 createdAt: "2025-04-22", updatedAt: "2025-04-22" },
  // p6 GST
  { id: "i18", identifier: "GST-1",  title: "Guest permission model",             description: "Read-only guest role. Must not expose billing or member data.",                                           status: "backlog",     type: "story",     priority: "low",                                                                         projectId: "p6", tenantId: "t2", labels: ["permissions"],         createdAt: "2025-04-15", updatedAt: "2025-04-15" },
  // p7 PWA
  { id: "i19", identifier: "PWA-1",  title: "IndexedDB offline cache layer",      description: "Cache issue list/detail in IndexedDB. Service Worker intercepts fetch. Sync queue for offline mutations.", status: "in_progress", type: "story",     priority: "high",   assigneeId: "u16", assigneeName: "Omar Hassan",      epicId: "e7", sprintId: "s10", projectId: "p7", tenantId: "t3", labels: ["offline","pwa"],      dueDate: "2025-05-30", createdAt: "2025-04-10", updatedAt: "2025-04-27" },
  { id: "i20", identifier: "PWA-2",  title: "Mobile crash on Android 13",         description: "App crashes on launch on Android 13 (Pixel 7, S23). NullPointerException in auth token refresh.",       status: "in_progress", type: "bug",         priority: "urgent", assigneeId: "u20", assigneeName: "Rafael Costa",     epicId: "e7", sprintId: "s10", projectId: "p7", tenantId: "t3", labels: ["mobile","crash"],     dueDate: "2025-05-03", createdAt: "2025-04-24", updatedAt: "2025-04-28" },
  { id: "i21", identifier: "PWA-3",  title: "PDF generation service",             description: "Integrate Puppeteer to render project status reports as PDFs. Branded header/footer.",                   status: "todo",        type: "story",     priority: "medium", assigneeId: "u17", assigneeName: "Fatima Al-Zahra",  epicId: "e7", sprintId: "s10", projectId: "p7", tenantId: "t3", labels: ["export"],             createdAt: "2025-04-14", updatedAt: "2025-04-22" },
  { id: "i22", identifier: "PWA-4",  title: "Background sync conflict resolver",  description: "Handle merge conflicts when local offline mutations conflict with server state.",                          status: "backlog",     type: "task", priority: "medium",                                                    epicId: "e7", sprintId: "s11", projectId: "p7", tenantId: "t3", labels: ["offline","pwa"],      createdAt: "2025-04-26", updatedAt: "2025-04-26" },
  // p8 AUD
  { id: "i23", identifier: "AUD-1",  title: "Custom fields schema migration",     description: "Design custom_fields JSONB column on issues. Write migration, validate per-tenant schema.",               status: "in_review",   type: "story",     priority: "high",   assigneeId: "u18", assigneeName: "Jake Morrison",    epicId: "e8", sprintId: "s12", projectId: "p8", tenantId: "t3", labels: ["db","customization"],  createdAt: "2025-04-07", updatedAt: "2025-04-24" },
  { id: "i24", identifier: "AUD-2",  title: "Audit log event emitter",            description: "Emit audit.created on every mutating API action. Store actor, timestamp, diff in audit_logs table.",     status: "backlog",     type: "story",     priority: "urgent",                                                    epicId: "e8", sprintId: "s13", projectId: "p8", tenantId: "t3", labels: ["security","compliance"], createdAt: "2025-04-05", updatedAt: "2025-04-05" },
  { id: "i25", identifier: "AUD-3",  title: "Bulk status update endpoint",        description: "PATCH /issues/bulk — array of ids + target status. Validate ids belong to same tenant.",                  status: "done",        type: "task", priority: "medium", assigneeId: "u19", assigneeName: "Sophie Blanc",     epicId: "e8", sprintId: "s12", projectId: "p8", tenantId: "t3", labels: ["api","bulk"],          createdAt: "2025-04-17", updatedAt: "2025-04-25" },
  // p9 PDF
  { id: "i26", identifier: "PDF-1",  title: "PDF template engine",                description: "Puppeteer-based HTML-to-PDF with tenant branding tokens injected at render time.",                        status: "todo",        type: "story",     priority: "medium",                                                                      projectId: "p9", tenantId: "t3", labels: ["export"],              createdAt: "2025-04-22", updatedAt: "2025-04-22" },
  // sub-tasks of i1 (AUTH-1 — Fix login redirect loop)
  { id: "i27", identifier: "AUTH-6", title: "Validate redirect_uri on callback",  description: "Add server-side validation to reject redirect URIs that are not whitelisted for the OAuth client.",      status: "in_progress", type: "subtask",   priority: "urgent", assigneeId: "u1",  assigneeName: "Alex Nguyen",  parentId: "i1",  epicId: "e1", sprintId: "s2",  projectId: "p1", tenantId: "t1", labels: ["auth"],  dueDate: "2025-05-03", createdAt: "2025-04-21", updatedAt: "2025-04-27" },
  { id: "i28", identifier: "AUTH-7", title: "Add regression test for OAuth flow", description: "Write Playwright e2e test covering Google & GitHub OAuth happy-path and error cases.",                   status: "todo",        type: "subtask",   priority: "high",                                                               parentId: "i1",  epicId: "e1", sprintId: "s2",  projectId: "p1", tenantId: "t1", labels: ["test"],              createdAt: "2025-04-22", updatedAt: "2025-04-22" },
  { id: "i29", identifier: "AUTH-8", title: "Update error messaging for redirect",description: "Show user-friendly error page instead of blank screen when OAuth redirect fails.",                        status: "backlog",     type: "subtask",   priority: "medium",                                                              parentId: "i1",  epicId: "e2", sprintId: "s3",  projectId: "p1", tenantId: "t1", labels: ["ux"],                createdAt: "2025-04-22", updatedAt: "2025-04-22" },
  // sub-tasks of i11 (KAN-1 — Kanban board component)
  { id: "i30", identifier: "KAN-5",  title: "Implement drag-and-drop with dnd-kit",description: "Wire up @dnd-kit/core. Cards draggable between status columns. Optimistic update on drop.",           status: "done",        type: "subtask",   priority: "high",   assigneeId: "u10", assigneeName: "Priya Patel",  parentId: "i11", epicId: "e4", sprintId: "s6",  projectId: "p4", tenantId: "t2", labels: ["ui","dnd"],          createdAt: "2025-04-06", updatedAt: "2025-04-18" },
  { id: "i31", identifier: "KAN-6",  title: "Priority colour indicators on cards", description: "Add left border colour on kanban cards matching priority (urgent=red, high=amber, etc.).",              status: "in_progress", type: "subtask",   priority: "medium", assigneeId: "u13", assigneeName: "Anna Schmidt", parentId: "i11", epicId: "e4", sprintId: "s7",  projectId: "p4", tenantId: "t2", labels: ["ui"],                createdAt: "2025-04-19", updatedAt: "2025-04-26" },
]
