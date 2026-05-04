import { useState } from "react"
import {
  CheckCircle2, XCircle, Clock,
  TrendingDown, AlertTriangle, LogIn, LogOut, MessageSquare,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { APPROVAL_REQUESTS } from "../mock-data"
import type { ApprovalRequest, ApprovalStatus } from "../mock-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function fmtVnd(n?: number) {
  if (!n) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr VND`
  return n.toLocaleString("vi-VN") + " VND"
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
type FilterTab = "all" | "in" | "out" | "pending" | "approved" | "rejected"

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  )
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  req, onApprove, onReject,
}: {
  req: ApprovalRequest
  onApprove: (id: string) => void
  onReject:  (id: string) => void
}) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote]         = useState("")

  const isOut     = req.type === "out"
  const isPending = req.status === "pending"

  const typeColor  = isOut ? "border-t-[hsl(var(--warning))]" : "border-t-[hsl(var(--info))]"
  const typeLabel  = isOut ? "OUT" : "IN"
  const TypeIcon   = isOut ? LogOut : LogIn

  const statusBadge: Record<ApprovalStatus, { label: string; variant: "warning" | "success" | "destructive" | "secondary" }> = {
    pending:  { label: "Chờ duyệt", variant: "warning"     },
    approved: { label: "Đã duyệt",  variant: "success"     },
    rejected: { label: "Từ chối",   variant: "destructive" },
  }
  const { label: statusLabel, variant: statusVariant } = statusBadge[req.status]

  return (
    <div className={cn("rounded-lg border bg-card p-4 border-t-2 space-y-3", typeColor)}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase shrink-0",
          isOut ? "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]" : "bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))]",
        )}>
          <TypeIcon className="size-3.5" />
          {typeLabel}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{req.skuName}</div>
          <div className="text-xs text-muted-foreground">{req.skuCode} · {req.brand}</div>
        </div>
        <Badge variant={statusVariant} className="uppercase shrink-0">{statusLabel}</Badge>
      </div>

      {/* Performance insight */}
      {req.revenue30d !== undefined && isOut && (
        <div className="flex items-center gap-2 bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
          <AlertTriangle className="size-4 text-destructive shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-destructive">Revenue 30d: </span>
            <span className="text-muted-foreground">{fmtVnd(req.revenue30d)}</span>
            {req.trendPct !== undefined && (
              <span className="text-destructive font-semibold ml-2">
                <TrendingDown className="size-3 inline" /> {Math.abs(req.trendPct)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lý do đề xuất</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{req.reason}</p>
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground border-t pt-2.5 space-y-0.5">
        <div>Yêu cầu bởi: <span className="font-medium text-foreground">{req.requestedBy}</span> · {fmtDate(req.requestedAt)}</div>
        {req.reviewedBy && (
          <div>Xử lý bởi: <span className="font-medium text-foreground">{req.reviewedBy}</span> · {fmtDate(req.reviewedAt!)}</div>
        )}
        {req.reviewNote && (
          <div className="flex items-start gap-1.5 mt-1.5 bg-muted/50 rounded px-2.5 py-1.5">
            <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <span className="italic text-xs">{req.reviewNote}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="border-t pt-3 space-y-2">
          {showNote ? (
            <>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ghi chú phê duyệt / từ chối (tuỳ chọn)…"
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onApprove(req.id); setShowNote(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))] hover:opacity-80 transition-opacity text-sm font-medium"
                >
                  <CheckCircle2 className="size-4" /> Phê duyệt
                </button>
                <button
                  onClick={() => { onReject(req.id); setShowNote(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
                >
                  <XCircle className="size-4" /> Từ chối
                </button>
                <button
                  onClick={() => setShowNote(false)}
                  className="ml-auto px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowNote(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))] hover:opacity-80 transition-opacity text-sm font-medium"
              >
                <CheckCircle2 className="size-4" /> Phê duyệt
              </button>
              <button
                onClick={() => setShowNote(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
              >
                <XCircle className="size-4" /> Từ chối
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProductsInOutApprovalPage() {
  const [requests, setRequests] = useState(APPROVAL_REQUESTS)
  const [tab, setTab]           = useState<FilterTab>("pending")

  const filtered = requests.filter(r => {
    if (tab === "all")      return true
    if (tab === "in")       return r.type === "in"
    if (tab === "out")      return r.type === "out"
    if (tab === "pending")  return r.status === "pending"
    if (tab === "approved") return r.status === "approved"
    if (tab === "rejected") return r.status === "rejected"
    return true
  })

  const pending  = requests.filter(r => r.status === "pending").length
  const inCount  = requests.filter(r => r.type === "in").length
  const outCount = requests.filter(r => r.type === "out").length

  function approve(id: string) {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: "approved" as const, reviewedBy: "Bạn", reviewedAt: new Date().toISOString() } : r
    ))
  }
  function reject(id: string) {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: "rejected" as const, reviewedBy: "Bạn", reviewedAt: new Date().toISOString() } : r
    ))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="In-Out Approval"
        description="Quy trình duyệt mở mã sản phẩm mới & khóa mã sản phẩm yếu"
      />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 space-y-5">

          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card px-4 py-3 border-t-2 border-t-[hsl(var(--warning))]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đang chờ duyệt</span>
                <Clock className="size-4 text-[hsl(var(--warning))]" />
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--warning))]">{pending}</div>
              <p className="text-xs text-muted-foreground">yêu cầu cần xử lý</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 border-t-2 border-t-[hsl(var(--info))]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mở mã (IN)</span>
                <LogIn className="size-4 text-[hsl(var(--info))]" />
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--info))]">{inCount}</div>
              <p className="text-xs text-muted-foreground">sản phẩm mới đăng ký</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 border-t-2 border-t-[hsl(var(--warning))]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Khóa mã (OUT)</span>
                <LogOut className="size-4 text-[hsl(var(--warning))]" />
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--warning))]">{outCount}</div>
              <p className="text-xs text-muted-foreground">sản phẩm performance yếu</p>
            </div>
          </div>

          {/* ── Process Info ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-4 border-l-4 border-l-[hsl(var(--info))]">
              <div className="flex items-center gap-2 mb-3">
                <LogIn className="size-4 text-[hsl(var(--info))]" />
                <h3 className="text-sm font-semibold">Quy trình Mở mã (IN)</h3>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--info))] shrink-0">1.</span> Supplier / Category Manager đề xuất sản phẩm mới</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--info))] shrink-0">2.</span> Điền đầy đủ thông tin: giá nhập, margin dự kiến, nhóm danh mục</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--info))] shrink-0">3.</span> Category Head review & phê duyệt / từ chối</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--info))] shrink-0">4.</span> Hệ thống tự động Active mã SKU sau khi duyệt</li>
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-4 border-l-4 border-l-[hsl(var(--warning))]">
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="size-4 text-[hsl(var(--warning))]" />
                <h3 className="text-sm font-semibold">Quy trình Khóa mã (OUT)</h3>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--warning))] shrink-0">1.</span> Hệ thống cảnh báo SKU có revenue giảm &gt;30% liên tiếp 30 ngày</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--warning))] shrink-0">2.</span> Category Manager xem xét & gửi đề xuất khóa mã</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--warning))] shrink-0">3.</span> Category Head phê duyệt / từ chối với ghi chú</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[hsl(var(--warning))] shrink-0">4.</span> SKU chuyển trạng thái Suspended → Closed sau khi duyệt</li>
              </ol>
            </div>
          </div>

          {/* ── Tabs + List ── */}
          <div>
            <div className="flex items-center gap-1 flex-wrap mb-4">
              {(["pending", "all", "in", "out", "approved", "rejected"] as FilterTab[]).map(t => (
                <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
                  {t === "pending" ? `Chờ duyệt (${pending})` :
                   t === "all"     ? "Tất cả" :
                   t === "in"      ? `Mở mã (${inCount})` :
                   t === "out"     ? `Khóa mã (${outCount})` :
                   t === "approved" ? "Đã duyệt" : "Từ chối"}
                </TabBtn>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed">
                <CheckCircle2 className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Không có yêu cầu nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(req => (
                  <RequestCard key={req.id} req={req} onApprove={approve} onReject={reject} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
