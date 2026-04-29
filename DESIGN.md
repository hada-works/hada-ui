# DESIGN.md — Hada UI Architecture & Design Standards

> **Trạng thái:** Bắt buộc tuân thủ cho mọi thay đổi kể từ ngày 2026-04-29.
> Mọi PR / task làm trái quy định này phải giải thích lý do rõ ràng trước khi merge.

---

## 1. Cấu trúc thư mục

```
src/
├── features/                  ← toàn bộ business logic, tổ chức theo domain
│   ├── <feature>/
│   │   ├── pages/             ← entry-point components (route targets)
│   │   │   └── <Name>Page.tsx
│   │   ├── components/        ← UI components nội bộ của feature
│   │   │   └── <Component>.tsx
│   │   ├── constants.ts       ← enums, config, static data, helper fns
│   │   └── index.ts           ← barrel — public API duy nhất của feature
│   │
│   ├── issues/
│   ├── feedbacks/
│   ├── projects/
│   ├── purchases/
│   └── workspace/             ← cross-cutting pages: dashboard, members, settings…
│
├── components/
│   ├── ui/                    ← shadcn primitives (KHÔNG sửa trực tiếp)
│   ├── layout/                ← AppLayout, Header, Sidebar
│   └── shared/                ← components dùng ≥ 2 feature khác nhau
│
├── store/                     ← global state, mock data
├── types/                     ← TypeScript types/interfaces toàn cục
├── lib/                       ← utils (cn, …)
└── App.tsx                    ← router — chỉ import từ features/*/index.ts
```

### Quy tắc đặt tên file

| Loại | Pattern | Ví dụ |
|------|---------|-------|
| Page (route target) | `<Name>Page.tsx` | `IssuesPage.tsx` |
| Component | `<PascalCase>.tsx` | `IssueRow.tsx` |
| Constants / helpers | `constants.ts` | `features/issues/constants.ts` |
| Barrel | `index.ts` | `features/issues/index.ts` |
| Types toàn cục | `types/index.ts` | (duy nhất một file) |

---

## 2. Dependency Direction (bắt buộc)

```
ui/  ←  shared/  ←  features/*/components  ←  features/*/pages  ←  App.tsx
```

**Quy tắc cứng:**

- `ui/` không biết gì về domain, không import từ `shared/` hay `features/`
- `shared/` không import từ bất kỳ `features/*` nào
- `features/A` **không import** từ `features/B` — nếu cần thì extract lên `shared/`
- `features/*/components` không import từ `features/*/pages` cùng feature
- `App.tsx` chỉ import từ `features/*/index.ts` — không bao giờ import sâu vào nội bộ

**Kiểm tra nhanh:** Nếu xóa cả folder `features/purchases/` thì không có file nào ngoài `App.tsx` và `Sidebar.tsx` bị lỗi → encapsulation đúng.

---

## 3. Barrel exports (`index.ts`)

Mỗi feature **phải có** `index.ts` xuất public API:

```ts
// features/purchases/index.ts
export { BulkBuyApprovalPage }    from "./pages/BulkBuyApprovalPage"
export { PurchasesDashboardPage } from "./pages/PurchasesDashboardPage"
export { PurchasesSettingsPage }  from "./pages/PurchasesSettingsPage"
// KHÔNG export internal components — chúng là implementation detail
```

`App.tsx` chỉ import từ barrel:

```ts
import { BulkBuyApprovalPage, PurchasesDashboardPage } from "@/features/purchases"
```

---

## 4. Phân loại component: `shared/` vs `features/*/components/`

| Đặt vào `shared/` | Đặt vào `features/*/components/` |
|-------------------|----------------------------------|
| Dùng ở ≥ 2 feature khác nhau | Chỉ dùng trong 1 feature |
| Không biết về domain data | Biết về domain types |
| Ví dụ: `EmptyState`, `PriorityBadge`, `StatusBadge`, `UserAvatar` | Ví dụ: `IssueTypeBadge`, `EpicChip`, `ApprovalStepBar`, `BulkItemTable` |

**Khi thêm component mới:** đặt vào `features/` trước. Chỉ promote lên `shared/` khi có feature thứ 2 thực sự cần dùng.

---

## 5. Design Token — CSS Variables

Toàn bộ màu sắc dùng CSS custom properties theo pattern `hsl(var(--token))`. **Không dùng raw Tailwind color classes** (`bg-emerald-500`, `text-blue-600`, v.v.) trong production code.

### Token palette (`src/index.css`)

**Base shadcn tokens** (không sửa):
`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`

**Semantic tokens** (thêm mới trong session này):

```css
/* Success */
--success: 152 69% 31%;
--success-foreground: 0 0% 100%;
--success-subtle: 152 60% 94%;
--success-subtle-foreground: 152 69% 22%;

/* Warning */
--warning: 32 95% 44%;
--warning-foreground: 0 0% 100%;
--warning-subtle: 48 100% 92%;
--warning-subtle-foreground: 32 95% 30%;

/* Info */
--info: 211 100% 50%;
--info-foreground: 0 0% 100%;
--info-subtle: 214 100% 93%;
--info-subtle-foreground: 211 100% 35%;
```

**Epic / categorical palette** (data viz, 8 màu):

```css
--epic-purple: 265 89% 66%;
--epic-blue:   213 93% 60%;
--epic-sky:    198 93% 55%;
--epic-amber:   38 95% 55%;
--epic-emerald:160 75% 46%;
--epic-green:  142 71% 45%;
--epic-cyan:   186 80% 47%;
--epic-rose:   351 83% 61%;
```

### Cách dùng đúng

```tsx
// ✅ Đúng
className="bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]"
className="bg-[hsl(var(--warning))]"
className="text-destructive"          // token shadcn — OK
className="bg-muted text-foreground"  // token shadcn — OK

// ❌ Sai
className="bg-emerald-500"
className="text-blue-600"
className="bg-amber-400"
```

### Dark mode

Mỗi token semantic **phải có** giá trị `.dark` tương ứng trong `index.css`. Kiểm tra contrast ≥ 4.5:1 (WCAG AA) trước khi thêm token mới.

---

## 6. Component Library — shadcn/ui

### Badge variants

`Badge` có 7 variant: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`.

```tsx
<Badge variant="success">Đã duyệt</Badge>
<Badge variant="warning">Cần TT</Badge>
<Badge variant="info">Chờ SCM</Badge>
```

Không tạo thêm badge variant mới nếu chưa thêm token CSS tương ứng.

### NativeSelect

Khi cần `<select>` HTML thuần (Settings, Members), dùng wrapper `NativeSelect` với shadcn classes thay vì `<select>` bare.

### Textarea

Luôn dùng `@/components/ui/textarea` — không dùng `<textarea>` bare.

---

## 7. Layout patterns

### Sticky frozen-header table

Dùng khi có bảng nhiều cột + cần scroll ngang:

```tsx
// Header: overflow-hidden, ref synced với rows
<div ref={headerScrollRef} className="shrink-0 overflow-hidden border-b bg-muted">

// Rows: overflow-auto, fire onScroll
<div ref={rowsScrollRef} className="flex-1 overflow-auto" onScroll={onRowsScroll}>

// Sync trong useCallback:
headerScrollRef.current.scrollLeft = rowsScrollRef.current.scrollLeft
```

Sticky columns dùng `position: sticky` + computed `left` offset. Background của sticky cell phải được set explicitly (không thể inherit qua `overflow: hidden`).

### Resizable split pane

```tsx
const onMouseDown = useCallback((e: React.MouseEvent) => {
  isDragging.current = true
  document.body.style.cursor = "col-resize"
  document.body.style.userSelect = "none"
}, [])
// cleanup trong useEffect window mousemove/mouseup
// clamp: Math.min(80, Math.max(20, pct))
```

Right panel phải có `min-w-[300px]` để tránh layout vỡ khi kéo quá hẹp.

### Status filter tabs

Pattern chuẩn (dùng cho Issues, Feedbacks, BulkBuy):

```tsx
<button
  className={cn(
    "shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors",
    isActive
      ? "border-primary text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
  )}
>
  {label}
  <span className={cn(
    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
  )}>
    {count}
  </span>
</button>
```

### Status dots

```tsx
// ✅ Đúng
"bg-[hsl(var(--success))]"
"bg-[hsl(var(--warning))]"
"bg-[hsl(var(--info))]"
"bg-destructive/70"
"bg-muted-foreground/60"

// ❌ Sai
"bg-emerald-500"
"bg-amber-400"
```

---

## 8. Sidebar navigation pattern

Group collapsible dùng `<Collapsible>` + `<ChevronRight>` rotate-90. Sub-items dùng `<SidebarMenuSubButton>`.

Khi thêm feature mới vào nav:
1. Thêm route vào `App.tsx` — import từ barrel
2. Thêm group + sub-items vào `Sidebar.tsx`
3. Collapsible state: `const [<feature>Open, set<Feature>Open] = useState(true)`

---

## 9. Two-approver flow pattern (Purchases)

Sequential: MDM phải approve trước → SCM mới có thể act.
Emergency parallel: `item.parallel = true` → cả hai có thể act cùng lúc, hiển thị badge KHẨN.

```ts
function deriveOverall(item: BulkItem): OverallStatus {
  const [mdm, scm] = item.steps
  if (item.parallel)                              return "parallel"
  if (mdm.status === "rejected" || scm.status === "rejected") return "rejected"
  if (scm.status === "approved")                  return "approved"
  if (mdm.status === "approved")                  return "pending_scm"
  if (mdm.status === "info_needed")               return "info_needed"
  return "pending_mdm"
}
```

Reset MDM → phải reset SCM theo (sequential dependency):
```ts
if (role === "MDM" && !item.parallel) steps[1] = { role: "SCM", status: "pending" }
```

---

## 10. Quy trình thêm feature mới

1. **Tạo folder:** `src/features/<name>/pages/`, `components/`, `constants.ts`, `index.ts`
2. **Viết components** — chỉ import từ `@/components/ui/*`, `@/components/shared/*`, `@/store/*`, `@/types`, `@/lib/utils`, và các file nội bộ của feature
3. **Export qua barrel** — `index.ts` chỉ export những gì `App.tsx` / `Sidebar.tsx` thực sự cần
4. **Update App.tsx** — import từ barrel, thêm `<Route>`
5. **Update Sidebar.tsx** — thêm nav item
6. **Kiểm tra:** `npx tsc --noEmit` — phải có zero errors
7. **Tự hỏi:** Nếu xóa folder này, có file nào ngoài `App.tsx` và `Sidebar.tsx` bị lỗi không? Nếu có → fix encapsulation trước

---

## 11. Checklist review trước khi merge

- [ ] Không có raw Tailwind color class (`bg-emerald-*`, `text-blue-*`, v.v.)
- [ ] Không có import từ `@/pages/*` — chỉ từ `@/features/*/index.ts` hoặc nội bộ feature
- [ ] Không có `features/A` import từ `features/B`
- [ ] Không có component domain-specific trong `shared/` (chỉ dùng 1 feature)
- [ ] `npx tsc --noEmit` → zero errors
- [ ] Dark mode: các token mới có giá trị `.dark` tương ứng
- [ ] Status dots và badge dùng CSS var token, không dùng raw color

---

## 12. Cấu trúc hiện tại (tính đến 2026-04-29)

```
src/features/
├── issues/
│   ├── pages/        IssuesPage, IssueDetailPage
│   ├── components/   IssueRow, IssueCard, IssueListView, IssueKanbanView,
│   │                 SwimlaneTable, TableHead, SprintBadge,
│   │                 IssueTypeBadge, EpicChip
│   └── constants.ts  STATUS_TABS, KANBAN_COLUMNS, STATUS_DOT, ViewMode, GroupBy
│
├── feedbacks/
│   ├── pages/        FeedbacksPage, FeedbackDetailPage, NewBoardPage
│   └── (components inline trong pages — tách ra khi cần tái sử dụng)
│
├── projects/
│   └── pages/        ProjectsPage, NewProjectPage
│
├── purchases/
│   ├── pages/        BulkBuyApprovalPage, PurchasesDashboardPage, PurchasesSettingsPage
│   ├── components/   BulkItemTable, DetailPanel, ApprovalStepBar,
│   │                 ActionForm, CommentSection, PasteModal
│   └── constants.ts  deriveOverall, COLS, STATUS_FILTERS, MONTH_FILTERS,
│                     APPROVE/REJECT/INFO_REASONS, fmt helpers, mock data
│
└── workspace/
    └── pages/        DashboardPage, MembersPage, SettingsPage,
                      AnalyticsPage, NotificationsPage

src/components/shared/
    EmptyState, PriorityBadge, StatusBadge, UserAvatar
```

---

*File này được duy trì bởi team. Cập nhật mỗi khi có thay đổi architectural.*
