import React, { useState } from "react"
import { MoreHorizontal, UserPlus, Mail, Shield, Crown, User } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/store/app-store"

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
import { cn } from "@/lib/utils"

// ─── Mock members per tenant ─────────────────────────────────────────────────

const ALL_MEMBERS = [
  // t1
  { id: "u1",  name: "Alex Nguyen",      email: "alex@acme.com",    role: "admin",  tenantId: "t1", joinedAt: "2024-01-15", lastActive: "Just now",  status: "active" },
  { id: "u2",  name: "Sarah Chen",       email: "sarah@acme.com",   role: "member", tenantId: "t1", joinedAt: "2024-02-03", lastActive: "2h ago",    status: "active" },
  { id: "u3",  name: "John Doe",         email: "john@acme.com",    role: "member", tenantId: "t1", joinedAt: "2024-03-10", lastActive: "Yesterday", status: "active" },
  { id: "u4",  name: "Maria Garcia",     email: "maria@acme.com",   role: "viewer", tenantId: "t1", joinedAt: "2024-04-01", lastActive: "3d ago",    status: "active" },
  { id: "u5",  name: "James Park",       email: "james@acme.com",   role: "member", tenantId: "t1", joinedAt: "2024-05-20", lastActive: "1w ago",    status: "inactive" },
  { id: "u21", name: "Pending Invite",   email: "recruit@acme.com", role: "member", tenantId: "t1", joinedAt: "",           lastActive: "—",         status: "invited" },
  // t2
  { id: "u10", name: "Priya Patel",      email: "priya@beta.io",    role: "admin",  tenantId: "t2", joinedAt: "2024-01-08", lastActive: "Just now",  status: "active" },
  { id: "u11", name: "Carlos Ruiz",      email: "carlos@beta.io",   role: "member", tenantId: "t2", joinedAt: "2024-02-14", lastActive: "4h ago",    status: "active" },
  { id: "u12", name: "Yuki Tanaka",      email: "yuki@beta.io",     role: "member", tenantId: "t2", joinedAt: "2024-03-22", lastActive: "Yesterday", status: "active" },
  { id: "u13", name: "Anna Schmidt",     email: "anna@beta.io",     role: "viewer", tenantId: "t2", joinedAt: "2024-06-01", lastActive: "2d ago",    status: "active" },
  // t3
  { id: "u16", name: "Omar Hassan",      email: "omar@gamma.co",    role: "admin",  tenantId: "t3", joinedAt: "2024-01-20", lastActive: "1h ago",    status: "active" },
  { id: "u17", name: "Fatima Al-Zahra",  email: "fatima@gamma.co",  role: "member", tenantId: "t3", joinedAt: "2024-02-28", lastActive: "Yesterday", status: "active" },
  { id: "u18", name: "Jake Morrison",    email: "jake@gamma.co",    role: "member", tenantId: "t3", joinedAt: "2024-04-10", lastActive: "3h ago",    status: "active" },
  { id: "u19", name: "Sophie Blanc",     email: "sophie@gamma.co",  role: "viewer", tenantId: "t3", joinedAt: "2024-05-15", lastActive: "5d ago",    status: "inactive" },
]

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Crown,
  member: User,
  viewer: Shield,
}

// Role badge → reuse Badge variants from badge.tsx
const ROLE_VARIANT: Record<string, "warning" | "info" | "secondary"> = {
  admin:  "warning",
  member: "info",
  viewer: "secondary",
}

// Status dot — decorative only, small size, acceptable palette echo
const STATUS_DOT: Record<string, string> = {
  active:   "bg-[hsl(var(--success))]",
  inactive: "bg-muted-foreground/40",
  invited:  "bg-[hsl(var(--warning))]",
}

export function Members() {
  const { currentTenant } = useApp()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")

  const members = ALL_MEMBERS.filter(m => m.tenantId === currentTenant.id)

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.email.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === "all" || m.status === tab
    return matchSearch && matchTab
  })

  const activeCount  = members.filter(m => m.status === "active").length
  const invitedCount = members.filter(m => m.status === "invited").length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Members"
        description={`${members.length} members in ${currentTenant.name}`}
        action={{ label: "Invite member", onClick: () => {} }}
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Members", value: members.length, sub: "in this workspace" },
              { label: "Active",        value: activeCount,    sub: "last 30 days" },
              { label: "Pending",       value: invitedCount,   sub: "invite not accepted" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm">Team Members</CardTitle>
                  <CardDescription>Manage roles and access</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-48 text-xs"
                    placeholder="Search members…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <Button size="sm" className="h-8 gap-1.5" onClick={() => {}}>
                    <UserPlus className="size-3.5" />
                    Invite
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={tab} onValueChange={setTab}>
                <div className="border-b px-6">
                  <TabsList className="h-9 bg-transparent p-0 gap-4">
                    {[
                      { value: "all",      label: "All" },
                      { value: "active",   label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "invited",  label: "Invited" },
                    ].map(t => (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className="h-9 rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
                      >
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value={tab} className="mt-0">
                  <div className="divide-y">
                    {filtered.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                        No members found
                      </div>
                    ) : filtered.map(member => {
                      const RoleIcon = ROLE_ICONS[member.role] ?? User
                      return (
                        <div key={member.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                          <div className="relative">
                            <Avatar className="size-9">
                              <AvatarFallback className="text-xs">
                                {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
                              STATUS_DOT[member.status]
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{member.name}</span>
                              {member.status === "invited" && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1">Invited</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5">
                            <Badge variant={ROLE_VARIANT[member.role]} className="gap-1 text-[11px]">
                              <RoleIcon className="size-3" />
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          </div>
                          <div className="hidden md:block text-xs text-muted-foreground w-24 text-right">
                            {member.lastActive}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem>View profile</DropdownMenuItem>
                              <DropdownMenuItem>Change role</DropdownMenuItem>
                              {member.status === "invited" && (
                                <DropdownMenuItem>Resend invite</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                {member.status === "invited" ? "Revoke invite" : "Remove member"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Invite by email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Invite by Email</CardTitle>
              <CardDescription>Send an invitation link to new team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input className="flex-1 h-9 text-sm" placeholder="colleague@company.com" />
                <NativeSelect className="h-9 px-3">
                  <option>Member</option>
                  <option>Viewer</option>
                  <option>Admin</option>
                </NativeSelect>
                <Button className="h-9 gap-1.5">
                  <Mail className="size-4" />
                  Send invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
