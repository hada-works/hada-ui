import { Outlet } from "react-router-dom"
import { AppSidebar } from "./Sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <main className="flex flex-1 flex-col overflow-hidden min-w-0">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
