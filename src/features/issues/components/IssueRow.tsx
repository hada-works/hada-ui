import type { Issue, Epic } from "@/types"
import { Badge } from "@/components/ui/badge"
import { IssueStatusBadge } from "@/components/shared/StatusBadge"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { EpicChip } from "./EpicChip"
import { IssueTypeBadge } from "./IssueTypeBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { cn } from "@/lib/utils"

interface IssueRowProps {
  issue:   Issue
  epics:   Epic[]
  onClick: () => void
}

export function IssueRow({ issue, epics, onClick }: IssueRowProps) {
  const epic = epics.find(e => e.id === issue.epicId)
  const cell = "border-b border-border"
  return (
    <tr
      className="hover:bg-accent/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className={cn(cell, "py-2.5 pl-4 pr-2")}>
        <span className="font-mono text-xs text-muted-foreground">{issue.identifier}</span>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}>
        <div className="space-y-1">
          <span className="font-medium text-sm">{issue.title}</span>
          {(epic || issue.labels.length > 0) && (
            <div className="flex gap-1 flex-wrap items-center">
              {epic && <EpicChip title={epic.title} color={epic.color} />}
              {issue.labels.map(l => (
                <Badge key={l} variant="outline" className="text-[10px] h-4 px-1.5 font-normal">{l}</Badge>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className={cn(cell, "py-2.5 px-2")}><IssueStatusBadge status={issue.status} /></td>
      <td className={cn(cell, "py-2.5 px-2")}><PriorityBadge priority={issue.priority} /></td>
      <td className={cn(cell, "py-2.5 px-2")}><IssueTypeBadge type={issue.type} /></td>
      <td className={cn(cell, "py-2.5 px-2")}>
        {issue.assigneeName ? (
          <div className="flex items-center gap-1.5">
            <UserAvatar name={issue.assigneeName} size="size-5" textSize="text-[10px]" />
            <span className="text-xs truncate max-w-[80px]">{issue.assigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className={cn(cell, "py-2.5 pl-2 pr-4")}>
        <span className="text-xs text-muted-foreground">{issue.updatedAt}</span>
      </td>
    </tr>
  )
}
