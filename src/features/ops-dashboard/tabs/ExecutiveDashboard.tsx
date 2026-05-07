import { TrendingUp, AlertTriangle, Building2, Layers, BadgeAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Trend, Status, DrillRow } from "../shared/types"
import { fmtVnd, fmt } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { KpiCard, Section, AlertRow, MiniBar } from "../shared/primitives"

interface Props {
  d: PeriodData
  period: string
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

export function ExecutiveView({ d, period, onDrill, activeDrill }: Props) {
  const criticals = d.alerts.filter(a => a.level === "critical")
  const warns     = d.alerts.filter(a => a.level === "warn")
  const openingLabel = period === "today" ? "hôm nay" : period === "7d" ? "tuần này" : "tháng này"

  const strategicKpis: { kpi: Parameters<typeof KpiCard>[0]["kpi"]; content: DrillContent }[] = [
    {
      kpi: {
        label: "Same-Store Sales (SSS)", value: `+${d.sss}%`,
        trend: (d.sss >= 5 ? "up" : "flat") as Trend,
        trendLabel: "vs. cùng kỳ năm ngoái", sub: "Metric định giá chuỗi #1",
        status: (d.sss >= 5 ? "good" : d.sss >= 2 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Same-Store Sales (SSS)", value: `+${d.sss}%`,
        status: (d.sss >= 5 ? "good" : d.sss >= 2 ? "warn" : "bad") as Status,
        rows: [
          { label: "HCM",        value: `+${d.regions[0].sss}%`, status: (d.regions[0].sss >= 5 ? "good" : "warn") as Status },
          { label: "Hà Nội",     value: `+${d.regions[1].sss}%`, status: (d.regions[1].sss >= 5 ? "good" : "warn") as Status },
          { label: "Miền Bắc",   value: `+${d.regions[2].sss}%`, status: (d.regions[2].sss >= 3 ? "warn" : "bad") as Status },
          { label: "Miền Trung", value: `+${d.regions[3].sss}%`, status: (d.regions[3].sss >= 3 ? "warn" : "bad") as Status },
          { label: "Miền Tây",   value: `+${d.regions[4].sss}%`, status: (d.regions[4].sss >= 5 ? "good" : "warn") as Status },
        ] as DrillRow[],
        note: "SSS chỉ tính stores đã vận hành >12 tháng (Mature cohort). Loại Ramp & Growth stores khỏi baseline để tránh base effect.",
        sections: [{
          label: "Cohort breakdown",
          rows: [
            { label: `Mature (>12 tháng) — ${d.storeCohort.mature} stores`, value: `${(d.storeCohort.mature/d.storeCount*100).toFixed(1)}% fleet`, sub: "Dùng cho SSS baseline", status: "neutral" as Status },
            { label: `Growth (3–12 tháng) — ${d.storeCohort.growth} stores`, value: `${(d.storeCohort.growth/d.storeCount*100).toFixed(1)}% fleet`, sub: "Loại khỏi SSS", status: "neutral" as Status },
            { label: `Ramp (<3 tháng) — ${d.storeCohort.ramp} stores`, value: `${(d.storeCohort.ramp/d.storeCount*100).toFixed(1)}% fleet`, sub: "Loại khỏi SSS — halo effect", status: "neutral" as Status },
          ],
        }, {
          label: "Ngưỡng cảnh báo SSS",
          rows: [
            { label: "Green (on track)",   value: "≥5%",    status: "good" as Status },
            { label: "Amber (watch)",      value: "2–4.9%", status: "warn" as Status },
            { label: "Red (intervention)", value: "<2%",    status: "bad" as Status, sub: "P0 alert nếu <0% trong 3 ngày liên tiếp" },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Doanh thu tổng chuỗi", value: fmtVnd(d.totalRevenue),
        trend: (d.revVsPlan >= 0 ? "up" : "down") as Trend,
        trendLabel: `${d.revVsPlan > 0 ? "+" : ""}${d.revVsPlan}% vs plan`,
        sub: `+${d.revVsLY}% vs cùng kỳ năm ngoái`,
        status: (d.revVsPlan >= 0 ? "good" : "bad") as Status,
      },
      content: {
        title: "Doanh thu tổng chuỗi", value: fmtVnd(d.totalRevenue),
        status: (d.revVsPlan >= 0 ? "good" : "bad") as Status,
        rows: [
          { label: "Offline (in-store)", value: fmtVnd(d.totalRevenue * 0.815), sub: "81.5% mix", status: "neutral" as Status },
          { label: "Online / delivery",  value: fmtVnd(d.totalRevenue * 0.185), sub: "18.5% mix · +6.1% vs plan", status: "good" as Status },
          { label: "Rev/store/ngày TB",  value: fmtVnd(Math.round(d.totalRevenue / d.storeCount)), status: "neutral" as Status },
          { label: "Rev/sqm",            value: fmtVnd(d.revPerSqm), sub: `+${d.revPerSqmVsLY}% vs LY`, status: (d.revPerSqmVsLY > 0 ? "good" : "warn") as Status },
        ] as DrillRow[],
        note: "Revenue/sqm: tổng mặt sàn kinh doanh ~585,000 m² toàn fleet.",
        sections: [{
          label: "Chuỗi đến 1,000 stores — Signal metrics",
          rows: [
            { label: "Avg revenue/store/ngày", value: fmtVnd(Math.round(d.totalRevenue / d.storeCount)), sub: "Thay thế total rev làm signal chính", status: "neutral" as Status },
            { label: "Revenue cohort Mature",  value: `${fmtVnd(Math.round(d.totalRevenue * 0.758))}`, sub: "241 stores · baseline SSS", status: "neutral" as Status },
            { label: "Revenue cohort Ramp",    value: `${fmtVnd(Math.round(d.totalRevenue * 0.078))}`, sub: "25 stores · loại khỏi SSS", status: "neutral" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "EBITDA margin", value: `${d.ebitdaPct}%`,
        trend: (d.ebitdaVsBudget >= 0 ? "up" : "down") as Trend,
        trendLabel: `${d.ebitdaVsBudget >= 0 ? "+" : ""}${d.ebitdaVsBudget} pp vs budget`,
        status: (d.ebitdaVsBudget >= 0 ? "good" : "bad") as Status,
      },
      content: {
        title: "EBITDA Margin", value: `${d.ebitdaPct}%`,
        status: (d.ebitdaVsBudget >= 0 ? "good" : "bad") as Status,
        rows: [
          { label: "Gross Margin",      value: `${d.gmPct}%`,        sub: `${d.gmVsBudget >= 0 ? "+" : ""}${d.gmVsBudget} pp vs budget`, status: (d.gmVsBudget >= 0 ? "good" : "warn") as Status },
          { label: "Labor cost % rev",  value: `${d.laborCostPct}%`, sub: `Target ${d.laborTarget}%`, status: (d.laborCostPct <= d.laborTarget ? "good" : "warn") as Status },
          { label: "Shrinkage",         value: `${d.shrinkagePct}%`, sub: `+${d.shrinkageVsBudget} pp vs budget`, status: (d.shrinkageVsBudget > 0.05 ? "bad" : "warn") as Status },
          { label: "Rental cost % rev", value: "8.2%", sub: "vs budget 8.0%", status: "warn" as Status },
          { label: "Utilities % rev",   value: "1.8%", sub: "vs budget 1.9% — tiết kiệm", status: "good" as Status },
          { label: "D&A % rev",         value: "2.1%", sub: "on budget", status: "neutral" as Status },
        ] as DrillRow[],
        note: "EBITDA = GM – Labor – Rental – Utilities – D&A. Chưa tính non-recurring items.",
        sections: [{
          label: "EBITDA sensitivity (1,000 stores)",
          rows: [
            { label: "+0.1pp OOS reduction",   value: "+~0.08pp EBITDA", sub: "Do recovered lost sales", status: "good" as Status },
            { label: "+0.1pp Shrinkage",        value: "-~0.1pp EBITDA",  sub: "Direct P&L hit", status: "bad" as Status },
            { label: "Labor +1 FTE/store",      value: "-~0.3pp EBITDA",  sub: "Tác động lớn ở scale lớn", status: "bad" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "NPS", value: String(d.nps),
        trend: (d.npsVsPrev > 0 ? "up" : d.npsVsPrev < 0 ? "down" : "flat") as Trend,
        trendLabel: `${d.npsVsPrev >= 0 ? "+" : ""}${d.npsVsPrev} vs kỳ trước`,
        status: (d.nps >= 40 ? "good" : d.nps >= 30 ? "warn" : "bad") as Status,
      },
      content: {
        title: "NPS & Customer Experience", value: String(d.nps),
        status: (d.nps >= 40 ? "good" : d.nps >= 30 ? "warn" : "bad") as Status,
        rows: [
          { label: "CSAT score",       value: `${d.csatScore}/5`, sub: `${d.csatVsPrev >= 0 ? "+" : ""}${d.csatVsPrev} vs kỳ trước`, status: (d.csatScore >= 4.3 ? "good" : "warn") as Status },
          { label: "Promoters (9–10)", value: "54%", status: "good" as Status },
          { label: "Passives (7–8)",   value: "34%", status: "neutral" as Status },
          { label: "Detractors (0–6)", value: "12%", sub: "giảm 1 pp vs kỳ trước", status: "good" as Status },
          { label: "Top complaint #1", value: "Thiếu hàng", sub: "38% feedback tiêu cực", status: "bad" as Status },
          { label: "Top complaint #2", value: "Chờ thanh toán lâu", sub: "21% feedback tiêu cực", status: "warn" as Status },
          { label: "Response rate",    value: "12.4%",  sub: "~3,200 responses/ngày", status: "neutral" as Status },
        ] as DrillRow[],
        note: "NPS từ exit survey tại POS + app feedback. Sample size đủ lớn ở 318 stores (≥10 resp/store/ngày).",
        sections: [{
          label: "NPS theo vùng",
          rows: d.regions.map(r => ({
            label: r.name,
            value: String(Math.round(d.nps + (r.revVsPlan - 2) * 1.5)),
            status: (d.nps + (r.revVsPlan - 2) * 1.5 >= 40 ? "good" : "warn") as Status,
          })),
        }],
      },
    },
  ]

  const expansionKpis: { kpi: Parameters<typeof KpiCard>[0]["kpi"]; content: DrillContent }[] = [
    {
      kpi: {
        label: "Rev/sqm", value: fmtVnd(d.revPerSqm),
        trend: (d.revPerSqmVsLY > 0 ? "up" : "down") as Trend,
        trendLabel: `+${d.revPerSqmVsLY}% vs LY`,
        status: (d.revPerSqmVsLY >= 3 ? "good" : d.revPerSqmVsLY >= 0 ? "warn" : "bad") as Status,
        sub: "Toàn fleet ~585K m²",
      },
      content: {
        title: "Revenue per Sqm", value: fmtVnd(d.revPerSqm),
        status: (d.revPerSqmVsLY >= 3 ? "good" : d.revPerSqmVsLY >= 0 ? "warn" : "bad") as Status,
        rows: [
          { label: "Rev/sqm hiện tại",        value: fmtVnd(d.revPerSqm), sub: `+${d.revPerSqmVsLY}% vs LY`, status: "good" as Status },
          { label: "Tổng mặt sàn fleet",      value: "~585,000 m²",        sub: "TB 1,840 m²/store", status: "neutral" as Status },
          { label: "HCM (cao nhất)",          value: fmtVnd(Math.round(d.revPerSqm * 1.18)), sub: "mặt bằng A+", status: "good" as Status },
          { label: "Miền Bắc (thấp nhất)",    value: fmtVnd(Math.round(d.revPerSqm * 0.76)), sub: "cần format review", status: "warn" as Status },
          { label: "Target cuối năm",         value: fmtVnd(Math.round(d.revPerSqm * 1.08)), sub: "+8% vs LY", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Rev/sqm là metric định giá mặt bằng. Dưới 7M/sqm/ngày → cân nhắc renegotiate hoặc đóng cửa hàng.",
        sections: [{
          label: "Rev/sqm theo format cửa hàng",
          rows: [
            { label: "Format S (<600 m²)",   value: fmtVnd(Math.round(d.revPerSqm * 1.31)), sub: "Compact, high density", status: "good" as Status },
            { label: "Format M (600–1,200)", value: fmtVnd(Math.round(d.revPerSqm * 1.04)), sub: "Standard — majority fleet", status: "good" as Status },
            { label: "Format L (>1,200 m²)", value: fmtVnd(Math.round(d.revPerSqm * 0.82)), sub: "Lower density — grocery anchor", status: "warn" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Cửa hàng vận hành", value: String(d.storeCount),
        trendLabel: `${d.storeOpening} khai trương ${openingLabel}`,
        trend: "flat" as Trend, status: "neutral" as Status,
      },
      content: {
        title: "Store Count & Maturity", value: String(d.storeCount),
        status: "neutral" as Status,
        rows: [
          { label: "Đang vận hành",        value: `${d.storesOp} stores`,               status: (d.storesOp < d.storesTotal ? "warn" : "good") as Status },
          { label: "Tạm ngừng",            value: `${d.storesTotal - d.storesOp} stores`, sub: "điện / ATTP", status: (d.storesTotal - d.storesOp > 0 ? "warn" : "good") as Status },
          { label: "Mature (>12 tháng)",  value: `${d.storeCohort.mature} stores`, sub: `${(d.storeCohort.mature/d.storeCount*100).toFixed(1)}% fleet — dùng cho SSS`, status: "neutral" as Status },
          { label: "Growth (3–12 tháng)", value: `${d.storeCohort.growth} stores`, sub: `${(d.storeCohort.growth/d.storeCount*100).toFixed(1)}% fleet`, status: "neutral" as Status },
          { label: "Ramp (<3 tháng)",     value: `${d.storeCohort.ramp} stores`,  sub: `${(d.storeCohort.ramp/d.storeCount*100).toFixed(1)}% fleet — loại khỏi SSS`, status: "neutral" as Status },
        ] as DrillRow[],
        note: "Mature stores loại khỏi SSS baseline trong 12 tháng đầu để tránh halo effect.",
        sections: [{
          label: "Store density vs competitors",
          rows: [
            { label: "Stores/triệu dân — HCM",  value: "16.0", sub: "128 stores / 8M dân — cao", status: "good" as Status },
            { label: "Stores/triệu dân — HN",   value: "10.5", sub: "84 stores / 8M dân — còn dư địa", status: "warn" as Status },
            { label: "White space estimate",     value: "~340 sites", sub: "Đến 2026 tại tier-2 cities", status: "neutral" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Pipeline sắp mở", value: String(d.storePipeline),
        sub: "Đã ký / đang thi công / chờ permit",
        status: (d.storePipeline >= 50 ? "good" : "warn") as Status,
      },
      content: {
        title: "Store Pipeline", value: String(d.storePipeline),
        status: (d.storePipeline >= 50 ? "good" : "warn") as Status,
        rows: [
          { label: "Đã ký hợp đồng",       value: `${d.storePipelineBreak.signed} sites`,       status: "good" as Status },
          { label: "Đang thi công",         value: `${d.storePipelineBreak.construction} sites`, status: "neutral" as Status },
          { label: "Chờ permit/phê duyệt",  value: `${d.storePipelineBreak.permit} sites`,       status: "warn" as Status },
          { label: "Avg time-to-open",      value: "74 ngày",  sub: "target 60 ngày (+14 vs target)", status: "warn" as Status },
          { label: "CapEx / store TB",      value: "1.8 tỷ",   sub: "vs budget 1.6 tỷ (+12.5%)", status: "warn" as Status },
          { label: "CapEx payback TB",      value: "~18 tháng", sub: "tại store đạt ramp target", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Time-to-open tính từ ngày ký HĐ thuê mặt bằng đến ngày khai trương. Bottleneck hiện tại: permit (13 sites).",
        sections: [{
          label: "Pipeline theo vùng",
          rows: [
            { label: "HCM",        value: "18 sites", sub: "Đang thi công chủ yếu", status: "neutral" as Status },
            { label: "Hà Nội",     value: "22 sites", sub: "Mix: ký + thi công", status: "neutral" as Status },
            { label: "Miền Bắc",   value: "14 sites", sub: "7 sites chờ permit", status: "warn" as Status },
            { label: "Miền Trung", value: "10 sites", status: "neutral" as Status },
            { label: "Miền Tây",   value: "8 sites",  status: "neutral" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Cash on hand", value: fmtVnd(d.cashOnHand),
        status: (d.cashOnHand >= 30e9 ? "good" : "warn") as Status,
        sub: "Tiền mặt + tài khoản NH",
      },
      content: {
        title: "Liquidity & Working Capital", value: fmtVnd(d.cashOnHand),
        status: (d.cashOnHand >= 30e9 ? "good" : "warn") as Status,
        rows: [
          { label: "Tiền mặt tại cửa hàng",      value: "4.2 tỷ",            sub: "~13tr/store/ngày TB", status: "neutral" as Status },
          { label: "Tài khoản ngân hàng",         value: "37.8 tỷ",           status: "neutral" as Status },
          { label: "AP overdue",                  value: fmtVnd(d.apOverdue), sub: "4 NCC đang hold đơn mới → OOS risk", status: "bad" as Status },
          { label: "AP sắp đến hạn (7 ngày)",    value: "12.4 tỷ",           status: "warn" as Status },
          { label: "Runway hiện tại",             value: "~18 ngày",          sub: "tại tốc độ chi tiêu hiện tại", status: "good" as Status },
          { label: "DIO (Days Inventory)",        value: `${d.dioDays} ngày`, sub: "Target 14–18 ngày", status: (d.dioDays <= 18 ? "good" : "warn") as Status },
          { label: "Electronic payment mix",      value: `${d.electronicPaymentPct}%`, sub: "QR + card — giảm cash risk", status: (d.electronicPaymentPct >= 60 ? "good" : "warn") as Status },
        ] as DrillRow[],
        note: "AP overdue ảnh hưởng trực tiếp đến supplier fill rate — cần thanh toán ưu tiên.",
        sections: [{
          label: "Cash management at 1,000 stores",
          rows: [
            { label: "Daily cash float/store",    value: "~13tr",  sub: "Cần armored car daily pick-up", status: "neutral" as Status },
            { label: "Total daily cash exposure", value: "~13 tỷ", sub: "Security risk nếu không có quy trình", status: "warn" as Status },
            { label: "Target e-payment mix",      value: "≥70%",   sub: `Hiện ${d.electronicPaymentPct}% — cần push QR`, status: (d.electronicPaymentPct >= 70 ? "good" : "warn") as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Nhân sự toàn chuỗi", value: fmt(d.headcount),
        trend: (d.headcountVsPlan < 0 ? "down" : "up") as Trend,
        trendLabel: `${d.headcountVsPlan}% vs HC plan`,
        status: (Math.abs(d.headcountVsPlan) <= 2 ? "good" : "warn") as Status,
      },
      content: {
        title: "Headcount & People", value: fmt(d.headcount),
        status: (Math.abs(d.headcountVsPlan) <= 2 ? "good" : "warn") as Status,
        rows: [
          { label: "Store staff",          value: "4,140", sub: "87% HC · -1.8% vs plan", status: "warn" as Status },
          { label: "DC / Logistics",       value: "420",   sub: "8.7% HC · on plan", status: "good" as Status },
          { label: "Head office",          value: "260",   sub: "5.4% HC · +2.1% vs plan", status: "warn" as Status },
          { label: "Turnover rate/tháng",  value: "3.8%",  sub: "Benchmark ngành: 4.5% — tốt", status: "good" as Status },
          { label: "Attendance hôm nay",   value: `${d.storesOp > 315 ? "96.2" : "95.8"}%`, status: "good" as Status },
          { label: "Cost/FTE/tháng",       value: "~7.2tr", sub: "Bao gồm BHXH, phụ cấp", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Turnover = headcount nghỉ việc / avg HC. Annualized ~45% — nếu lên 1,000 stores cần ~15,000 FTE.",
        sections: [{
          label: "People projection đến 1,000 stores",
          rows: [
            { label: "Store FTE estimate",   value: "~13,000",  sub: "Avg 13 FTE/store", status: "neutral" as Status },
            { label: "DC/Logistics estimate", value: "~1,200",  sub: "3 DCs + linehaul", status: "neutral" as Status },
            { label: "HQ + support estimate", value: "~600",    sub: "Cần build COE functions", status: "neutral" as Status },
            { label: "Annual turnover cost",  value: "~14.4 tỷ", sub: "Ở 40% turnover · 45% FTE × 2tr recruit cost", status: "warn" as Status },
          ],
        }],
      },
    },
  ]

  return (
    <div className="space-y-6">

      {/* Critical alert summary */}
      {(criticals.length > 0 || warns.length > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.04] px-4 py-3">
          <BadgeAlert className="size-4 text-destructive shrink-0" />
          <p className="flex-1 text-xs">
            <span className="font-semibold text-destructive">{criticals.length} vấn đề P0</span>
            {warns.length > 0 && <span className="text-muted-foreground"> · {warns.length} P1</span>}
          </p>
          <p className="text-[11px] text-muted-foreground hidden sm:block truncate max-w-[260px]">
            {criticals[0]?.msg.slice(0, 52)}{criticals.length > 0 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Strategic KPIs */}
      <Section icon={TrendingUp} label="Chỉ số chiến lược" color="bg-[hsl(var(--epic-blue))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {strategicKpis.map(({ kpi, content }) => (
            <KpiCard
              key={kpi.label}
              kpi={kpi}
              active={activeDrill === kpi.label}
              onClick={() => onDrill({ ...content })}
            />
          ))}
        </div>
      </Section>

      {/* Expansion & Finance */}
      <Section icon={Building2} label="Mở rộng & Tài chính" color="bg-[hsl(var(--epic-purple))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {expansionKpis.map(({ kpi, content }) => (
            <KpiCard
              key={kpi.label}
              kpi={kpi}
              active={activeDrill === kpi.label}
              onClick={() => onDrill({ ...content })}
            />
          ))}
        </div>
      </Section>

      {/* Fleet percentile bands */}
      <Section icon={Layers} label="Phân phối hiệu suất fleet — Percentile bands" color="bg-[hsl(var(--epic-emerald))]">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground mb-4">
              {d.storeCount} cửa hàng phân theo hiệu suất doanh thu — thay thế "top N stores" để đánh giá fleet chính xác khi scale lên 1,000 stores
            </p>
            <div className="grid grid-cols-5 gap-3 text-center">
              {[
                { label: "P80–100", tag: "Stars",    pct: d.storeBands.p80, color: "bg-[hsl(var(--success))]",    text: "text-[hsl(var(--success))]" },
                { label: "P60–80",  tag: "Strong",   pct: d.storeBands.p60, color: "bg-[hsl(var(--success))]/50", text: "text-[hsl(var(--success))]" },
                { label: "P40–60",  tag: "Core",     pct: d.storeBands.p40, color: "bg-muted-foreground/30",      text: "text-foreground" },
                { label: "P20–40",  tag: "Under",    pct: d.storeBands.p20, color: "bg-[hsl(var(--warning))]",   text: "text-[hsl(var(--warning))]" },
                { label: "P0–20",   tag: "Critical", pct: d.storeBands.p0,  color: "bg-destructive",              text: "text-destructive" },
              ].map(b => (
                <div key={b.label} className="space-y-1.5">
                  <p className={cn("text-2xl font-bold tabular-nums", b.text)}>{b.pct}%</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground">{b.tag}</p>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className={cn("h-1.5 rounded-full", b.color)} style={{ width: `${Math.min(b.pct * 3.2, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{Math.round(d.storeCount * b.pct / 100)} stores</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{d.storeBands.p0 + d.storeBands.p20}%</span> stores cần intervention (P0–40)
                </span>
                <span className={cn("font-medium", (d.storeBands.p0 + d.storeBands.p20) <= 15 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]")}>
                  Mục tiêu: &lt;15%
                </span>
              </div>
              <MiniBar
                value={d.storeBands.p0 + d.storeBands.p20}
                max={30}
                color={(d.storeBands.p0 + d.storeBands.p20) <= 15 ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--warning))]"}
              />
              <p className="text-[11px] text-muted-foreground mt-2">
                P0–20 (Critical): intervention plan trong 48h · P20–40 (Under): coaching + action plan trong 7 ngày
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* All alerts */}
      <Section icon={AlertTriangle} label="Alerts tổng hợp — tất cả domain" color="bg-destructive">
        <div className="space-y-1.5">
          {d.alerts.map((a, i) => <AlertRow key={i} a={a} />)}
        </div>
      </Section>
    </div>
  )
}

export default ExecutiveView
