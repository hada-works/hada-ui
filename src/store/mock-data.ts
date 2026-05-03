// ─── App-wide shared entities ─────────────────────────────────────────────────
// Feature-specific mock data lives in each feature's own mock-data.ts:
//   feedbacks  → src/features/feedbacks/mock-data.ts
//   projects   → src/features/projects/mock-data.ts
//   issues     → src/features/issues/mock-data.ts
//   purchases  → src/features/purchases/mock-data.ts

import type { Tenant, User } from "@/types"

export const TENANTS: Tenant[] = [
  { id: "t1", name: "Acme Corp",  slug: "acme",  plan: "enterprise" },
  { id: "t2", name: "Beta Inc",   slug: "beta",  plan: "pro" },
  { id: "t3", name: "Gamma LLC",  slug: "gamma", plan: "starter" },
]

export const CURRENT_USER: User = {
  id: "u1", name: "Alex Nguyen", email: "alex@acme.com",
  role: "admin", tenantId: "t1",
}
