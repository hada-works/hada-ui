import React from "react"
import { Search, Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  actions?: React.ReactNode
}

export function Header({ title, description, action, actions }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6">
      <div className="flex-1">
        <h1 className="text-base font-semibold">{title}</h1>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input className="h-8 w-48 pl-8 text-xs" placeholder="Search..." />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary" className="text-xs">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { title: "New feedback submitted", desc: "Mobile app feature request", time: "2m ago" },
              { title: "Issue ENG-101 updated", desc: "Status changed to In Progress", time: "1h ago" },
              { title: "Project milestone reached", desc: "Auth Overhaul is 60% complete", time: "3h ago" },
            ].map((n, i) => (
              <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.desc}</span>
                <span className="text-xs text-muted-foreground/60">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {actions}
        {action && (
          <Button size="sm" className="h-8 gap-1.5" onClick={action.onClick}>
            <Plus className="size-3.5" />
            {action.label}
          </Button>
        )}
      </div>
    </header>
  )
}
