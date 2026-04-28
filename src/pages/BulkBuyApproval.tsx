import { useState, useRef, useCallback, useEffect } from "react"
import {
  ShoppingCart, ClipboardPaste, CheckCircle2, XCircle,
  Clock, Package, AlertCircle, Check, Send,
  Building2, Calendar, User, Hash, FileText, MessageSquare,
  Shield, Zap,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleKey = "MDM" | "SCM"
type StepStatus = "pending" | "approved" | "rejected" | "info_needed" | "skipped"

interface ApprovalStep {
  role:       RoleKey
  status:     StepStatus
  approvedBy?: string
  approvedAt?: string
  reasonGroup?: string
  note?:      string
}

// Overall item status is derived from the two steps
type OverallStatus = "pending_mdm" | "pending_scm" | "approved" | "rejected" | "info_needed" | "parallel"

// Month filter options
const MONTH_FILTERS = [
  { label: "Tất cả tháng", value: "all" },
  { label: "Tháng 4/2026", value: "2026-04" },
  { label: "Tháng 5/2026", value: "2026-05" },
  { label: "Tháng 3/2026", value: "2026-03" },
]

interface Comment {
  id:     string
  author: string
  role:   RoleKey | "Requester"
  text:   string
  time:   string
}

interface BulkItem {
  id:          string
  sku:         string
  productName: string
  category:    string
  supplier:    string
  requestedBy: string
  requestedAt: string

  // Order fields
  qtyOrdered:      number   // Số lượng dự kiến đặt (incl. hàng tặng)
  unitPrice:       number
  orderValue:      number   // Giá trị đơn hàng
  expectedArrival: string   // Ngày nhập dự kiến

  // Inventory at request date
  stockDC:         number   // Tồn DC tại ngày YC
  stockTotal:      number   // Tổng tồn tại ngày YC

  // Deal window
  dealStart:       string   // MM/DD/YYYY
  dealEnd:         string   // MM/DD/YYYY — Thời gian bán hết lô

  // Velocity & promotion
  projectedDailySales: number  // Sức bán dự kiến / ngày
  promotion:           string  // CTKM Support
  feasibilityNote:     string  // Giải thích để thấy độ khả thi

  // Sales benchmarks
  avgSales28d:     number   // SBTB 28 ngày gần nhất
  avgSalesNonPromo:number   // SBTB Không KM
  daysStockDC:     number   // Ngày tồn hiện tại_DC
  daysStockTotal:  number   // Ngày tồn hiện tại_Toàn hệ thống

  // Derived / forecast
  projectedStockAtArrival: number  // Tổng tồn dự kiến ngày nhập
  salesFcVsActualDiff:     number  // Chênh lệch FC vs Actual (%)
  projectedSellingDays:    number  // Số ngày bán hàng dự kiến
  projectedDCDaysPostDeal: number  // Ngày tồn DC theo sức bán dự kiến
  totalDaysPostPromo:      number  // Ngày tồn toàn hệ thống sau khi hết CTKM
  scmDeadline:             string  // Deadline SCM Confirm

  steps:    [ApprovalStep, ApprovalStep]  // [MDM, SCM]
  parallel: boolean                        // edge case: parallel approval
  comments: Comment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveOverall(item: BulkItem): OverallStatus {
  const [mdm, scm] = item.steps
  if (item.parallel) return "parallel"
  if (mdm.status === "rejected" || scm.status === "rejected") return "rejected"
  if (scm.status === "approved") return "approved"
  if (mdm.status === "approved") return "pending_scm"
  if (mdm.status === "info_needed") return "info_needed"
  return "pending_mdm"
}

const fmt   = (n: number) => n.toLocaleString("vi-VN") + "₫"
const fmtN  = (n: number) => n.toLocaleString("vi-VN")
const fmtPct= (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%"

// ─── Reason groups ────────────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Giá vượt ngưỡng cho phép",
  "Tồn kho quá cao",
  "Sức bán không đủ khả thi",
  "Deal window quá ngắn",
  "Nhà cung cấp chưa đủ điều kiện",
  "Sản phẩm không phù hợp danh mục",
  "Ngân sách không đủ",
  "Lý do khác",
]
const INFO_REASONS = [
  "Cần xác nhận hạn sử dụng",
  "Cần xác nhận giá cuối",
  "Cần xác nhận số lượng hàng tặng",
  "Cần xác nhận điều khoản thanh toán",
  "Cần xác nhận lịch giao hàng",
  "Thông tin khác",
]
const APPROVE_REASONS = [
  "Đủ điều kiện — chuẩn quy trình",
  "Ưu tiên chiến lược",
  "Hàng sắp thiếu — cần nhập gấp",
  "Deal tốt — margin cao",
]

// ─── Mock data ────────────────────────────────────────────────────────────────

const mkStep = (role: RoleKey, status: StepStatus = "pending", extra: Partial<ApprovalStep> = {}): ApprovalStep =>
  ({ role, status, ...extra })

const mkComments = (...args: [string, RoleKey | "Requester", string, string][]): Comment[] =>
  args.map(([author, role, text, time], i) => ({ id: `c${i}`, author, role, text, time }))

const MOCK_ITEMS: BulkItem[] = [
  {
    id: "bb1", sku: "FRZ-0021", productName: "Frozen Chicken Breast 2kg", category: "Frozen", supplier: "Vissan",
    requestedBy: "Nguyen Van A", requestedAt: "2026-04-25",
    qtyOrdered: 2400, unitPrice: 85000, orderValue: 204000000, expectedArrival: "2026-05-05",
    stockDC: 800, stockTotal: 2200, dealStart: "05/10/2026", dealEnd: "05/31/2026",
    projectedDailySales: 120, promotion: "Giảm 15% + Tặng 1 hộp/10 hộp",
    feasibilityNote: "Deal Vissan Q2 — sức bán tốt theo lịch sử T4/2025. Tồn DC an toàn.",
    avgSales28d: 98, avgSalesNonPromo: 72, daysStockDC: 8, daysStockTotal: 22,
    projectedStockAtArrival: 1600, salesFcVsActualDiff: 22.4, projectedSellingDays: 20,
    projectedDCDaysPostDeal: 3, totalDaysPostPromo: 8, scmDeadline: "05/01/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-26", reasonGroup: "Đủ điều kiện — chuẩn quy trình" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Nguyen Van A", "Requester", "Vissan đã confirm giá lock đến 30/5.", "2026-04-25 09:12"], ["Le Thi M", "MDM", "Đã check margin OK. Chuyển SCM duyệt.", "2026-04-26 14:30"]),
  },
  {
    id: "bb2", sku: "DRY-1104", productName: "Jasmine Rice 5kg", category: "Dry Goods", supplier: "Vinacafe",
    requestedBy: "Tran Thi B", requestedAt: "2026-04-25",
    qtyOrdered: 6000, unitPrice: 120000, orderValue: 720000000, expectedArrival: "2026-05-08",
    stockDC: 3200, stockTotal: 9100, dealStart: "05/12/2026", dealEnd: "06/15/2026",
    projectedDailySales: 180, promotion: "Mua 2 giảm 10%",
    feasibilityNote: "Lúa gạo mùa vụ — tồn khá cao nhưng deal tốt. Cần đánh giá kỹ tồn sau deal.",
    avgSales28d: 145, avgSalesNonPromo: 130, daysStockDC: 22, daysStockTotal: 63,
    projectedStockAtArrival: 8800, salesFcVsActualDiff: 24.1, projectedSellingDays: 33,
    projectedDCDaysPostDeal: 12, totalDaysPostPromo: 35, scmDeadline: "05/03/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb3", sku: "BEV-0334", productName: "Mineral Water 500ml (case 24)", category: "Beverage", supplier: "Lavie",
    requestedBy: "Le Van C", requestedAt: "2026-04-26",
    qtyOrdered: 7200, unitPrice: 96000, orderValue: 691200000, expectedArrival: "2026-05-03",
    stockDC: 4800, stockTotal: 12000, dealStart: "05/05/2026", dealEnd: "05/25/2026",
    projectedDailySales: 360, promotion: "Tặng 10% số lượng",
    feasibilityNote: "Nước khoáng mùa hè — sức bán rất cao. Deal theo lịch sử năm ngoái.",
    avgSales28d: 310, avgSalesNonPromo: 280, daysStockDC: 15, daysStockTotal: 39,
    projectedStockAtArrival: 11400, salesFcVsActualDiff: 16.1, projectedSellingDays: 20,
    projectedDCDaysPostDeal: 0, totalDaysPostPromo: 5, scmDeadline: "04/28/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-27", reasonGroup: "Deal tốt — margin cao" }), mkStep("SCM", "approved", { approvedBy: "Pham S", approvedAt: "2026-04-27", reasonGroup: "Đủ điều kiện — chuẩn quy trình" })],
    parallel: false,
    comments: mkComments(["Le Van C", "Requester", "Lavie confirm giao đúng 3/5.", "2026-04-26 10:00"], ["Pham S", "SCM", "Logistics OK. Duyệt.", "2026-04-27 16:45"]),
  },
  {
    id: "bb4", sku: "DRY-2201", productName: "Cooking Oil 5L", category: "Dry Goods", supplier: "Tuong An",
    requestedBy: "Pham Thi D", requestedAt: "2026-04-26",
    qtyOrdered: 1800, unitPrice: 210000, orderValue: 378000000, expectedArrival: "2026-05-10",
    stockDC: 2100, stockTotal: 5600, dealStart: "05/15/2026", dealEnd: "06/30/2026",
    projectedDailySales: 80, promotion: "Không",
    feasibilityNote: "Giá cao hơn thị trường ~12%. Tồn hiện tại đã đủ 70 ngày.",
    avgSales28d: 68, avgSalesNonPromo: 68, daysStockDC: 31, daysStockTotal: 82,
    projectedStockAtArrival: 5400, salesFcVsActualDiff: 17.6, projectedSellingDays: 22,
    projectedDCDaysPostDeal: 20, totalDaysPostPromo: 55, scmDeadline: "05/05/2026",
    steps: [mkStep("MDM", "rejected", { approvedBy: "Le Thi M", approvedAt: "2026-04-27", reasonGroup: "Giá vượt ngưỡng cho phép", note: "Giá cao hơn thị trường ~12%. Yêu cầu đàm phán lại." }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Le Thi M", "MDM", "Giá vượt ngưỡng, reject. Cần đàm phán lại với NCC.", "2026-04-27 11:20"]),
  },
  {
    id: "bb5", sku: "FRZ-0088", productName: "Frozen Shrimp 1kg", category: "Frozen", supplier: "Minh Phu",
    requestedBy: "Nguyen Van A", requestedAt: "2026-04-27",
    qtyOrdered: 1200, unitPrice: 280000, orderValue: 336000000, expectedArrival: "2026-05-07",
    stockDC: 350, stockTotal: 900, dealStart: "05/10/2026", dealEnd: "05/30/2026",
    projectedDailySales: 65, promotion: "Giảm 20%",
    feasibilityNote: "Tôm sú mùa vụ — sức bán tốt. Tồn thấp, cần nhập gấp.",
    avgSales28d: 52, avgSalesNonPromo: 38, daysStockDC: 7, daysStockTotal: 17,
    projectedStockAtArrival: 820, salesFcVsActualDiff: 25.0, projectedSellingDays: 18,
    projectedDCDaysPostDeal: 2, totalDaysPostPromo: 6, scmDeadline: "05/02/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb6", sku: "DAI-0011", productName: "Fresh Milk 1L (case 12)", category: "Dairy", supplier: "Vinamilk",
    requestedBy: "Hoang Van E", requestedAt: "2026-04-27",
    qtyOrdered: 3000, unitPrice: 360000, orderValue: 1080000000, expectedArrival: "2026-05-04",
    stockDC: 1200, stockTotal: 3600, dealStart: "05/06/2026", dealEnd: "05/20/2026",
    projectedDailySales: 220, promotion: "Tặng thêm 5%",
    feasibilityNote: "Cần xác nhận hạn sử dụng lô hàng trước khi confirm số lượng.",
    avgSales28d: 185, avgSalesNonPromo: 170, daysStockDC: 6, daysStockTotal: 19,
    projectedStockAtArrival: 3400, salesFcVsActualDiff: 18.9, projectedSellingDays: 14,
    projectedDCDaysPostDeal: 1, totalDaysPostPromo: 4, scmDeadline: "04/30/2026",
    steps: [mkStep("MDM", "info_needed", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Cần xác nhận hạn sử dụng", note: "Confirm NSX/HSD trước khi chốt SL" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Le Thi M", "MDM", "Cần Vinamilk cung cấp NSX lô hàng. Chờ xác nhận.", "2026-04-28 09:00"]),
  },
  {
    id: "bb7", sku: "BEV-0112", productName: "Green Tea 330ml (case 24)", category: "Beverage", supplier: "URC Vietnam",
    requestedBy: "Tran Thi B", requestedAt: "2026-04-27",
    qtyOrdered: 4320, unitPrice: 192000, orderValue: 829440000, expectedArrival: "2026-05-06",
    stockDC: 2880, stockTotal: 7200, dealStart: "05/08/2026", dealEnd: "06/08/2026",
    projectedDailySales: 150, promotion: "Buy 1 Get 1 (case)",
    feasibilityNote: "Trà xanh URC — sức bán ổn định. B1G1 sẽ kéo traffic tốt.",
    avgSales28d: 128, avgSalesNonPromo: 110, daysStockDC: 22, daysStockTotal: 56,
    projectedStockAtArrival: 7000, salesFcVsActualDiff: 17.2, projectedSellingDays: 31,
    projectedDCDaysPostDeal: 8, totalDaysPostPromo: 22, scmDeadline: "05/01/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: true,   // edge case: parallel approval
    comments: mkComments(["Tran Thi B", "Requester", "URC yêu cầu confirm trước 01/05 để giữ giá. Đề xuất duyệt song song.", "2026-04-27 14:00"]),
  },
  {
    id: "bb8", sku: "CLN-0045", productName: "Dishwashing Liquid 1L", category: "Cleaning", supplier: "Unilever",
    requestedBy: "Le Van C", requestedAt: "2026-04-28",
    qtyOrdered: 4800, unitPrice: 35000, orderValue: 168000000, expectedArrival: "2026-05-09",
    stockDC: 3600, stockTotal: 9800, dealStart: "05/12/2026", dealEnd: "06/30/2026",
    projectedDailySales: 200, promotion: "Giảm 8%",
    feasibilityNote: "Nước rửa chén — nhu cầu ổn định. Tồn khá cao cần theo dõi.",
    avgSales28d: 168, avgSalesNonPromo: 158, daysStockDC: 21, daysStockTotal: 58,
    projectedStockAtArrival: 9600, salesFcVsActualDiff: 19.0, projectedSellingDays: 24,
    projectedDCDaysPostDeal: 6, totalDaysPostPromo: 20, scmDeadline: "05/04/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  // ── Batch 2 ───────────────────────────────────────────────────────────────
  {
    id: "bb9", sku: "FRZ-0055", productName: "Pork Belly Slice 500g", category: "Frozen", supplier: "CP Vietnam",
    requestedBy: "Nguyen Van A", requestedAt: "2026-04-28",
    qtyOrdered: 3600, unitPrice: 95000, orderValue: 342000000, expectedArrival: "2026-05-06",
    stockDC: 620, stockTotal: 1800, dealStart: "05/08/2026", dealEnd: "05/28/2026",
    projectedDailySales: 190, promotion: "Giảm 18% + Tặng túi đựng",
    feasibilityNote: "Ba chỉ heo CP — deal mùa hè, sức bán dự kiến cao do KM mạnh.",
    avgSales28d: 155, avgSalesNonPromo: 120, daysStockDC: 4, daysStockTotal: 12,
    projectedStockAtArrival: 1400, salesFcVsActualDiff: 22.6, projectedSellingDays: 19,
    projectedDCDaysPostDeal: 1, totalDaysPostPromo: 5, scmDeadline: "04/30/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb10", sku: "DAI-0044", productName: "Yogurt Mixed Fruit 100g x6", category: "Dairy", supplier: "TH True Milk",
    requestedBy: "Tran Thi B", requestedAt: "2026-04-27",
    qtyOrdered: 5400, unitPrice: 72000, orderValue: 388800000, expectedArrival: "2026-05-05",
    stockDC: 2100, stockTotal: 5800, dealStart: "05/07/2026", dealEnd: "05/22/2026",
    projectedDailySales: 310, promotion: "Mua 2 giảm 15%",
    feasibilityNote: "Yogurt TH — hạn sử dụng ngắn, cần bán nhanh. Deal window vừa đủ.",
    avgSales28d: 270, avgSalesNonPromo: 230, daysStockDC: 8, daysStockTotal: 21,
    projectedStockAtArrival: 5500, salesFcVsActualDiff: 14.8, projectedSellingDays: 15,
    projectedDCDaysPostDeal: 2, totalDaysPostPromo: 7, scmDeadline: "05/02/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Ưu tiên chiến lược" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Tran Thi B", "Requester", "TH confirm giao lạnh đúng chuẩn.", "2026-04-27 11:30"]),
  },
  {
    id: "bb11", sku: "BEV-0221", productName: "Iced Coffee Can 240ml (case 24)", category: "Beverage", supplier: "Nescafe",
    requestedBy: "Hoang Van E", requestedAt: "2026-04-26",
    qtyOrdered: 5760, unitPrice: 216000, orderValue: 1244160000, expectedArrival: "2026-05-04",
    stockDC: 3840, stockTotal: 9600, dealStart: "05/06/2026", dealEnd: "06/06/2026",
    projectedDailySales: 210, promotion: "Tặng 8%",
    feasibilityNote: "Cà phê lon Nescafe — mùa hè sức bán ổn. Tồn DC đang ở mức an toàn.",
    avgSales28d: 192, avgSalesNonPromo: 178, daysStockDC: 20, daysStockTotal: 50,
    projectedStockAtArrival: 9400, salesFcVsActualDiff: 9.4, projectedSellingDays: 29,
    projectedDCDaysPostDeal: 7, totalDaysPostPromo: 19, scmDeadline: "05/01/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-27", reasonGroup: "Đủ điều kiện — chuẩn quy trình" }), mkStep("SCM", "approved", { approvedBy: "Pham S", approvedAt: "2026-04-28", reasonGroup: "Đủ điều kiện — chuẩn quy trình" })],
    parallel: false,
    comments: mkComments(["Pham S", "SCM", "Logistics sẵn sàng. Duyệt.", "2026-04-28 10:15"]),
  },
  {
    id: "bb12", sku: "DRY-3301", productName: "Instant Noodles Hảo Hảo 75g x30", category: "Dry Goods", supplier: "Acecook",
    requestedBy: "Le Van C", requestedAt: "2026-04-28",
    qtyOrdered: 9000, unitPrice: 105000, orderValue: 945000000, expectedArrival: "2026-05-10",
    stockDC: 6200, stockTotal: 18500, dealStart: "05/12/2026", dealEnd: "07/01/2026",
    projectedDailySales: 420, promotion: "Giảm 10%",
    feasibilityNote: "Mỳ ăn liền — tồn rất cao, cần cân nhắc kỹ. Deal window 50 ngày.",
    avgSales28d: 385, avgSalesNonPromo: 360, daysStockDC: 16, daysStockTotal: 48,
    projectedStockAtArrival: 18000, salesFcVsActualDiff: 9.1, projectedSellingDays: 43,
    projectedDCDaysPostDeal: 10, totalDaysPostPromo: 30, scmDeadline: "05/05/2026",
    steps: [mkStep("MDM", "info_needed", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Cần xác nhận số lượng hàng tặng", note: "Acecook cần confirm tỉ lệ hàng tặng chính xác" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Le Thi M", "MDM", "Chờ Acecook xác nhận % hàng tặng.", "2026-04-28 14:00"]),
  },
  {
    id: "bb13", sku: "CLN-0088", productName: "Fabric Softener 3.6L", category: "Cleaning", supplier: "P&G",
    requestedBy: "Pham Thi D", requestedAt: "2026-04-27",
    qtyOrdered: 2400, unitPrice: 185000, orderValue: 444000000, expectedArrival: "2026-05-08",
    stockDC: 1800, stockTotal: 4900, dealStart: "05/10/2026", dealEnd: "06/20/2026",
    projectedDailySales: 95, promotion: "Giảm 12%",
    feasibilityNote: "Nước xả vải Downy — deal ổn định. Margin tốt theo khung P&G.",
    avgSales28d: 82, avgSalesNonPromo: 76, daysStockDC: 22, daysStockTotal: 60,
    projectedStockAtArrival: 4700, salesFcVsActualDiff: 15.9, projectedSellingDays: 41,
    projectedDCDaysPostDeal: 12, totalDaysPostPromo: 38, scmDeadline: "05/03/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb14", sku: "FRZ-0099", productName: "Fish Cake Assorted 500g", category: "Frozen", supplier: "Hai Long",
    requestedBy: "Nguyen Van A", requestedAt: "2026-04-28",
    qtyOrdered: 1800, unitPrice: 115000, orderValue: 207000000, expectedArrival: "2026-05-07",
    stockDC: 480, stockTotal: 1100, dealStart: "05/09/2026", dealEnd: "05/29/2026",
    projectedDailySales: 88, promotion: "Tặng 5%",
    feasibilityNote: "Chả cá Hải Long — cần nhập gấp, tồn DC rất thấp.",
    avgSales28d: 75, avgSalesNonPromo: 60, daysStockDC: 6, daysStockTotal: 15,
    projectedStockAtArrival: 1050, salesFcVsActualDiff: 17.3, projectedSellingDays: 20,
    projectedDCDaysPostDeal: 2, totalDaysPostPromo: 7, scmDeadline: "04/30/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: true,
    comments: mkComments(["Nguyen Van A", "Requester", "Tồn gần hết, đề xuất song song để kịp ngày nhập.", "2026-04-28 08:30"]),
  },
  {
    id: "bb15", sku: "BEV-0445", productName: "Sports Drink 500ml (case 24)", category: "Beverage", supplier: "Pocari Sweat",
    requestedBy: "Tran Thi B", requestedAt: "2026-04-27",
    qtyOrdered: 3840, unitPrice: 288000, orderValue: 1105920000, expectedArrival: "2026-05-05",
    stockDC: 2560, stockTotal: 6400, dealStart: "05/07/2026", dealEnd: "06/07/2026",
    projectedDailySales: 140, promotion: "Mua 10 tặng 1",
    feasibilityNote: "Pocari mùa thể thao — sức bán tốt. FC vs Actual thấp, ổn định.",
    avgSales28d: 128, avgSalesNonPromo: 115, daysStockDC: 20, daysStockTotal: 50,
    projectedStockAtArrival: 6300, salesFcVsActualDiff: 9.4, projectedSellingDays: 31,
    projectedDCDaysPostDeal: 9, totalDaysPostPromo: 27, scmDeadline: "05/01/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Deal tốt — margin cao" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb16", sku: "DRY-4402", productName: "Soy Sauce 500ml (case 12)", category: "Dry Goods", supplier: "Chin Su",
    requestedBy: "Hoang Van E", requestedAt: "2026-04-26",
    qtyOrdered: 7200, unitPrice: 54000, orderValue: 388800000, expectedArrival: "2026-05-11",
    stockDC: 5400, stockTotal: 14200, dealStart: "05/14/2026", dealEnd: "07/14/2026",
    projectedDailySales: 130, promotion: "Giảm 7%",
    feasibilityNote: "Nước tương Chin Su — nhu cầu ổn định nhưng tồn đã cao. Cần đánh giá kỹ.",
    avgSales28d: 118, avgSalesNonPromo: 112, daysStockDC: 46, daysStockTotal: 120,
    projectedStockAtArrival: 13900, salesFcVsActualDiff: 10.2, projectedSellingDays: 55,
    projectedDCDaysPostDeal: 38, totalDaysPostPromo: 95, scmDeadline: "05/06/2026",
    steps: [mkStep("MDM", "rejected", { approvedBy: "Le Thi M", approvedAt: "2026-04-27", reasonGroup: "Tồn kho quá cao", note: "Tồn toàn HT đã 120 ngày. Không đủ điều kiện nhập thêm." }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Le Thi M", "MDM", "Tồn 120 ngày — vượt ngưỡng an toàn. Reject.", "2026-04-27 15:40"]),
  },
  // ── Batch 3 ───────────────────────────────────────────────────────────────
  {
    id: "bb17", sku: "SNK-0011", productName: "Potato Chips Original 68g x12", category: "Snacks", supplier: "Lay's",
    requestedBy: "Le Van C", requestedAt: "2026-04-28",
    qtyOrdered: 4320, unitPrice: 144000, orderValue: 622080000, expectedArrival: "2026-05-06",
    stockDC: 2880, stockTotal: 7200, dealStart: "05/08/2026", dealEnd: "06/08/2026",
    projectedDailySales: 175, promotion: "Tặng 10%",
    feasibilityNote: "Lay's — sức bán ổn định. Deal thường niên Q2.",
    avgSales28d: 158, avgSalesNonPromo: 140, daysStockDC: 18, daysStockTotal: 46,
    projectedStockAtArrival: 7000, salesFcVsActualDiff: 10.8, projectedSellingDays: 35,
    projectedDCDaysPostDeal: 7, totalDaysPostPromo: 22, scmDeadline: "05/02/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Đủ điều kiện — chuẩn quy trình" }), mkStep("SCM", "approved", { approvedBy: "Pham S", approvedAt: "2026-04-28", reasonGroup: "Đủ điều kiện — chuẩn quy trình" })],
    parallel: false,
    comments: [],
  },
  {
    id: "bb18", sku: "PER-0023", productName: "Baby Diaper Size M x48", category: "Personal Care", supplier: "Huggies",
    requestedBy: "Pham Thi D", requestedAt: "2026-04-27",
    qtyOrdered: 1200, unitPrice: 420000, orderValue: 504000000, expectedArrival: "2026-05-09",
    stockDC: 480, stockTotal: 1320, dealStart: "05/11/2026", dealEnd: "06/30/2026",
    projectedDailySales: 42, promotion: "Giảm 15%",
    feasibilityNote: "Tã Huggies M — nhu cầu ổn định. Tồn DC thấp cần nhập.",
    avgSales28d: 38, avgSalesNonPromo: 36, daysStockDC: 13, daysStockTotal: 35,
    projectedStockAtArrival: 1280, salesFcVsActualDiff: 10.5, projectedSellingDays: 50,
    projectedDCDaysPostDeal: 18, totalDaysPostPromo: 52, scmDeadline: "05/04/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb19", sku: "FRZ-0110", productName: "Frozen Squid Ring 500g", category: "Frozen", supplier: "Minh Phu",
    requestedBy: "Nguyen Van A", requestedAt: "2026-04-28",
    qtyOrdered: 2400, unitPrice: 175000, orderValue: 420000000, expectedArrival: "2026-05-07",
    stockDC: 720, stockTotal: 1920, dealStart: "05/09/2026", dealEnd: "05/31/2026",
    projectedDailySales: 108, promotion: "Giảm 20%",
    feasibilityNote: "Mực vòng đông lạnh — deal hè. Sức bán tốt theo lịch sử.",
    avgSales28d: 92, avgSalesNonPromo: 70, daysStockDC: 8, daysStockTotal: 21,
    projectedStockAtArrival: 1800, salesFcVsActualDiff: 17.4, projectedSellingDays: 22,
    projectedDCDaysPostDeal: 3, totalDaysPostPromo: 9, scmDeadline: "05/02/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Deal tốt — margin cao" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb20", sku: "BEV-0556", productName: "Orange Juice 1L (case 12)", category: "Beverage", supplier: "Tropicana",
    requestedBy: "Tran Thi B", requestedAt: "2026-04-28",
    qtyOrdered: 2880, unitPrice: 336000, orderValue: 967680000, expectedArrival: "2026-05-05",
    stockDC: 1920, stockTotal: 4800, dealStart: "05/07/2026", dealEnd: "05/27/2026",
    projectedDailySales: 220, promotion: "Tặng 5% + Tặng ly",
    feasibilityNote: "Nước cam Tropicana — hạn sử dụng 90 ngày. Cần xác nhận lô NSX.",
    avgSales28d: 195, avgSalesNonPromo: 180, daysStockDC: 10, daysStockTotal: 25,
    projectedStockAtArrival: 4700, salesFcVsActualDiff: 12.8, projectedSellingDays: 20,
    projectedDCDaysPostDeal: 4, totalDaysPostPromo: 11, scmDeadline: "05/01/2026",
    steps: [mkStep("MDM", "info_needed", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Cần xác nhận hạn sử dụng", note: "Confirm NSX lô trước khi duyệt số lượng" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: mkComments(["Le Thi M", "MDM", "Cần NSX lô hàng từ Tropicana.", "2026-04-28 11:00"]),
  },
  {
    id: "bb21", sku: "CLN-0112", productName: "Toilet Paper 10 rolls", category: "Cleaning", supplier: "Bless You",
    requestedBy: "Le Van C", requestedAt: "2026-04-26",
    qtyOrdered: 6000, unitPrice: 55000, orderValue: 330000000, expectedArrival: "2026-05-10",
    stockDC: 4500, stockTotal: 12000, dealStart: "05/12/2026", dealEnd: "06/30/2026",
    projectedDailySales: 245, promotion: "Giảm 5%",
    feasibilityNote: "Giấy vệ sinh — nhu cầu thiết yếu, ổn định. Tồn DC vừa phải.",
    avgSales28d: 228, avgSalesNonPromo: 218, daysStockDC: 20, daysStockTotal: 53,
    projectedStockAtArrival: 11700, salesFcVsActualDiff: 7.5, projectedSellingDays: 47,
    projectedDCDaysPostDeal: 11, totalDaysPostPromo: 33, scmDeadline: "05/05/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-27", reasonGroup: "Đủ điều kiện — chuẩn quy trình" }), mkStep("SCM", "approved", { approvedBy: "Pham S", approvedAt: "2026-04-28", reasonGroup: "Đủ điều kiện — chuẩn quy trình" })],
    parallel: false,
    comments: [],
  },
  {
    id: "bb22", sku: "SNK-0055", productName: "Dark Chocolate 100g x12", category: "Snacks", supplier: "Meiji",
    requestedBy: "Hoang Van E", requestedAt: "2026-04-28",
    qtyOrdered: 1440, unitPrice: 276000, orderValue: 397440000, expectedArrival: "2026-05-08",
    stockDC: 960, stockTotal: 2400, dealStart: "05/10/2026", dealEnd: "06/10/2026",
    projectedDailySales: 55, promotion: "Giảm 10%",
    feasibilityNote: "Socola đen Meiji — margin cao. Tồn DC ở mức an toàn.",
    avgSales28d: 48, avgSalesNonPromo: 44, daysStockDC: 20, daysStockTotal: 50,
    projectedStockAtArrival: 2350, salesFcVsActualDiff: 14.6, projectedSellingDays: 43,
    projectedDCDaysPostDeal: 14, totalDaysPostPromo: 38, scmDeadline: "05/04/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb23", sku: "PER-0067", productName: "Hand Sanitizer 500ml x6", category: "Personal Care", supplier: "Lifebuoy",
    requestedBy: "Pham Thi D", requestedAt: "2026-04-27",
    qtyOrdered: 3600, unitPrice: 162000, orderValue: 583200000, expectedArrival: "2026-05-06",
    stockDC: 2700, stockTotal: 7200, dealStart: "05/08/2026", dealEnd: "06/30/2026",
    projectedDailySales: 120, promotion: "Tặng 8%",
    feasibilityNote: "Gel rửa tay Lifebuoy — nhu cầu quanh năm. Tồn DC ổn.",
    avgSales28d: 108, avgSalesNonPromo: 102, daysStockDC: 25, daysStockTotal: 67,
    projectedStockAtArrival: 7100, salesFcVsActualDiff: 11.1, projectedSellingDays: 45,
    projectedDCDaysPostDeal: 15, totalDaysPostPromo: 42, scmDeadline: "05/02/2026",
    steps: [mkStep("MDM", "pending"), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
  {
    id: "bb24", sku: "DRY-5503", productName: "Pasta Spaghetti 500g x12", category: "Dry Goods", supplier: "Barilla",
    requestedBy: "Le Van C", requestedAt: "2026-04-28",
    qtyOrdered: 2160, unitPrice: 192000, orderValue: 414720000, expectedArrival: "2026-05-11",
    stockDC: 1440, stockTotal: 3840, dealStart: "05/14/2026", dealEnd: "07/14/2026",
    projectedDailySales: 62, promotion: "Giảm 12%",
    feasibilityNote: "Mỳ Ý Barilla — phân khúc premium. Sức bán ổn định, margin tốt.",
    avgSales28d: 55, avgSalesNonPromo: 50, daysStockDC: 26, daysStockTotal: 70,
    projectedStockAtArrival: 3760, salesFcVsActualDiff: 12.7, projectedSellingDays: 61,
    projectedDCDaysPostDeal: 20, totalDaysPostPromo: 58, scmDeadline: "05/06/2026",
    steps: [mkStep("MDM", "approved", { approvedBy: "Le Thi M", approvedAt: "2026-04-28", reasonGroup: "Ưu tiên chiến lược" }), mkStep("SCM", "pending")],
    parallel: false,
    comments: [],
  },
]

// ─── Overall status config ────────────────────────────────────────────────────

const OVERALL_CONFIG: Record<OverallStatus, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "info"; dot: string }> = {
  pending_mdm: { label: "Chờ MDM",    variant: "secondary", dot: "bg-muted-foreground/60" },
  pending_scm: { label: "Chờ SCM",    variant: "info",      dot: "bg-[hsl(var(--info))]" },
  approved:    { label: "Đã duyệt",   variant: "success",   dot: "bg-[hsl(var(--success))]" },
  rejected:    { label: "Từ chối",    variant: "destructive", dot: "bg-destructive" },
  info_needed: { label: "Cần TT",     variant: "warning",   dot: "bg-[hsl(var(--warning))]" },
  parallel:    { label: "Song song",  variant: "warning",   dot: "bg-[hsl(var(--warning))]" },
}

const STEP_CONFIG: Record<StepStatus, { label: string; color: string }> = {
  pending:     { label: "Chờ duyệt",  color: "text-muted-foreground" },
  approved:    { label: "Đã duyệt",   color: "text-[hsl(var(--success))]" },
  rejected:    { label: "Từ chối",    color: "text-destructive" },
  info_needed: { label: "Cần TT",     color: "text-[hsl(var(--warning))]" },
  skipped:     { label: "Bỏ qua",     color: "text-muted-foreground/50" },
}

function OverallBadge({ item }: { item: BulkItem }) {
  const overall = deriveOverall(item)
  const cfg = OVERALL_CONFIG[overall]
  return (
    <Badge variant={cfg.variant} className="gap-1 text-[10px] h-5 px-1.5 font-medium shrink-0">
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </Badge>
  )
}

// ─── Approval step indicator ──────────────────────────────────────────────────

function ApprovalStepBar({ steps, parallel }: { steps: [ApprovalStep, ApprovalStep]; parallel: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const cfg = STEP_CONFIG[step.status]
        const isActive = step.status !== "pending" && step.status !== "skipped"
        return (
          <div key={step.role} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground/40 text-[10px] mx-0.5">
                {parallel ? "⇉" : "→"}
              </span>
            )}
            <div className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border",
              step.status === "approved"    && "bg-[hsl(var(--success-subtle))] border-[hsl(var(--success)/0.3)] text-[hsl(var(--success-subtle-foreground))]",
              step.status === "rejected"    && "bg-destructive/10 border-destructive/30 text-destructive",
              step.status === "info_needed" && "bg-[hsl(var(--warning-subtle))] border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning-subtle-foreground))]",
              step.status === "pending"     && "bg-muted border-border text-muted-foreground",
            )}>
              {step.role}
              {step.status === "approved"    && <Check className="size-2.5" />}
              {step.status === "rejected"    && <XCircle className="size-2.5" />}
              {step.status === "info_needed" && <AlertCircle className="size-2.5" />}
              {step.status === "pending"     && <Clock className="size-2.5 opacity-50" />}
            </div>
          </div>
        )
      })}
      {parallel && (
        <Badge variant="warning" className="text-[9px] h-4 px-1 gap-0.5 ml-0.5">
          <Zap className="size-2.5" />KHẨN
        </Badge>
      )}
    </div>
  )
}

// ─── Action form ──────────────────────────────────────────────────────────────

function ActionForm({ action, onSubmit, onCancel }: {
  action: "approve" | "reject" | "info"
  onSubmit: (reasonGroup: string, note: string) => void
  onCancel: () => void
}) {
  const [reasonGroup, setReasonGroup] = useState("")
  const [note, setNote]               = useState("")

  const reasons  = action === "approve" ? APPROVE_REASONS : action === "reject" ? REJECT_REASONS : INFO_REASONS
  const needNote = action !== "approve"

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
      <Select value={reasonGroup} onValueChange={setReasonGroup}>
        <SelectTrigger className="h-8 text-xs bg-background">
          <SelectValue placeholder="Chọn nhóm lý do…" />
        </SelectTrigger>
        <SelectContent>
          {reasons.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
        </SelectContent>
      </Select>
      <Textarea
        className="text-xs min-h-[64px] resize-none bg-background"
        placeholder={needNote ? "Ghi chú bổ sung (bắt buộc nếu không chọn lý do)…" : "Ghi chú thêm (tuỳ chọn)…"}
        value={note}
        onChange={e => setNote(e.target.value)}
        autoFocus={!reasonGroup}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>Huỷ</Button>
        <Button
          size="sm"
          className={cn(
            "h-7 text-xs gap-1",
            action === "reject" && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
            action === "info"   && "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.9)] text-[hsl(var(--warning-foreground))]",
          )}
          disabled={!reasonGroup && needNote && !note.trim()}
          onClick={() => onSubmit(reasonGroup || note.trim(), note)}
        >
          {action === "approve" && <><Check className="size-3" />Xác nhận duyệt</>}
          {action === "reject"  && <><XCircle className="size-3" />Xác nhận từ chối</>}
          {action === "info"    && <><AlertCircle className="size-3" />Gửi yêu cầu TT</>}
        </Button>
      </div>
    </div>
  )
}

// ─── Comment section ──────────────────────────────────────────────────────────

const CURRENT_ROLE: RoleKey = "MDM"
const CURRENT_NAME = "Le Thi M"

function CommentSection({ comments, onAdd }: {
  comments: Comment[]
  onAdd: (text: string) => void
}) {
  const [text, setText] = useState("")

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim())
    setText("")
  }

  const roleColor: Record<Comment["role"], string> = {
    MDM:       "bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))]",
    SCM:       "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]",
    Requester: "bg-secondary text-secondary-foreground",
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Trao đổi ({comments.length})
        </p>
      </div>

      <div className="space-y-2.5 max-h-48 overflow-auto pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground/50 italic">Chưa có bình luận.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <Avatar className="size-5 shrink-0 mt-0.5">
              <AvatarFallback className="text-[8px]">
                {c.author.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium">{c.author}</span>
                <span className={cn("text-[9px] font-semibold px-1 py-0.5 rounded", roleColor[c.role])}>{c.role}</span>
                <span className="text-[10px] text-muted-foreground/60">{c.time}</span>
              </div>
              <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <Avatar className="size-5 shrink-0 mt-1">
          <AvatarFallback className="text-[8px]">
            {CURRENT_NAME.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Textarea
            className="text-xs min-h-[56px] resize-none"
            placeholder="Nhập bình luận… (Ctrl+Enter để gửi)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit() }}
          />
          <div className="flex justify-end">
            <Button size="sm" className="h-6 text-xs gap-1 px-2" disabled={!text.trim()} onClick={submit}>
              <Send className="size-3" />Gửi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ item, onStepAction, onStepReset, onComment }: {
  item: BulkItem
  onStepAction: (id: string, role: RoleKey, action: "approve" | "reject" | "info", reasonGroup: string, note: string) => void
  onStepReset:  (id: string, role: RoleKey) => void
  onComment:    (id: string, text: string) => void
}) {
  const [action, setAction] = useState<{ role: RoleKey; type: "approve" | "reject" | "info" } | null>(null)
  useEffect(() => { setAction(null) }, [item.id])

  const overall = deriveOverall(item)

  // Which roles can act now
  const canActMDM = (item.steps[0].status === "pending" || item.steps[0].status === "info_needed") &&
    (overall === "pending_mdm" || overall === "info_needed" || item.parallel)
  const canActSCM = item.steps[1].status === "pending" &&
    (overall === "pending_scm" || item.parallel)
  // Can reset = step was actioned (not pending/skipped) and it's their turn or parallel
  const canResetMDM = item.steps[0].status !== "pending" && item.steps[0].status !== "skipped"
  const canResetSCM = item.steps[1].status !== "pending" && item.steps[1].status !== "skipped"

  const MetaRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="flex items-baseline justify-between py-1 border-b border-border/50 last:border-0 gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-[11px] font-medium text-right", highlight && "text-primary")}>{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] text-muted-foreground">{item.sku}</p>
            <h2 className="text-sm font-semibold leading-snug mt-0.5">{item.productName}</h2>
          </div>
          <OverallBadge item={item} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <Package className="size-2.5" />{item.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <Building2 className="size-2.5" />{item.supplier}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
            <User className="size-2.5" />{item.requestedBy}
          </Badge>
        </div>
        <ApprovalStepBar steps={item.steps} parallel={item.parallel} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto">
        <div className="px-5 py-4 space-y-5">

          {/* Order summary */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Đơn hàng</p>
            <div className="rounded-lg border overflow-hidden">
              <div className="flex flex-wrap divide-x">
                <div className="flex-1 min-w-[80px] py-2.5 px-3 text-center">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">SL đặt</p>
                  <p className="text-sm font-bold mt-0.5">{fmtN(item.qtyOrdered)}</p>
                </div>
                <div className="flex-1 min-w-[80px] py-2.5 px-3 text-center">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">Đơn giá</p>
                  <p className="text-sm font-bold mt-0.5 truncate">{fmt(item.unitPrice)}</p>
                </div>
                <div className="flex-1 min-w-[96px] py-2.5 px-3 text-center bg-muted/40">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">Giá trị ĐH</p>
                  <p className="text-sm font-bold mt-0.5 text-primary truncate">{fmt(item.orderValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics grid — 2 cols when wide enough, stacks when narrow */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border p-3 space-y-0 flex-1 min-w-[140px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tồn kho tại ngày YC</p>
              <MetaRow label="Tồn DC" value={fmtN(item.stockDC)} />
              <MetaRow label="Tổng tồn" value={fmtN(item.stockTotal)} />
              <MetaRow label="Ngày tồn DC" value={`${item.daysStockDC} ngày`} highlight={item.daysStockDC < 10} />
              <MetaRow label="Ngày tồn toàn HT" value={`${item.daysStockTotal} ngày`} />
            </div>
            <div className="rounded-lg border p-3 space-y-0 flex-1 min-w-[140px]">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sức bán</p>
              <MetaRow label="SBTB 28 ngày" value={fmtN(item.avgSales28d)} />
              <MetaRow label="SBTB không KM" value={fmtN(item.avgSalesNonPromo)} />
              <MetaRow label="SB dự kiến/ngày" value={fmtN(item.projectedDailySales)} highlight />
              <MetaRow label="FC vs Actual" value={fmtPct(item.salesFcVsActualDiff)} highlight={item.salesFcVsActualDiff > 30} />
            </div>
          </div>

          {/* Deal info */}
          <div className="rounded-lg border p-3 space-y-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Thông tin Deal</p>
            <MetaRow label="Ngày nhập dự kiến" value={item.expectedArrival} />
            <MetaRow label="Bắt đầu deal" value={item.dealStart} />
            <MetaRow label="Bán hết lô" value={item.dealEnd} />
            <MetaRow label="Số ngày bán dự kiến" value={`${item.projectedSellingDays} ngày`} />
            <MetaRow label="CTKM Support" value={item.promotion} />
            <MetaRow label="Deadline SCM Confirm" value={item.scmDeadline} highlight />
          </div>

          {/* Forecast */}
          <div className="rounded-lg border p-3 space-y-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Dự báo sau nhập hàng</p>
            <MetaRow label="Tổng tồn dự kiến ngày nhập" value={fmtN(item.projectedStockAtArrival)} />
            <MetaRow label="Ngày tồn DC (theo SB dự kiến)" value={`${item.projectedDCDaysPostDeal} ngày`} highlight={item.projectedDCDaysPostDeal > 30} />
            <MetaRow label="Ngày tồn toàn HT sau hết KM" value={`${item.totalDaysPostPromo} ngày`} highlight={item.totalDaysPostPromo > 45} />
          </div>

          {/* Feasibility note */}
          {item.feasibilityNote && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Giải thích độ khả thi</p>
              <p className="text-xs leading-relaxed">{item.feasibilityNote}</p>
            </div>
          )}

          {/* Approval steps history */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Lịch sử phê duyệt</p>
            {item.steps.map(step => (
              <div key={step.role} className={cn(
                "rounded-lg border px-3 py-2.5 space-y-1",
                step.status === "approved"    && "bg-[hsl(var(--success-subtle))] border-[hsl(var(--success)/0.3)]",
                step.status === "rejected"    && "bg-destructive/5 border-destructive/20",
                step.status === "info_needed" && "bg-[hsl(var(--warning-subtle))] border-[hsl(var(--warning)/0.3)]",
                step.status === "pending"     && "bg-muted/30",
              )}>
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">{step.role}</span>
                  <span className={cn("text-[10px] font-medium ml-auto", STEP_CONFIG[step.status].color)}>
                    {STEP_CONFIG[step.status].label}
                  </span>
                </div>
                {step.reasonGroup && <p className="text-[11px] font-medium pl-5">{step.reasonGroup}</p>}
                {step.note       && <p className="text-[11px] text-muted-foreground pl-5">{step.note}</p>}
                {step.approvedBy && (
                  <p className="text-[10px] text-muted-foreground/60 pl-5">
                    bởi {step.approvedBy} · {step.approvedAt}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Approval actions ── */}
          {(canActMDM || canActSCM || canResetMDM || canResetSCM) && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-3 py-2 bg-muted/50 border-b">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phê duyệt</p>
              </div>
              <div className="divide-y">

                {/* MDM block */}
                {(canActMDM || canResetMDM) && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-semibold text-muted-foreground">MDM</span>
                      {canResetMDM && !canActMDM && (
                        <button
                          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                          onClick={() => { onStepReset(item.id, "MDM"); setAction(null) }}
                        >
                          Duyệt lại
                        </button>
                      )}
                    </div>

                    {canActMDM && action?.role !== "MDM" && (
                      <div className="space-y-1.5">
                        {/* Primary: Approve */}
                        <Button
                          size="sm"
                          className="w-full h-9 gap-2 text-xs bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-white"
                          onClick={() => setAction({ role: "MDM", type: "approve" })}
                        >
                          <CheckCircle2 className="size-4" />
                          Duyệt
                        </Button>
                        {/* Secondary row */}
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 gap-1 text-[11px] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.35)] hover:bg-[hsl(var(--warning-subtle))]"
                            onClick={() => setAction({ role: "MDM", type: "info" })}
                          >
                            <AlertCircle className="size-3" />Cần thêm TT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 gap-1 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => setAction({ role: "MDM", type: "reject" })}
                          >
                            <XCircle className="size-3" />Từ chối
                          </Button>
                        </div>
                      </div>
                    )}

                    {canResetMDM && !canActMDM && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <span className={cn("text-[11px] font-medium", STEP_CONFIG[item.steps[0].status].color)}>
                          {STEP_CONFIG[item.steps[0].status].label}
                        </span>
                        {item.steps[0].reasonGroup && (
                          <span className="text-[10px] text-muted-foreground truncate">· {item.steps[0].reasonGroup}</span>
                        )}
                      </div>
                    )}

                    {action?.role === "MDM" && (
                      <ActionForm
                        action={action.type}
                        onSubmit={(rg, n) => { onStepAction(item.id, "MDM", action.type, rg, n); setAction(null) }}
                        onCancel={() => setAction(null)}
                      />
                    )}
                  </div>
                )}

                {/* SCM block */}
                {(canActSCM || canResetSCM) && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-semibold text-muted-foreground">SCM</span>
                      {canResetSCM && !canActSCM && (
                        <button
                          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                          onClick={() => { onStepReset(item.id, "SCM"); setAction(null) }}
                        >
                          Duyệt lại
                        </button>
                      )}
                    </div>

                    {canActSCM && action?.role !== "SCM" && (
                      <div className="space-y-1.5">
                        <Button
                          size="sm"
                          className="w-full h-9 gap-2 text-xs bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.9)] text-white"
                          onClick={() => setAction({ role: "SCM", type: "approve" })}
                        >
                          <CheckCircle2 className="size-4" />
                          Duyệt
                        </Button>
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 gap-1 text-[11px] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.35)] hover:bg-[hsl(var(--warning-subtle))]"
                            onClick={() => setAction({ role: "SCM", type: "info" })}
                          >
                            <AlertCircle className="size-3" />Cần thêm TT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 gap-1 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => setAction({ role: "SCM", type: "reject" })}
                          >
                            <XCircle className="size-3" />Từ chối
                          </Button>
                        </div>
                      </div>
                    )}

                    {canResetSCM && !canActSCM && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                        <span className={cn("text-[11px] font-medium", STEP_CONFIG[item.steps[1].status].color)}>
                          {STEP_CONFIG[item.steps[1].status].label}
                        </span>
                        {item.steps[1].reasonGroup && (
                          <span className="text-[10px] text-muted-foreground truncate">· {item.steps[1].reasonGroup}</span>
                        )}
                      </div>
                    )}

                    {!canActSCM && !canResetSCM && (
                      <p className="text-[11px] text-muted-foreground/60 italic">Chờ MDM duyệt trước</p>
                    )}

                    {action?.role === "SCM" && (
                      <ActionForm
                        action={action.type}
                        onSubmit={(rg, n) => { onStepAction(item.id, "SCM", action.type, rg, n); setAction(null) }}
                        onCancel={() => setAction(null)}
                      />
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          <Separator />

          {/* Comments */}
          <CommentSection
            comments={item.comments}
            onAdd={text => onComment(item.id, text)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Left table ───────────────────────────────────────────────────────────────

// Column definitions for the wide table
// sticky cols are frozen to the left; left offset is computed at render time
interface ColDef { key: string; label: string; width: number; align?: "right" | "center"; sticky?: boolean }
const COLS: ColDef[] = [
  { key: "productName",           label: "Sản phẩm",                      width: 180, sticky: true },
  { key: "sku",                   label: "SKU",                           width: 88 },
  { key: "supplier",              label: "NCC",                           width: 96 },
  { key: "qtyOrdered",            label: "SL đặt (incl. tặng)",           width: 100, align: "right" },
  { key: "orderValue",            label: "Giá trị ĐH",                   width: 112, align: "right" },
  { key: "expectedArrival",       label: "Ngày nhập DK",                 width: 96,  align: "center" },
  { key: "stockDC",               label: "Tồn DC tại ngày YC",           width: 100, align: "right" },
  { key: "stockTotal",            label: "Tổng tồn tại ngày YC",         width: 112, align: "right" },
  { key: "dealStart",             label: "Bắt đầu deal",                 width: 96,  align: "center" },
  { key: "dealEnd",               label: "Bán hết lô",                   width: 96,  align: "center" },
  { key: "projectedDailySales",   label: "SB DK / ngày",                 width: 88,  align: "right" },
  { key: "promotion",             label: "CTKM Support",                  width: 160 },
  { key: "avgSales28d",           label: "SBTB 28 ngày",                 width: 88,  align: "right" },
  { key: "avgSalesNonPromo",      label: "SBTB Không KM",                width: 96,  align: "right" },
  { key: "daysStockDC",           label: "Ngày tồn DC",                  width: 80,  align: "right" },
  { key: "daysStockTotal",        label: "Ngày tồn toàn HT",             width: 100, align: "right" },
  { key: "projectedStockAtArrival",label: "Tổng tồn DK ngày nhập",       width: 120, align: "right" },
  { key: "salesFcVsActualDiff",   label: "Chênh lệch FC vs Actual",      width: 120, align: "right" },
  { key: "projectedSellingDays",  label: "Số ngày bán DK",               width: 88,  align: "right" },
  { key: "projectedDCDaysPostDeal",label: "Ngày tồn DC theo SB DK",      width: 116, align: "right" },
  { key: "totalDaysPostPromo",    label: "Ngày tồn toàn HT sau KM",      width: 124, align: "right" },
  { key: "scmDeadline",           label: "Deadline SCM",                  width: 96,  align: "center" },
  { key: "steps",                 label: "Trạng thái",                    width: 140 },
]

function cellValue(item: BulkItem, key: string): React.ReactNode {
  switch (key) {
    case "sku":                    return <span className="font-mono text-[10px] text-muted-foreground">{item.sku}</span>
    case "productName":            return <span className="font-medium text-xs truncate block">{item.productName}</span>
    case "supplier":               return <span className="text-xs text-muted-foreground">{item.supplier}</span>
    case "qtyOrdered":             return <span className="text-xs font-medium">{fmtN(item.qtyOrdered)}</span>
    case "orderValue":             return <span className="text-xs font-semibold text-primary">{fmt(item.orderValue)}</span>
    case "expectedArrival":        return <span className="text-xs">{item.expectedArrival}</span>
    case "stockDC":                return <span className="text-xs">{fmtN(item.stockDC)}</span>
    case "stockTotal":             return <span className="text-xs">{fmtN(item.stockTotal)}</span>
    case "dealStart":              return <span className="text-xs">{item.dealStart}</span>
    case "dealEnd":                return <span className="text-xs">{item.dealEnd}</span>
    case "projectedDailySales":    return <span className="text-xs font-medium text-primary">{fmtN(item.projectedDailySales)}</span>
    case "promotion":              return <span className="text-[11px] text-muted-foreground truncate block">{item.promotion}</span>
    case "avgSales28d":            return <span className="text-xs">{fmtN(item.avgSales28d)}</span>
    case "avgSalesNonPromo":       return <span className="text-xs">{fmtN(item.avgSalesNonPromo)}</span>
    case "daysStockDC":            return <span className={cn("text-xs font-medium", item.daysStockDC < 10 && "text-destructive")}>{item.daysStockDC}d</span>
    case "daysStockTotal":         return <span className="text-xs">{item.daysStockTotal}d</span>
    case "projectedStockAtArrival":return <span className="text-xs">{fmtN(item.projectedStockAtArrival)}</span>
    case "salesFcVsActualDiff":    return <span className={cn("text-xs font-medium", item.salesFcVsActualDiff > 30 && "text-[hsl(var(--warning))]")}>{fmtPct(item.salesFcVsActualDiff)}</span>
    case "projectedSellingDays":   return <span className="text-xs">{item.projectedSellingDays}d</span>
    case "projectedDCDaysPostDeal":return <span className={cn("text-xs font-medium", item.projectedDCDaysPostDeal > 30 && "text-destructive")}>{item.projectedDCDaysPostDeal}d</span>
    case "totalDaysPostPromo":     return <span className={cn("text-xs", item.totalDaysPostPromo > 45 && "text-[hsl(var(--warning))]")}>{item.totalDaysPostPromo}d</span>
    case "scmDeadline":            return <span className="text-xs font-medium text-destructive/80">{item.scmDeadline}</span>
    case "steps":                  return <ApprovalStepBar steps={item.steps} parallel={item.parallel} />
    default:                       return null
  }
}

// ─── Paste modal ──────────────────────────────────────────────────────────────

function PasteModal({ onClose, onImport }: {
  onClose: () => void
  onImport: (items: Partial<BulkItem>[]) => void
}) {
  const [raw, setRaw]         = useState("")
  const [count, setCount]     = useState(0)
  const [error, setError]     = useState("")

  const parse = (text: string) => {
    setRaw(text)
    if (!text.trim()) { setCount(0); setError(""); return }
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    const valid = lines.filter(l => {
      const cols = l.split(/\t|,/)
      return cols.length >= 3 && cols[0].trim() && cols[1].trim()
    })
    setCount(valid.length)
    setError(valid.length === 0 ? "Không nhận dạng được dữ liệu. Tối thiểu: SKU ⇥ Tên sản phẩm ⇥ Nhà cung cấp" : "")
  }

  const doImport = () => {
    const lines = raw.trim().split(/\r?\n/).filter(Boolean)
    const rows: Partial<BulkItem>[] = lines
      .map(l => l.split(/\t|,/).map(c => c.trim().replace(/^"|"$/g, "")))
      .filter(c => c.length >= 3 && c[0] && c[1])
      .map(c => ({
        sku:             c[0],
        productName:     c[1],
        supplier:        c[2] || "—",
        category:        c[3] || "Uncategorized",
        qtyOrdered:      parseInt(c[4]?.replace(/\D/g, "") || "0") || 0,
        unitPrice:       parseInt(c[5]?.replace(/\D/g, "") || "0") || 0,
        orderValue:      (parseInt(c[4]?.replace(/\D/g, "") || "0") || 0) * (parseInt(c[5]?.replace(/\D/g, "") || "0") || 0),
        expectedArrival: c[6] || "",
        dealStart:       c[7] || "",
        dealEnd:         c[8] || "",
        scmDeadline:     c[9] || "",
        promotion:       c[10] || "—",
        feasibilityNote: c[11] || "",
        requestedBy:     "Current User",
        requestedAt:     new Date().toISOString().slice(0, 10),
      }))
    onImport(rows)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Paste hàng loạt từ Excel / CSV</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>✕</Button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-auto">
          <p className="text-xs text-muted-foreground">
            Định dạng mỗi dòng (tab-separated hoặc CSV):
          </p>
          <code className="block px-2.5 py-2 bg-muted rounded text-[10px] font-mono leading-relaxed">
            SKU ⇥ Tên sản phẩm ⇥ NCC ⇥ Danh mục ⇥ SL đặt ⇥ Đơn giá ⇥ Ngày nhập ⇥ Bắt đầu deal ⇥ Bán hết lô ⇥ Deadline SCM ⇥ CTKM ⇥ Giải thích
          </code>
          <Textarea
            className="font-mono text-xs min-h-[140px] resize-none"
            placeholder={"FRZ-0021\tFrozen Chicken 2kg\tVissan\tFrozen\t2400\t85000\t2026-05-05\t05/10/2026\t05/31/2026\t05/01/2026\tGiảm 15%\tDeal Q2..."}
            value={raw}
            onChange={e => parse(e.target.value)}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {count > 0 && <p className="text-xs text-[hsl(var(--success))]">✓ Nhận dạng được {count} dòng hợp lệ</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Huỷ</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" disabled={count === 0} onClick={doImport}>
            <ClipboardPaste className="size-3.5" />Import {count > 0 && `${count} dòng`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "Tất cả",      value: "all" },
  { label: "Chờ MDM",    value: "pending_mdm" },
  { label: "Chờ SCM",    value: "pending_scm" },
  { label: "Đã duyệt",   value: "approved" },
  { label: "Từ chối",    value: "rejected" },
  { label: "Cần TT",     value: "info_needed" },
  { label: "Song song",  value: "parallel" },
]

// ─── Main page ────────────────────────────────────────────────────────────────

const mkDefaultItem = (partial: Partial<BulkItem>, idx: number): BulkItem => ({
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
})

export function BulkBuyApproval() {
  const [items,        setItems]        = useState<BulkItem[]>(MOCK_ITEMS)
  const [selectedId,   setSelectedId]   = useState<string | null>(MOCK_ITEMS[0].id)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter,  setMonthFilter]  = useState("2026-04")
  const [showPaste,    setShowPaste]    = useState(false)

  // Resizable splitter
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftPct, setLeftPct] = useState(62)
  const isDragging = useRef(false)

  // Sync horizontal scroll: header follows rows
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const rowsScrollRef   = useRef<HTMLDivElement>(null)
  const onRowsScroll = useCallback(() => {
    if (headerScrollRef.current && rowsScrollRef.current) {
      headerScrollRef.current.scrollLeft = rowsScrollRef.current.scrollLeft
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct  = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(80, Math.max(20, pct)))
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  // Derived
  const monthFiltered = items.filter(i =>
    monthFilter === "all" || i.requestedAt.startsWith(monthFilter)
  )
  const filtered = monthFiltered.filter(i => {
    if (statusFilter === "all") return true
    return deriveOverall(i) === statusFilter
  })
  const selected = items.find(i => i.id === selectedId) ?? null

  // Tổng duyệt tháng này (approved, không tính rejected)
  const approvedThisMonth = monthFiltered
    .filter(i => deriveOverall(i) === "approved")
    .reduce((s, i) => s + i.orderValue, 0)

  // Bulk select — only pending_mdm or parallel items
  const canCheck = (i: BulkItem) => {
    const o = deriveOverall(i)
    return o === "pending_mdm" || o === "parallel" || o === "info_needed"
  }
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const checkableInView = filtered.filter(canCheck)
  const allChecked = checkableInView.length > 0 && checkableInView.every(i => selectedIds.has(i.id))
  const toggleAll = () => setSelectedIds(allChecked ? new Set() : new Set(checkableInView.map(i => i.id)))

  // Step action
  const handleStepAction = (id: string, role: RoleKey, type: "approve" | "reject" | "info", reasonGroup: string, note: string) => {
    const statusMap = { approve: "approved" as StepStatus, reject: "rejected" as StepStatus, info: "info_needed" as StepStatus }
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const steps: [ApprovalStep, ApprovalStep] = [...item.steps] as [ApprovalStep, ApprovalStep]
      const idx = role === "MDM" ? 0 : 1
      steps[idx] = {
        ...steps[idx],
        status: statusMap[type],
        reasonGroup: reasonGroup || undefined,
        note: note || undefined,
        approvedBy: CURRENT_NAME,
        approvedAt: new Date().toISOString().slice(0, 10),
      }
      return { ...item, steps }
    }))
  }

  // Reset step (duyệt lại)
  const handleStepReset = (id: string, role: RoleKey) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const steps: [ApprovalStep, ApprovalStep] = [...item.steps] as [ApprovalStep, ApprovalStep]
      const idx = role === "MDM" ? 0 : 1
      steps[idx] = { role, status: "pending" }
      // If resetting MDM, also reset SCM (sequential dependency)
      if (role === "MDM" && !item.parallel) steps[1] = { role: "SCM", status: "pending" }
      return { ...item, steps }
    }))
  }

  // Comment
  const handleComment = (id: string, text: string) => {
    setItems(prev => prev.map(item => item.id !== id ? item : {
      ...item,
      comments: [...item.comments, {
        id: `c${Date.now()}`,
        author: CURRENT_NAME,
        role: CURRENT_ROLE,
        text,
        time: new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }),
      }],
    }))
  }

  // Bulk MDM approve
  const bulkApprove = () => {
    Array.from(selectedIds).forEach(id => handleStepAction(id, "MDM", "approve", "Đủ điều kiện — chuẩn quy trình", ""))
    setSelectedIds(new Set())
  }
  const bulkReject = () => {
    Array.from(selectedIds).forEach(id => handleStepAction(id, "MDM", "reject", "Lý do khác", "Bulk reject"))
    setSelectedIds(new Set())
  }

  // Import
  const handleImport = (rows: Partial<BulkItem>[]) => {
    const newItems = rows.map((r, i) => mkDefaultItem(r, i))
    setItems(prev => [...newItems, ...prev])
    if (newItems.length > 0) setSelectedId(newItems[0].id)
  }


  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Bulk-buy Approval"
        description="Phê duyệt đơn mua hàng lô / gói — MDM → SCM"
        action={{ label: "Paste hàng loạt", onClick: () => setShowPaste(true) }}
      />

      {/* ── Toolbar: status tabs + month filter + approved total + bulk actions ── */}
      <div className="shrink-0 border-b bg-background flex items-center">
        {/* Status tabs — scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto shrink min-w-0 px-4">
          {STATUS_FILTERS.map(f => {
            const count = f.value === "all"
              ? monthFiltered.length
              : monthFiltered.filter(i => deriveOverall(i) === f.value).length
            const isActive = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right side: divider + month filter + approved total + bulk */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-1.5 border-l ml-auto">
          {/* Month filter */}
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Approved total */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tổng duyệt: <strong className="text-[hsl(var(--success))] font-semibold">{fmt(approvedThisMonth)}</strong>
          </span>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-primary font-medium">{selectedIds.size} dòng</span>
              <Button size="sm" className="h-6 text-xs px-2 gap-1" onClick={bulkApprove}>
                <CheckCircle2 className="size-3" />MDM Duyệt
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs px-2 gap-1 text-destructive border-destructive/30" onClick={bulkReject}>
                <XCircle className="size-3" />Từ chối
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Two-column resizable ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* Left — wide table */}
        <div className="flex flex-col overflow-hidden border-r" style={{ width: `${leftPct}%` }}>
          {/* Frozen header — scrollLeft synced from rows */}
          {(() => {
            // Pre-compute sticky left offsets: checkbox=40px, then each sticky col accumulates
            const CHECKBOX_W = 40
            const colLefts: Record<string, number> = {}
            let stickyOffset = CHECKBOX_W
            COLS.forEach(col => {
              if (col.sticky) { colLefts[col.key] = stickyOffset; stickyOffset += col.width }
            })
            const totalMinWidth = COLS.reduce((s, c) => s + c.width, CHECKBOX_W)

            return (
              <>
                {/* Frozen header — scrollLeft synced from rows */}
                <div ref={headerScrollRef} className="shrink-0 overflow-hidden border-b bg-muted">
                  <div className="flex relative" style={{ minWidth: totalMinWidth + "px" }}>
                    {/* Checkbox col — sticky */}
                    <div className="shrink-0 w-10 flex items-center justify-center py-2 border-r border-border bg-muted sticky left-0 z-20">
                      <input
                        type="checkbox"
                        className="size-3.5 accent-primary cursor-pointer rounded"
                        checked={allChecked}
                        onChange={toggleAll}
                      />
                    </div>
                    {COLS.map(col => (
                      <div
                        key={col.key}
                        className={cn(
                          "shrink-0 py-2 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border last:border-r-0 leading-tight bg-muted",
                          col.sticky && "sticky z-10",
                        )}
                        style={{
                          width: col.width,
                          textAlign: col.align ?? "left",
                          ...(col.sticky ? { left: colLefts[col.key] } : {}),
                        }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scrollable rows */}
                <div ref={rowsScrollRef} className="flex-1 overflow-auto" onScroll={onRowsScroll}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                      <ShoppingCart className="size-8 opacity-30" />
                      <p className="text-xs">Không có đơn hàng</p>
                    </div>
                  ) : filtered.map(item => {
                    const isActive  = selectedId === item.id
                    const isChecked = selectedIds.has(item.id)
                    const checkable = canCheck(item)
                    const rowBg = isActive ? "hsl(var(--accent))" : "hsl(var(--background))"
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          "flex border-b cursor-pointer transition-colors group/row",
                          isActive ? "bg-accent" : "hover:bg-accent/40"
                        )}
                        style={{ minWidth: totalMinWidth + "px" }}
                      >
                        {/* Checkbox — sticky */}
                        <div
                          className="shrink-0 w-10 flex items-center justify-center border-r border-border/50 sticky left-0 z-10 transition-colors"
                          style={{ background: rowBg }}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-primary cursor-pointer rounded disabled:opacity-30"
                            checked={isChecked}
                            disabled={!checkable}
                            onChange={() => {}}
                            onClick={e => checkable && toggleSelect(item.id, e)}
                          />
                        </div>
                        {COLS.map(col => (
                          <div
                            key={col.key}
                            className={cn(
                              "shrink-0 py-2 px-2 flex items-center border-r border-border/30 last:border-r-0 overflow-hidden transition-colors",
                              col.sticky && "sticky z-10",
                              col.key === "productName" && "border-r border-border/50",
                            )}
                            style={{
                              width: col.width,
                              justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                              ...(col.sticky ? { left: colLefts[col.key], background: rowBg } : {}),
                            }}
                          >
                            {cellValue(item, col.key)}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1 shrink-0 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative group"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
        </div>

        {/* Right — detail */}
        <div className="flex-1 overflow-hidden bg-background min-w-[300px]">
          {selected ? (
            <DetailPanel
              key={selected.id}
              item={selected}
              onStepAction={handleStepAction}
              onStepReset={handleStepReset}
              onComment={handleComment}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <ShoppingCart className="size-10 opacity-20" />
              <p className="text-sm">Chọn một dòng để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {showPaste && <PasteModal onClose={() => setShowPaste(false)} onImport={handleImport} />}
    </div>
  )
}
