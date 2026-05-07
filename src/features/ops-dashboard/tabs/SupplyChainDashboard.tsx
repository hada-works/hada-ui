import {
  AlertTriangle, Truck, ShoppingCart, Users, ReceiptText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PeriodData, Trend, Status } from "../shared/types"
import { fmtVnd } from "../shared/types"
import type { DrillContent } from "../shared/primitives"
import { KpiCard, Section, MiniBar, AlertRow } from "../shared/primitives"

interface Props {
  d: PeriodData
  onDrill: (c: DrillContent) => void
  activeDrill: string | null
}

export function SupplyChainView({ d, onDrill, activeDrill }: Props) {
  const scAlerts = d.alerts.filter(a => a.tag === "Supply Chain")

  const kpis: { kpiDef: Parameters<typeof KpiCard>[0]["kpi"]; drillContent: DrillContent }[] = [
    {
      kpiDef: {
        label: "On-time delivery", value: `${d.onTimeDeliveryPct}%`,
        trend: (d.onTimeDeliveryPct >= 98 ? "up" : "down") as Trend,
        trendLabel: `${d.transitLate} xe trễ / ${d.transitTotal} tổng`,
        status: (d.onTimeDeliveryPct >= 98 ? "good" : d.onTimeDeliveryPct >= 95 ? "warn" : "bad") as Status,
        alert: d.onTimeDeliveryPct < 95 ? `⚠ Dưới ngưỡng 95%` : undefined,
      },
      drillContent: {
        title: "On-time Delivery", value: `${d.onTimeDeliveryPct}%`,
        status: (d.onTimeDeliveryPct >= 98 ? "good" : d.onTimeDeliveryPct >= 95 ? "warn" : "bad") as Status,
        rows: [
          { label: "Xe đúng giờ",        value: `${d.transitTotal - d.transitLate} / ${d.transitTotal}`, status: "good" as Status },
          { label: "Trễ <1 giờ",         value: `${Math.round(d.transitLate * 0.5)} xe`, sub: "ảnh hưởng nhỏ", status: "warn" as Status },
          { label: "Trễ 1–3 giờ",        value: `${Math.round(d.transitLate * 0.35)} xe`, status: "warn" as Status },
          { label: "Trễ >3 giờ",         value: `${Math.round(d.transitLate * 0.15)} xe`, sub: "cần báo cáo stores ngay", status: "bad" as Status },
          { label: "Target OTD",         value: "≥98%", sub: `Hiện ${d.onTimeDeliveryPct}%`, status: (d.onTimeDeliveryPct >= 98 ? "good" : "warn") as Status },
        ],
        sections: [{
          label: "OTD thresholds",
          rows: [
            { label: "P0 — OTD <90%",    value: "Escalate ngay tới DC Manager", status: "bad" as Status },
            { label: "P1 — OTD 90–95%",  value: "Review tuyến + thời tiết", status: "warn" as Status },
            { label: "P2 — OTD 95–97%",  value: "Monitor — track daily", status: "neutral" as Status },
          ],
          note: "Tại 1,000 stores: cần real-time GPS tracking — mỗi xe trễ >3h ảnh hưởng avg 8 stores.",
        }],
      },
    },
    {
      kpiDef: {
        label: "DC fill accuracy", value: `${d.dcFillAccuracy}%`,
        trend: (d.dcFillAccuracy >= 97 ? "up" : "down") as Trend,
        trendLabel: "Target ≥97%",
        status: (d.dcFillAccuracy >= 97 ? "good" : d.dcFillAccuracy >= 94 ? "warn" : "bad") as Status,
        alert: d.dcFillAccuracy < 94 ? `⚠ Fill accuracy thấp — OOS risk` : undefined,
      },
      drillContent: {
        title: "DC Fill Accuracy", value: `${d.dcFillAccuracy}%`,
        status: (d.dcFillAccuracy >= 97 ? "good" : d.dcFillAccuracy >= 94 ? "warn" : "bad") as Status,
        rows: [
          { label: "Chuyến xuất đủ hàng", value: `${Math.round(d.dcDispatch * d.dcFillAccuracy / 100)} / ${d.dcDispatch}`, status: "good" as Status },
          { label: "Thiếu do DC stockout", value: `${Math.round(d.dcDispatch * (100 - d.dcFillAccuracy) / 100 * 0.6)}`, sub: "DC hết hàng", status: "bad" as Status },
          { label: "Thiếu do forecast",    value: `${Math.round(d.dcDispatch * (100 - d.dcFillAccuracy) / 100 * 0.4)}`, sub: "Demand planning sai", status: "warn" as Status },
          { label: "DC pending backlog",   value: `${d.dcPending} chuyến`, sub: "Chưa xuất", status: (d.dcPending > 5 ? "warn" : "good") as Status },
        ],
        note: "DC fill accuracy đo lường % chuyến xuất đủ số lượng theo pick list. Thiếu 1 chuyến → avg 3–5 SKU OOS tại store.",
        sections: [{
          label: "Fill accuracy theo tuyến",
          rows: [
            { label: "Tuyến HCM",        value: `${Math.round(d.dcFillAccuracy + 1.2)}%`, status: "good" as Status },
            { label: "Tuyến Hà Nội",     value: `${Math.round(d.dcFillAccuracy + 0.4)}%`, status: "good" as Status },
            { label: "Tuyến Miền Bắc",   value: `${Math.round(d.dcFillAccuracy - 2.8)}%`, sub: "Thấp nhất — cần review DC Bắc", status: "warn" as Status },
            { label: "Tuyến Miền Trung", value: `${Math.round(d.dcFillAccuracy - 0.6)}%`, status: "neutral" as Status },
            { label: "Tuyến Miền Tây",   value: `${Math.round(d.dcFillAccuracy + 0.9)}%`, status: "good" as Status },
          ],
        }],
      },
    },
    {
      kpiDef: {
        label: "PO đang mở", value: String(d.poOpen),
        trend: (d.poOverdue > 0 ? "down" : "flat") as Trend,
        trendLabel: `${d.poOverdue} PO trễ hạn`,
        status: (d.poOverdue >= 8 ? "bad" : d.poOverdue >= 4 ? "warn" : "good") as Status,
        alert: d.poOverdue > 0 ? `${d.poOverdue} PO quá hạn cần escalation` : undefined,
      },
      drillContent: {
        title: "PO đang mở",
        value: String(d.poOpen),
        status: (d.poOverdue >= 8 ? "bad" : d.poOverdue >= 4 ? "warn" : "good") as Status,
        rows: [
          { label: "PO đúng hạn",           value: `${d.poOpen - d.poOverdue}`,            status: "good" as Status },
          { label: "PO trễ 1–2 ngày",       value: `${Math.round(d.poOverdue * 0.4)}`,      sub: "risk nhỏ", status: "warn" as Status },
          { label: "PO trễ >2 ngày",        value: `${Math.round(d.poOverdue * 0.6)}`,      sub: "cần escalation", status: "bad" as Status },
          { label: "Giá trị PO trễ",        value: fmtVnd(d.poOverdue * 820_000_000 / 5),   status: "bad" as Status },
          { label: "Supplier bị ảnh hưởng", value: "4 NCC",                                 status: "warn" as Status },
        ],
        sections: [
          {
            label: "Ngưỡng cảnh báo PO",
            rows: [
              { label: "P0 — Escalate ngay", value: "PO trễ >3 ngày hoặc giá trị >5 tỷ", status: "bad" as Status },
              { label: "P1 — Notify SCM",    value: "PO trễ 1–3 ngày, nhiều supplier", status: "warn" as Status },
              { label: "P2 — Track weekly",  value: "PO trễ <1 ngày, đơn lẻ", status: "neutral" as Status },
            ],
            note: "Tại 1,000 stores: tự động escalate khi số PO trễ >5% tổng PO mở.",
          },
        ],
      },
    },
    {
      kpiDef: {
        label: "Supplier fill rate", value: `${d.supplierFillRate}%`,
        trend: (d.supplierFillRate >= 95 ? "up" : "down") as Trend,
        trendLabel: "Target ≥95%",
        status: (d.supplierFillRate >= 95 ? "good" : d.supplierFillRate >= 90 ? "warn" : "bad") as Status,
        alert: d.supplierFillRate < 95 ? "Dưới ngưỡng 95%" : undefined,
      },
      drillContent: {
        title: "Supplier fill rate",
        value: `${d.supplierFillRate}%`,
        status: (d.supplierFillRate >= 95 ? "good" : d.supplierFillRate >= 90 ? "warn" : "bad") as Status,
        rows: d.supplierBreak.map(s => ({
          label: s.name,
          value: `${s.fillRate}%`,
          sub: s.poOverdue > 0 ? `${s.poOverdue} PO trễ hạn` : "PO on time",
          status: (s.fillRate >= 95 ? "good" : s.fillRate >= 85 ? "warn" : "bad") as Status,
        })),
        note: "Fill rate = hàng giao đủ / hàng đặt mua trong 7 ngày qua.",
        sections: [
          {
            label: "Signal vs Noise — Fill rate",
            rows: [
              { label: "Signal (hành động ngay)", value: "Fill rate <90% bất kỳ NCC A-tier", status: "bad" as Status },
              { label: "Watch (theo dõi)",        value: "Fill rate 90–94% kéo dài >3 ngày", status: "warn" as Status },
              { label: "Noise (bỏ qua)",          value: "Biến động 1–2% hàng tuần trong ngưỡng", status: "neutral" as Status },
            ],
            note: "Ở 1,000 stores, trọng số theo đóng góp doanh thu của supplier — NCC A-tier chiếm >60% GMV cần alert ngay.",
          },
        ],
      },
    },
    {
      kpiDef: {
        label: "Xe vận chuyển", value: `${d.transitTotal} tải`,
        trend: (d.transitLate > 0 ? "down" : "flat") as Trend,
        trendLabel: `${d.transitLate} đang trễ`,
        status: (d.transitLate >= 5 ? "bad" : d.transitLate >= 2 ? "warn" : "good") as Status,
        alert: d.transitLate >= 2 ? `${d.transitLate} xe trễ lịch giao` : undefined,
      },
      drillContent: {
        title: "Xe vận chuyển",
        value: `${d.transitTotal} tải`,
        status: (d.transitLate >= 5 ? "bad" : d.transitLate >= 2 ? "warn" : "good") as Status,
        rows: [
          { label: "Đúng giờ",           value: `${d.transitTotal - d.transitLate} xe`,          status: "good" as Status },
          { label: "Trễ <1 giờ",         value: `${Math.round(d.transitLate * 0.5)} xe`,          status: "warn" as Status },
          { label: "Trễ 1–3 giờ",        value: `${Math.round(d.transitLate * 0.35)} xe`,         status: "warn" as Status },
          { label: "Trễ >3 giờ",         value: `${Math.round(d.transitLate * 0.15)} xe`,         sub: "cần báo cáo stores", status: "bad" as Status },
          { label: "On-time delivery %", value: `${((d.transitTotal - d.transitLate) / d.transitTotal * 100).toFixed(1)}%`, sub: "target 98%", status: (d.transitLate <= 1 ? "good" : "warn") as Status },
        ],
        sections: [
          {
            label: "Tuyến vận chuyển DC",
            rows: [
              { label: "Tuyến HCM",        value: `${Math.round(d.dcDispatch * 0.42)} chuyến`, status: "good" as Status },
              { label: "Tuyến Hà Nội",     value: `${Math.round(d.dcDispatch * 0.28)} chuyến`, status: "good" as Status },
              { label: "Tuyến Miền Bắc",   value: `${Math.round(d.dcDispatch * 0.14)} chuyến`, status: "good" as Status },
              { label: "Tuyến Miền Trung", value: `${Math.round(d.dcDispatch * 0.10)} chuyến`, status: "good" as Status },
              { label: "Tuyến Miền Tây",   value: `${Math.round(d.dcDispatch * 0.06)} chuyến`, status: "good" as Status },
            ],
          },
        ],
      },
    },
    {
      kpiDef: {
        label: "DC xuất hàng", value: `${d.dcDispatch} chuyến`,
        trendLabel: `${d.dcPending} chưa xuất`,
        status: (d.dcPending >= 10 ? "warn" : "good") as Status,
      },
      drillContent: {
        title: "DC xuất hàng",
        value: `${d.dcDispatch} chuyến`,
        status: (d.dcPending >= 10 ? "warn" : "good") as Status,
        rows: [
          { label: "Tuyến HCM",          value: `${Math.round(d.dcDispatch * 0.42)} chuyến`, status: "good" as Status },
          { label: "Tuyến Hà Nội",       value: `${Math.round(d.dcDispatch * 0.28)} chuyến`, status: "good" as Status },
          { label: "Tuyến Miền Bắc",     value: `${Math.round(d.dcDispatch * 0.14)} chuyến`, status: "good" as Status },
          { label: "Tuyến Miền Trung",   value: `${Math.round(d.dcDispatch * 0.10)} chuyến`, status: "good" as Status },
          { label: "Tuyến Miền Tây",     value: `${Math.round(d.dcDispatch * 0.06)} chuyến`, status: "good" as Status },
          { label: "Chờ xuất (backlog)", value: `${d.dcPending} chuyến`, sub: "target 0", status: (d.dcPending > 5 ? "warn" : "good") as Status },
        ],
        note: "Backlog >10 chuyến → cần bổ sung ca vận hành DC hoặc điều phối lại lịch xuất.",
      },
    },
    {
      kpiDef: {
        label: "GRN nhập hàng", value: `${d.grn} phiếu`,
        trendLabel: `${d.grnPending} chờ xác nhận`,
        status: (d.grnPending >= 15 ? "warn" : "good") as Status,
      },
      drillContent: {
        title: "GRN nhập hàng",
        value: `${d.grn} phiếu`,
        status: (d.grnPending >= 15 ? "warn" : "good") as Status,
        rows: [
          { label: "GRN đã confirm",     value: `${d.grn - d.grnPending}`, status: "good" as Status },
          { label: "GRN chờ xác nhận",   value: `${d.grnPending}`, sub: ">48h cần follow-up", status: "warn" as Status },
          { label: "GRN có discrepancy", value: "4", sub: "SL nhận ≠ PO — đang điều tra", status: "warn" as Status },
          { label: "Avg GRN processing", value: "1.8 giờ", sub: "target <2h", status: "good" as Status },
          { label: "Rejection rate",     value: "1.4%", sub: "hàng trả lại NCC", status: "neutral" as Status },
        ],
        sections: [
          {
            label: "Chất lượng nhập hàng",
            rows: [
              { label: "Discrepancy rate",   value: `${(4 / d.grn * 100).toFixed(1)}%`, sub: "target <2%", status: "good" as Status },
              { label: "Rejection rate",     value: "1.4%", sub: "target <1%", status: "warn" as Status },
              { label: "Avg processing time",value: "1.8 giờ", sub: "target <2h", status: "good" as Status },
            ],
            note: "Tăng rejection rate cần review quy trình kiểm tra hàng tại cửa hàng.",
          },
        ],
      },
    },
  ]

  return (
    <div className="space-y-6">
      <Section icon={ShoppingCart} label="Đặt mua & Nhà cung cấp" color="bg-[hsl(var(--epic-blue))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {kpis.map(({ kpiDef, drillContent }) => (
            <KpiCard
              key={kpiDef.label}
              kpi={kpiDef}
              onClick={() => onDrill(drillContent)}
              active={activeDrill === kpiDef.label}
            />
          ))}
        </div>
      </Section>

      {/* Transit tracker */}
      <Section icon={Truck} label="Trạng thái vận chuyển DC → Cửa hàng" color="bg-[hsl(var(--epic-emerald))]">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-6 mb-4">
              {[
                { label: "Đúng giờ",  value: d.transitTotal - d.transitLate, color: "text-[hsl(var(--success))]" },
                { label: "Đang trễ", value: d.transitLate,                   color: d.transitLate > 0 ? "text-[hsl(var(--warning))]" : "text-muted-foreground" },
                { label: "Tổng tải", value: d.transitTotal,                  color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-3xl font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <MiniBar
              value={d.transitTotal - d.transitLate}
              max={d.transitTotal}
              color={d.transitLate === 0 ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--warning))]"}
            />
            <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">DC xuất hàng hôm nay</p>
                <p className="text-xl font-bold tabular-nums">
                  {d.dcDispatch} <span className="text-sm font-normal text-muted-foreground">chuyến</span>
                </p>
                {d.dcPending > 0 && (
                  <p className="text-[11px] text-[hsl(var(--warning))] mt-0.5">{d.dcPending} chuyến chưa xuất</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">GRN chờ xác nhận</p>
                <p className="text-xl font-bold tabular-nums">
                  {d.grnPending} <span className="text-sm font-normal text-muted-foreground">phiếu</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{d.grn} tổng GRN hôm nay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Supplier performance table */}
      <Section icon={Users} label="Hiệu suất nhà cung cấp top 5" color="bg-[hsl(var(--epic-amber))]">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {d.supplierBreak.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    {s.poOverdue > 0 && (
                      <p className="text-[11px] text-destructive">{s.poOverdue} PO trễ hạn</p>
                    )}
                  </div>
                  <div className="w-28 shrink-0">
                    <MiniBar
                      value={s.fillRate}
                      max={100}
                      color={
                        s.fillRate >= 95 ? "bg-[hsl(var(--success))]" :
                        s.fillRate >= 85 ? "bg-[hsl(var(--warning))]" : "bg-destructive"
                      }
                    />
                  </div>
                  <p className={cn(
                    "text-xs font-semibold tabular-nums w-12 text-right shrink-0",
                    s.fillRate >= 95 ? "text-[hsl(var(--success))]" :
                    s.fillRate >= 85 ? "text-[hsl(var(--warning))]" : "text-destructive",
                  )}>{s.fillRate}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Working capital */}
      <Section icon={ReceiptText} label="Working capital & Tồn kho rủi ro" color="bg-[hsl(var(--epic-rose))]">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Tồn kho ứ đọng (>DOH×1.5)",  value: fmtVnd(d.overStockVnd),
              status: (d.overStockVnd >= 1e9 ? "bad" : d.overStockVnd >= 5e8 ? "warn" : "good") as Status,
              sub: "Cần flash sale hoặc inter-store transfer",
            },
            {
              label: "Hàng sắp hết HSD (<7 ngày)", value: fmtVnd(d.nearExpiryVnd),
              status: (d.nearExpiryVnd >= 5e8 ? "bad" : d.nearExpiryVnd >= 1e8 ? "warn" : "good") as Status,
              sub: "Cần markdown 20–30% để clear",
            },
          ].map(c => (
            <Card key={c.label} className={cn(
              "border",
              c.status === "bad"  ? "border-destructive/40" :
              c.status === "warn" ? "border-[hsl(var(--warning))]/40" : "",
            )}>
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground mb-2">{c.label}</p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  c.status === "bad"  ? "text-destructive" :
                  c.status === "warn" ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]",
                )}>{c.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {scAlerts.length > 0 && (
        <Section icon={AlertTriangle} label="Alerts supply chain" color="bg-destructive">
          <div className="space-y-1.5">
            {scAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

export default SupplyChainView
