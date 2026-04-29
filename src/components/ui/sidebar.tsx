import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// ── Constants ─────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH_DEFAULT = 256
const SIDEBAR_WIDTH_MIN     = 180
const SIDEBAR_WIDTH_MAX     = 400
const SIDEBAR_WIDTH_ICON    = 56

// ── Context ───────────────────────────────────────────────────────────────────
type SidebarContextValue = {
  open:       boolean
  setOpen:    (v: boolean) => void
  toggleSidebar: () => void
  width:      number
  setWidth:   (w: number) => void
  isDragging: boolean          // ← exposed so Sidebar can drop transition during drag
  setIsDragging: (v: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
  width: SIDEBAR_WIDTH_DEFAULT,
  setWidth: () => {},
  isDragging: false,
  setIsDragging: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function SidebarProvider({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  style,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const [_open,      _setOpen]      = React.useState(defaultOpen)
  const [width,      setWidth]      = React.useState(SIDEBAR_WIDTH_DEFAULT)
  const [isDragging, setIsDragging] = React.useState(false)
  const open = openProp ?? _open

  const setOpen = React.useCallback((v: boolean) => {
    _setOpen(v)
    onOpenChange?.(v)
  }, [onOpenChange])

  const toggleSidebar = React.useCallback(() => setOpen(!open), [open, setOpen])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar, width, setWidth, isDragging, setIsDragging }}>
      <div className={cn("flex h-full w-full", className)} style={style} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

// ── Root (with drag-to-resize handle) ────────────────────────────────────────
export const Sidebar = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"aside"> & { collapsible?: "icon" | "none" }
>(({ className, children, collapsible = "icon", ...props }, externalRef) => {
  const { open, width, setWidth, isDragging, setIsDragging } = useSidebar()

  // Internal ref — always valid regardless of whether a consumer passes externalRef
  const internalRef = React.useRef<HTMLElement>(null)

  // Merge refs: keep externalRef in sync so consumers can still use it
  const setRef = React.useCallback((node: HTMLElement | null) => {
    (internalRef as React.MutableRefObject<HTMLElement | null>).current = node
    if (typeof externalRef === "function") externalRef(node)
    else if (externalRef) (externalRef as React.MutableRefObject<HTMLElement | null>).current = node
  }, [externalRef])

  // Drag state stored in refs — never triggers re-render during drag
  const startX = React.useRef(0)
  const startW = React.useRef(width)

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!open) return
    e.preventDefault()

    startX.current = e.clientX
    startW.current = width
    setIsDragging(true)

    document.body.style.cursor     = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      const next = Math.min(
        SIDEBAR_WIDTH_MAX,
        Math.max(SIDEBAR_WIDTH_MIN, startW.current + ev.clientX - startX.current)
      )
      // Direct DOM mutation — zero React overhead during drag
      const el = internalRef.current
      if (el) {
        el.style.width    = `${next}px`
        el.style.minWidth = `${next}px`
      }
      // Reset both anchors each frame to avoid cumulative drift
      startW.current = next
      startX.current = ev.clientX
    }

    const onUp = () => {
      // Commit final width to React state exactly once on release
      const el = internalRef.current
      if (el) {
        const finalW = parseInt(el.style.width, 10)
        if (!isNaN(finalW)) setWidth(finalW)
      }
      setIsDragging(false)
      document.body.style.cursor     = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }, [open, width, setWidth, setIsDragging])

  const currentWidth = open ? width : SIDEBAR_WIDTH_ICON

  return (
    <aside
      ref={setRef}
      data-state={open ? "expanded" : "collapsed"}
      data-collapsible={collapsible}
      style={{ width: currentWidth, minWidth: currentWidth }}
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground shrink-0",
        // CSS transition only for open/close toggle — disabled during drag
        !isDragging && "transition-[width,min-width] duration-300 ease-in-out",
        className
      )}
      {...props}
    >
      {children}

      {/* Resize handle — visible only when expanded */}
      {open && (
        <div
          onMouseDown={onMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize group z-10 translate-x-[1px]"
        >
          <div className="absolute inset-y-0 right-0 w-[3px] rounded-full opacity-0 group-hover:opacity-100 bg-primary/40 transition-opacity duration-150" />
        </div>
      )}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

// ── Header / Footer / Content ─────────────────────────────────────────────────
export const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2 p-2 shrink-0", className)} {...props} />
  )
)
SidebarHeader.displayName = "SidebarHeader"

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2 p-2 mt-auto", className)} {...props} />
  )
)
SidebarFooter.displayName = "SidebarFooter"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden py-2", className)} {...props} />
  )
)
SidebarContent.displayName = "SidebarContent"

export const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mx-2 my-1 h-px bg-sidebar-border", className)} {...props} />
  )
)
SidebarSeparator.displayName = "SidebarSeparator"

// ── Group ─────────────────────────────────────────────────────────────────────
export const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex w-full min-w-0 flex-col px-2", className)} {...props} />
  )
)
SidebarGroup.displayName = "SidebarGroup"

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  const { open } = useSidebar()
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex h-7 shrink-0 items-center rounded-md px-2 text-sm font-medium text-sidebar-foreground/60 outline-none transition-[height,opacity,margin] duration-200 overflow-hidden whitespace-nowrap",
        !open && "h-0 opacity-0 pointer-events-none",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full text-sm", className)} {...props} />
  )
)
SidebarGroupContent.displayName = "SidebarGroupContent"

export const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const { open } = useSidebar()
  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !open && "hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

// ── Menu ──────────────────────────────────────────────────────────────────────
export const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex w-full min-w-0 flex-col gap-0.5", className)} {...props} />
  )
)
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("group/menu-item relative", className)} {...props} />
  )
)
SidebarMenuItem.displayName = "SidebarMenuItem"

// ── MenuButton ────────────────────────────────────────────────────────────────
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      isActive: {
        true:  "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        false: "text-sidebar-foreground/70",
      },
      size: {
        default: "h-8 text-sm",
        sm:      "h-7 text-xs",
        lg:      "h-12 text-sm",
      },
    },
    defaultVariants: { isActive: false, size: "default" },
  }
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(({ asChild, isActive, size, tooltip, className, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const { open } = useSidebar()

  const button = (
    <Comp
      ref={ref}
      className={cn(sidebarMenuButtonVariants({ isActive: !!isActive, size }), className)}
      {...props}
    >
      {children}
    </Comp>
  )

  if (!tooltip || open) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center">{tooltip}</TooltipContent>
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

// ── MenuAction ────────────────────────────────────────────────────────────────
export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean }
>(({ className, asChild, showOnHover, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        showOnHover && "opacity-0 group-hover/menu-item:opacity-100",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

// ── Sub ───────────────────────────────────────────────────────────────────────
export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => {
    const { open } = useSidebar()
    return (
      <ul
        ref={ref}
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          open ? "ml-3.5 border-l border-sidebar-border pl-2.5 py-0.5" : "hidden",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuSub.displayName = "SidebarMenuSub"

export const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ ...props }, ref) => <li ref={ref} {...props} />
)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { asChild?: boolean; isActive?: boolean }
>(({ asChild, isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground/70 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs transition-colors whitespace-nowrap",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

// ── Badge ─────────────────────────────────────────────────────────────────────
export const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1 text-[10px] font-medium tabular-nums text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
)
SidebarMenuBadge.displayName = "SidebarMenuBadge"
