import { Badge } from "@/components/ui/badge"

export function SprintBadge({ status }: { status: string }) {
  const variant =
    status === "active"    ? "success"   as const :
    status === "completed" ? "secondary" as const : "outline" as const
  return (
    <Badge variant={variant} className="text-[10px] h-4 px-1.5 capitalize">
      {status}
    </Badge>
  )
}
