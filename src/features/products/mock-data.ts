// ─── Products Mock Data ───────────────────────────────────────────────────────

export type SkuStatus = "active" | "closed" | "suspended" | "pending"

export interface Sku {
  id: string; code: string; name: string; brand: string
  status: SkuStatus; groupPath: string[]
  unitCost: number; retailPrice: number
  revenue30d: number; unitsSold30d: number
  marginPct: number; trendPct: number
  inDate: string; outDate?: string; lastUpdated: string
}

export interface ProductGroup {
  id: string; name: string; level: number; parentId: string | null
  skuCount: number; revenue30d: number; marginPct: number; trendPct: number
}

export type ApprovalType   = "in" | "out"
export type ApprovalStatus = "pending" | "approved" | "rejected"

export interface ApprovalRequest {
  id: string; type: ApprovalType; skuId: string; skuCode: string; skuName: string
  brand: string; requestedBy: string; requestedAt: string; reason: string
  status: ApprovalStatus; reviewedBy?: string; reviewedAt?: string
  reviewNote?: string; performanceNote?: string
  revenue30d?: number; trendPct?: number
}

// ─── NEW: Inventory Availability Types ───────────────────────────────────────

/** Phân bổ trạng thái tồn kho theo % */
export interface InventoryStatusDist {
  inStock: number       // % hàng đang có đủ tồn
  belowMin: number      // % dưới mức tồn tối thiểu
  aboveMax: number      // % vượt mức tồn tối đa
  oos: number           // % out-of-stock tại cửa hàng
  oosVendor: number     // % OOS do nhà cung cấp
  oosShipped: number    // % OOS nhưng đã có đơn vận chuyển
}

/** Availability theo nhóm/rank/kênh */
export interface AvailabilityByDimension {
  name: string
  availability: number          // % fill rate tổng
  availabilityExVendor: number  // % fill rate (loại trừ OOS NCC)
}

/** Điểm dữ liệu theo ngày — trend line */
export interface AvailabilityPoint {
  date: string          // "DD/MM"
  availability: number  // %
  availabilityExVendor: number
  oosLines: number      // số dòng OOS tại cửa hàng
  activeSkus: number
}

/** Điểm OOS theo ngày (stacked bar) */
export interface OosPoint {
  date: string
  newOos: number     // nghìn dòng
  remainOos: number
  solved: number
}

/** Availability theo NCC */
export interface VendorAvailability {
  vendor: string
  oosRate: number   // % dòng OOS (càng thấp càng tốt)
}

// ─── Product Groups (6-level hierarchy) ──────────────────────────────────────
export const PRODUCT_GROUPS: ProductGroup[] = [
  { id: "g1",   name: "Thực phẩm",        level: 1, parentId: null,      skuCount: 320, revenue30d: 2_450_000_000, marginPct: 18.5, trendPct:  4.2 },
  { id: "g2",   name: "Đồ uống",           level: 1, parentId: null,      skuCount: 180, revenue30d: 1_120_000_000, marginPct: 22.1, trendPct:  7.8 },
  { id: "g3",   name: "Hóa mỹ phẩm",      level: 1, parentId: null,      skuCount: 210, revenue30d:   890_000_000, marginPct: 31.4, trendPct: -2.1 },
  { id: "g4",   name: "Gia dụng",          level: 1, parentId: null,      skuCount:  95, revenue30d:   560_000_000, marginPct: 24.8, trendPct:  1.5 },

  { id: "g1-1", name: "Thực phẩm khô",    level: 2, parentId: "g1",      skuCount: 140, revenue30d: 1_100_000_000, marginPct: 16.2, trendPct:  3.1 },
  { id: "g1-2", name: "Thực phẩm tươi",   level: 2, parentId: "g1",      skuCount: 110, revenue30d:   880_000_000, marginPct: 19.8, trendPct:  5.6 },
  { id: "g1-3", name: "Đông lạnh",         level: 2, parentId: "g1",      skuCount:  70, revenue30d:   470_000_000, marginPct: 21.0, trendPct:  2.4 },

  { id: "g1-1-1", name: "Gạo & Ngũ cốc",    level: 3, parentId: "g1-1",  skuCount: 45, revenue30d: 380_000_000, marginPct: 14.5, trendPct:  1.8 },
  { id: "g1-1-2", name: "Mì & Bún khô",      level: 3, parentId: "g1-1",  skuCount: 55, revenue30d: 420_000_000, marginPct: 17.3, trendPct:  4.2 },
  { id: "g1-1-3", name: "Gia vị & Nước mắm", level: 3, parentId: "g1-1",  skuCount: 40, revenue30d: 300_000_000, marginPct: 18.9, trendPct:  2.1 },

  { id: "g1-1-1-1", name: "Gạo trắng", level: 4, parentId: "g1-1-1", skuCount: 18, revenue30d: 160_000_000, marginPct: 12.5, trendPct:  0.9 },
  { id: "g1-1-1-2", name: "Gạo lứt",   level: 4, parentId: "g1-1-1", skuCount: 12, revenue30d:  98_000_000, marginPct: 16.2, trendPct:  5.5 },
  { id: "g1-1-1-3", name: "Yến mạch",  level: 4, parentId: "g1-1-1", skuCount: 15, revenue30d: 122_000_000, marginPct: 18.0, trendPct:  9.3 },

  { id: "g1-1-1-1-1", name: "Gạo ST25",     level: 5, parentId: "g1-1-1-1", skuCount:  6, revenue30d: 72_000_000, marginPct: 11.2, trendPct: -1.5 },
  { id: "g1-1-1-1-2", name: "Gạo Jasmine",  level: 5, parentId: "g1-1-1-1", skuCount:  7, revenue30d: 58_000_000, marginPct: 13.8, trendPct:  2.8 },
  { id: "g1-1-1-1-3", name: "Gạo Tám xoan", level: 5, parentId: "g1-1-1-1", skuCount:  5, revenue30d: 30_000_000, marginPct: 10.5, trendPct: -4.2 },

  { id: "g1-1-1-1-1-1", name: "ST25 túi 5kg",  level: 6, parentId: "g1-1-1-1-1", skuCount: 3, revenue30d: 42_000_000, marginPct: 10.5, trendPct: -2.1 },
  { id: "g1-1-1-1-1-2", name: "ST25 túi 10kg", level: 6, parentId: "g1-1-1-1-1", skuCount: 3, revenue30d: 30_000_000, marginPct: 12.0, trendPct: -0.8 },
]

// ─── SKU list ─────────────────────────────────────────────────────────────────
export const SKUS: Sku[] = [
  { id: "s1",  code: "FD-001", name: "Gạo ST25 túi 5kg Cánh Đồng",     brand: "Cánh Đồng", status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Gạo & Ngũ cốc","Gạo trắng","Gạo ST25","ST25 túi 5kg"],  unitCost: 95_000,  retailPrice: 112_000, revenue30d: 21_000_000, unitsSold30d: 188, marginPct: 10.5, trendPct:  -2.1, inDate: "2024-01-15", lastUpdated: "2025-05-01" },
  { id: "s2",  code: "FD-002", name: "Gạo Jasmine túi 5kg Vinaseed",    brand: "Vinaseed",   status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Gạo & Ngũ cốc","Gạo trắng","Gạo Jasmine"],              unitCost: 78_000,  retailPrice:  92_000, revenue30d: 18_400_000, unitsSold30d: 200, marginPct: 13.8, trendPct:   2.8, inDate: "2024-02-10", lastUpdated: "2025-05-01" },
  { id: "s3",  code: "FD-003", name: "Mì Hảo Hảo tôm chua cay 30 gói", brand: "Acecook",    status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Mì & Bún khô"],                                          unitCost: 42_000,  retailPrice:  55_000, revenue30d: 33_000_000, unitsSold30d: 600, marginPct: 17.3, trendPct:   6.1, inDate: "2023-11-01", lastUpdated: "2025-05-01" },
  { id: "s4",  code: "FD-004", name: "Nước mắm Chin-su 40° 500ml",      brand: "Chin-su",    status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Gia vị & Nước mắm"],                                     unitCost: 28_000,  retailPrice:  38_000, revenue30d: 15_200_000, unitsSold30d: 400, marginPct: 18.9, trendPct:   3.2, inDate: "2023-08-15", lastUpdated: "2025-05-01" },
  { id: "s5",  code: "FD-005", name: "Sữa tươi Vinamilk 1L (lốc 4)",    brand: "Vinamilk",   status: "active",    groupPath: ["Đồ uống","Sữa & Sản phẩm từ sữa"],                                                   unitCost: 62_000,  retailPrice:  79_000, revenue30d: 47_400_000, unitsSold30d: 600, marginPct: 22.1, trendPct:   8.4, inDate: "2023-06-01", lastUpdated: "2025-05-01" },
  { id: "s6",  code: "FD-006", name: "Dầu gội Clear Men 650ml",          brand: "Unilever",   status: "suspended", groupPath: ["Hóa mỹ phẩm","Chăm sóc tóc"],                                                        unitCost: 89_000,  retailPrice: 115_000, revenue30d:  3_450_000, unitsSold30d:  30, marginPct: 22.6, trendPct: -38.5, inDate: "2023-09-01", lastUpdated: "2025-04-20" },
  { id: "s7",  code: "FD-007", name: "Bột giặt Omo Matic 3kg",           brand: "Unilever",   status: "active",    groupPath: ["Hóa mỹ phẩm","Chất tẩy rửa"],                                                        unitCost: 148_000, retailPrice: 189_000, revenue30d: 28_350_000, unitsSold30d: 150, marginPct: 21.7, trendPct:   1.2, inDate: "2023-07-01", lastUpdated: "2025-05-01" },
  { id: "s8",  code: "FD-008", name: "Gạo Tám xoan 2kg Bắc Hương",      brand: "Bắc Hương",  status: "suspended", groupPath: ["Thực phẩm","Thực phẩm khô","Gạo & Ngũ cốc","Gạo trắng","Gạo Tám xoan"],             unitCost: 48_000,  retailPrice:  58_000, revenue30d:  1_160_000, unitsSold30d:  20, marginPct: 10.5, trendPct: -52.3, inDate: "2024-03-01", lastUpdated: "2025-04-10" },
  { id: "s9",  code: "FD-009", name: "Yến mạch Quaker 800g",             brand: "PepsiCo",    status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Gạo & Ngũ cốc","Yến mạch"],                             unitCost: 68_000,  retailPrice:  85_000, revenue30d: 25_500_000, unitsSold30d: 300, marginPct: 18.0, trendPct:  12.4, inDate: "2024-01-20", lastUpdated: "2025-05-01" },
  { id: "s10", code: "FD-010", name: "Nước Lavie 500ml lốc 24 chai",     brand: "Lavie",      status: "closed",    groupPath: ["Đồ uống","Nước uống"],                                                                unitCost: 78_000,  retailPrice:  96_000, revenue30d:          0, unitsSold30d:   0, marginPct: 18.8, trendPct:   0.0, inDate: "2022-01-01", outDate: "2025-03-31", lastUpdated: "2025-03-31" },
  { id: "s11", code: "FD-011", name: "Kem đánh răng P/S 230g x3",        brand: "Unilever",   status: "pending",   groupPath: ["Hóa mỹ phẩm","Chăm sóc răng miệng"],                                                 unitCost: 58_000,  retailPrice:  75_000, revenue30d:          0, unitsSold30d:   0, marginPct: 22.7, trendPct:   0.0, inDate: "2025-05-04", lastUpdated: "2025-05-04" },
  { id: "s12", code: "FD-012", name: "Dầu ăn Simply 1L",                 brand: "Wilmar",     status: "active",    groupPath: ["Thực phẩm","Thực phẩm khô","Gia vị & Nước mắm"],                                    unitCost: 32_000,  retailPrice:  42_000, revenue30d: 12_600_000, unitsSold30d: 300, marginPct: 19.0, trendPct:   0.8, inDate: "2023-05-01", lastUpdated: "2025-05-01" },
]

// ─── Approval Requests ────────────────────────────────────────────────────────
export const APPROVAL_REQUESTS: ApprovalRequest[] = [
  { id: "ap-1", type: "out", skuId: "s6",  skuCode: "FD-006", skuName: "Dầu gội Clear Men 650ml",       brand: "Unilever",  requestedBy: "Nguyen Van A", requestedAt: "2025-04-28T09:00:00", reason: "Doanh số liên tục giảm 38.5% trong 30 ngày. Tồn kho cao. Đề xuất khóa mã kinh doanh.", status: "pending",  performanceNote: "Revenue 30d: 3,450,000 VND | Trend: -38.5%", revenue30d: 3_450_000, trendPct: -38.5 },
  { id: "ap-2", type: "out", skuId: "s8",  skuCode: "FD-008", skuName: "Gạo Tám xoan 2kg Bắc Hương",   brand: "Bắc Hương", requestedBy: "Tran Thi B",   requestedAt: "2025-04-25T14:30:00", reason: "Revenue sụt giảm 52.3%, số lượng bán chỉ 20 đơn vị/tháng. Không đạt ngưỡng tối thiểu.", status: "pending",  performanceNote: "Revenue 30d: 1,160,000 VND | Trend: -52.3%", revenue30d: 1_160_000, trendPct: -52.3 },
  { id: "ap-3", type: "in",  skuId: "s11", skuCode: "FD-011", skuName: "Kem đánh răng P/S 230g x3",    brand: "Unilever",  requestedBy: "Le Van C",     requestedAt: "2025-05-03T08:15:00", reason: "Sản phẩm mới từ nhà cung cấp Unilever. Margin dự kiến 22.7%. Phù hợp với danh mục Hóa mỹ phẩm.", status: "pending", performanceNote: "Margin dự kiến: 22.7% | Đơn giá nhập: 58,000 VND" },
  { id: "ap-4", type: "out", skuId: "s10", skuCode: "FD-010", skuName: "Nước Lavie 500ml lốc 24 chai", brand: "Lavie",     requestedBy: "Nguyen Van A", requestedAt: "2025-03-28T10:00:00", reason: "Đã có phương án thay thế tốt hơn. Supplier ngừng hợp đồng.", status: "approved", reviewedBy: "Pham Thi D", reviewedAt: "2025-03-30T16:00:00", reviewNote: "Đồng ý đóng mã. Xác nhận đã thanh lý hàng tồn kho.", revenue30d: 0, trendPct: 0 },
]

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const PRODUCT_STATS = {
  totalSkus:          SKUS.length,
  active:             SKUS.filter(s => s.status === "active").length,
  suspended:          SKUS.filter(s => s.status === "suspended").length,
  closed:             SKUS.filter(s => s.status === "closed").length,
  pending:            SKUS.filter(s => s.status === "pending").length,
  totalRevenue30d:    SKUS.reduce((s, x) => s + x.revenue30d, 0),
  avgMarginPct:       parseFloat((SKUS.filter(s => s.status === "active").reduce((s, x) => s + x.marginPct, 0) / SKUS.filter(s => s.status === "active").length).toFixed(1)),
  pendingApprovals:   APPROVAL_REQUESTS.filter(r => r.status === "pending").length,
  // Availability / OOS
  avgAvailability:    91.2,  // % fill rate tổng hệ thống
  oosRate:             7.7,  // % SKU-dòng đang OOS tại cửa hàng
  oosLines:          262_897, // dòng OOS hiện tại
  fillRatePct:        91.2,
  // Năng suất assortment
  revenuePerActiveSku: 0,     // sẽ tính inline
  slowMovingCount:     2,     // SKU dưới ngưỡng velocity
  newSkuContribPct:    3.4,   // % revenue từ SKU mới trong 30 ngày
}

// ─── Inventory Status Distribution ───────────────────────────────────────────
export const INVENTORY_STATUS: InventoryStatusDist = {
  inStock:     58.15,
  belowMin:    17.16,
  aboveMax:    15.03,
  oos:          7.71,
  oosVendor:    0.54,
  oosShipped:   1.41,
}

// ─── Availability by Category Rank ───────────────────────────────────────────
export const AVAILABILITY_BY_RANK: AvailabilityByDimension[] = [
  { name: "NFD",  availability: 85.2, availabilityExVendor: 86.0 },
  { name: "A-",   availability: 84.1, availabilityExVendor: 85.3 },
  { name: "A+",   availability: 82.9, availabilityExVendor: 84.1 },
  { name: "B",    availability: 81.5, availabilityExVendor: 83.2 },
  { name: "C",    availability: 79.8, availabilityExVendor: 82.3 },
  { name: "D",    availability: 82.3, availabilityExVendor: 84.0 },
]

// ─── Availability by Region ───────────────────────────────────────────────────
export const AVAILABILITY_BY_REGION: AvailabilityByDimension[] = [
  { name: "Tp. Hà Nội",         availability: 93.1, availabilityExVendor: 93.8 },
  { name: "Tp. HCM",            availability: 90.2, availabilityExVendor: 91.4 },
  { name: "Tp. Đà Nẵng",        availability: 92.4, availabilityExVendor: 93.2 },
  { name: "Tỉnh Bình Thuận",    availability: 90.8, availabilityExVendor: 91.5 },
  { name: "Tỉnh An Giang",      availability: 90.3, availabilityExVendor: 91.0 },
  { name: "Tỉnh Nghệ An",       availability: 90.1, availabilityExVendor: 90.9 },
  { name: "Tỉnh Hậu Giang",     availability: 91.2, availabilityExVendor: 92.0 },
  { name: "Tỉnh Tây Ninh",      availability: 92.0, availabilityExVendor: 92.7 },
]

// ─── Availability Trend (last 8 weeks, weekly points) ────────────────────────
export const AVAILABILITY_TREND: AvailabilityPoint[] = [
  { date: "T1/W1", availability: 88.2, availabilityExVendor: 89.1, oosLines: 310_000, activeSkus: 2_740_000 },
  { date: "T1/W2", availability: 87.5, availabilityExVendor: 88.4, oosLines: 328_000, activeSkus: 2_745_000 },
  { date: "T1/W3", availability: 86.0, availabilityExVendor: 87.0, oosLines: 345_000, activeSkus: 2_748_000 },
  { date: "T1/W4", availability: 85.2, availabilityExVendor: 86.3, oosLines: 362_000, activeSkus: 2_750_000 },
  { date: "T2/W1", availability: 87.9, availabilityExVendor: 88.8, oosLines: 298_000, activeSkus: 2_752_000 },
  { date: "T2/W2", availability: 89.1, availabilityExVendor: 90.0, oosLines: 280_000, activeSkus: 2_755_000 },
  { date: "T2/W3", availability: 90.4, availabilityExVendor: 91.1, oosLines: 268_000, activeSkus: 2_756_000 },
  { date: "T2/W4", availability: 91.2, availabilityExVendor: 90.9, oosLines: 262_897, activeSkus: 2_758_394 },
]

// ─── OOS By Week (nghìn dòng) ─────────────────────────────────────────────────
export const OOS_TREND: OosPoint[] = [
  { date: "T1/W1", newOos: 48, remainOos: 220, solved: 42 },
  { date: "T1/W2", newOos: 52, remainOos: 235, solved: 37 },
  { date: "T1/W3", newOos: 44, remainOos: 248, solved: 41 },
  { date: "T1/W4", newOos: 38, remainOos: 255, solved: 50 },
  { date: "T2/W1", newOos: 35, remainOos: 228, solved: 62 },
  { date: "T2/W2", newOos: 31, remainOos: 210, solved: 59 },
  { date: "T2/W3", newOos: 27, remainOos: 195, solved: 55 },
  { date: "T2/W4", newOos: 22, remainOos: 183, solved: 57 },
]

// ─── Vendor OOS Rate ──────────────────────────────────────────────────────────
export const VENDOR_AVAILABILITY: VendorAvailability[] = [
  { vendor: "Unilever VN",          oosRate:  2.1 },
  { vendor: "Vinamilk",             oosRate:  1.8 },
  { vendor: "Acecook VN",           oosRate:  3.4 },
  { vendor: "Masan Consumer",       oosRate:  5.2 },
  { vendor: "PepsiCo VN",           oosRate:  4.7 },
  { vendor: "Wilmar Calofic",       oosRate:  7.8 },
  { vendor: "Bắc Hương Foods",      oosRate: 14.3 },
  { vendor: "Cánh Đồng Vàng",       oosRate: 16.5 },
  { vendor: "NCC Tổng hợp khác",    oosRate: 23.9 },
]
