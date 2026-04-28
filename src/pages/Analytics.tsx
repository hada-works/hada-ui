import { Header } from "@/components/layout/Header"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Analytics() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Analytics" description="This section is coming soon." />
      <ScrollArea className="flex-1">
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Analytics page — coming soon
        </div>
      </ScrollArea>
    </div>
  )
}
