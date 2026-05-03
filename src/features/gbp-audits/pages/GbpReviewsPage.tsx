import { useState, useMemo } from "react"
import { Search, Star, MessageCircle, Clock, CheckCircle2, AlertTriangle, X, ChevronDown } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { GBP_LOCATIONS, GBP_REVIEWS } from "../constants"
import type { GbpReviewSentiment } from "@/types"

// ─── Star rating display ──────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "size-3" : "size-3.5"
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(cls, i <= rating
          ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
          : "fill-muted text-muted-foreground/30"
        )} />
      ))}
    </span>
  )
}

// ─── Sentiment badge ──────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: GbpReviewSentiment }) {
  if (sentiment === "positive") return <Badge variant="success"     className="text-[10px] h-4 px-1.5">Positive</Badge>
  if (sentiment === "negative") return <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Negative</Badge>
  return                               <Badge variant="secondary"   className="text-[10px] h-4 px-1.5">Neutral</Badge>
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType
  accent?: "warning" | "success" | "destructive" | "info"
}) {
  const accentBg: Record<string, string> = {
    warning:     "bg-[hsl(var(--warning-subtle))]   text-[hsl(var(--warning))]",
    success:     "bg-[hsl(var(--success-subtle))]   text-[hsl(var(--success))]",
    destructive: "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
    info:        "bg-[hsl(var(--info-subtle))]      text-[hsl(var(--info-subtle-foreground))]",
  }
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5">
      <div className={cn("rounded-md p-1.5 shrink-0", accent ? accentBg[accent] : "bg-muted text-muted-foreground")}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold leading-none">{value}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  )
}

// ─── Collapsible filter section ───────────────────────────────────────────────

function FilterSection({
  label, children, defaultOpen = true, isActive = false,
}: {
  label: string; children: React.ReactNode; defaultOpen?: boolean; isActive?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1 hover:text-foreground transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex-1 text-left">
          {label}
        </span>
        {isActive && <div className="size-1.5 rounded-full bg-primary shrink-0" />}
        <ChevronDown className={cn(
          "size-3 text-muted-foreground/50 transition-transform duration-150 shrink-0",
          !open && "-rotate-90"
        )} />
      </button>
      {open && <div className="pt-0.5">{children}</div>}
    </div>
  )
}

// ─── Inline searchable location list ─────────────────────────────────────────

function LocationList({ value, onChange, locations }: {
  value: string
  onChange: (v: string) => void
  locations: { id: string; name: string; city: string }[]
}) {
  const [q, setQ] = useState("")
  const opts = useMemo(() => {
    const query = q.toLowerCase().trim()
    if (!query) return locations
    return locations.filter(l =>
      l.name.toLowerCase().includes(query) || l.city.toLowerCase().includes(query)
    )
  }, [locations, q])

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Search className="absolute left-2 top-1.5 size-3 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm location…"
          className="w-full rounded-md border bg-background pl-6 pr-6 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition"
        />
        {q && <button onClick={() => setQ("")} className="absolute right-2 top-1.5"><X className="size-3 text-muted-foreground hover:text-foreground" /></button>}
      </div>
      <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
        <button onClick={() => onChange("all")} className={cn("w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors", value === "all" ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
          All locations
        </button>
        {opts.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-muted-foreground">Không tìm thấy</p>
        ) : opts.map(l => (
          <button key={l.id} onClick={() => onChange(l.id)} className={cn("w-full rounded-md px-2.5 py-1 text-left transition-colors", value === l.id ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
            <div className="text-xs leading-snug">{l.name}</div>
            <div className="text-[10px] text-muted-foreground/70">{l.city}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Filter row (radio-style) ─────────────────────────────────────────────────

function FilterRow<T extends string>({ value, options, onChange }: {
  value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn(
          "w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
          value === o.value ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ reviewerName, rating, date, locationName, text, sentiment, responded, response, responseDate }: {
  reviewerName: string; rating: number; date: string; locationName: string; text: string
  sentiment: GbpReviewSentiment; responded: boolean; response?: string; responseDate?: string
}) {
  const initials = reviewerName.split(" ").filter(Boolean).slice(-2).map(n => n[0]).join("").toUpperCase()
  const fmt = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{reviewerName}</span>
            <StarRating rating={rating} size="xs" />
            <SentimentBadge sentiment={sentiment} />
            {responded
              ? <Badge variant="success"  className="text-[10px] h-4 px-1.5 gap-0.5"><CheckCircle2 className="size-2.5" />Responded</Badge>
              : <Badge variant="warning"  className="text-[10px] h-4 px-1.5 gap-0.5"><Clock        className="size-2.5" />Pending</Badge>
            }
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{fmt(date)}</span>
            <span className="text-[11px] text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground truncate">{locationName}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed pl-11">{text}</p>
      {responded && response && (
        <div className="pl-11">
          <div className="rounded-md border-l-2 border-[hsl(var(--info))] bg-[hsl(var(--info-subtle))] px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="size-3 text-[hsl(var(--info-subtle-foreground))]" />
              <span className="text-[11px] font-medium text-[hsl(var(--info-subtle-foreground))]">Phản hồi của Hada Market</span>
              {responseDate && <span className="text-[10px] text-muted-foreground ml-auto">{fmt(responseDate)}</span>}
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{response}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_OPTIONS = [
  { value: "all", label: "All ratings"  },
  { value: "5",   label: "★★★★★  5 sao" },
  { value: "4",   label: "★★★★☆  4 sao" },
  { value: "3",   label: "★★★☆☆  3 sao" },
  { value: "2",   label: "★★☆☆☆  2 sao" },
  { value: "1",   label: "★☆☆☆☆  1 sao" },
] as const

const SENTIMENT_OPTIONS = [
  { value: "all",      label: "All sentiments" },
  { value: "positive", label: "Positive"       },
  { value: "neutral",  label: "Neutral"        },
  { value: "negative", label: "Negative"       },
] as const

const RESPONSE_OPTIONS = [
  { value: "all",       label: "All reviews"   },
  { value: "pending",   label: "Pending reply" },
  { value: "responded", label: "Responded"     },
] as const

type RatingOpt    = typeof RATING_OPTIONS[number]["value"]
type SentimentOpt = typeof SENTIMENT_OPTIONS[number]["value"]
type ResponseOpt  = typeof RESPONSE_OPTIONS[number]["value"]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GbpReviewsPage() {
  const { currentTenant } = useApp()

  const [search,     setSearch]     = useState("")
  const [locationId, setLocationId] = useState("all")
  const [rating,     setRating]     = useState<RatingOpt>("all")
  const [sentiment,  setSentiment]  = useState<SentimentOpt>("all")
  const [response,   setResponse]   = useState<ResponseOpt>("all")

  const tenantLocations = useMemo(() => GBP_LOCATIONS.filter(l => l.tenantId === currentTenant.id), [currentTenant.id])
  const locationMap     = useMemo(() => Object.fromEntries(tenantLocations.map(l => [l.id, l])), [tenantLocations])
  const base            = useMemo(() => GBP_REVIEWS.filter(r => r.tenantId === currentTenant.id), [currentTenant.id])

  const filtered = useMemo(() => {
    return base
      .filter(r => locationId === "all" || r.locationId === locationId)
      .filter(r => rating    === "all" || r.rating    === Number(rating))
      .filter(r => sentiment === "all" || r.sentiment === sentiment)
      .filter(r => response  === "all" || (response === "pending" ? !r.responded : r.responded))
      .filter(r => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return r.reviewerName.toLowerCase().includes(q) || r.text.toLowerCase().includes(q) || (locationMap[r.locationId]?.city ?? "").toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (!a.responded && b.responded) return -1
        if (a.responded && !b.responded) return 1
        return b.date.localeCompare(a.date)
      })
  }, [base, locationId, rating, sentiment, response, search, locationMap])

  const total        = base.length
  const pending      = base.filter(r => !r.responded).length
  const urgent       = base.filter(r => !r.responded && r.rating <= 2).length
  const avgRating    = total ? (base.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "—"
  const responseRate = total ? Math.round(base.filter(r => r.responded).length / total * 100) : 0

  const hasFilters = locationId !== "all" || rating !== "all" || sentiment !== "all" || response !== "all" || search !== ""
  const clearFilters = () => { setLocationId("all"); setRating("all"); setSentiment("all"); setResponse("all"); setSearch("") }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="GBP Reviews" description={`${total} reviews · monitor and respond to customer feedback`} />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left filter panel ── */}
        <aside className="w-56 shrink-0 border-r bg-background overflow-y-auto flex flex-col gap-4 p-4">

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Filters</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <FilterSection label="Search" isActive={search !== ""}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 size-3 text-muted-foreground pointer-events-none" />
              <Input className="h-7 pl-7 pr-6 text-xs" placeholder="Reviewer, text…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1.5"><X className="size-3 text-muted-foreground hover:text-foreground" /></button>}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection label="Location" isActive={locationId !== "all"}>
            <LocationList value={locationId} onChange={setLocationId} locations={tenantLocations} />
          </FilterSection>

          {/* Rating */}
          <FilterSection label="Rating" isActive={rating !== "all"}>
            <FilterRow value={rating} options={RATING_OPTIONS} onChange={setRating} />
          </FilterSection>

          {/* Sentiment */}
          <FilterSection label="Sentiment" isActive={sentiment !== "all"}>
            <FilterRow value={sentiment} options={SENTIMENT_OPTIONS} onChange={setSentiment} />
          </FilterSection>

          {/* Response */}
          <FilterSection label="Response" isActive={response !== "all"}>
            <FilterRow value={response} options={RESPONSE_OPTIONS} onChange={setResponse} />
          </FilterSection>
        </aside>

        {/* ── Right: KPIs + list ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background px-4 py-3 shrink-0">
            <div className="grid grid-cols-5 gap-2.5">
              <KpiCard label="Total reviews"  value={total}              icon={Star}          accent="warning" />
              <KpiCard label="Avg rating"      value={avgRating}          icon={Star}          accent="warning" />
              <KpiCard label="Response rate"   value={`${responseRate}%`} icon={MessageCircle} accent={responseRate >= 80 ? "success" : responseRate >= 50 ? "warning" : "destructive"} />
              <KpiCard label="Pending reply"   value={pending}            icon={Clock}         accent={pending > 0 ? "warning" : "success"} />
              <KpiCard label="Urgent (1–2★)"  value={urgent}             icon={AlertTriangle}  accent={urgent  > 0 ? "destructive" : "success"} />
            </div>
          </div>

          <div className="border-b bg-background px-4 py-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}{hasFilters && " (filtered)"}
            </span>
          </div>

          <div className="flex-1 overflow-auto px-4 py-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-sm text-muted-foreground">
                <Star className="size-8 opacity-20" />
                <span>No reviews match your filters</span>
              </div>
            ) : (
              <div className="max-w-2xl space-y-3">
                {filtered.map(r => (
                  <ReviewCard key={r.id}
                    reviewerName={r.reviewerName} rating={r.rating} date={r.date}
                    locationName={locationMap[r.locationId] ? `${locationMap[r.locationId].name} · ${locationMap[r.locationId].city}` : r.locationId}
                    text={r.text} sentiment={r.sentiment} responded={r.responded} response={r.response} responseDate={r.responseDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
