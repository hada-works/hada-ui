import React, { useState } from "react"
import { Building2, Users, Bell, Shield, CreditCard, Trash2, Globe, Lock } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/app-store"

// ─── Settings sections ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "workspace",     label: "Workspace",     icon: Building2 },
  { id: "members",      label: "Members",        icon: Users },
  { id: "notifications",label: "Notifications",  icon: Bell },
  { id: "security",     label: "Security",       icon: Shield },
  { id: "billing",      label: "Billing",        icon: CreditCard },
  { id: "danger",       label: "Danger zone",    icon: Trash2 },
]

// Native select styled to match shadcn Input — used for simple static option lists
function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex rounded-md border border-input bg-background text-sm ring-offset-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { currentTenant } = useApp()
  const [activeSection, setActiveSection] = useState("workspace")

  // Local toggle states
  const [notifFeedback,    setNotifFeedback]    = useState(true)
  const [notifIssue,       setNotifIssue]       = useState(true)
  const [notifProject,     setNotifProject]     = useState(false)
  const [notifDigest,      setNotifDigest]      = useState(true)
  const [twoFactor,        setTwoFactor]        = useState(false)
  const [ssoEnabled,       setSsoEnabled]       = useState(false)
  const [auditLog,         setAuditLog]         = useState(true)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Settings" description={`Configure ${currentTenant.name}`} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar nav ── */}
        <nav className="hidden md:flex flex-col w-52 shrink-0 border-r p-3 gap-0.5 overflow-y-auto">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                  activeSection === s.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  s.id === "danger" && "text-destructive hover:text-destructive"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* ── Right: content ── */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-2xl space-y-6">

            {/* ─ Workspace ─ */}
            {activeSection === "workspace" && (
              <>
                <div>
                  <h2 className="text-base font-semibold">Workspace Settings</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage your workspace details and preferences</p>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Workspace name</label>
                      <Input defaultValue={currentTenant.name} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Slug</label>
                      <div className="flex items-center gap-0">
                        <span className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-xs text-muted-foreground">
                          app.hada.io/
                        </span>
                        <Input defaultValue={currentTenant.slug} className="h-9 rounded-l-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Plan</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{currentTenant.plan}</Badge>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Upgrade plan</Button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button size="sm">Save changes</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Localization</CardTitle>
                    <CardDescription>Timezone and date format preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                      <NativeSelect className="h-9 w-full px-3">
                        <option>(UTC+07:00) Indochina Time</option>
                        <option>(UTC+00:00) UTC</option>
                        <option>(UTC-05:00) Eastern Time</option>
                        <option>(UTC-08:00) Pacific Time</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Date format</label>
                      <NativeSelect className="h-9 w-full px-3">
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </NativeSelect>
                    </div>
                    <div className="pt-2"><Button size="sm">Save</Button></div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─ Members ─ */}
            {activeSection === "members" && (
              <>
                <div>
                  <h2 className="text-base font-semibold">Member Settings</h2>
                  <p className="text-sm text-muted-foreground mt-1">Control how members join and collaborate</p>
                </div>
                <Card>
                  <CardContent className="pt-6 divide-y">
                    <SettingRow
                      label="Allow email domain sign-up"
                      description="Anyone with a matching email domain can join without an invite"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                          <Globe className="size-3" />
                          {currentTenant.slug}.com
                        </div>
                        <Toggle checked={false} onChange={() => {}} />
                      </div>
                    </SettingRow>
                    <SettingRow
                      label="Require admin approval"
                      description="New members must be approved before accessing the workspace"
                    >
                      <Toggle checked={true} onChange={() => {}} />
                    </SettingRow>
                    <SettingRow
                      label="Allow guest access"
                      description="External users can be invited as read-only guests"
                    >
                      <Toggle checked={currentTenant.plan !== "starter"} onChange={() => {}} />
                    </SettingRow>
                    <SettingRow
                      label="Default role for new members"
                      description="Role assigned when someone joins without a specific invite"
                    >
                      <NativeSelect className="h-8 px-2 text-xs">
                        <option>Member</option>
                        <option>Viewer</option>
                      </NativeSelect>
                    </SettingRow>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─ Notifications ─ */}
            {activeSection === "notifications" && (
              <>
                <div>
                  <h2 className="text-base font-semibold">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose what you get notified about</p>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In-app notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    <SettingRow label="New feedback submitted" description="When a user submits a new feature request">
                      <Toggle checked={notifFeedback} onChange={setNotifFeedback} />
                    </SettingRow>
                    <SettingRow label="Issue status changes" description="When issues assigned to you change status">
                      <Toggle checked={notifIssue} onChange={setNotifIssue} />
                    </SettingRow>
                    <SettingRow label="Project milestones" description="When a project reaches a progress milestone">
                      <Toggle checked={notifProject} onChange={setNotifProject} />
                    </SettingRow>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Email notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    <SettingRow label="Weekly digest" description="Summary of workspace activity every Monday morning">
                      <Toggle checked={notifDigest} onChange={setNotifDigest} />
                    </SettingRow>
                    <SettingRow label="Digest email" description="">
                      <Input className="h-8 w-52 text-xs" defaultValue="alex@acme.com" />
                    </SettingRow>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─ Security ─ */}
            {activeSection === "security" && (
              <>
                <div>
                  <h2 className="text-base font-semibold">Security</h2>
                  <p className="text-sm text-muted-foreground mt-1">Authentication and access controls</p>
                </div>
                <Card>
                  <CardContent className="pt-6 divide-y">
                    <SettingRow
                      label="Two-factor authentication"
                      description="Require 2FA for all workspace members"
                    >
                      <Toggle checked={twoFactor} onChange={setTwoFactor} />
                    </SettingRow>
                    <SettingRow
                      label="SAML SSO"
                      description="Single sign-on via Okta, Azure AD, or any SAML 2.0 provider"
                    >
                      <div className="flex items-center gap-2">
                        {currentTenant.plan !== "enterprise" && (
                          <Badge variant="outline" className="text-[10px]">Enterprise only</Badge>
                        )}
                        <Toggle
                          checked={ssoEnabled}
                          onChange={v => currentTenant.plan === "enterprise" && setSsoEnabled(v)}
                        />
                      </div>
                    </SettingRow>
                    <SettingRow
                      label="Audit log"
                      description="Record all user actions for compliance and security review"
                    >
                      <Toggle checked={auditLog} onChange={setAuditLog} />
                    </SettingRow>
                    <SettingRow
                      label="Session timeout"
                      description="Automatically sign out inactive sessions"
                    >
                      <NativeSelect className="h-8 px-2 text-xs">
                        <option>7 days</option>
                        <option>24 hours</option>
                        <option>1 hour</option>
                        <option>Never</option>
                      </NativeSelect>
                    </SettingRow>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">API Keys</CardTitle>
                    <CardDescription>Manage programmatic access tokens</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Production key", created: "2025-01-10", last: "Just now" },
                      { name: "CI/CD key",       created: "2025-03-05", last: "2h ago" },
                    ].map(key => (
                      <div key={key.name} className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{key.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Created {key.created} · Last used {key.last}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                            sk-••••••••1234
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">Revoke</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <Lock className="size-3.5" />
                      Generate new key
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─ Billing ─ */}
            {activeSection === "billing" && (
              <>
                <div>
                  <h2 className="text-base font-semibold">Billing & Plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage your subscription and invoices</p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="capitalize text-xs">{currentTenant.plan}</Badge>
                          <span className="text-sm text-muted-foreground">current plan</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                          {currentTenant.plan === "enterprise" ? "Custom" :
                           currentTenant.plan === "pro" ? "$49" : "$0"}
                          <span className="text-sm font-normal text-muted-foreground">
                            {currentTenant.plan !== "enterprise" ? "/mo" : ""}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentTenant.plan === "enterprise"
                            ? "Unlimited members · SSO · Custom SLA"
                            : currentTenant.plan === "pro"
                            ? "Up to 25 members · Priority support"
                            : "Up to 5 members · Community support"}
                        </p>
                      </div>
                      {currentTenant.plan !== "enterprise" && (
                        <Button size="sm">Upgrade</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recent invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {[
                        { period: "March 2025",   amount: "$49.00", status: "Paid" },
                        { period: "February 2025",amount: "$49.00", status: "Paid" },
                        { period: "January 2025", amount: "$49.00", status: "Paid" },
                      ].map(inv => (
                        <div key={inv.period} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm">{inv.period}</p>
                            <p className="text-xs text-muted-foreground">{inv.amount}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{inv.status}</Badge>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Download</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─ Danger Zone ─ */}
            {activeSection === "danger" && (
              <>
                <div>
                  <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mt-1">Irreversible actions — proceed with caution</p>
                </div>
                <Card className="border-destructive/40">
                  <CardContent className="pt-6 divide-y divide-destructive/20">
                    {[
                      {
                        title: "Export all data",
                        desc: "Download a full export of all workspace data as a JSON archive.",
                        action: "Export data",
                        variant: "outline" as const,
                      },
                      {
                        title: "Reset workspace",
                        desc: "Delete all feedbacks, issues, and projects. Members and settings are preserved.",
                        action: "Reset workspace",
                        variant: "destructive" as const,
                      },
                      {
                        title: "Delete workspace",
                        desc: "Permanently delete this workspace and all associated data. This cannot be undone.",
                        action: "Delete workspace",
                        variant: "destructive" as const,
                      },
                    ].map(item => (
                      <div key={item.title} className="flex items-center justify-between gap-6 py-4">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <Button variant={item.variant} size="sm" className="shrink-0">{item.action}</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
