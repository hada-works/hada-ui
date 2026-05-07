import { Activity, AlertTriangle, Store, Zap, ShieldCheck, Star, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Trend, Status, DrillRow } from "../shared/types"
import { fmt, fmtVnd } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { KpiCard, Section, MiniBar, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

export function OperationsView({ d, onDrill, activeDrill }: Props) {
  const opsAlerts = d.alerts.filter(a => a.tag === "Operations")

  const kpis: { kpi: Parameters<typeof KpiCard>[0]["kpi"]; content: DrillContent }[] = [
    {
      kpi: {
        label: "Stores hoạt động", value: `${d.storesOp}/${d.storesTotal}`,
        trend: (d.storesOp < d.storesTotal ? "down" : "flat") as Trend,
        trendLabel: d.storesOp < d.storesTotal ? `${d.storesTotal - d.storesOp} tạm dừng` : "100% online",
        status: (d.storesOp === d.storesTotal ? "good" : d.storesTotal - d.storesOp <= 2 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Store Availability", value: `${d.storesOp}/${d.storesTotal}`,
        status: (d.storesOp === d.storesTotal ? "good" : d.storesTotal - d.storesOp <= 2 ? "warn" : "bad") as Status,
        rows: [
          { label: "Sự cố điện / hạ tầng", value: "1 store", status: "bad" as Status, sub: "Dự kiến phục hồi 14:00" },
          { label: "Vi phạm ATTP",          value: "1 store", status: "bad" as Status, sub: "Đang re-audit" },
          { label: "Bảo trì định kỳ",       value: "0 store", status: "good" as Status },
          { label: "POS uptime fleet",      value: `${d.posUptime}%`, sub: "target >99.5%", status: (d.posUptime >= 99.5 ? "good" : "warn") as Status },
          { label: "CCTV coverage",         value: `${d.cctvCoverage}%`, sub: `${Math.round((100 - d.cctvCoverage) / 100 * d.storeCount * 4)} camera offline`, status: (d.cctvCoverage >= 98 ? "good" : "warn") as Status },
          { label: "Avg uptime rolling 30d", value: "99.3%", sub: "SLA target 99%", status: "good" as Status },
        ] as DrillRow[],
        note: "Tại 1,000 stores: mỗi 1% uptime loss = ~10 stores không vận hành = ~130tr/ngày lost rev.",
        sections: [{
          label: "SLA thresholds",
          rows: [
            { label: "P0 — store đóng cửa",        value: "Resolve <4h",   status: "bad" as Status },
            { label: "P1 — POS offline >30 phút",  value: "Resolve <2h",   status: "warn" as Status },
            { label: "P2 — CCTV offline",           value: "Resolve <24h",  status: "neutral" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Traffic & Conversion", value: fmt(d.trafficCount),
        trendLabel: `Conversion ${d.trafficConversion}%`,
        trend: (d.trafficConversionVsLY > 0 ? "up" : "down") as Trend,
        sub: `+${d.trafficConversionVsLY} pp vs LY`,
        status: "good" as Status,
      },
      content: {
        title: "Traffic & Conversion", value: fmt(d.trafficCount),
        status: "good" as Status,
        rows: [
          { label: "Conversion rate",        value: `${d.trafficConversion}%`, sub: `+${d.trafficConversionVsLY} pp vs LY`, status: "good" as Status },
          { label: "Transaction/store/ngày", value: fmt(d.txnPerStore),        sub: "Actual transactions", status: "neutral" as Status },
          { label: "Giờ cao điểm (11h–13h)", value: "28.4% traffic",  status: "neutral" as Status },
          { label: "Giờ cao điểm (17h–20h)", value: "34.1% traffic",  status: "neutral" as Status },
          { label: "Conversion thấp nhất",   value: "Miền Bắc 18.2%", status: "warn" as Status, sub: "Cần staffing review" },
          { label: "HCM (cao nhất)",         value: "23.1%", status: "good" as Status },
        ] as DrillRow[],
        note: "Traffic từ hệ thống camera AI đếm khách. Conversion = giao dịch / lượt vào cửa hàng.",
        sections: [{
          label: "Conversion drivers",
          rows: [
            { label: "OOS ảnh hưởng conversion",  value: "-1.2pp est.", sub: "Correlation với OOS 3.8%", status: "warn" as Status },
            { label: "Promo active hôm nay",       value: "14 campaigns", sub: "+0.8pp lift TB", status: "good" as Status },
            { label: "Queue time avg",             value: "2.8 phút",   sub: "Target <3 phút", status: "good" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Avg basket size", value: fmtVnd(d.avgBasket),
        trend: (d.avgBasketVsLY > 0 ? "up" : "down") as Trend,
        trendLabel: `+${d.avgBasketVsLY}% vs LY`,
        status: (d.avgBasketVsLY >= 5 ? "good" : d.avgBasketVsLY >= 0 ? "warn" : "bad") as Status,
        sub: `Txn/store/ngày: ${fmt(d.txnPerStore)}`,
      },
      content: {
        title: "Avg Basket & Transaction Mix", value: fmtVnd(d.avgBasket),
        status: (d.avgBasketVsLY >= 5 ? "good" : d.avgBasketVsLY >= 0 ? "warn" : "bad") as Status,
        rows: [
          { label: "Avg basket hiện tại",     value: fmtVnd(d.avgBasket),  sub: `+${d.avgBasketVsLY}% vs LY`, status: "good" as Status },
          { label: "Txn/store/ngày",          value: fmt(d.txnPerStore),   sub: "Tổng giao dịch / số stores / ngày", status: "neutral" as Status },
          { label: "Basket <50K (impulse)",   value: "28.4%",  sub: "Single item hoặc snack", status: "neutral" as Status },
          { label: "Basket 50K–200K (core)",  value: "48.2%",  sub: "Grocery run chính", status: "good" as Status },
          { label: "Basket >200K (mission)",  value: "23.4%",  sub: "Weekly top-up — loyalty cao", status: "good" as Status },
          { label: "Electronic payment mix",  value: `${d.electronicPaymentPct}%`, sub: "QR + card", status: (d.electronicPaymentPct >= 60 ? "good" : "warn") as Status },
        ] as DrillRow[],
        note: "Avg basket tăng chủ yếu nhờ category upsell và bundle promo. Target cuối năm: 275K (+5.8% vs hiện tại).",
        sections: [{
          label: "Basket by region",
          rows: d.regions.map(r => ({
            label: r.name,
            value: fmtVnd(Math.round(d.avgBasket * (0.88 + r.revVsPlan * 0.015))),
            status: "neutral" as Status,
          })),
        }],
      },
    },
    {
      kpi: {
        label: "CSAT", value: `${d.csatScore}/5`,
        trend: (d.csatVsPrev > 0 ? "up" : d.csatVsPrev < 0 ? "down" : "flat") as Trend,
        trendLabel: `${d.csatVsPrev >= 0 ? "+" : ""}${d.csatVsPrev} vs kỳ trước`,
        status: (d.csatScore >= 4.3 ? "good" : d.csatScore >= 4.0 ? "warn" : "bad") as Status,
      },
      content: {
        title: "CSAT — Customer Satisfaction", value: `${d.csatScore}/5`,
        status: (d.csatScore >= 4.3 ? "good" : d.csatScore >= 4.0 ? "warn" : "bad") as Status,
        rows: [
          { label: "Chất lượng sản phẩm", value: "4.5/5", status: "good" as Status },
          { label: "Thái độ nhân viên",   value: "4.4/5", status: "good" as Status },
          { label: "Độ sẵn hàng",         value: "3.9/5", sub: "Driver của complaint #1", status: "warn" as Status },
          { label: "Vệ sinh cửa hàng",    value: "4.2/5", status: "good" as Status },
          { label: "Tốc độ thanh toán",   value: "4.1/5", sub: "Queue >3 phút tại 22 stores", status: "warn" as Status },
        ] as DrillRow[],
        note: "~3,200 exit surveys/ngày qua app và QR tại quầy. Response rate 12.4%.",
        sections: [{
          label: "CSAT theo vùng (est.)",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${(d.csatScore + (r.revVsPlan - 2) * 0.05).toFixed(1)}/5`,
            status: (d.csatScore + (r.revVsPlan - 2) * 0.05 >= 4.3 ? "good" : "warn") as Status,
          })),
        }],
      },
    },
    {
      kpi: {
        label: "Mystery shop score", value: `${d.mysterShopScore}/100`,
        trend: (d.mysterShopScore >= 80 ? "up" : "down") as Trend,
        trendLabel: "Target ≥80",
        status: (d.mysterShopScore >= 85 ? "good" : d.mysterShopScore >= 75 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Mystery Shop Score", value: `${d.mysterShopScore}/100`,
        status: (d.mysterShopScore >= 85 ? "good" : d.mysterShopScore >= 75 ? "warn" : "bad") as Status,
        rows: [
          { label: "Chào hỏi khách hàng",     value: "91/100", status: "good" as Status },
          { label: "Tư vấn sản phẩm",         value: "78/100", sub: "Dưới ngưỡng — cần training", status: "warn" as Status },
          { label: "Vệ sinh & trưng bày",     value: "86/100", status: "good" as Status },
          { label: "Xử lý đổi trả",           value: "82/100", status: "good" as Status },
          { label: "Compliance SOP",          value: `${d.compliancePct}/100`, sub: "Target ≥85", status: (d.compliancePct >= 85 ? "good" : "warn") as Status },
          { label: "Lowest scoring region",   value: "Miền Bắc 74", sub: "Cần action plan", status: "bad" as Status },
        ] as DrillRow[],
        note: "Mystery shop 2x/tháng/store. Điểm tổng hợp 5 tiêu chí. Stores <70 điểm: re-audit trong 7 ngày.",
        sections: [{
          label: "Score distribution",
          rows: [
            { label: "≥85 (Excellent)",  value: `${Math.round(d.storeCount * 0.31)} stores`, status: "good" as Status },
            { label: "75–84 (Good)",     value: `${Math.round(d.storeCount * 0.48)} stores`, status: "neutral" as Status },
            { label: "65–74 (Needs work)", value: `${Math.round(d.storeCount * 0.15)} stores`, status: "warn" as Status },
            { label: "<65 (Action req.)", value: `${Math.round(d.storeCount * 0.06)} stores`, sub: "Cần coaching ngay", status: "bad" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Labor cost % rev", value: `${d.laborCostPct}%`,
        trend: (d.laborCostPct <= d.laborTarget ? "flat" : "down") as Trend,
        trendLabel: `Target ${d.laborTarget}%`,
        status: (d.laborCostPct <= d.laborTarget ? "good" : d.laborCostPct <= d.laborTarget + 0.5 ? "warn" : "bad") as Status,
        alert: d.laborCostPct > d.laborTarget ? `⚠ Vượt ${(d.laborCostPct - d.laborTarget).toFixed(1)} pp` : undefined,
      },
      content: {
        title: "Labor Cost % Revenue", value: `${d.laborCostPct}%`,
        status: (d.laborCostPct <= d.laborTarget ? "good" : d.laborCostPct <= d.laborTarget + 0.5 ? "warn" : "bad") as Status,
        rows: [
          { label: "Store staff / store TB", value: "13.0 FTE",  sub: "vs plan 12.8 FTE", status: "warn" as Status },
          { label: "Overtime rate",          value: "8.4%",       sub: "target <7% — cần schedule tối ưu", status: "warn" as Status },
          { label: "Miền Bắc (cao nhất)",    value: `${d.regions[2].laborPct}% rev`, sub: "Fleet avg: 14.2%", status: "bad" as Status },
          { label: "Scheduling efficiency",  value: "84%",        sub: "% giờ productive vs total shift", status: "warn" as Status },
          { label: "Turnover YTD",           value: "38%",        sub: "annualized · benchmark 45%", status: "good" as Status },
          { label: "Avg wage/FTE/tháng",     value: "~6.8tr",     sub: "Bao gồm BHXH", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Mỗi +0.1pp labor cost = -~90tr/ngày EBITDA ở 318 stores. Cần workforce management tool khi >500 stores.",
        sections: [{
          label: "Labor cost theo vùng",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${r.laborPct}%`,
            status: (r.laborPct <= 14.0 ? "good" : r.laborPct <= 14.5 ? "warn" : "bad") as Status,
            sub: r.laborPct > 14.5 ? "Above target — cần review" : undefined,
          })),
        }],
      },
    },
    {
      kpi: {
        label: "Staffing Coverage", value: `${d.staffingCoverage}%`,
        trend: (d.staffingCoverage >= 96 ? "up" : "down") as Trend,
        trendLabel: `Target ≥96%`,
        status: (d.staffingCoverage >= 96 ? "good" : d.staffingCoverage >= 92 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Staffing Coverage", value: `${d.staffingCoverage}%`,
        status: (d.staffingCoverage >= 96 ? "good" : d.staffingCoverage >= 92 ? "warn" : "bad") as Status,
        rows: [
          { label: "Coverage hiện tại", value: `${d.staffingCoverage}%`, status: (d.staffingCoverage >= 96 ? "good" : d.staffingCoverage >= 92 ? "warn" : "bad") as Status },
          { label: "Target", value: "≥96%", status: "good" as Status },
          { label: "Stores thiếu staff", value: `${Math.round((100 - d.staffingCoverage) / 100 * d.storesOp)} stores`, status: (d.staffingCoverage >= 96 ? "good" : d.staffingCoverage >= 92 ? "warn" : "bad") as Status },
          { label: "Tác động est.", value: `~${Math.round((100 - d.staffingCoverage) / 100 * d.storesOp * 2)}tr lost rev`, status: "warn" as Status },
        ] as DrillRow[],
        sections: [{
          label: "Staffing gaps by region",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${r.stores} stores`,
            sub: r.laborPct > 14.0 ? `Labor ${r.laborPct}% — over target` : `Labor ${r.laborPct}% — OK`,
            status: (r.laborPct <= 14.0 ? "good" : r.laborPct <= 14.5 ? "warn" : "bad") as Status,
          })),
        }, {
          label: "Hành động",
          rows: d.staffingCoverage < 96 ? [
            { label: "Priority", value: "Review shift schedule ngay hôm nay", status: "warn" as Status },
            { label: "Escalate", value: "Notify Area Manager về stores thiếu staff", status: "warn" as Status },
          ] : [
            { label: "Trạng thái", value: "Coverage đạt target — tiếp tục theo dõi", status: "good" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Shrinkage rate", value: `${d.shrinkagePct}%`,
        trend: (d.shrinkageVsBudget <= 0 ? "up" : "down") as Trend,
        trendLabel: `${d.shrinkageVsBudget >= 0 ? "+" : ""}${d.shrinkageVsBudget} pp vs budget`,
        status: (d.shrinkageVsBudget <= 0 ? "good" : d.shrinkageVsBudget <= 0.05 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Shrinkage Rate", value: `${d.shrinkagePct}%`,
        status: (d.shrinkageVsBudget <= 0 ? "good" : d.shrinkageVsBudget <= 0.05 ? "warn" : "bad") as Status,
        rows: [
          { label: "Theft (shoplifting)",     value: "0.21%", sub: "vs budget 0.18%", status: "warn" as Status },
          { label: "Admin error / miss-scan", value: "0.18%", sub: "vs budget 0.16%", status: "warn" as Status },
          { label: "Expiry waste",            value: "0.09%", sub: "on budget", status: "good" as Status },
          { label: "Vendor fraud",            value: "0.04%", sub: "under investigation", status: "warn" as Status },
          { label: "Miền Bắc (cao nhất)",     value: `${d.regions[2].shrinkage}%`, sub: `gấp ${(d.regions[2].shrinkage / d.shrinkagePct).toFixed(1)}x fleet avg`, status: "bad" as Status },
        ] as DrillRow[],
        note: "Shrinkage >0.05pp vs budget → P1 alert. Miền Bắc cần CCTV audit và cycle count hàng tuần.",
        sections: [{
          label: "Shrinkage theo vùng",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${r.shrinkage}%`,
            status: (r.shrinkage <= 0.5 ? "good" : r.shrinkage <= 0.65 ? "warn" : "bad") as Status,
          })),
        }, {
          label: "Loss prevention actions",
          rows: [
            { label: "CCTV coverage",      value: "97.4%",   sub: "Target 100%", status: "warn" as Status },
            { label: "Cycle count weekly", value: "68 stores", sub: "ABC hàng A items", status: "neutral" as Status },
            { label: "EAS gates installed", value: "41%",    sub: "Cần rollout thêm", status: "warn" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Food safety audit pass", value: `${d.foodSafetyPass}%`,
        trend: (d.foodSafetyPass >= 95 ? "up" : "down") as Trend,
        trendLabel: "Target ≥95%",
        status: (d.foodSafetyPass >= 95 ? "good" : d.foodSafetyPass >= 90 ? "warn" : "bad") as Status,
        alert: d.foodSafetyPass < 95 ? "⚠ Dưới ngưỡng" : undefined,
      },
      content: {
        title: "Food Safety & Compliance", value: `${d.foodSafetyPass}%`,
        status: (d.foodSafetyPass >= 95 ? "good" : d.foodSafetyPass >= 90 ? "warn" : "bad") as Status,
        rows: [
          {
            label: "Audit pass rate",
            value: `${d.foodSafetyPass}%`,
            status: (d.foodSafetyPass >= 95 ? "good" : d.foodSafetyPass >= 90 ? "warn" : "bad") as Status,
          },
          {
            label: "Temp log compliance",
            value: `${d.tempLogCompliance}%`,
            status: (d.tempLogCompliance >= 98 ? "good" : d.tempLogCompliance >= 95 ? "warn" : "bad") as Status,
          },
          {
            label: "Expiry waste",
            value: `${d.expiryWastePct}%`,
            status: (d.expiryWastePct <= 0.1 ? "good" : d.expiryWastePct <= 0.15 ? "warn" : "bad") as Status,
          },
          {
            label: "Near-miss incidents",
            value: `${d.nearMissCount}`,
            status: (d.nearMissCount === 0 ? "good" : d.nearMissCount <= 3 ? "warn" : "bad") as Status,
          },
          {
            label: "Corrective actions pending",
            value: `${d.correctiveActionsPending}`,
            status: (d.correctiveActionsPending <= 10 ? "good" : d.correctiveActionsPending <= 25 ? "warn" : "bad") as Status,
          },
        ] as DrillRow[],
        note: "Internal audit 2 lần/tháng. Stores fail bị tạm ngừng đến khi pass re-audit trong 48h.",
        sections: [{
          label: "Hành động",
          rows: [
            ...(d.nearMissCount > 0 ? [{
              label: "Near-miss review",
              value: `${d.nearMissCount} incidents cần báo cáo trong 24h`,
              status: "warn" as Status,
            }] : []),
            ...(d.correctiveActionsPending > 20 ? [{
              label: "Corrective actions",
              value: `${d.correctiveActionsPending} pending — escalate AM`,
              status: "bad" as Status,
            }] : []),
            ...(d.tempLogCompliance < 98 ? [{
              label: "Temp logging",
              value: `${d.tempLogCompliance}% — kiểm tra thiết bị`,
              status: "warn" as Status,
            }] : []),
            ...(d.expiryWastePct > 0.1 ? [{
              label: "Expiry waste",
              value: `${d.expiryWastePct}% — review ordering process`,
              status: "warn" as Status,
            }] : []),
          ],
        }],
      },
    },
    {
      kpi: {
        label: "SOP Compliance", value: `${d.compliancePct}%`,
        trend: (d.compliancePct >= 90 ? "up" : "down") as Trend,
        trendLabel: "Target ≥90%",
        status: (d.compliancePct >= 90 ? "good" : d.compliancePct >= 80 ? "warn" : "bad") as Status,
      },
      content: {
        title: "SOP & Operational Compliance", value: `${d.compliancePct}%`,
        status: (d.compliancePct >= 90 ? "good" : d.compliancePct >= 80 ? "warn" : "bad") as Status,
        rows: [
          { label: "Opening checklist",    value: "94%", status: "good" as Status },
          { label: "Closing checklist",    value: "91%", status: "good" as Status },
          { label: "Price label accuracy", value: "96%", sub: "QR scan check", status: "good" as Status },
          { label: "Stock replenishment",  value: "82%", sub: "target 90% — gap do thiếu hàng", status: "warn" as Status },
          { label: "Cash reconciliation",  value: "99.1%", status: "good" as Status },
          { label: "Staff uniform check",  value: "88%", sub: "Cần reminder system", status: "warn" as Status },
        ] as DrillRow[],
        note: "Compliance audit qua digital checklist app. Tại 1,000 stores cần AI-powered audit để scale.",
        sections: [{
          label: "Compliance theo vùng",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${Math.round(d.compliancePct + (r.healthGreen - 55) * 0.2)}%`,
            status: (Math.round(d.compliancePct + (r.healthGreen - 55) * 0.2) >= 90 ? "good" : "warn") as Status,
          })),
        }],
      },
    },
  ]

  return (
    <div className="space-y-6">
      <Section icon={Activity} label="Chỉ số vận hành fleet" color="bg-[hsl(var(--epic-blue))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map(({ kpi, content }) => (
            <KpiCard
              key={kpi.label}
              kpi={kpi}
              active={activeDrill === kpi.label}
              onClick={() => onDrill({ ...content })}
            />
          ))}
        </div>
      </Section>

      {/* Store health distribution */}
      <Section icon={Store} label="Phân phối Store Health Score" color="bg-[hsl(var(--epic-emerald))]">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-6 mb-4">
              {[
                { pct: d.storeHealthGreen,  label: "Healthy",  emoji: "🟢", color: "text-[hsl(var(--success))]", desc: "Mục tiêu: >65%" },
                { pct: d.storeHealthYellow, label: "At-risk",  emoji: "🟡", color: "text-[hsl(var(--warning))]", desc: "Coaching plan" },
                { pct: d.storeHealthRed,    label: "Critical", emoji: "🔴", color: "text-destructive",           desc: "Mục tiêu: <8%" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-3xl font-bold tabular-nums", s.color)}>{s.pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.emoji} {s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{Math.round(d.storeCount * s.pct / 100)} stores</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 opacity-70">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex h-2.5 w-full rounded-full overflow-hidden">
              <div className="bg-[hsl(var(--success))] rounded-l-full" style={{ width: `${d.storeHealthGreen}%` }} />
              <div className="bg-[hsl(var(--warning))]"               style={{ width: `${d.storeHealthYellow}%` }} />
              <div className="bg-destructive rounded-r-full"          style={{ width: `${d.storeHealthRed}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              {"Composite: Revenue attainment (40%) + OOS rate (25%) + Compliance (20%) + Shrinkage (15%). Mục tiêu: Green >65%, Red <8%"}
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* New store ramp */}
      <Section icon={Zap} label="New store ramp performance" color="bg-[hsl(var(--epic-amber))]">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-3xl font-bold tabular-nums">{d.newStoreRampPct}%</p>
                <p className="text-sm text-muted-foreground mt-0.5">New stores đang đạt hoặc vượt ramp curve</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full mt-1",
                d.newStoreRampPct >= 75 ? "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]" :
                d.newStoreRampPct >= 60 ? "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]" :
                "bg-destructive/10 text-destructive",
              )}>
                {d.newStoreRampPct >= 75 ? "On track" : d.newStoreRampPct >= 60 ? "Cần theo dõi" : "Dưới kỳ vọng"}
              </span>
            </div>
            <MiniBar value={d.newStoreRampPct} max={100}
              color={d.newStoreRampPct >= 75 ? "bg-[hsl(var(--success))]" : d.newStoreRampPct >= 60 ? "bg-[hsl(var(--warning))]" : "bg-destructive"} />
            <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t text-center">
              {[
                { label: "W1–4 (entry)",   value: "61%", sub: "vs ramp 65%" },
                { label: "W5–8 (build)",   value: "74%", sub: "vs ramp 75%" },
                { label: "W9–12 (mature)", value: "83%", sub: "vs ramp 85%" },
              ].map(w => (
                <div key={w.label}>
                  <p className="text-sm font-semibold tabular-nums">{w.value}</p>
                  <p className="text-[10px] text-muted-foreground">{w.label}</p>
                  <p className="text-[10px] text-muted-foreground">{w.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Mystery shop & compliance summary cards */}
      <Section icon={Star} label="Store quality — Mystery shop & SOP compliance" color="bg-[hsl(var(--epic-purple))]">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Mystery shop score",
              value: `${d.mysterShopScore}/100`,
              sub: d.mysterShopScore >= 80 ? "On target ✓" : "Dưới ngưỡng 80 — training needed",
              color: d.mysterShopScore >= 85 ? "text-[hsl(var(--success))]" :
                     d.mysterShopScore >= 75 ? "text-[hsl(var(--warning))]" : "text-destructive",
              bar: d.mysterShopScore,
              barColor: d.mysterShopScore >= 85 ? "bg-[hsl(var(--success))]" : d.mysterShopScore >= 75 ? "bg-[hsl(var(--warning))]" : "bg-destructive",
            },
            {
              label: "SOP Compliance",
              value: `${d.compliancePct}%`,
              sub: d.compliancePct >= 90 ? "On target ✓" : "Dưới ngưỡng 90% — audit cần thiết",
              color: d.compliancePct >= 90 ? "text-[hsl(var(--success))]" :
                     d.compliancePct >= 80 ? "text-[hsl(var(--warning))]" : "text-destructive",
              bar: d.compliancePct,
              barColor: d.compliancePct >= 90 ? "bg-[hsl(var(--success))]" : d.compliancePct >= 80 ? "bg-[hsl(var(--warning))]" : "bg-destructive",
            },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground mb-1">{c.label}</p>
                <p className={cn("text-2xl font-bold tabular-nums", c.color)}>{c.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 mb-2">{c.sub}</p>
                <MiniBar value={c.bar} max={100} color={c.barColor} />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Alert SLA reference */}
      <Section icon={ShieldCheck} label="Alert SLA — Operational thresholds" color="bg-[hsl(var(--epic-rose))]">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { level: "P0", label: "Store đóng cửa / POS down >1h / ATTP vi phạm",       sla: "Escalate <15 phút · Resolve <4h",  color: "text-destructive", bg: "bg-destructive/[0.04]" },
                { level: "P1", label: "SSS <0% · OOS hàng A >20 SKU · Shrinkage >0.8%",      sla: "Notify DM <1h · Action plan <24h",  color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning-subtle))]" },
                { level: "P2", label: "Labor >target+0.5pp · Compliance <80% · CSAT <4.0",   sla: "Weekly review · Fix trong sprint",   color: "text-[hsl(var(--info-subtle-foreground))]", bg: "bg-[hsl(var(--info-subtle))]" },
              ].map(r => (
                <div key={r.level} className={cn("flex items-center gap-3 px-4 py-3", r.bg)}>
                  <span className={cn("text-[10px] font-bold w-6 shrink-0", r.color)}>{r.level}</span>
                  <p className="flex-1 text-xs text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground shrink-0 text-right">{r.sla}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Area Manager Store Ranking */}
      <Section icon={Users} label="Area Manager — Store Ranking" color="bg-[hsl(var(--epic-violet))]">
        <Card>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="col-span-1">Store</span>
              <span className="col-span-1 text-right">Revenue/ngày</span>
              <span className="col-span-1 text-right">vs Plan</span>
              <span className="col-span-1 text-right">Traffic</span>
              <span className="col-span-1 text-right">Issues</span>
              <span className="col-span-1 text-right">Cluster</span>
            </div>
            <div className="divide-y">
              {d.storeRanking.map(store => {
                const revColor = store.revVsPlan > 5
                  ? "text-[hsl(var(--success))]"
                  : store.revVsPlan > 0
                  ? "text-[hsl(var(--warning))]"
                  : "text-destructive"
                const planColor = store.revVsPlan > 5
                  ? "text-[hsl(var(--success))]"
                  : store.revVsPlan > 0
                  ? "text-[hsl(var(--warning))]"
                  : "text-destructive"
                const storeStatus: Status = store.revVsPlan > 5 ? "good" : store.revVsPlan >= 0 ? "warn" : "bad"
                return (
                  <button
                    key={store.id}
                    className="w-full grid grid-cols-6 gap-2 px-4 py-2.5 text-left hover:bg-muted/20 transition-colors"
                    onClick={() => onDrill({
                      title: store.name,
                      value: `${store.revVsPlan >= 0 ? "+" : ""}${store.revVsPlan}% vs plan`,
                      status: storeStatus,
                      rows: [
                        {
                          label: "Revenue/ngày",
                          value: fmtVnd(store.rev),
                          status: storeStatus,
                        },
                        {
                          label: "Traffic",
                          value: `${store.traffic} visitors`,
                          status: "neutral" as Status,
                        },
                        {
                          label: "Issues",
                          value: `${store.issues}`,
                          status: (store.issues > 0 ? "bad" : "good") as Status,
                        },
                        {
                          label: "Cluster",
                          value: store.cluster,
                          status: "neutral" as Status,
                        },
                      ] as DrillRow[],
                      sections: store.issues > 0 ? [{
                        label: "Hành động",
                        rows: [
                          {
                            label: "Issues cần xử lý",
                            value: store.issues <= 2
                              ? `${store.issues} issue — theo dõi trong ngày`
                              : `${store.issues} issues — escalate Area Manager`,
                            status: (store.issues <= 2 ? "warn" : "bad") as Status,
                          },
                        ],
                      }] : undefined,
                    })}
                  >
                    <div className="col-span-1 min-w-0">
                      <p className="text-xs font-medium truncate">{store.name}</p>
                      <p className="text-[10px] text-muted-foreground">{store.id}</p>
                    </div>
                    <p className={cn("col-span-1 text-xs font-semibold tabular-nums text-right self-center", revColor)}>
                      {fmtVnd(store.rev)}
                    </p>
                    <p className={cn("col-span-1 text-xs font-semibold tabular-nums text-right self-center", planColor)}>
                      {store.revVsPlan >= 0 ? "+" : ""}{store.revVsPlan}%
                    </p>
                    <p className="col-span-1 text-xs tabular-nums text-right self-center text-foreground">
                      {store.traffic}
                    </p>
                    <p className={cn(
                      "col-span-1 text-xs font-semibold tabular-nums text-right self-center",
                      store.issues > 0 ? "text-destructive" : "text-[hsl(var(--success))]",
                    )}>
                      {store.issues}
                    </p>
                    <p className="col-span-1 text-[10px] text-muted-foreground text-right self-center truncate">
                      {store.cluster}
                    </p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Section>

      {opsAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Alerts vận hành" color="bg-destructive">
          <div className="space-y-1.5">
            {opsAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

export default OperationsView
