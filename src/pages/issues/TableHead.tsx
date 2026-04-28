import { cn } from "@/lib/utils"

interface TableHeadProps {
  sticky?: boolean
}

export function TableHead({ sticky = false }: TableHeadProps) {
  const base = "py-2.5 px-2 text-left text-xs font-medium text-muted-foreground bg-muted border-b border-r border-border last:border-r-0"
  return (
    <thead className={sticky ? "sticky top-0 z-10" : undefined}>
      <tr>
        <th className={cn(base, "pl-4 pr-2 w-24")}>ID</th>
        <th className={cn(base)}>Title</th>
        <th className={cn(base, "w-28")}>Status</th>
        <th className={cn(base, "w-24")}>Priority</th>
        <th className={cn(base, "w-24")}>Type</th>
        <th className={cn(base, "w-32")}>Assignee</th>
        <th className={cn(base, "pl-2 pr-4 w-24")}>Updated</th>
      </tr>
    </thead>
  )
}
