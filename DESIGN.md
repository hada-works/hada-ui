# DESIGN.md — Hada UI Architecture & Design Standards

> Mandatory for all changes. PRs that deviate from these standards must provide a clear justification before merging.

---

## 1. Directory Structure

```
src/
├── features/                  ← business logic, organized by domain
│   └── <feature>/
│       ├── pages/             ← route-target components
│       ├── components/        ← UI components internal to this feature
│       ├── constants.ts       ← enums, config, helpers
│       └── index.ts           ← barrel — the only public API of this feature
│
├── components/
│   ├── ui/                    ← shadcn primitives (do not edit directly)
│   ├── layout/                ← AppLayout, Sidebar
│   └── shared/                ← components used by ≥ 2 different features
│
├── store/                     ← global state
├── types/                     ← global TypeScript types/interfaces
├── lib/                       ← utilities (cn, …)
└── App.tsx                    ← router — imports only from features/*/index.ts
```

### File naming

| Type | Pattern | Example |
|------|---------|---------|
| Page (route target) | `<Name>Page.tsx` | `IssuesPage.tsx` |
| Component | `PascalCase.tsx` | `IssueRow.tsx` |
| Constants / helpers | `constants.ts` | `features/issues/constants.ts` |
| Barrel | `index.ts` | `features/issues/index.ts` |
| Global types | `types/index.ts` | (single file) |

---

## 2. Dependency Direction

```
ui/  ←  shared/  ←  features/*/components  ←  features/*/pages  ←  App.tsx
```

**Hard rules:**

- `ui/` has no knowledge of domain — never imports from `shared/` or `features/`
- `shared/` never imports from any `features/*`
- `features/A` never imports from `features/B` — extract to `shared/` if needed
- `App.tsx` imports only from `features/*/index.ts` — never from internal paths

**Sanity check:** If you delete an entire `features/<name>/` folder, no file outside `App.tsx` and `Sidebar.tsx` should break. If one does, fix the encapsulation first.

---

## 3. Barrel Exports

Every feature must have an `index.ts` that exposes its public API:

```ts
// features/purchases/index.ts
export { BulkBuyApprovalPage }    from "./pages/BulkBuyApprovalPage"
export { PurchasesDashboardPage } from "./pages/PurchasesDashboardPage"
export { PurchasesSettingsPage }  from "./pages/PurchasesSettingsPage"
// Do NOT export internal components — they are implementation details
```

---

## 4. `shared/` vs `features/*/components/`

| Put in `shared/` | Put in `features/*/components/` |
|------------------|---------------------------------|
| Used by ≥ 2 different features | Used by only 1 feature |
| No knowledge of domain data | Knows about domain types |

**Rule of thumb:** Start in `features/`. Only promote to `shared/` when a second feature genuinely needs it.

---

## 5. Design Tokens

All colors use CSS custom properties with the `hsl(var(--token))` pattern. **Never use raw Tailwind color utilities** (`bg-emerald-500`, `text-blue-600`, etc.) in production code.

**Token groups** (defined in `src/index.css`):

- **Base shadcn tokens** — `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` (do not modify)
- **Semantic tokens** — `--success`, `--warning`, `--info` (each with `-foreground`, `-subtle`, `-subtle-foreground` variants)
- **Categorical palette** — `--epic-purple`, `--epic-blue`, `--epic-sky`, `--epic-amber`, `--epic-emerald`, `--epic-green`, `--epic-cyan`, `--epic-rose` (for data viz)

**Usage:**

```tsx
// ✅
className="bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]"
className="text-destructive"
className="bg-muted text-foreground"

// ❌
className="bg-emerald-500"
className="text-blue-600"
```

**Dark mode:** every semantic token must have a corresponding `.dark` value in `index.css`. Verify contrast ≥ 4.5:1 (WCAG AA) before adding a new token.

---

## 6. Component Library (shadcn/ui)

- **Badge** has 7 variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`. Do not add a new variant without a corresponding CSS token.
- **Select (native):** use the `NativeSelect` wrapper instead of a bare `<select>`.
- **Textarea:** always use `@/components/ui/textarea` — never a bare `<textarea>`.

---

## 7. Adding a New Feature

1. Create `src/features/<name>/pages/`, `components/`, `constants.ts`, `index.ts`
2. Write components — only import from `@/components/ui/*`, `@/components/shared/*`, `@/store/*`, `@/types`, `@/lib/utils`, and feature-internal paths
3. Export from barrel — only what `App.tsx` / `Sidebar.tsx` actually needs
4. Register route in `App.tsx` — import from the barrel
5. Add nav item to `Sidebar.tsx`
6. Run `npx tsc --noEmit` — must be zero errors
7. Apply the sanity check from §2

---

## 8. Pre-merge Checklist

- [ ] No raw Tailwind color classes (`bg-emerald-*`, `text-blue-*`, etc.)
- [ ] No cross-feature imports (`features/A` importing from `features/B`)
- [ ] No domain-specific components sitting in `shared/` (used by only 1 feature)
- [ ] `App.tsx` imports only from feature barrels, never from internal paths
- [ ] `npx tsc --noEmit` → zero errors
- [ ] New semantic tokens have a `.dark` counterpart in `index.css`

---

*Maintained by the team. Update whenever an architectural decision changes.*
