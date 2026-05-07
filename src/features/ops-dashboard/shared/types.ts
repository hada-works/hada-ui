// ─── Shared types & helpers ───────────────────────────────────────────────────

export type Trend  = "up" | "down" | "flat"
export type Status = "good" | "warn" | "bad" | "neutral"
export type TabId  = "executive" | "operations" | "commercial" | "supply" | "regional" | "technology" | "finance" | "foodsafety" | "expansion" | "store"

export interface KPI {
  label: string
  value: string
  sub?: string
  trend?: Trend
  trendLabel?: string
  status?: Status
  alert?: string
}

export interface DrillRow {
  label: string
  value: string
  sub?: string
  status?: Status
}

/** Store cluster type — dùng cho assortment & site selection strategy */
export type StoreCluster = "residential" | "street" | "industrial" | "school" | "office" | "transit"

export interface PeriodData {
  // Executive
  sss: number
  revVsPlan: number
  revVsLY: number
  totalRevenue: number
  ebitdaPct: number
  ebitdaVsBudget: number
  storeCount: number
  storeOpening: number
  storePipeline: number
  storePipelineBreak: { signed: number; construction: number; permit: number }
  /** Store maturity cohorts — dùng cho SSS baseline và revenue split */
  storeCohort: { mature: number; growth: number; ramp: number }
  nps: number
  npsVsPrev: number
  headcount: number
  headcountVsPlan: number
  revPerSqm: number
  revPerSqmVsLY: number
  cashOnHand: number
  apOverdue: number
  /** Daily cash burn rate (VND/ngày) — dùng để tính runway */
  dailyCashBurn: number
  /** Electronic / cashless payment mix % */
  electronicPaymentPct: number
  /** Rental cost as % of revenue */
  rentalCostPct: number
  /** Utilities cost as % of revenue */
  utilitiesPct: number
  /** D&A (depreciation & amortization) as % of revenue */
  dAndAPct: number
  /** Online/delivery revenue as % of total */
  onlineRevPct: number
  /** Headcount breakdown by function */
  headcountBreakdown: { store: number; dc: number; hq: number }
  /** Turnover rate % per month */
  turnoverRatePct: number

  // Operations
  storesOp: number
  storesTotal: number
  storeHealthGreen: number
  storeHealthYellow: number
  storeHealthRed: number
  shrinkagePct: number
  shrinkageVsBudget: number
  laborCostPct: number
  laborTarget: number
  /** Staffing coverage % — actual staff vs scheduled */
  staffingCoverage: number
  mysterShopScore: number
  newStoreRampPct: number
  compliancePct: number
  csatScore: number
  csatVsPrev: number
  posUptime: number
  foodSafetyPass: number
  /** Temperature log compliance % across cold chain */
  tempLogCompliance: number
  /** Expiry waste as % of perishable COGS */
  expiryWastePct: number
  /** Active corrective actions pending across fleet */
  correctiveActionsPending: number
  /** Near-miss food safety incidents in period */
  nearMissCount: number
  trafficCount: number
  trafficConversion: number
  trafficConversionVsLY: number
  avgBasket: number
  avgBasketVsLY: number
  /** Transactions per store per day */
  txnPerStore: number
  /** Store cluster performance breakdown */
  clusterPerf: { cluster: string; stores: number; sss: number; revVsPlan: number; avgBasket: number }[]
  /** Area manager store list for ranking view */
  storeRanking: { id: string; name: string; rev: number; revVsPlan: number; traffic: number; issues: number; cluster: string }[]

  // Commercial
  oosPct: number
  oosAbc: number
  gmPct: number
  gmVsBudget: number
  sellThroughPct: number
  supplierFillRate: number
  dioDays: number
  /** Days Sales Outstanding — AR collection speed */
  dsoDays: number
  promoPctRevenue: number
  promoGmImpact: number
  privateLabelPct: number
  newSkuSuccessRate: number
  planogramPct: number
  categoryGm: {
    name: string
    gm: number
    gmVsBudget: number
    oosPct: number
    /** Top OOS SKUs in this category */
    topOosSku: { sku: string; stores: number; lostRevDay: number }[]
    /** Performance by region for this category */
    regionPerf: { region: string; gm: number; oosRate: number }[]
  }[]

  // Supply Chain
  poOpen: number
  poOverdue: number
  transitTotal: number
  transitLate: number
  /** On-time delivery % = (transitTotal - transitLate) / transitTotal × 100 */
  onTimeDeliveryPct: number
  /** DC dispatch fill accuracy % — chuyến xuất đủ hàng vs kế hoạch */
  dcFillAccuracy: number
  dcDispatch: number
  dcPending: number
  grn: number
  grnPending: number
  nearExpiryVnd: number
  overStockVnd: number
  supplierBreak: { name: string; fillRate: number; poOverdue: number }[]

  // Technology Operations
  /** POS system uptime % across fleet */
  posUptimePct: number
  /** App (mobile + web) availability % */
  appAvailability: number
  /** Payment transaction success rate % */
  paymentSuccessRate: number
  /** CCTV online % across stores */
  cctvCoverage: number
  /** Integration error rate (API/middleware failures per 1000 calls) */
  integrationErrorRate: number
  /** Mobile app DAU */
  mobileAppDau: number
  /** Open IT incidents by severity */
  itIncidents: { sev1: number; sev2: number; sev3: number }
  /** System incidents timeline for the period */
  systemIncidents: { system: string; store?: string; downtime: number; status: "open" | "resolved"; time: string }[]

  // Finance & Working Capital
  /** CapEx spent vs budget % */
  capExVsBudget: number
  /** Total CapEx spent in period */
  capExSpent: number
  /** Revenue per store P&L breakdown by region */
  regionPnL: { region: string; revenue: number; laborCost: number; rentCost: number; gmPct: number; ebitdaPct: number }[]
  /** AP aging buckets */
  apAging: { bucket: string; amount: number; count: number }[]
  /** Cash conversion cycle in days */
  cashConversionCycle: number

  // Regional
  regions: {
    name: string
    stores: number
    revVsPlan: number
    /** Revenue/store/ngày (VND) */
    revPerStore: number
    sss: number
    oosRate: number
    healthGreen: number
    newStores: number
    laborPct: number
    shrinkage: number
    /** Pipeline sites in this region */
    pipeline: number
    /** Avg lease cost/sqm/month (VND) */
    leaseCostSqm: number
  }[]
  storeBands: { p0: number; p20: number; p40: number; p60: number; p80: number }

  // Expansion & Real Estate (Tier 3c)
  /** Average time from lease signing to store opening (days) */
  timeToOpenDays: number
  /** Target time-to-open (days) */
  timeToOpenTarget: number
  /** Site approval rate % (approved vs submitted) */
  siteApprovalRate: number
  /** Average payback period for new stores (months) */
  paybackPeriodMonths: number
  /** Individual expansion projects */
  expansionProjects: {
    id: string
    name: string
    region: string
    cluster: string
    status: "signed" | "construction" | "permit" | "opening"
    startDate: string
    targetOpenDate: string
    leaseCostSqm: number
    capEx: number
    milestone: string
    daysDelayed: number
  }[]

  // Store Daily Operations (Tier 5)
  /** Today's revenue target for the "sample" store view */
  storeDailyTarget: number
  /** Today's revenue actual */
  storeDailyActual: number
  /** Hourly revenue data for today */
  hourlyRevenue: { hour: number; actual: number; target: number }[]
  /** Current staff on floor */
  staffOnFloor: number
  /** Scheduled staff for this shift */
  staffScheduled: number
  /** Low stock alerts (SKU level) */
  lowStockAlerts: { sku: string; currentQty: number; minQty: number; urgency: "critical" | "warn" }[]
  /** Today's task checklist */
  taskChecklist: { task: string; status: "done" | "pending" | "overdue"; owner: string }[]
  /** Customer complaints today */
  customerComplaints: { category: string; count: number; status: "new" | "resolved" }[]

  // Food Safety standalone (Tier 4b)
  /** Per-store audit history sample */
  auditHistory: {
    storeId: string
    storeName: string
    lastAuditDate: string
    score: number
    status: "pass" | "fail" | "pending"
    findings: string[]
    correctiveActions: { action: string; dueDate: string; owner: string; status: "open" | "closed" }[]
  }[]
  /** Near-miss incident log */
  nearMissLog: { storeId: string; storeName: string; description: string; time: string; category: string; status: "open" | "closed" }[]

  // Alerts
  alerts: { level: "critical" | "warn" | "info"; msg: string; time: string; tag: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n: number): string =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
    ? `${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
    ? `${(n / 1e3).toFixed(0)}K`
    : String(n)

export const fmtVnd = (n: number): string =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)} tỷ`
    : n >= 1e6
    ? `${(n / 1e6).toFixed(0)}tr`
    : `${n.toLocaleString("vi")}đ`
