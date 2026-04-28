# hada-ui

> **Enterprise UI Template** — Built by makers who actually run large-scale businesses.

A production-grade, highly customizable frontend template engineered for enterprise applications. Not a toy project, not a demo — this is the foundation we use to ship real products, fast.

---

## Why hada-ui?

Most UI templates are built to look good in screenshots.  
**hada-ui** is built to survive production.

We've operated enterprise platforms across B2B SaaS, internal tooling, and large-scale operations. Every pattern here reflects real problems we've solved — approval workflows, multi-entity project management, complex data grids, role-based UX, and more.

---

## ✦ Key Principles

### 🏭 Battle-tested by Enterprise Operators
Every screen, component, and data pattern is derived from real enterprise workflows — issue tracking, feedback management, team coordination, procurement approvals, and analytics dashboards. No generic CRUD. No fake data that doesn't match real-world complexity.

### ⚙️ Highly Customizable by Design
The architecture is intentionally layered:
- **Design tokens** via Tailwind config — change the entire look with one file
- **Shared UI components** built on Radix UI primitives — fully controllable, no black boxes
- **Page-level composition** — each screen is independent and cleanly separated
- **Global state** via a lightweight store — swap out for Redux, Zustand, or any state manager

### 🤖 AI First & AI Coding Ready
hada-ui is designed to be navigated, extended, and modified by AI coding agents (Cursor, Antigravity, Copilot, Claude, etc.):
- Strict folder structure with predictable naming conventions
- Co-located types, stores, and components — minimal context-switching for AI agents
- Pages are self-contained — AI can modify one screen without breaking others
- Fully typed with TypeScript — AI suggestions are accurate, not guesswork

### 🧱 Production Architecture, Not a Starter Kit
| Aspect | Typical Template | hada-ui |
|--------|-----------------|---------|
| Component library | shadcn copy-paste | Radix UI + custom CVA variants |
| State management | useState everywhere | Centralized store with typed actions |
| Routing | Basic routes | Nested layout with protected patterns |
| Data layer | Hardcoded props | Mock store mirroring real API contracts |
| UI complexity | Simple forms | Approval flows, bulk ops, detail panels |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| UI Primitives | Radix UI |
| Component variants | Class Variance Authority (CVA) |
| Routing | React Router v7 |
| Icons | Lucide React |
| Date handling | date-fns + react-day-picker |
| Emoji support | emoji-mart |

---

## 🗂️ Project Structure

```
hada-ui/
├── src/
│   ├── components/
│   │   ├── layout/          # AppLayout, Header, Sidebar
│   │   ├── shared/          # StatusBadge, PriorityBadge, EmptyState
│   │   └── ui/              # Button, Input, Select, DatePicker, ...
│   ├── pages/               # One file per screen
│   │   ├── Dashboard.tsx
│   │   ├── Issues.tsx        # Full issue tracker with filters & detail
│   │   ├── IssueDetail.tsx
│   │   ├── Feedbacks.tsx     # Customer feedback management
│   │   ├── FeedbackDetail.tsx
│   │   ├── BulkBuyApproval.tsx  # Multi-step procurement approval
│   │   ├── Projects.tsx
│   │   ├── Members.tsx
│   │   ├── Analytics.tsx
│   │   ├── Notifications.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   ├── app-store.tsx    # Global state
│   │   └── mock-data.ts     # Realistic mock data contracts
│   ├── types/
│   │   └── index.ts         # Shared type definitions
│   └── lib/
│       └── utils.ts         # cn(), formatters, helpers
├── .gitignore
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/hada-works/hada-ui.git
cd hada-ui

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

---

## 📋 Included Screens

| Screen | Description |
|--------|-------------|
| **Dashboard** | KPI summary, activity feed, quick actions |
| **Issues** | Full issue tracker — filters, priority, status, assignee |
| **Issue Detail** | Thread view, status updates, linked entities |
| **Feedbacks** | Customer feedback inbox with tagging |
| **Feedback Detail** | Feedback thread + internal notes |
| **Bulk Buy Approval** | Multi-step procurement approval workflow |
| **Projects** | Project card grid with status tracking |
| **New Project / Board** | Creation flows with rich form UX |
| **Members** | Team directory with role management |
| **Analytics** | Placeholder for data visualization integration |
| **Notifications** | Notification center with read/unread states |
| **Settings** | Profile, workspace, and preference management |

---

## 🛠️ Customization Guide

### 1. Brand & Colors
Edit `tailwind.config.js` → update the `colors` and `extend` section.

### 2. Swap State Management
The store in `src/store/app-store.tsx` is framework-agnostic by design.  
Replace with Zustand, Redux Toolkit, or TanStack Query as needed.

### 3. Connect Real APIs
Mock data lives in `src/store/mock-data.ts`.  
The data shape mirrors real API contracts — replace with `fetch`/`axios` calls and the types stay identical.

### 4. Extend Components
All UI components in `src/components/ui/` use CVA for variant management.  
Add new variants without touching existing ones.

---

## 🤖 Tips for AI Coding Agents

This template is optimized for AI-assisted development:

```
# Good prompts to use with this codebase:
"Add a new page for [feature] following the pattern in Issues.tsx"
"Create a new shared component similar to StatusBadge for [X]"
"Add a new field to the Issue type and update all related components"
"Implement real API calls in Issues.tsx replacing mock-data"
```

The codebase follows strict conventions so AI agents produce accurate, non-breaking changes on the first attempt.

---

## 🏢 About Hada Works

**hada-ui** is maintained by [Hada Works](https://github.com/hada-works) — a team of operators and engineers who build and run enterprise software at scale.

We build tools we actually use. Everything in this template has been validated in production environments handling real business complexity.

---

## 📄 License

MIT — use it, fork it, ship it.

---

*Built with conviction. Maintained by operators.*
