import { BulkItem, OverallStatus, StepStatus, ApprovalStep, RoleKey } from "@/types"

// ─── Auth simulation (replace with useApp() context when wiring real auth) ───
export const CURRENT_ROLE: RoleKey = "MDM"
export const CURRENT_NAME          = "Le Thi M"

// ─── Format helpers ───────────────────────────────────────────────────────────
export const fmt    = (n: number) => n.toLocaleString("vi-VN") + "₫"
export const fmtN   = (n: number) => n.toLocaleString("vi-VN")
export const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%"

// ─── Derive overall status from two steps ────────────────────────────────────
export function deriveOverall(item: BulkItem): OverallStatus {
  const [mdm, scm] = item.steps
  if (item.parallel)                                          return "parallel"
  if (mdm.status === "rejected" || scm.status === "rejected") return "rejected"
  if (scm.status === "approved")                              return "approved"
  if (mdm.status === "approved")                              return "pending_scm"
  if (mdm.status === "info_needed")                           return "info_needed"
  return "pending_mdm"
}

// ─── Display config maps ──────────────────────────────────────────────────────
export const OVERALL_CONFIG: Record<OverallStatus, {
  label:   string
  variant: "success" | "destructive" | "warning" | "secondary" | "info"
  dot:     string
}> = {
  pending_mdm: { label: "Chờ MDM",   variant: "secondary",   dot: "bg-muted-foreground/60" },
  pending_scm: { label: "Chờ SCM",   variant: "info",        dot: "bg-[hsl(var(--info))]" },
  approved:    { label: "Đã duyệt",  variant: "success",     dot: "bg-[hsl(var(--success))]" },
  rejected:    { label: "Từ chối",   variant: "destructive", dot: "bg-destructive" },
  info_needed: { label: "Cần TT",    variant: "warning",     dot: "bg-[hsl(var(--warning))]" },
  parallel:    { label: "Song song", variant: "warning",     dot: "bg-[hsl(var(--warning))]" },
}

export const STEP_CONFIG: Record<StepStatus, { label: string; color: string }> = {
  pending:     { label: "Chờ duyệt", color: "text-muted-foreground" },
  approved:    { label: "Đã duyệt",  color: "text-[hsl(var(--success))]" },
  rejected:    { label: "Từ chối",   color: "text-destructive" },
  info_needed: { label: "Cần TT",    color: "text-[hsl(var(--warning))]" },
  skipped:     { label: "Bỏ qua",    color: "text-muted-foreground/50" },
}

// ─── Reason option lists ──────────────────────────────────────────────────────
export const REJECT_REASONS = [
  "Giá vượt ngưỡng cho phép",
  "Tồn kho quá cao",
  "Sức bán không đủ khả thi",
  "Deal window quá ngắn",
  "Nhà cung cấp chưa đủ điều kiện",
  "Sản phẩm không phù hợp danh mục",
  "Ngân sách không đủ",
  "Lý do khác",
]

export const INFO_REASONS = [
  "Cần xác nhận hạn sử dụng",
  "Cần xác nhận giá cuối",
  "Cần xác nhận số lượng hàng tặng",
  "Cần xác nhận điều khoản thanh toán",
  "Cần xác nhận lịch giao hàng",
  "Thông tin khác",
]

export const APPROVE_REASONS = [
  "Đủ điều kiện — chuẩn quy trình",
  "Ưu tiên chiến lược",
  "Hàng sắp thiếu — cần nhập gấp",
  "Deal tốt — margin cao",
]

// ─── Toolbar filter options ───────────────────────────────────────────────────
export const MONTH_FILTERS = [
  { label: "Tất cả tháng", value: "all" },
  { label: "Tháng 4/2026", value: "2026-04" },
  { label: "Tháng 5/2026", value: "2026-05" },
  { label: "Tháng 3/2026", value: "2026-03" },
]

export const STATUS_FILTERS = [
  { label: "Tất cả",    value: "all" },
  { label: "Chờ MDM",  value: "pending_mdm" },
  { label: "Chờ SCM",  value: "pending_scm" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối",  value: "rejected" },
  { label: "Cần TT",   value: "info_needed" },
  { label: "Song song",value: "parallel" },
]

// ─── Wide-table column definitions ───────────────────────────────────────────
export interface ColDef {
  key:     string
  label:   string
  width:   number
  align?:  "right" | "center"
  sticky?: boolean
}

export const COLS: ColDef[] = [
  { key: "productName",            label: "Sản phẩm",                  width: 180, sticky: true },
  { key: "sku",                    label: "SKU",                        width: 88 },
  { key: "supplier",               label: "NCC",                        width: 96 },
  { key: "qtyOrdered",             label: "SL đặt (incl. tặng)",       width: 100, align: "right" },
  { key: "orderValue",             label: "Giá trị ĐH",                width: 112, align: "right" },
  { key: "expectedArrival",        label: "Ngày nhập DK",              width: 96,  align: "center" },
  { key: "stockDC",                label: "Tồn DC tại ngày YC",        width: 100, align: "right" },
  { key: "stockTotal",             label: "Tổng tồn tại ngày YC",      width: 112, align: "right" },
  { key: "dealStart",              label: "Bắt đầu deal",              width: 96,  align: "center" },
  { key: "dealEnd",                label: "Bán hết lô",                width: 96,  align: "center" },
  { key: "projectedDailySales",    label: "SB DK / ngày",              width: 88,  align: "right" },
  { key: "promotion",              label: "CTKM Support",               width: 160 },
  { key: "avgSales28d",            label: "SBTB 28 ngày",              width: 88,  align: "right" },
  { key: "avgSalesNonPromo",       label: "SBTB Không KM",             width: 96,  align: "right" },
  { key: "daysStockDC",            label: "Ngày tồn DC",               width: 80,  align: "right" },
  { key: "daysStockTotal",         label: "Ngày tồn toàn HT",          width: 100, align: "right" },
  { key: "projectedStockAtArrival",label: "Tổng tồn DK ngày nhập",     width: 120, align: "right" },
  { key: "salesFcVsActualDiff",    label: "Chênh lệch FC vs Actual",   width: 120, align: "right" },
  { key: "projectedSellingDays",   label: "Số ngày bán DK",            width: 88,  align: "right" },
  { key: "projectedDCDaysPostDeal",label: "Ngày tồn DC theo SB DK",    width: 116, align: "right" },
  { key: "totalDaysPostPromo",     label: "Ngày tồn toàn HT sau KM",   width: 124, align: "right" },
  { key: "scmDeadline",            label: "Deadline SCM",               width: 96,  align: "center" },
  { key: "steps",                  label: "Trạng thái",                 width: 140 },
]

// ─── Factory for pasted / imported items ─────────────────────────────────────
export function mkDefaultItem(partial: Partial<BulkItem>, idx: number): BulkItem {
  const mkStep = (role: RoleKey, status: StepStatus = "pending", extra: Partial<ApprovalStep> = {}): ApprovalStep =>
    ({ role, status, ...extra })
  return {
    id: `paste-${Date.now()}-${idx}`,
    sku: "", productName: "", category: "Uncategorized", supplier: "—",
    requestedBy: "Current User", requestedAt: new Date().toISOString().slice(0, 10),
    qtyOrdered: 0, unitPrice: 0, orderValue: 0, expectedArrival: "",
    stockDC: 0, stockTotal: 0, dealStart: "", dealEnd: "",
    projectedDailySales: 0, promotion: "—", feasibilityNote: "",
    avgSales28d: 0, avgSalesNonPromo: 0, daysStockDC: 0, daysStockTotal: 0,
    projectedStockAtArrival: 0, salesFcVsActualDiff: 0, projectedSellingDays: 0,
    projectedDCDaysPostDeal: 0, totalDaysPostPromo: 0, scmDeadline: "",
    steps: [mkStep("MDM"), mkStep("SCM")],
    parallel: false,
    comments: [],
    ...partial,
  }
}
