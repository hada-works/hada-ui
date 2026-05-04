import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, MessageSquare, FolderKanban,
  Settings, ChevronsUpDown,
  Check, Building2, Users, BarChart3, Bell,
  ChevronRight, Plus, PanelLeftClose, PanelLeftOpen, MoreHorizontal,
  ShoppingCart, ClipboardCheck, SlidersHorizontal,
  MapPin, Star, Cog, TrendingUp,
  Package, ClipboardList, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/app-store"
import { TENANTS } from "@/store/mock-data"
import { FEEDBACK_BOARDS } from "@/features/feedbacks/mock-data"
import { PROJECTS } from "@/features/projects/mock-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// ─── Static nav lists ────────────────────────────────────────────────────────
const TOP_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
]
const BOTTOM_NAV = [
  { label: "Members",       href: "/members",       icon: Users },
  { label: "Analytics",     href: "/analytics",     icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings",      href: "/settings",      icon: Settings },
]

// ─── NavItem — icon always visible, text fades out when collapsed ─────────────
function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const { open } = useSidebar()
  const location = useLocation()
  const active = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href)

  const inner = (
    <SidebarMenuButton asChild isActive={active} className="h-7">
      <Link to={href} className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" />
        <span className={cn(
          "truncate transition-[opacity,width] duration-200 text-sm",
          open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
        )}>
          {label}
        </span>
      </Link>
    </SidebarMenuButton>
  )

  if (!open) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" align="center">{label}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    )
  }
  return <SidebarMenuItem>{inner}</SidebarMenuItem>
}

// ─── Main sidebar component ───────────────────────────────────────────────────
export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar()
  const { currentTenant, setCurrentTenant, currentUser } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [logoHovered, setLogoHovered] = useState(false)
  const [feedbackOpen,  setFeedbackOpen]  = useState(true)
  const [projectsOpen,  setProjectsOpen]  = useState(true)
  const [purchasesOpen, setPurchasesOpen] = useState(true)
  const [gbpOpen,       setGbpOpen]       = useState(true)
  const [productsOpen,  setProductsOpen]  = useState(true)

  const tenantBoards   = FEEDBACK_BOARDS.filter(b => b.tenantId === currentTenant.id)
  const tenantProjects = PROJECTS.filter(p => p.tenantId === currentTenant.id)

  return (
    <Sidebar collapsible="icon">
      {/* ── Header ── */}
      <SidebarHeader className="h-14 justify-center px-3 border-b">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent transition-colors cursor-pointer",
            !open && "justify-center px-0"
          )}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          {/* Logo — doubles as collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold transition-all"
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                {logoHovered
                  ? (open ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />)
                  : <span>{currentTenant.name[0]}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{open ? "Collapse sidebar" : "Expand sidebar"}</TooltipContent>
          </Tooltip>

          {/* Tenant info — fade out, don't conditionally render (prevents layout jump) */}
          <div className={cn(
            "flex flex-1 min-w-0 items-center gap-1 transition-[opacity,width] duration-200 overflow-hidden",
            open ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-1 min-w-0 items-center gap-1 text-left rounded hover:opacity-75 transition-opacity">
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-sidebar-foreground">{currentTenant.name}</div>
                    <div className="text-xs text-sidebar-foreground/50 capitalize">{currentTenant.plan}</div>
                  </div>
                  <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TENANTS.map(t => (
                  <DropdownMenuItem key={t.id} onClick={() => setCurrentTenant(t)} className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">{t.name[0]}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{t.plan}</div>
                    </div>
                    {currentTenant.id === t.id && <Check className="size-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem><Building2 className="size-4 mr-1" />Create workspace</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent>
        {/* ── Dashboard ── */}
        <SidebarGroup>
          {open ? (
            <SidebarGroupLabel asChild>
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-1 hover:text-sidebar-foreground transition-colors",
                  location.pathname === "/" && "text-sidebar-foreground font-semibold"
                )}
              >
                <LayoutDashboard className="size-4 shrink-0" />
                Dashboard
              </Link>
            </SidebarGroupLabel>
          ) : (
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* ── Products (2-level collapsible) ── */}
        <SidebarGroup>
          <Collapsible open={open ? productsOpen : false} onOpenChange={setProductsOpen}>
            <div className="flex items-center">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex flex-1 items-center gap-1 hover:text-sidebar-foreground transition-colors [&[data-state=open]>svg.chevron]:rotate-90">
                  <Package className="size-4 shrink-0" />
                  Products
                  <ChevronRight className="chevron ml-auto size-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {!open && (
                  <NavItem href="/products/dashboard" icon={Package} label="Products" />
                )}
                {open && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/products/dashboard"}>
                          <Link to="/products/dashboard" className="flex items-center gap-1.5">
                            <LayoutDashboard className="size-3 shrink-0" />
                            Dashboard
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/products/assortments"}>
                          <Link to="/products/assortments" className="flex items-center gap-1.5">
                            <Layers className="size-3 shrink-0" />
                            Assortments
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/products/in-out"}>
                          <Link to="/products/in-out" className="flex items-center gap-1.5">
                            <ClipboardList className="size-3 shrink-0" />
                            In-out approval
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </Collapsible>
        </SidebarGroup>

        {/* ── Purchases (2-level collapsible) ── */}
        <SidebarGroup>
          <Collapsible open={open ? purchasesOpen : false} onOpenChange={setPurchasesOpen}>
            <div className="flex items-center">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex flex-1 items-center gap-1 hover:text-sidebar-foreground transition-colors [&[data-state=open]>svg.chevron]:rotate-90">
                  <ShoppingCart className="size-4 shrink-0" />
                  Purchases
                  <ChevronRight className="chevron ml-auto size-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {!open && (
                  <NavItem href="/purchases/bulk-buy" icon={ShoppingCart} label="Purchases" />
                )}
                {open && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/purchases/insights"}>
                          <Link to="/purchases/insights" className="flex items-center gap-1.5">
                            <LayoutDashboard className="size-3 shrink-0" />
                            Insights
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/purchases/bulk-buy"}>
                          <Link to="/purchases/bulk-buy" className="flex items-center gap-1.5">
                            <ClipboardCheck className="size-3 shrink-0" />
                            Bulkbuy approval
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/purchases/settings"}>
                          <Link to="/purchases/settings" className="flex items-center gap-1.5">
                            <SlidersHorizontal className="size-3 shrink-0" />
                            Bulkbuy settings
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </Collapsible>
        </SidebarGroup>

        {/* ── Projects / Issues (2-level collapsible) ── */}
        <SidebarGroup>
          <Collapsible open={open ? projectsOpen : false} onOpenChange={setProjectsOpen}>
            <div className="flex items-center">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex flex-1 items-center gap-1 hover:text-sidebar-foreground transition-colors [&[data-state=open]>svg.chevron]:rotate-90">
                  <FolderKanban className="size-4 shrink-0" />
                  Projects
                  <ChevronRight className="chevron ml-auto size-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>

            </div>

            <SidebarGroupContent>
              <SidebarMenu>
                {!open && (
                  <NavItem href="/projects" icon={FolderKanban} label="Projects" />
                )}
                {open && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/issues"}>
                          <Link to="/issues">All Issues</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {tenantProjects.map(project => (
                        <SidebarMenuSubItem key={project.id} className="group/proj-item">
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === `/projects/${project.id}`}
                          >
                            <Link to={`/projects/${project.id}`}>
                              <span className="shrink-0">{project.emoji}</span>
                              <span className="truncate flex-1">{project.name}</span>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${project.id}/settings`) }}
                                className="ml-auto opacity-0 group-hover/proj-item:opacity-100 hover:text-sidebar-foreground transition-opacity p-0.5 rounded"
                                title="Project settings"
                              >
                                <MoreHorizontal className="size-3" />
                              </button>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <button
                            className="w-full text-sidebar-foreground/40 hover:text-sidebar-foreground gap-1"
                            onClick={() => navigate("/projects/new")}
                          >
                            <Plus className="size-3" />
                            New project
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </Collapsible>
        </SidebarGroup>

        {/* ── Feedbacks (2-level collapsible) ── */}
        <SidebarGroup>
          <Collapsible open={open ? feedbackOpen : false} onOpenChange={setFeedbackOpen}>
            <div className="flex items-center">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex flex-1 items-center gap-1 hover:text-sidebar-foreground transition-colors [&[data-state=open]>svg.chevron]:rotate-90">
                  <MessageSquare className="size-4 shrink-0" />
                  Feedbacks
                  <ChevronRight className="chevron ml-auto size-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>

            </div>

            <SidebarGroupContent>
              <SidebarMenu>
                {!open && (
                  <NavItem href="/feedbacks" icon={MessageSquare} label="Feedbacks" />
                )}
                {open && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/feedbacks"}>
                          <Link to="/feedbacks">All Feedbacks</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {tenantBoards.map(board => (
                        <SidebarMenuSubItem key={board.id} className="group/board-item">
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === `/feedbacks/board/${board.id}`}
                          >
                            <Link to={`/feedbacks/board/${board.id}`}>
                              <span className="shrink-0">{board.emoji}</span>
                              <span className="truncate flex-1">{board.name}</span>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/feedbacks/board/${board.id}/settings`) }}
                                className="ml-auto opacity-0 group-hover/board-item:opacity-100 hover:text-sidebar-foreground transition-opacity p-0.5 rounded"
                                title="Board settings"
                              >
                                <MoreHorizontal className="size-3" />
                              </button>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <button
                            className="w-full text-sidebar-foreground/40 hover:text-sidebar-foreground gap-1"
                            onClick={() => navigate("/feedbacks/new-board")}
                          >
                            <Plus className="size-3" />
                            New board
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </Collapsible>
        </SidebarGroup>

        {/* ── GBP Audits (2-level collapsible) ── */}
        <SidebarGroup>
          <Collapsible open={open ? gbpOpen : false} onOpenChange={setGbpOpen}>
            <div className="flex items-center">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex flex-1 items-center gap-1 hover:text-sidebar-foreground transition-colors [&[data-state=open]>svg.chevron]:rotate-90">
                  <MapPin className="size-4 shrink-0" />
                  GBP Audits
                  <ChevronRight className="chevron ml-auto size-4 transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {!open && (
                  <NavItem href="/gbp/dashboard" icon={MapPin} label="GBP Audits" />
                )}
                {open && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/gbp/dashboard"}>
                          <Link to="/gbp/dashboard" className="flex items-center gap-1.5">
                            <LayoutDashboard className="size-3 shrink-0" />
                            Dashboard
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/gbp/insights"}>
                          <Link to="/gbp/insights" className="flex items-center gap-1.5">
                            <TrendingUp className="size-3 shrink-0" />
                            Insights
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/gbp/locations"}>
                          <Link to="/gbp/locations" className="flex items-center gap-1.5">
                            <MapPin className="size-3 shrink-0" />
                            Locations
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/gbp/reviews"}>
                          <Link to="/gbp/reviews" className="flex items-center gap-1.5">
                            <Star className="size-3 shrink-0" />
                            Reviews
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === "/gbp/settings"}>
                          <Link to="/gbp/settings" className="flex items-center gap-1.5">
                            <Cog className="size-3 shrink-0" />
                            Settings
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </Collapsible>
        </SidebarGroup>

        {/* ── Secondary nav ── */}
        {BOTTOM_NAV.map(item => (
          <SidebarGroup key={item.href}>
            {open ? (
              <SidebarGroupLabel asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-1 hover:text-sidebar-foreground transition-colors",
                    location.pathname.startsWith(item.href) && "text-sidebar-foreground font-semibold"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </SidebarGroupLabel>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <NavItem href={item.href} icon={item.icon} label={item.label} />
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── User footer ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn("h-9", !open && "justify-center")}
                  tooltip={currentUser.name}
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {currentUser.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex flex-1 min-w-0 items-center gap-1 transition-[opacity,width] duration-200 overflow-hidden",
                    open ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none"
                  )}>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate text-xs font-semibold">{currentUser.name}</div>
                      <div className="truncate text-[11px] text-sidebar-foreground/50">{currentUser.email}</div>
                    </div>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/50" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align={open ? "end" : "start"} className="w-48">
                <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Account settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
