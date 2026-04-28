import { useState } from "react"
import {
  Zap, Shield, Clock, Bell, Users, AlertTriangle,
  Plus, Trash2, Info, ChevronDown, Check, Save,
} from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutoApproveRule {
  id: string
  name: string
  monthlyBudgetCap: number
  perRequestCap: number
  requireMdmFirst: boolean
  maxStockDays: number
  maxProjectedDaysPostDeal: number
  minSalesVelocity: number
  enabled: boolean
}

interface ApprovalConstraint {
  id: string
  label: string
  field: string
  operator: string
  value: number
  unit: string
  action: "reject" | "flag" | "require_info"
  enabled: boolean
}

interface NotificationRule {
  id: string
  event: string
  recipients: string[]
  channel: string
  enabled: boolean
}

interface ApproverConfig {
  id: string
  name: string
  email: string
  role: "MDM" | "SCM" | "Both"
  category: string
  active: boolean
}

// ─── Mock state ───────────────────────────────────────────────────────────────

const DEFAULT_AUTO_RULES: AutoApproveRule[] = [
  {
    id: "rule-1",
    name: "Pool tháng — Hàng tiêu dùng nhanh",
    monthlyBudgetCap: 2_000_000_000,
    perRequestCap: 300_000_000,
    requireMdmFirst: true,
    maxStockDays: 30,
    maxProjectedDaysPostDeal: 14,
    minSalesVelocity: 50,
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Pool tháng — Hàng khô & đóng gói",
    monthlyBudgetCap: 1_500_000_000,
    perRequestCap: 200_000_000,
    requireMdmFirst: true,
    maxStockDays: 45,
    maxProjectedDaysPostDeal: 21,
    minSalesVelocity: 30,
    enabled: true,
  },
  {
    id: "rule-3",
    name: "Pool khẩn cấp — Nhà cung cấp chiến lược",
    monthlyBudgetCap: 500_000_000,
    perRequestCap: 150_000_000,
    requireMdmFirst: false,
    maxStockDays: 20,
    maxProjectedDaysPostDeal: 10,
    minSalesVelocity: 80,
    enabled: false,
  },
]

const DEFAULT_CONSTRAINTS: ApprovalConstraint[] = [
  { id: "c1", label: "Tồn kho quá cao", field: "daysStockTotal", operator: ">", value: 60, unit: "ngày", action: "reject", enabled: true },
  { id: "c2", label: "Chênh lệch FC vs Actual vượt ngưỡng", field: "salesFcVsActualDiff", operator: ">", value: 30, unit: "%", action: "flag", enabled: true },
  { id: "c3", label: "Ngày tồn DC sau deal quá cao", field: "projectedDCDaysPostDeal", operator: ">", value: 45, unit: "ngày", action: "flag", enabled: true },
  { id: "c4", label: "Giá trị đơn vượt ngưỡng cảnh báo", field: "orderValue", operator: ">", value: 1_000_000_000, unit: "₫", action: "require_info", enabled: true },
  { id: "c5", label: "Sức bán dự kiến quá thấp", field: "projectedDailySales", operator: "<", value: 10, unit: "đơn/ngày", action: "reject", enabled: false },
  { id: "c6", label: "Deal window dưới tối thiểu", field: "dealWindowDays", operator: "<", value: 7, unit: "ngày", action: "flag", enabled: true },
]

const DEFAULT_NOTIFICATIONS: NotificationRule[] = [
  { id: "n1", event: "Request mới cần duyệt MDM", recipients: ["mdm-team@company.vn"], channel: "email", enabled: true },
  { id: "n2", event: "MDM đã duyệt — chờ SCM confirm", recipients: ["scm-team@company.vn"], channel: "email", enabled: true },
  { id: "n3", event: "Request bị reject", recipients: ["requester", "mdm-team@company.vn"], channel: "email", enabled: true },
  { id: "n4", event: "Chờ duyệt quá 2 ngày (MDM)", recipients: ["mdm-manager@company.vn"], channel: "email", enabled: true },
  { id: "n5", event: "Chờ SCM confirm quá SLA", recipients: ["scm-manager@company.vn", "admin@company.vn"], channel: "email", enabled: true },
  { id: "n6", event: "Auto-approved — thông báo ghi nhận", recipients: ["requester", "scm-team@company.vn"], channel: "slack", enabled: false },
  { id: "n7", event: "Pool budget đã dùng > 80%", recipients: ["admin@company.vn", "finance@company.vn"], channel: "email", enabled: true },
]

const DEFAULT_APPROVERS: ApproverConfig[] = [
  { id: "a1", name: "Nguyễn Văn Minh", email: "minh.nv@company.vn", role: "MDM", category: "Tất cả", active: true },
  { id: "a2", name: "Trần Thị Lan", email: "lan.tt@company.vn", role: "MDM", category: "Hàng tiêu dùng nhanh", active: true },
  { id: "a3", name: "Lê Hoàng Nam", email: "nam.lh@company.vn", role: "SCM", category: "Tất cả", active: true },
  { id: "a4", name: "Phạm Thu Hà", email: "ha.pt@company.vn", role: "SCM", category: "Hàng khô & đóng gói", active: true },
  { id: "a5", name: "Đỗ Bảo Long", email: "long.db@company.vn", role: "Both", category: "Nhà cung cấp chiến lược", active: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBig = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " tr"
  return n.toLocaleString("vi-VN")
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none",
        enabled ? "bg-primary" : "bg-muted"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
        enabled ? "translate-x-4" : "translate-x-1"
      )} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  )
}

function ActionBadge({ action }: { action: "reject" | "flag" | "require_info" }) {
  if (action === "reject")       return <Badge variant="destructive" className="text-xs">Auto reject</Badge>
  if (action === "flag")         return <Badge variant="warning" className="text-xs">Flag cảnh báo</Badge>
  if (action === "require_info") return <Badge variant="info" className="text-xs">Yêu cầu bổ sung</Badge>
  return null
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PurchasesSettings() {
  const [autoRules, setAutoRules]         = useState<AutoApproveRule[]>(DEFAULT_AUTO_RULES)
  const [constraints, setConstraints]     = useState<ApprovalConstraint[]>(DEFAULT_CONSTRAINTS)
  const [notifications, setNotifications] = useState<NotificationRule[]>(DEFAULT_NOTIFICATIONS)
  const [approvers]                       = useState<ApproverConfig[]>(DEFAULT_APPROVERS)
  const [mdmSla, setMdmSla]               = useState("2")
  const [scmSla, setScmSla]               = useState("3")
  const [autoEscalate, setAutoEscalate]   = useState(true)
  const [parallelApproval, setParallelApproval] = useState(false)
  const [savedTab, setSavedTab]           = useState<string | null>(null)

  function toggleRule(id: string) {
    setAutoRules(r => r.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))
  }
  function toggleConstraint(id: string) {
    setConstraints(c => c.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))
  }
  function toggleNotif(id: string) {
    setNotifications(n => n.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))
  }
  function handleSave(tab: string) {
    setSavedTab(tab)
    setTimeout(() => setSavedTab(null), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Purchases Settings"
        description="Cấu hình các ràng buộc, pool tự động, SLA và phân quyền để tối ưu hóa quy trình duyệt mua hàng"
      />

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <Tabs defaultValue="auto-approve" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="auto-approve" className="text-xs gap-1.5">
              <Zap className="size-3.5" />Auto-Approve Pool
            </TabsTrigger>
            <TabsTrigger value="constraints" className="text-xs gap-1.5">
              <Shield className="size-3.5" />Ràng buộc
            </TabsTrigger>
            <TabsTrigger value="sla" className="text-xs gap-1.5">
              <Clock className="size-3.5" />SLA & Leo thang
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5">
              <Bell className="size-3.5" />Thông báo
            </TabsTrigger>
            <TabsTrigger value="approvers" className="text-xs gap-1.5">
              <Users className="size-3.5" />Người duyệt
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Auto-Approve Pool ── */}
          <TabsContent value="auto-approve" className="space-y-4 mt-4">
            <Card className="p-5">
              <SectionHeader
                icon={Zap}
                title="Pool Duyệt Tự Động"
                desc="Nếu tổng ngân sách đã duyệt trong tháng còn trong pool và request đủ điều kiện (MDM đã duyệt + vượt qua các ràng buộc), SCM sẽ được tự động bỏ qua (auto-approve)."
              />

              <div className="space-y-3">
                {autoRules.map(rule => (
                  <div
                    key={rule.id}
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      rule.enabled ? "border-border bg-card" : "border-dashed bg-muted/30 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{rule.name}</span>
                          {rule.enabled
                            ? <Badge variant="success" className="text-[10px] px-1.5 py-0">Active</Badge>
                            : <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Tắt</Badge>
                          }
                        </div>
                      </div>
                      <Toggle enabled={rule.enabled} onToggle={() => toggleRule(rule.id)} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Pool ngân sách tháng</label>
                        <div className="text-sm font-semibold">{fmtBig(rule.monthlyBudgetCap)}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Giới hạn / request</label>
                        <div className="text-sm font-semibold">{fmtBig(rule.perRequestCap)}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Tồn kho tối đa</label>
                        <div className="text-sm font-semibold">{rule.maxStockDays} ngày</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Ngày tồn DC sau deal</label>
                        <div className="text-sm font-semibold">≤ {rule.maxProjectedDaysPostDeal} ngày</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Sức bán tối thiểu</label>
                        <div className="text-sm font-semibold">≥ {rule.minSalesVelocity} đơn/ngày</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Yêu cầu MDM trước</label>
                        <div className="text-sm font-semibold flex items-center gap-1">
                          {rule.requireMdmFirst
                            ? <><Check className="size-3.5 text-[hsl(var(--success))]" /> Bắt buộc</>
                            : <span className="text-muted-foreground">Không bắt buộc</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="size-3.5" />Thêm pool mới
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleSave("auto-approve")}>
                  {savedTab === "auto-approve" ? <><Check className="size-3.5" />Đã lưu</> : <><Save className="size-3.5" />Lưu thay đổi</>}
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex gap-2.5 text-sm text-amber-800 dark:text-amber-300">
                <Info className="size-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Luồng auto-approve:</strong> Request nhận → MDM duyệt → Hệ thống kiểm tra pool + ràng buộc → Nếu đủ điều kiện: auto-approve SCM và trừ pool → Nếu không đủ: chuyển tiếp SCM duyệt thủ công.
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Constraints ── */}
          <TabsContent value="constraints" className="space-y-4 mt-4">
            <Card className="p-5">
              <SectionHeader
                icon={Shield}
                title="Ràng buộc Tự động"
                desc="Các điều kiện được kiểm tra tự động khi request đến. Hệ thống có thể tự reject, flag cảnh báo, hoặc yêu cầu bổ sung thông tin mà không cần chờ người duyệt."
              />

              <div className="space-y-2">
                {constraints.map(c => (
                  <div key={c.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    c.enabled ? "bg-card" : "bg-muted/30 opacity-60 border-dashed"
                  )}>
                    <Toggle enabled={c.enabled} onToggle={() => toggleConstraint(c.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Khi <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{c.field}</code> {c.operator} {c.value.toLocaleString("vi-VN")} {c.unit}
                      </div>
                    </div>
                    <ActionBadge action={c.action} />
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="size-3.5" />Thêm ràng buộc
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleSave("constraints")}>
                  {savedTab === "constraints" ? <><Check className="size-3.5" />Đã lưu</> : <><Save className="size-3.5" />Lưu thay đổi</>}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── Tab 3: SLA & Escalation ── */}
          <TabsContent value="sla" className="space-y-4 mt-4">
            <Card className="p-5">
              <SectionHeader
                icon={Clock}
                title="SLA Xử lý"
                desc="Thiết lập thời gian tối đa cho mỗi bước. Khi vượt SLA, hệ thống sẽ tự leo thang (escalate) hoặc gửi cảnh báo."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SLA MDM Review (ngày làm việc)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={mdmSla}
                      onChange={e => setMdmSla(e.target.value)}
                      className="w-24 h-8 text-sm"
                      min="1" max="10"
                    />
                    <span className="text-sm text-muted-foreground">ngày kể từ khi tạo request</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SLA SCM Confirm (ngày làm việc)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={scmSla}
                      onChange={e => setScmSla(e.target.value)}
                      className="w-24 h-8 text-sm"
                      min="1" max="10"
                    />
                    <span className="text-sm text-muted-foreground">ngày kể từ khi MDM duyệt</span>
                  </div>
                </div>
              </div>

              <Separator className="mb-5" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Tự động leo thang khi quá SLA</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Gửi cảnh báo lên manager khi bước bị trễ hơn SLA đã cấu hình</div>
                  </div>
                  <Toggle enabled={autoEscalate} onToggle={() => setAutoEscalate(v => !v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Cho phép duyệt song song (MDM + SCM cùng lúc)</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Chỉ áp dụng cho các nhà cung cấp chiến lược đã được whitelist. Rút ngắn thời gian xử lý nhưng tăng rủi ro.
                    </div>
                  </div>
                  <Toggle enabled={parallelApproval} onToggle={() => setParallelApproval(v => !v)} />
                </div>
              </div>

              <Separator className="my-5" />

              <div>
                <div className="text-sm font-semibold mb-3">Deadline SCM tự động</div>
                <div className="text-xs text-muted-foreground mb-3">Hệ thống tự tính deadline SCM = ngày MDM duyệt + SLA SCM, và hiển thị trực tiếp trong request. SCM nhận cảnh báo 1 ngày trước deadline.</div>
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm",
                  "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20"
                )}>
                  <Check className="size-4 shrink-0" />
                  Deadline SCM = Ngày MDM approve + {scmSla} ngày làm việc, cảnh báo trước 1 ngày
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleSave("sla")}>
                  {savedTab === "sla" ? <><Check className="size-3.5" />Đã lưu</> : <><Save className="size-3.5" />Lưu thay đổi</>}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── Tab 4: Notifications ── */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card className="p-5">
              <SectionHeader
                icon={Bell}
                title="Quy tắc Thông báo"
                desc="Cấu hình ai nhận thông báo gì, qua kênh nào, để không bỏ lỡ bất kỳ sự kiện quan trọng nào trong quy trình duyệt."
              />

              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    n.enabled ? "bg-card" : "bg-muted/30 opacity-60 border-dashed"
                  )}>
                    <Toggle enabled={n.enabled} onToggle={() => toggleNotif(n.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{n.event}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {n.recipients.map(r => (
                          <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant={n.channel === "slack" ? "info" : "secondary"}
                      className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5"
                    >
                      {n.channel}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="size-3.5" />Thêm rule
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleSave("notifications")}>
                  {savedTab === "notifications" ? <><Check className="size-3.5" />Đã lưu</> : <><Save className="size-3.5" />Lưu thay đổi</>}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── Tab 5: Approvers ── */}
          <TabsContent value="approvers" className="space-y-4 mt-4">
            <Card className="p-5">
              <SectionHeader
                icon={Users}
                title="Cấu hình Người Duyệt"
                desc="Phân công MDM và SCM cho từng danh mục hàng hóa. Có thể cấu hình nhiều người duyệt backup để không bị tắc khi người chính vắng mặt."
              />

              <div className="space-y-2 mb-4">
                {approvers.map(a => (
                  <div key={a.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    !a.active && "opacity-50"
                  )}>
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {a.name.split(" ").slice(-1)[0][0]}{a.name.split(" ").slice(-2, -1)[0]?.[0] ?? ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {a.name}
                        {!a.active && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Tạm vắng</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.email}</div>
                    </div>
                    <Badge
                      variant={a.role === "MDM" ? "info" : a.role === "SCM" ? "warning" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {a.role}
                    </Badge>
                    <div className="text-xs text-muted-foreground shrink-0 hidden md:block">{a.category}</div>
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <Input placeholder="Tên người duyệt" className="h-8 text-sm" />
                  <Input placeholder="Email" className="h-8 text-sm" />
                  <Select>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MDM">MDM</SelectItem>
                      <SelectItem value="SCM">SCM</SelectItem>
                      <SelectItem value="Both">Cả hai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full">
                  <Plus className="size-3.5" />Thêm người duyệt
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleSave("approvers")}>
                  {savedTab === "approvers" ? <><Check className="size-3.5" />Đã lưu</> : <><Save className="size-3.5" />Lưu thay đổi</>}
                </Button>
              </div>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
