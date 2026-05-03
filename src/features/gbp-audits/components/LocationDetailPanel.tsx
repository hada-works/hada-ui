import {
  X, Star, MapPin, MessageCircle, CalendarDays,
  Globe, Phone, Clock3, Camera, FileText, Tag,
  Wifi, ParkingCircle, Accessibility, CreditCard,
  Banknote, Truck, UtensilsCrossed, ShoppingBag,
  ExternalLink, BookOpen, ShoppingCart, ImageIcon,
  LayoutGrid, QrCode,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { GbpLocation, GbpAttributes } from "@/types"
import { HealthBadge } from "./HealthBadge"
import { ScoreBar } from "./ScoreBar"
import { FieldIcon, fieldState, photoState } from "./FieldIcon"
import { GBP_REVIEWS, BRAND_CANONICAL_NAME } from "../constants"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </p>
  )
}

function MetaRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between px-3 py-1.5 border-b border-border/50 last:border-0 gap-3">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={cn(
        "text-[11px] font-medium text-right min-w-0 truncate",
        highlight && "text-[hsl(var(--warning))]"
      )}>
        {value}
      </span>
    </div>
  )
}

// ─── Rating distribution mini bar ────────────────────────────────────────────

function RatingDist({ dist }: { dist: [number, number, number, number, number] }) {
  const max = Math.max(...dist, 1)
  const labels = ["1★", "2★", "3★", "4★", "5★"]
  const colors = [
    "bg-[hsl(var(--destructive))]",
    "bg-[hsl(var(--warning))]",
    "bg-muted-foreground/40",
    "bg-[hsl(var(--success)/0.7)]",
    "bg-[hsl(var(--success))]",
  ]

  return (
    <div className="space-y-1.5">
      {[...dist].reverse().map((count, i) => {
        const idx = 4 - i
        const pct = Math.round(count / max * 100)
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">{labels[idx]}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", colors[idx])} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground w-5 shrink-0">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Profile completeness field rows ─────────────────────────────────────────

const FIELD_DEFS = [
  { icon: Globe,    label: "Website",     getState: (l: GbpLocation) => fieldState(l.fields.hasWebsite)     },
  { icon: Phone,    label: "Phone",       getState: (l: GbpLocation) => fieldState(l.fields.hasPhone)       },
  { icon: Tag,      label: "Category",    getState: (l: GbpLocation) => fieldState(l.fields.hasCategory)    },
  { icon: Clock3,   label: "Hours",       getState: (l: GbpLocation) => fieldState(l.fields.hasHours)       },
  { icon: Camera,   label: "Photos",      getState: (l: GbpLocation) => photoState(l.fields.photoCount)     },
  { icon: FileText, label: "Description", getState: (l: GbpLocation) => fieldState(l.fields.hasDescription) },
]

// ─── Attribute items ──────────────────────────────────────────────────────────

const ATTR_DEFS: { key: keyof GbpAttributes; icon: React.ElementType; label: string }[] = [
  { key: "wheelchair",  icon: Accessibility,    label: "Wheelchair"   },
  { key: "parking",     icon: ParkingCircle,    label: "Parking"      },
  { key: "wifi",        icon: Wifi,             label: "Wi-Fi"        },
  { key: "cashPayment", icon: Banknote,         label: "Cash"         },
  { key: "cardPayment", icon: CreditCard,       label: "Card"         },
  { key: "delivery",    icon: Truck,            label: "Delivery"     },
  { key: "dineIn",      icon: UtensilsCrossed,  label: "Dine-in"      },
  { key: "takeout",     icon: ShoppingBag,      label: "Takeout"      },
]

// ─── Business hours table ─────────────────────────────────────────────────────

const DAY_LABELS: [string, string][] = [
  ["monday",    "Mon"],
  ["tuesday",   "Tue"],
  ["wednesday", "Wed"],
  ["thursday",  "Thu"],
  ["friday",    "Fri"],
  ["saturday",  "Sat"],
  ["sunday",    "Sun"],
]

// ─── Bool chip ────────────────────────────────────────────────────────────────

function BoolChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
      ok
        ? "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]"
        : "bg-muted text-muted-foreground/60"
    )}>
      {ok ? "✓" : "–"} {label}
    </span>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface LocationDetailPanelProps {
  location: GbpLocation
  onClose:  () => void
}

export function LocationDetailPanel({ location: loc, onClose }: LocationDetailPanelProps) {
  const reviews = GBP_REVIEWS.filter(r => r.locationId === loc.id)
  const pending = reviews.filter(r => !r.responded).length
  const p = loc.profile

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3 border-b space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <HealthBadge status={loc.status} className="text-[10px] h-4 px-1.5 shrink-0" />
              {!loc.nameIsCorrect && (
                <Badge variant="warning" className="text-[10px] h-4 px-1.5 shrink-0">Name mismatch</Badge>
              )}
            </div>
            <h2 className={cn(
              "text-sm font-semibold leading-snug truncate",
              !loc.nameIsCorrect && "text-[hsl(var(--warning))]"
            )}>
              {loc.name}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{loc.address}, {loc.city}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent transition-colors shrink-0 mt-0.5"
            aria-label="Close panel"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Health score */}
        <ScoreBar score={loc.healthScore} showLabel />
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 space-y-5">

          {/* ── Thông tin chung ── */}
          <div>
            <SectionLabel>Thông tin chung</SectionLabel>
            <div className="rounded-lg border overflow-hidden divide-y divide-border/50">
              <MetaRow label="Tên chuẩn thương hiệu" value={BRAND_CANONICAL_NAME} />
              <MetaRow
                label="Tên trên GBP"
                value={loc.name}
                highlight={!loc.nameIsCorrect}
              />
              <MetaRow label="Thành phố"  value={loc.city} />
              <MetaRow label="Địa chỉ"   value={loc.address} />
              <MetaRow
                label="Kiểm tra lần cuối"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <CalendarDays className="size-3 shrink-0" />
                    {loc.lastAudit}
                  </span>
                }
              />
            </div>
          </div>

          {/* ── Danh mục & Liên hệ (rich profile only) ── */}
          {p && (
            <div>
              <SectionLabel>Danh mục &amp; Liên hệ</SectionLabel>
              <div className="rounded-lg border overflow-hidden divide-y divide-border/50">
                <div className="px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Danh mục chính</p>
                  <Badge variant="secondary" className="text-[10px]">{p.primaryCategory}</Badge>
                </div>
                {p.secondaryCategories.length > 0 && (
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Danh mục phụ</p>
                    <div className="flex flex-wrap gap-1">
                      {p.secondaryCategories.map(c => (
                        <Badge key={c} variant="outline" className="text-[10px] font-normal">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <MetaRow label="Điện thoại chính" value={p.phone} />
                {p.additionalPhone && (
                  <MetaRow label="Điện thoại phụ" value={p.additionalPhone} />
                )}
                <div className="flex items-baseline justify-between px-3 py-1.5 border-b border-border/50 last:border-0 gap-3">
                  <span className="text-[11px] text-muted-foreground shrink-0">Website</span>
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 min-w-0 truncate"
                  >
                    <span className="truncate">{p.website.replace("https://", "")}</span>
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
                <MetaRow label="Ngày khai trương" value={p.openingDate} />
              </div>
            </div>
          )}

          {/* ── Giờ hoạt động (rich profile only) ── */}
          {p && (
            <div>
              <SectionLabel>
                Giờ hoạt động
                {p.hasSpecialHours && (
                  <Badge variant="info" className="ml-2 text-[9px] h-3.5 px-1 normal-case tracking-normal">
                    Có giờ đặc biệt
                  </Badge>
                )}
              </SectionLabel>
              <div className="rounded-lg border overflow-hidden divide-y divide-border/50">
                {DAY_LABELS.map(([key, short]) => {
                  const hours = p.regularHours[key as keyof typeof p.regularHours]
                  const isClosed = hours === "Closed"
                  const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === key
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5 gap-3",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <span className={cn(
                        "text-[11px] w-8 shrink-0",
                        isToday ? "font-semibold text-primary" : "text-muted-foreground"
                      )}>
                        {short}
                      </span>
                      <span className={cn(
                        "text-[11px] font-medium text-right",
                        isClosed && "text-muted-foreground/50"
                      )}>
                        {hours}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tiện ích & Dịch vụ (rich profile only) ── */}
          {p && (
            <div>
              <SectionLabel>Tiện ích &amp; Dịch vụ</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {ATTR_DEFS.map(({ key, icon: Icon, label }) => {
                  const enabled = p.attributes[key]
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px]",
                        enabled
                          ? "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]"
                          : "bg-muted/50 text-muted-foreground/50"
                      )}
                    >
                      <Icon className="size-3 shrink-0" />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Mô tả (rich profile only) ── */}
          {p && (
            <div>
              <SectionLabel>Mô tả hồ sơ</SectionLabel>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">{p.shortDescription}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-right">
                  {p.shortDescription.length} / 750 ký tự
                </p>
              </div>
            </div>
          )}

          {/* ── Nội dung & Hoạt động (rich profile only) ── */}
          {p && (
            <div>
              <SectionLabel>Nội dung &amp; Hoạt động</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {/* Posts */}
                <div className="rounded-lg border p-2.5 text-center">
                  <p className={cn(
                    "text-lg font-bold",
                    p.postCount === 0 ? "text-[hsl(var(--destructive))]" :
                    p.postCount < 4 ? "text-[hsl(var(--warning))]" : "text-foreground"
                  )}>
                    {p.postCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Posts (90 ngày)</p>
                </div>
                {/* Q&A */}
                <div className="rounded-lg border p-2.5 text-center">
                  <p className={cn(
                    "text-lg font-bold",
                    p.qaCount === 0 ? "text-[hsl(var(--destructive))]" :
                    p.qaCount < 10 ? "text-[hsl(var(--warning))]" : "text-foreground"
                  )}>
                    {p.qaCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Q&amp;A pairs</p>
                </div>
              </div>

              {/* Link & media flags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <BoolChip ok={p.hasBookingLink}    label="Booking link"    />
                <BoolChip ok={p.hasMenuLink}        label="Menu link"       />
                <BoolChip ok={p.hasProductCatalog}  label="Product catalog" />
                <BoolChip ok={p.logoUploaded}       label="Logo"            />
                <BoolChip ok={p.coverPhotoUploaded} label="Cover photo"     />
              </div>
            </div>
          )}

          {/* ── Hoàn thiện hồ sơ ── */}
          <div>
            <SectionLabel>Hoàn thiện hồ sơ</SectionLabel>
            <div className="rounded-lg border overflow-hidden divide-y divide-border/50">
              {FIELD_DEFS.map(({ icon: Icon, label, getState }) => {
                const state = getState(loc)
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px]">{label}</span>
                      {label === "Photos" && (
                        <span className="text-[10px] text-muted-foreground">({loc.fields.photoCount} ảnh)</span>
                      )}
                    </div>
                    <FieldIcon state={state} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Đánh giá khách hàng ── */}
          <div>
            <SectionLabel>Đánh giá khách hàng</SectionLabel>
            <div className="rounded-lg border p-3 space-y-4">
              {/* Avg + response */}
              <div className="flex gap-3">
                <div className="flex-1 text-center rounded-md bg-muted/40 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="size-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                    <span className="text-lg font-bold">{loc.review.avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{loc.review.totalCount} đánh giá</p>
                </div>
                <div className="flex-1 text-center rounded-md bg-muted/40 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <MessageCircle className="size-3.5 text-muted-foreground" />
                    <span className={cn(
                      "text-lg font-bold",
                      loc.review.responseRate < 40 ? "text-[hsl(var(--destructive))]" :
                      loc.review.responseRate < 70 ? "text-[hsl(var(--warning))]" :
                      "text-[hsl(var(--success))]"
                    )}>
                      {loc.review.responseRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">response rate</p>
                </div>
              </div>

              {/* Rating distribution */}
              <RatingDist dist={loc.review.dist} />

              {/* Sentiment */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="rounded-md bg-[hsl(var(--success-subtle))] py-1.5">
                  <p className="font-semibold text-[hsl(var(--success))]">{loc.review.positivePct}%</p>
                  <p className="text-muted-foreground">Positive</p>
                </div>
                <div className="rounded-md bg-muted/50 py-1.5">
                  <p className="font-semibold">{loc.review.neutralPct}%</p>
                  <p className="text-muted-foreground">Neutral</p>
                </div>
                <div className="rounded-md bg-[hsl(var(--destructive)/0.08)] py-1.5">
                  <p className="font-semibold text-[hsl(var(--destructive))]">{loc.review.negativePct}%</p>
                  <p className="text-muted-foreground">Negative</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews gần đây ── */}
          {reviews.length > 0 && (
            <div>
              <SectionLabel>
                Reviews gần đây
                {pending > 0 && (
                  <Badge variant="warning" className="ml-2 text-[9px] h-3.5 px-1 normal-case tracking-normal">
                    {pending} chờ phản hồi
                  </Badge>
                )}
              </SectionLabel>
              <div className="space-y-2">
                {reviews.slice(0, 5).map(r => {
                  const initials = r.reviewerName.split(" ").filter(Boolean).slice(-2).map(n => n[0]).join("").toUpperCase()
                  return (
                    <div key={r.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {initials}
                        </div>
                        <span className="text-xs font-medium flex-1 truncate">{r.reviewerName}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={cn("size-2.5", i <= r.rating ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "fill-muted text-muted-foreground/30")} />
                          ))}
                        </div>
                        {!r.responded && (
                          <Badge variant="warning" className="text-[9px] h-3.5 px-1 shrink-0">Pending</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 pl-8">{r.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Tóm tắt ── */}
          <div className="rounded-lg border bg-muted/20 overflow-hidden divide-y divide-border/50">
            <div className="px-3 py-2">
              <SectionLabel>Tóm tắt</SectionLabel>
            </div>
            <MetaRow label="Health score"    value={`${loc.healthScore}/100`} highlight={loc.healthScore < 30} />
            <MetaRow label="Tổng reviews"    value={loc.review.totalCount} />
            <MetaRow label="Pending replies" value={pending} highlight={pending > 0} />
            <MetaRow
              label="Trạng thái tên"
              value={loc.nameIsCorrect ? "✓ Đúng chuẩn" : "⚠ Cần sửa"}
              highlight={!loc.nameIsCorrect}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
