import type { Issue, Epic } from "@/types"
import { EpicChip } from "@/components/shared/EpicChip"
import { PriorityBadge } from "@/components/shared/PriorityBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"

interface IssueCardProps {
  issue:   Issue
  epics:   Epic[]
  onClick: () => void
}

export function IssueCard({ issue, epics, onClick }: IssueCardProps) {
  const epic = epics.find(e => e.id === issue.epicId)
  return (
    <div
      className="rounded-md border bg-card text-card-foreground p-3 cursor-pointer hover:bg-accent/20 hover:border-border transition-colors space-y-2 shadow-sm"
      onClick={onClick}
    >
      {epic && <EpicChip title={epic.title} color={epic.color} />}
      <p className="text-xs font-medium leading-snug line-clamp-3">{issue.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">{issue.identifier}</span>
          <PriorityBadge priority={issue.priority} />
        </div>
        {issue.assigneeName && (
          <UserAvatar name={issue.assigneeName} size="size-5" textSize="text-[10px]" className="shrink-0" />
        )}
      </div>
    </div>
  )
}
