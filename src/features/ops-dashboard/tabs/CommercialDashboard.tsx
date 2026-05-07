import { BarChart3, AlertTriangle, Layers, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Trend, Status, DrillRow } from "../shared/types"
import { fmtVnd } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { KpiCard, Section, MiniBar, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

export function CommercialView({ d, onDrill, activeDrill }: Props) {
  const commAlerts = d.alerts.filter(a => a.tag === "Commercial")

  const kpis: { kpi: Parameters<typeof KpiCard>[0]["kpi"]; content: DrillContent }[] = [
    {
      kpi: {
        label: "OOS rate (toàn SKU)", value: `${d.oosPct}%`,
        trend: (d.oosPct <= 3 ? "up" : "down") as Trend,
        trendLabel: `${d.oosAbc} SKU hàng A đang OOS`,
        status: (d.oosPct <= 3 ? "good" : d.oosPct <= 5 ? "warn" : "bad") as Status,
        alert: d.oosAbc > 15 ? `⚠ Lost rev ~${fmtVnd(d.oosAbc * 8_500_000)}/ngày` : undefined,
      },
      content: {
        title: "Out-of-Stock Analysis", value: `${d.oosPct}%`,
        status: (d.oosPct <= 3 ? "good" : d.oosPct <= 5 ? "warn" : "bad") as Status,
        rows: [
          { label: "Hàng A OOS (>80% revenue)", value: `${d.oosAbc} SKU`, sub: `Lost rev ~${fmtVnd(d.oosAbc * 8_500_000)}/ngày`, status: "bad" as Status },
          { label: "Hàng B OOS",                value: "47 SKU",           sub: "ảnh hưởng trung bình", status: "warn" as Status },
          { label: "Hàng C OOS",                value: "198 SKU",          sub: "long-tail, low impact", status: "neutral" as Status },
          { label: "OOS do supplier (fill rate)", value: "62%",            sub: "Nguyên nhân chính", status: "bad" as Status },
          { label: "OOS do forecast sai",         value: "24%",            sub: "Demand planning cần review", status: "warn" as Status },
          { label: "OOS do DC thiếu hàng",        value: "14%",            sub: "DC buffer stock thấp", status: "warn" as Status },
        ] as DrillRow[],
        note: "Lost revenue tính: avg rev/SKU/store/ngày × số stores OOS. Hàng A OOS là P0.",
        sections: [{
          label: "OOS theo vùng",
          rows: d.regions.map(r => ({
            label: r.name,
            value: `${r.oosRate}%`,
            status: (r.oosRate <= 3.5 ? "good" : r.oosRate <= 5 ? "warn" : "bad") as Status,
            sub: r.oosRate > 5 ? "Cần emergency restock" : undefined,
          })),
        }, {
          label: "OOS thresholds (Signal vs Noise)",
          rows: [
            { label: "P0 — Hàng A OOS >15 SKU",   value: "Alert ngay", status: "bad" as Status },
            { label: "P1 — Fleet OOS >5%",          value: "Review trong ngày", status: "warn" as Status },
            { label: "Noise — Hàng C OOS",          value: "Weekly review đủ", status: "neutral" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Gross Margin", value: `${d.gmPct}%`,
        trend: (d.gmVsBudget >= 0 ? "up" : "down") as Trend,
        trendLabel: `${d.gmVsBudget >= 0 ? "+" : ""}${d.gmVsBudget} pp vs budget`,
        status: (d.gmVsBudget >= 0 ? "good" : d.gmVsBudget >= -0.5 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Gross Margin by Category", value: `${d.gmPct}%`,
        status: (d.gmVsBudget >= 0 ? "good" : d.gmVsBudget >= -0.5 ? "warn" : "bad") as Status,
        rows: d.categoryGm.map(c => ({
          label: c.name,
          value: `${c.gm}%`,
          sub: `${c.gmVsBudget >= 0 ? "+" : ""}${c.gmVsBudget} pp vs budget · OOS ${c.oosPct}%`,
          status: (c.gmVsBudget >= 0 ? "good" : c.gmVsBudget >= -0.5 ? "warn" : "bad") as Status,
        })),
        note: "GM theo category sau shrinkage, promo, markdown. Sữa & Bánh cần urgent review.",
        sections: [
          {
            label: "GM levers",
            rows: [
              { label: "Promo GM impact",           value: `${d.promoGmImpact} pp`, sub: "Cần promo ROI review", status: (d.promoGmImpact >= -1 ? "warn" : "bad") as Status },
              { label: "Private label GM premium",  value: "+8.4 pp vs NB", sub: "Mix target 12%", status: "good" as Status },
              { label: "Markdown / clearance loss", value: "~0.3pp",        sub: "Hàng sắp HSD", status: "warn" as Status },
            ],
          },
          ...(d.categoryGm.flatMap(cat => cat.topOosSku).length > 0 ? [{
            label: "Top OOS SKUs",
            rows: d.categoryGm.flatMap(cat =>
              cat.topOosSku.map(sku => ({
                label: sku.sku,
                value: `${sku.stores} stores`,
                sub: `-${fmtVnd(sku.lostRevDay)}/ngày`,
                status: "bad" as Status,
              }))
            ),
          }] : []),
          ...(d.categoryGm.flatMap(cat => cat.regionPerf).length > 0 ? [{
            label: "Hiệu suất theo vùng",
            rows: d.categoryGm.flatMap(cat =>
              cat.regionPerf.map(rp => ({
                label: rp.region,
                value: `GM ${rp.gm}%`,
                sub: `OOS ${rp.oosRate}%`,
                status: (rp.gm >= 25 ? "good" : rp.gm >= 22 ? "warn" : "bad") as Status,
              }))
            ),
          }] : []),
        ],
      },
    },
    {
      kpi: {
        label: "DIO (Inventory days)", value: `${d.dioDays} ngày`,
        trend: (d.dioDays <= 18 ? "up" : "down") as Trend,
        trendLabel: "Target 14–18 ngày",
        status: (d.dioDays <= 18 ? "good" : d.dioDays <= 22 ? "warn" : "bad") as Status,
        alert: d.dioDays > 22 ? "⚠ Tồn kho quá cao — cash flow rủi ro" : undefined,
      },
      content: {
        title: "Days Inventory Outstanding", value: `${d.dioDays} ngày`,
        status: (d.dioDays <= 18 ? "good" : d.dioDays <= 22 ? "warn" : "bad") as Status,
        rows: [
          { label: "DIO hiện tại",        value: `${d.dioDays} ngày`,  sub: "Target 14–18 ngày", status: (d.dioDays <= 18 ? "good" : "warn") as Status },
          { label: "DIO ngành TB",        value: "16.2 ngày",          sub: "Modern trade VN benchmark", status: "neutral" as Status },
          { label: "Tồn ứ đọng (>1.5x DOH)", value: fmtVnd(d.overStockVnd), sub: "Cần flash sale / transfer", status: (d.overStockVnd >= 5e8 ? "warn" : "good") as Status },
          { label: "Hàng sắp HSD <7 ngày", value: fmtVnd(d.nearExpiryVnd), sub: "Markdown 20–30%", status: (d.nearExpiryVnd >= 1e8 ? "warn" : "good") as Status },
          { label: "Working capital tied", value: fmtVnd(d.dioDays * d.totalRevenue / 30), sub: "Tổng vốn kẹt trong hàng tồn", status: "neutral" as Status },
        ] as DrillRow[],
        note: "DIO = (Inventory / COGS) × 30. Mỗi -1 ngày DIO ở 1,000 stores = ~80–100 tỷ tiền mặt giải phóng.",
        sections: [{
          label: "DIO theo category",
          rows: [
            { label: "Tươi sống",       value: "3–5 ngày",  sub: "Cần just-in-time supply", status: "neutral" as Status },
            { label: "FMCG",            value: "18–22 ngày", sub: "Trong target", status: "good" as Status },
            { label: "Hàng theo mùa",   value: "42 ngày",   sub: "Excess — cần clearance plan", status: "bad" as Status },
            { label: "Đông lạnh",       value: "12 ngày",   sub: "Tốt", status: "good" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "Sell-through rate", value: `${d.sellThroughPct}%`,
        trend: (d.sellThroughPct >= 92 ? "up" : "down") as Trend,
        status: (d.sellThroughPct >= 92 ? "good" : d.sellThroughPct >= 88 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Sell-through Rate", value: `${d.sellThroughPct}%`,
        status: (d.sellThroughPct >= 92 ? "good" : d.sellThroughPct >= 88 ? "warn" : "bad") as Status,
        rows: [
          { label: "FMCG",           value: "94.8%", status: "good" as Status },
          { label: "Thực phẩm tươi", value: "87.1%", sub: "Cần markdown sớm hơn 2 ngày", status: "warn" as Status },
          { label: "Đông lạnh",      value: "91.4%", status: "good" as Status },
          { label: "Hàng theo mùa",  value: "79.2%", sub: "Excess stock 3.2 tỷ — clearance plan cần", status: "bad" as Status },
          { label: "Promo items",    value: "96.8%", sub: "Promo hiệu quả", status: "good" as Status },
        ] as DrillRow[],
        note: "Sell-through <88% ở hàng có HSD ngắn → nguy cơ expiry waste và markdown loss.",
      },
    },
    {
      kpi: {
        label: "Promo % doanh thu", value: `${d.promoPctRevenue}%`,
        trendLabel: `GM impact ${d.promoGmImpact} pp`,
        status: (Math.abs(d.promoGmImpact) <= 1 ? "good" : "warn") as Status,
        alert: d.promoGmImpact <= -1.5 ? "⚠ Promo đang ăn mòn GM" : undefined,
      },
      content: {
        title: "Promotion Mix & ROI", value: `${d.promoPctRevenue}%`,
        status: (Math.abs(d.promoGmImpact) <= 1 ? "good" : "warn") as Status,
        rows: [
          { label: "Multi-buy deals",     value: `${(d.promoPctRevenue * 0.38).toFixed(1)}% rev`, sub: "GM impact -0.4 pp — efficient", status: "good" as Status },
          { label: "Price reduction",     value: `${(d.promoPctRevenue * 0.31).toFixed(1)}% rev`, sub: "GM impact -0.5 pp", status: "warn" as Status },
          { label: "Bundle / cross-sell", value: `${(d.promoPctRevenue * 0.21).toFixed(1)}% rev`, sub: "GM impact +0.2 pp — tốt nhất", status: "good" as Status },
          { label: "Loyalty / voucher",   value: `${(d.promoPctRevenue * 0.10).toFixed(1)}% rev`, sub: "GM impact -0.5 pp", status: "warn" as Status },
          { label: "Promo ROI avg",       value: "142%",  sub: "Target >130% — on track", status: "good" as Status },
          { label: "Total GM impact",     value: `${d.promoGmImpact} pp`, sub: `Target <-1.2pp`, status: (d.promoGmImpact >= -1.2 ? "good" : "warn") as Status },
        ] as DrillRow[],
        note: "Promo ROI = incremental revenue / promo cost. Ưu tiên bundle và multi-buy — ít GM erosion nhất.",
        sections: [{
          label: "Promo calendar risk",
          rows: [
            { label: "Promo chạy song song",  value: "14 campaigns",  sub: "Cần conflict check", status: "warn" as Status },
            { label: "Promo không có end date", value: "3 campaigns", sub: "Phải close", status: "bad" as Status },
            { label: "Avg promo lead time",    value: "4.2 ngày",     sub: "Target 7 ngày", status: "warn" as Status },
          ],
        }],
      },
    },
    {
      kpi: {
        label: "New SKU success rate", value: `${d.newSkuSuccessRate}%`,
        trend: (d.newSkuSuccessRate >= 70 ? "up" : "down") as Trend,
        trendLabel: "Target ≥70%",
        status: (d.newSkuSuccessRate >= 70 ? "good" : d.newSkuSuccessRate >= 55 ? "warn" : "bad") as Status,
        alert: d.newSkuSuccessRate < 60 ? "⚠ Dưới ngưỡng — review listing process" : undefined,
      },
      content: {
        title: "New SKU Success Rate", value: `${d.newSkuSuccessRate}%`,
        status: (d.newSkuSuccessRate >= 70 ? "good" : d.newSkuSuccessRate >= 55 ? "warn" : "bad") as Status,
        rows: [
          { label: "SKU ra mắt trong 90 ngày", value: "42 SKU",          status: "neutral" as Status },
          { label: "Đạt velocity target",      value: `${d.newSkuSuccessRate}%`, sub: "Target ≥70% trong 12 tuần", status: (d.newSkuSuccessRate >= 70 ? "good" : "warn") as Status },
          { label: "Failed / delisted",        value: `${Math.round(42 * (1 - d.newSkuSuccessRate / 100))} SKU`, sub: "Đã hoặc cần delist", status: "bad" as Status },
          { label: "Avg time-to-velocity",     value: "8.4 tuần",         sub: "Target 8 tuần", status: "neutral" as Status },
          { label: "Success rate by category",  value: "Beverages best",   sub: "76% · Dairy worst 51%", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Success = đạt ≥80% velocity target trong 12 tuần đầu. Dưới 60% → delinquent list review.",
        sections: [{
          label: "New SKU by category",
          rows: d.categoryGm.map(c => ({
            label: c.name,
            value: `${Math.round(d.newSkuSuccessRate * (0.8 + Math.random() * 0.4))}%`,
            status: "neutral" as Status,
          })),
        }],
      },
    },
    {
      kpi: {
        label: "Private label penetration", value: `${d.privateLabelPct}%`,
        trend: "up" as Trend, trendLabel: "Target 12% cuối năm",
        status: (d.privateLabelPct >= 10 ? "good" : "warn") as Status,
      },
      content: {
        title: "Private Label Penetration", value: `${d.privateLabelPct}%`,
        status: (d.privateLabelPct >= 10 ? "good" : "warn") as Status,
        rows: [
          { label: "Đồ uống PL",       value: "14.2%", status: "good" as Status },
          { label: "Snack / bánh PL",  value: "9.8%",  status: "warn" as Status },
          { label: "CSSK / HPC PL",    value: "6.1%",  sub: "Cần accelerate", status: "warn" as Status },
          { label: "Thực phẩm khô PL", value: "11.4%", status: "good" as Status },
          { label: "GM PL vs NB avg",  value: "+8.4 pp", sub: "PL luôn có biên cao hơn NB", status: "good" as Status },
          { label: "Số SKU PL",        value: "184 SKU", sub: "Target 250 SKU cuối năm", status: "neutral" as Status },
        ] as DrillRow[],
        note: "Mỗi +1pp PL penetration ≈ +0.08pp GM. Target 12% = +~0.3pp GM vs hiện tại.",
      },
    },
    {
      kpi: {
        label: "Planogram compliance", value: `${d.planogramPct}%`,
        trend: (d.planogramPct >= 90 ? "up" : "down") as Trend,
        status: (d.planogramPct >= 90 ? "good" : d.planogramPct >= 80 ? "warn" : "bad") as Status,
      },
      content: {
        title: "Planogram Compliance", value: `${d.planogramPct}%`,
        status: (d.planogramPct >= 90 ? "good" : d.planogramPct >= 80 ? "warn" : "bad") as Status,
        rows: [
          { label: "HCM compliance",              value: "92.1%",         status: "good" as Status },
          { label: "Hà Nội compliance",           value: "89.4%",         status: "warn" as Status },
          { label: "Miền Bắc compliance",         value: "81.2%",         sub: "Thấp nhất fleet — audit ưu tiên", status: "bad" as Status },
          { label: "Category bị vi phạm nhiều",   value: "Đồ uống 34%",  sub: "Supplier mismatch display", status: "warn" as Status },
          { label: "Audit bằng AI (camera)",      value: "68% stores",    sub: "Còn 32% manual audit", status: "neutral" as Status },
          { label: "GM impact của planogram",     value: "+2–4% per store", sub: "Khi compliance >90%", status: "good" as Status },
        ] as DrillRow[],
        note: "Planogram compliance có tương quan dương với conversion rate. Target 90%+ toàn fleet.",
        sections: [{
          label: "Compliance scale-up plan",
          rows: [
            { label: "AI camera audit rollout",  value: "68% → 90%",   sub: "Q3 target", status: "neutral" as Status },
            { label: "Auto-alert khi vi phạm",   value: "Đang build",   sub: "Live Q3", status: "neutral" as Status },
            { label: "Supplier co-compliance",   value: "4 NCC signed", sub: "Joint audit program", status: "good" as Status },
          ],
        }],
      },
    },
  ]

  return (
    <div className="space-y-6">
      <Section icon={BarChart3} label="Merchandising & Category KPIs" color="bg-[hsl(var(--epic-purple))]">
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

      {/* Category GM heatmap */}
      <Section icon={Layers} label="GM% theo category (vs budget)" color="bg-[hsl(var(--epic-amber))]">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {d.categoryGm.map(c => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">OOS {c.oosPct}%</span>
                      <span className={cn(
                        "text-xs font-semibold tabular-nums w-16 text-right",
                        c.gmVsBudget > 0 ? "text-[hsl(var(--success))]" :
                        c.gmVsBudget > -0.5 ? "text-[hsl(var(--warning))]" : "text-destructive",
                      )}>
                        {c.gm}%{" "}
                        <span className="text-[10px] font-normal">({c.gmVsBudget >= 0 ? "+" : ""}{c.gmVsBudget})</span>
                      </span>
                    </div>
                  </div>
                  <MiniBar value={c.gm} max={35}
                    color={c.gmVsBudget > 0 ? "bg-[hsl(var(--success))]" : c.gmVsBudget > -0.5 ? "bg-[hsl(var(--warning))]" : "bg-destructive"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* DIO + Working capital strip */}
      <Section icon={TrendingDown} label="Inventory health & Working capital" color="bg-[hsl(var(--epic-rose))]">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "DIO", value: `${d.dioDays} ngày`,
              sub: "Target 14–18 ngày",
              status: (d.dioDays <= 18 ? "good" : "warn") as Status,
            },
            {
              label: "Tồn ứ đọng (>DOH×1.5)", value: fmtVnd(d.overStockVnd),
              sub: "Cần flash sale / transfer",
              status: (d.overStockVnd >= 1e9 ? "bad" : d.overStockVnd >= 5e8 ? "warn" : "good") as Status,
            },
            {
              label: "Hàng sắp HSD (<7 ngày)", value: fmtVnd(d.nearExpiryVnd),
              sub: "Markdown 20–30%",
              status: (d.nearExpiryVnd >= 5e8 ? "bad" : d.nearExpiryVnd >= 1e8 ? "warn" : "good") as Status,
            },
          ].map(c => (
            <Card key={c.label} className={cn(
              "border",
              c.status === "bad"  ? "border-destructive/40" :
              c.status === "warn" ? "border-[hsl(var(--warning))]/40" : "border-[hsl(var(--success))]/25",
            )}>
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground mb-2">{c.label}</p>
                <p className={cn("text-xl font-bold tabular-nums",
                  c.status === "bad"  ? "text-destructive" :
                  c.status === "warn" ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]",
                )}>{c.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {commAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Alerts commercial" color="bg-destructive">
          <div className="space-y-1.5">
            {commAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

export default CommercialView
