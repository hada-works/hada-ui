import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout/Header"
import { Store, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Clock, PackageX, Activity, LayoutDashboard, MapPin, Grid, ChevronRight, ChevronDown, X, ZoomIn, ZoomOut, Camera } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type CellDetail = {
  region: string;
  store: string;
  colKey: string;
  value: number;
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const OSA_STATS = {
  totalStores: 124,
  storesWithOos: 32,
  overallOsaPct: 96.4,
  oosLinesCount: 1450,
  urgentOos: 350
}

const REGION_STATS = [
  { region: "Hồ Chí Minh", osaPct: 95.8, oosLines: 650, stores: 52 },
  { region: "Hà Nội", osaPct: 97.2, oosLines: 320, stores: 38 },
  { region: "Đà Nẵng", osaPct: 94.5, oosLines: 180, stores: 12 },
  { region: "Tỉnh Khác", osaPct: 97.8, oosLines: 300, stores: 22 },
]

const CATEGORY_STATS = [
  { name: "Sữa & Chế phẩm", osaPct: 92.1, oosLines: 420 },
  { name: "Thịt Cá Tươi Sống", osaPct: 88.5, oosLines: 610 },
  { name: "Rau Củ Quả", osaPct: 90.2, oosLines: 310 },
  { name: "Đồ Khô & Gia Vị", osaPct: 98.4, oosLines: 110 },
]

const CATEGORY_KEYS = ["Sữa & Chế phẩm", "Thịt Cá Tươi Sống", "Rau Củ Quả", "Đồ Khô & Gia Vị"]

const HOURS = ["06h", "07h", "08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h"]

const HEATMAP_DATA = [
  { 
    region: "Hồ Chí Minh", 
    categories: { "Sữa & Chế phẩm": 45, "Thịt Cá Tươi Sống": 120, "Rau Củ Quả": 80, "Đồ Khô & Gia Vị": 15 },
    stores: [
      { name: "CH Quận 1 - Nguyễn Thị Minh Khai", categories: { "Sữa & Chế phẩm": 25, "Thịt Cá Tươi Sống": 70, "Rau Củ Quả": 45, "Đồ Khô & Gia Vị": 10 } },
      { name: "CH Gò Vấp - Quang Trung", categories: { "Sữa & Chế phẩm": 20, "Thịt Cá Tươi Sống": 50, "Rau Củ Quả": 35, "Đồ Khô & Gia Vị": 5 } }
    ]
  },
  { 
    region: "Hà Nội", 
    categories: { "Sữa & Chế phẩm": 30, "Thịt Cá Tươi Sống": 85, "Rau Củ Quả": 55, "Đồ Khô & Gia Vị": 10 },
    stores: [
      { name: "CH Cầu Giấy - Xuân Thủy", categories: { "Sữa & Chế phẩm": 18, "Thịt Cá Tươi Sống": 45, "Rau Củ Quả": 30, "Đồ Khô & Gia Vị": 6 } },
      { name: "CH Đống Đa - Thái Hà", categories: { "Sữa & Chế phẩm": 12, "Thịt Cá Tươi Sống": 40, "Rau Củ Quả": 25, "Đồ Khô & Gia Vị": 4 } }
    ]
  },
  { 
    region: "Đà Nẵng", 
    categories: { "Sữa & Chế phẩm": 50, "Thịt Cá Tươi Sống": 140, "Rau Củ Quả": 95, "Đồ Khô & Gia Vị": 25 },
    stores: [
      { name: "CH Hải Châu - Lê Duẩn", categories: { "Sữa & Chế phẩm": 50, "Thịt Cá Tươi Sống": 140, "Rau Củ Quả": 95, "Đồ Khô & Gia Vị": 25 } }
    ]
  },
  { 
    region: "Tỉnh Khác", 
    categories: { "Sữa & Chế phẩm": 25, "Thịt Cá Tươi Sống": 60, "Rau Củ Quả": 40, "Đồ Khô & Gia Vị": 8 },
    stores: [
      { name: "CH Cần Thơ - Ninh Kiều", categories: { "Sữa & Chế phẩm": 25, "Thịt Cá Tươi Sống": 60, "Rau Củ Quả": 40, "Đồ Khô & Gia Vị": 8 } }
    ]
  },
]

const TIMELINE_DATA = [
  { 
    region: "Hồ Chí Minh", 
    hours: [20, 35, 45, 60, 85, 90, 70, 50, 45, 60, 85, 110, 130, 90, 40, 15],
    stores: [
      { name: "CH Quận 1 - Nguyễn Thị Minh Khai", hours: [5, 8, 12, 15, 20, 25, 18, 12, 10, 15, 25, 35, 45, 25, 10, 4] },
      { name: "CH Gò Vấp - Quang Trung", hours: [15, 27, 33, 45, 65, 65, 52, 38, 35, 45, 60, 75, 85, 65, 30, 11] }
    ]
  },
  { 
    region: "Hà Nội", 
    hours: [15, 25, 30, 50, 70, 80, 60, 40, 35, 50, 75, 90, 105, 80, 35, 10],
    stores: [
      { name: "CH Cầu Giấy - Xuân Thủy", hours: [8, 12, 15, 25, 35, 40, 30, 20, 18, 25, 40, 50, 60, 45, 20, 5] },
      { name: "CH Đống Đa - Thái Hà", hours: [7, 13, 15, 25, 35, 40, 30, 20, 17, 25, 35, 40, 45, 35, 15, 5] }
    ]
  },
  { 
    region: "Đà Nẵng", 
    hours: [5, 10, 15, 25, 35, 45, 35, 25, 20, 30, 45, 60, 70, 50, 20, 8],
    stores: [
      { name: "CH Hải Châu - Lê Duẩn", hours: [5, 10, 15, 25, 35, 45, 35, 25, 20, 30, 45, 60, 70, 50, 20, 8] }
    ]
  },
  { 
    region: "Tỉnh Khác", 
    hours: [10, 20, 25, 40, 55, 65, 50, 35, 30, 40, 60, 75, 90, 70, 30, 12],
    stores: [
      { name: "CH Cần Thơ - Ninh Kiều", hours: [10, 20, 25, 40, 55, 65, 50, 35, 30, 40, 60, 75, 90, 70, 30, 12] }
    ]
  },
]

const STORE_ALERTS = [
  { id: "S001", name: "CH Quận 1 - Nguyễn Thị Minh Khai", region: "Hồ Chí Minh", oosLines: 125, urgent: 45, osaPct: 89.2 },
  { id: "S045", name: "CH Gò Vấp - Quang Trung", region: "Hồ Chí Minh", oosLines: 98, urgent: 20, osaPct: 91.5 },
  { id: "S082", name: "CH Cầu Giấy - Xuân Thủy", region: "Hà Nội", oosLines: 85, urgent: 15, osaPct: 92.1 },
  { id: "S105", name: "CH Hải Châu - Lê Duẩn", region: "Đà Nẵng", oosLines: 110, urgent: 30, osaPct: 87.5 },
  { id: "S032", name: "CH Bình Thạnh - Xô Viết Nghệ Tĩnh", region: "Hồ Chí Minh", oosLines: 105, urgent: 25, osaPct: 90.0 },
  { id: "S112", name: "CH Hoàn Kiếm - Hai Bà Trưng", region: "Hà Nội", oosLines: 78, urgent: 12, osaPct: 93.4 },
  { id: "S099", name: "CH Thủ Đức - Võ Văn Ngân", region: "Hồ Chí Minh", oosLines: 95, urgent: 18, osaPct: 90.8 },
  { id: "S021", name: "CH Quận 7 - Nguyễn Thị Thập", region: "Hồ Chí Minh", oosLines: 88, urgent: 14, osaPct: 91.2 },
  { id: "S133", name: "CH Thanh Khê - Điện Biên Phủ", region: "Đà Nẵng", oosLines: 72, urgent: 10, osaPct: 94.1 },
  { id: "S067", name: "CH Cần Thơ - 30 Tháng 4", region: "Tỉnh Khác", oosLines: 82, urgent: 16, osaPct: 92.5 },
]

function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n) }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; accent: "default"|"success"|"warning"|"destructive"|"info"; trend?: number
}) {
  const c = { default:"text-primary", success:"text-[hsl(var(--success))]", warning:"text-[hsl(var(--warning))]", destructive:"text-destructive", info:"text-[hsl(var(--info))]" }[accent]
  const b = { default:"border-t-primary", success:"border-t-[hsl(var(--success))]", warning:"border-t-[hsl(var(--warning))]", destructive:"border-t-destructive", info:"border-t-[hsl(var(--info))]" }[accent]
  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3.5 border-t-2 hover:shadow-sm transition-shadow", b)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-4 shrink-0", c)} />
      </div>
      <div className={cn("text-2xl font-bold leading-none mb-1.5", c)}>{value}</div>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-semibold ml-auto", trend >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────
function HBar({ label, value, max, color, subValue }: { label: string; value: number; max: number; color: string; subValue?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <div className="flex flex-col items-end w-16 shrink-0">
        <span className="text-xs font-semibold tabular-nums">{value}%</span>
        {subValue && <span className="text-[10px] text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function OsaHeatmap({ data, cols, onCellClick }: { data: typeof HEATMAP_DATA, cols: string[], onCellClick: (c: CellDetail) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const getColor = (val: number) => {
    if (val === 0) return "bg-muted/30 text-muted-foreground"
    if (val <= 15) return "bg-[hsl(var(--success))] text-white"
    if (val <= 40) return "bg-[hsl(var(--warning))] text-white"
    return "bg-destructive text-white"
  }
  
  const toggle = (region: string) => {
    setExpanded(prev => ({ ...prev, [region]: !prev[region] }))
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="flex border-b">
          <div className="w-56 p-2 text-xs font-semibold text-muted-foreground">Khu vực / Chi nhánh</div>
          {cols.map(c => <div key={c} className="flex-1 p-2 text-xs font-semibold text-center text-muted-foreground truncate" title={c}>{c}</div>)}
        </div>
        {/* Rows */}
        {data.map(row => {
          const isExpanded = expanded[row.region]
          return (
            <div key={row.region} className="flex flex-col border-b last:border-0 transition-colors">
              
              {/* Region Row */}
              <div 
                className="flex items-center hover:bg-muted/30 cursor-pointer"
                onClick={() => toggle(row.region)}
              >
                <div className="w-56 p-2 text-xs font-medium flex items-center gap-1">
                  {isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                  {row.region}
                </div>
                {cols.map(c => {
                  const val = row.categories[c as keyof typeof row.categories]
                  return (
                    <div key={c} className="flex-1 p-1">
                      <div className={cn("h-8 w-full rounded flex items-center justify-center text-xs font-bold transition-all shadow-sm", getColor(val))}>
                        {val}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stores Row (Drilldown) */}
              {isExpanded && (
                <div className="bg-muted/10 border-t border-dashed">
                  {row.stores.map(store => (
                    <div key={store.name} className="flex items-center hover:bg-muted/20 border-b border-dashed last:border-0">
                      <div className="w-56 p-2 pl-8 text-xs text-muted-foreground truncate flex items-center gap-1" title={store.name}>
                        <Store className="size-3 shrink-0" />
                        <span className="truncate">{store.name}</span>
                      </div>
                      {cols.map(c => {
                        const val = store.categories[c as keyof typeof store.categories]
                        return (
                          <div key={c} className="flex-1 p-1">
                            <div 
                              className={cn("h-7 w-full rounded flex items-center justify-center text-[11px] font-semibold opacity-90 hover:opacity-100 transition-opacity cursor-pointer", getColor(val))}
                              onClick={() => onCellClick({ region: row.region, store: store.name, colKey: c, value: val })}
                            >
                              {val}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Timeline Heatmap ─────────────────────────────────────────────────────────
function OsaTimelineHeatmap({ data, hours, onCellClick }: { data: typeof TIMELINE_DATA, hours: string[], onCellClick: (c: CellDetail) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Inverse logic: more OOS = red (bad), less OOS = green (good)
  const getColor = (val: number) => {
    if (val === 0) return "bg-muted/30 text-muted-foreground"
    if (val <= 15) return "bg-[hsl(var(--success))] text-white"
    if (val <= 40) return "bg-[hsl(var(--warning))] text-white"
    return "bg-destructive text-white"
  }
  
  const toggle = (region: string) => {
    setExpanded(prev => ({ ...prev, [region]: !prev[region] }))
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex border-b">
          <div className="w-56 p-2 text-[10px] font-semibold text-muted-foreground flex items-end uppercase">Khu vực / Chi nhánh</div>
          {hours.map(h => <div key={h} className="flex-1 p-2 text-xs font-semibold text-center text-muted-foreground">{h}</div>)}
        </div>
        {/* Rows */}
        {data.map(row => {
          const isExpanded = expanded[row.region]
          return (
            <div key={row.region} className="flex flex-col border-b last:border-0 transition-colors">
              
              {/* Region Row */}
              <div 
                className="flex items-center hover:bg-muted/30 cursor-pointer py-1"
                onClick={() => toggle(row.region)}
              >
                <div className="w-56 p-2 text-xs font-medium flex items-center gap-1">
                  {isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                  {row.region}
                </div>
                {row.hours.map((val, idx) => (
                  <div key={idx} className="flex-1 p-0.5">
                    <div className={cn("h-7 w-full rounded-sm flex items-center justify-center text-[11px] font-bold transition-all shadow-sm", getColor(val))}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stores Row (Drilldown) */}
              {isExpanded && (
                <div className="bg-muted/10 border-t border-dashed py-1">
                  {row.stores.map(store => (
                    <div key={store.name} className="flex items-center hover:bg-muted/20 border-b border-dashed last:border-0 py-0.5">
                      <div className="w-56 p-2 pl-8 text-xs text-muted-foreground truncate flex items-center gap-1" title={store.name}>
                        <Store className="size-3 shrink-0" />
                        <span className="truncate">{store.name}</span>
                      </div>
                      {store.hours.map((val, idx) => (
                        <div key={idx} className="flex-1 p-0.5">
                          <div 
                            className={cn("h-6 w-full rounded-sm flex items-center justify-center text-[10px] font-semibold opacity-90 hover:opacity-100 transition-opacity cursor-pointer", getColor(val))}
                            onClick={() => onCellClick({ region: row.region, store: store.name, colKey: hours[idx], value: val })}
                          >
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function OsaDetailModal({ cell, onClose }: { cell: CellDetail, onClose: () => void }) {
  const [zoomedImage, setZoomedImage] = useState<{src: string, label: string} | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(480)
  const isResizing = useRef(false)
  const isDragging = useRef(false)

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= 320 && newWidth <= 1200) {
          setSidebarWidth(newWidth)
        }
      })
    }
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false
        document.body.style.cursor = 'default'
        setTimeout(() => {
          isDragging.current = false
        }, 100)
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])
  
  // Mocking multiple records for the AI detection every 10 mins
  const mockRecords = Array.from({ length: 6 }).map((_, i) => {
    const min = (i * 10).toString().padStart(2, '0')
    return {
      id: i + 1,
      time: cell.colKey.includes('h') ? cell.colKey.replace('h', `:${min}`) : `14:${min}`,
      category: cell.colKey.includes('h') ? (i % 2 === 0 ? "Sữa & Chế phẩm" : "Thịt Cá Tươi Sống") : cell.colKey,
      camera: "CAM-03",
      oosLines: Math.max(1, Math.floor(cell.value * (0.15 + (Math.random() * 0.1)))),
      image: i % 2 === 0 ? "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=1000&auto=format&fit=crop" : "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1000&auto=format&fit=crop"
    }
  })

  if (zoomedImage) {
    return (
      <div 
        className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in"
        onClick={() => setZoomedImage(null)}
      >
        <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/50 rounded-full transition-colors">
          <ZoomOut className="size-6" />
        </button>
        <img 
          src={zoomedImage.src} 
          alt="Fullsize Shelf" 
          className="max-w-full max-h-[90vh] object-contain rounded-md" 
          onClick={(e) => e.stopPropagation()} 
        />
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{cell.store}</span>
          <span className="text-white/50">•</span>
          <span>{zoomedImage.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/20 flex justify-end backdrop-blur-[2px]" 
      onClick={() => {
        if (!isDragging.current) onClose()
      }}
    >
      <div 
        className="bg-background shadow-2xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right-full duration-300 border-l relative" 
        style={{ width: sidebarWidth, maxWidth: '90vw', transition: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors"
          onMouseDown={() => {
            isResizing.current = true
            isDragging.current = true
            document.body.style.cursor = 'col-resize'
          }}
        />
        
        {/* Modal Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b bg-card">
          <div>
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <Camera className="size-5 text-[hsl(var(--info))]" />
              Lịch sử ghi nhận AI (OOS)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {cell.store} • {cell.region} • <span className="font-medium text-foreground">{cell.colKey}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-md transition-colors">
            <X className="size-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-0 overflow-y-auto flex-1 bg-muted/10">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="destructive" className="px-3 py-1 text-sm shadow-sm">Tổng OOS: {cell.value}</Badge>
              <Badge variant="outline" className="bg-background px-3 py-1 shadow-sm text-muted-foreground">Chu kỳ quét: 10 phút</Badge>
            </div>
            
            <div className="space-y-4">
              {mockRecords.map(record => (
                <div key={record.id} className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex p-3 gap-4">
                    
                    {/* Image Thumbnail */}
                    <div 
                      className="relative w-28 h-20 sm:w-36 sm:h-24 bg-muted cursor-zoom-in group shrink-0 rounded-md overflow-hidden border"
                      onClick={() => setZoomedImage({ src: record.image, label: `${record.time} - ${record.category}` })}
                    >
                      <img src={record.image} alt="Shelf" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="size-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
                      </div>
                    </div>

                    {/* Record Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground truncate">
                          <Clock className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">Hôm nay, {record.time}</span>
                        </div>
                        <div className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded border border-destructive/20 shrink-0">
                          {record.oosLines} OOS
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs mt-1">
                        <div className="flex justify-between border-b border-dashed pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Camera className="size-3" /> Kênh</span>
                          <span className="font-medium text-foreground truncate pl-2">{record.camera}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Ngành hàng</span>
                          <span className="font-medium text-foreground text-right truncate pl-2">{record.category}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-5 py-3 border-t bg-muted/30 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow hover:bg-primary/90 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export function OsaDashboardPage() {
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header 
        title="OSA Dashboard" 
        description="On Shelf Availability - Theo dõi tình hình trống kệ, thiếu hàng tại cửa hàng" 
        action={{ label: "Export Báo Cáo", onClick: () => {} }} 
      />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 space-y-6">

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Tỷ lệ OSA" value={`${OSA_STATS.overallOsaPct}%`} sub="toàn hệ thống" icon={Activity} accent="success" trend={0.5} />
            <KpiCard label="Tổng OOS Lines" value={fmtK(OSA_STATS.oosLinesCount)} sub="dòng thiếu hàng" icon={PackageX} accent="warning" trend={-1.2} />
            <KpiCard label="Cảnh báo Khẩn cấp" value={OSA_STATS.urgentOos} sub="OOS kéo dài > 4h" icon={AlertTriangle} accent="destructive" />
            <KpiCard label="Cửa hàng OOS cao" value={OSA_STATS.storesWithOos} sub={`/ ${OSA_STATS.totalStores} cửa hàng`} icon={Store} accent="warning" />
            <KpiCard label="Thời gian OOS TB" value="1.5h" sub="thời gian xử lý trống kệ" icon={Clock} accent="info" trend={-5} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* ── Column 1: Heatmap (Span 2) ── */}
            <div className="xl:col-span-2 flex flex-col">
              <div className="rounded-lg border bg-card overflow-hidden flex flex-col shrink-0">
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Grid className="size-4 text-primary" />
                    <h2 className="text-base font-semibold">Bản đồ Nhiệt (Heatmap) Tình Hình Thiếu Hàng (OOS Lines)</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground hidden sm:flex">
                    <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-[hsl(var(--success))]" /> Tốt</div>
                    <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-[hsl(var(--warning))]" /> Vừa</div>
                    <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-destructive" /> Kém</div>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  <OsaHeatmap data={HEATMAP_DATA} cols={CATEGORY_KEYS} onCellClick={setSelectedCell} />
                </div>
              </div>

              {/* ── Timeline Chart ── */}
              <div className="rounded-lg border bg-card overflow-hidden flex flex-col flex-1 mt-6">
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[hsl(var(--info))]" />
                    <h2 className="text-base font-semibold">Tình Hình Thiếu Hàng Theo Khung Giờ (OOS Lines)</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground hidden sm:flex">
                      <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-[hsl(var(--success))]" /> Tốt</div>
                      <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-[hsl(var(--warning))]" /> Vừa</div>
                      <div className="flex items-center gap-1"><div className="size-3 rounded-sm bg-destructive" /> Kém</div>
                    </div>
                    <select className="text-xs font-medium border rounded-md px-2 py-1.5 bg-background text-foreground hover:bg-muted/50 cursor-pointer outline-none">
                      <option>Hôm nay</option>
                      <option>Hôm qua</option>
                      <option>Tuần này</option>
                      <option>Tháng này</option>
                      <option>Tháng trước</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  <OsaTimelineHeatmap data={TIMELINE_DATA} hours={HOURS} onCellClick={setSelectedCell} />
                </div>
              </div>
            </div>

            {/* ── Column 2: Stacked Widgets ── */}
            <div className="space-y-6 flex flex-col">
              
              {/* ── Cảnh báo Cửa Hàng ── */}
              <div className="rounded-lg border bg-card overflow-hidden flex flex-col shrink-0 max-h-[350px]">
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" />
                    <h2 className="text-base font-semibold">Cửa hàng cần xử lý gấp</h2>
                  </div>
                  <Badge variant="destructive">{STORE_ALERTS.length} cửa hàng</Badge>
                </div>
                <div className="divide-y overflow-auto">
                  {STORE_ALERTS.map(store => (
                    <div key={store.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{store.name}</span>
                          <Badge variant="outline" className="text-[10px]">{store.region}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">Tỷ lệ OSA hiện tại: <span className={cn("font-medium", store.osaPct < 90 ? "text-destructive" : "text-[hsl(var(--warning))]")}>{store.osaPct}%</span></div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">OOS Lines:</span>
                          <span className="font-semibold">{store.oosLines}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-destructive font-medium flex items-center gap-1">
                            <Clock className="size-3" />
                            {store.urgent} Khẩn cấp (&gt;4h)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Phân tích theo Khu Vực ── */}
              <div className="rounded-lg border bg-card p-4 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="size-4 text-[hsl(var(--info))]" />
                  <h2 className="text-base font-semibold">OSA Theo Khu Vực</h2>
                </div>
                <div className="space-y-3">
                  {REGION_STATS.map(r => (
                    <HBar 
                      key={r.region} 
                      label={r.region} 
                      value={r.osaPct} 
                      max={100} 
                      color={r.osaPct < 95 ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--success))]"} 
                      subValue={`${r.oosLines} lines`}
                    />
                  ))}
                </div>
              </div>

              {/* ── Top Ngành Hàng ── */}
              <div className="rounded-lg border bg-card p-4 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <Grid className="size-4 text-[hsl(var(--warning))]" />
                  <h2 className="text-base font-semibold">Top Ngành Hàng Thiếu Hàng</h2>
                </div>
                <div className="space-y-3">
                  {[...CATEGORY_STATS].sort((a,b) => a.osaPct - b.osaPct).map(c => (
                    <HBar 
                      key={c.name} 
                      label={c.name} 
                      value={c.osaPct} 
                      max={100} 
                      color={c.osaPct < 90 ? "bg-destructive" : "bg-[hsl(var(--warning))]"} 
                      subValue={`${c.oosLines} lines`}
                    />
                  ))}
                </div>
              </div>

              {/* ── Top Siêu Thị Thiếu Hàng ── */}
              <div className="rounded-lg border bg-card p-4 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="size-4 text-destructive" />
                  <h2 className="text-base font-semibold">Top Siêu Thị Thiếu Hàng</h2>
                </div>
                <div className="space-y-3">
                  {[...STORE_ALERTS].sort((a,b) => a.osaPct - b.osaPct).slice(0, 10).map(store => (
                    <HBar 
                      key={store.id} 
                      label={store.name} 
                      value={store.osaPct} 
                      max={100} 
                      color={store.osaPct < 90 ? "bg-destructive" : "bg-[hsl(var(--warning))]"} 
                      subValue={`${store.oosLines} lines`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {selectedCell && (
        <OsaDetailModal cell={selectedCell} onClose={() => setSelectedCell(null)} />
      )}
    </div>
  )
}
