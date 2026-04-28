import { Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EpicChip } from "@/components/shared/EpicChip"
import { cn } from "@/lib/utils"
import type { Issue, Epic, Sprint } from "@/types"
import { KANBAN_COLUMNS, STATUS_DOT, type GroupBy } from "./issues.constants"
import { SwimlaneTable, type SwimlaneRow } from "./SwimlaneTable"
import { IssueCard } from "./IssueCard"
import { SprintBadge } from "./SprintBadge"

interface IssueKanbanViewProps {
  filtered:        Issue[]
  tenantEpics:     Epic[]
  relevantSprints: Sprint[]
  groupBy:         GroupBy
  projectId?:      string
  onCardClick:     (id: string) => void
}

export function IssueKanbanView({
  filtered, tenantEpics, relevantSprints,
  groupBy, projectId, onCardClick,
}: IssueKanbanViewProps) {

  // ── Sprint swimlane ──────────────────────────────────────────────────────────
  if (groupBy === "sprint") {
    const orderedSprints = [...relevantSprints].sort((a, b) => {
      const o = { active: 0, upcoming: 1, completed: 2 } as Record<string, number>
      return (o[a.status] ?? 3) - (o[b.status] ?? 3)
    })
    const usedSprintIds = new Set(filtered.map(i => i.sprintId ?? "__none__"))
    const rows: SwimlaneRow[] = [
      ...orderedSprints.filter(s => usedSprintIds.has(s.id)).map(s => ({
        id: s.id,
        labelNode: (
          <>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold leading-tight">{s.name}</span>
            </div>
            <SprintBadge status={s.status} />
          </>
        ),
        issues: filtered.filter(i => i.sprintId === s.id),
      })),
      ...(usedSprintIds.has("__none__") ? [{
        id:        "__none__",
        labelNode: <span className="text-xs font-semibold text-muted-foreground">No Sprint</span>,
        issues:    filtered.filter(i => !i.sprintId),
      }] : []),
    ]
    return (
      <SwimlaneTable
        headerLabel="Sprint"
        rows={rows}
        tenantEpics={tenantEpics}
        defaultLabelW={160}
        minLabelW={100}
        maxLabelW={320}
        onCardClick={onCardClick}
      />
    )
  }

  // ── Epic swimlane ────────────────────────────────────────────────────────────
  if (groupBy === "epic") {
    const scopedEpics = tenantEpics.filter(e => !projectId || e.projectId === projectId)
    const usedEpicIds = new Set(filtered.map(i => i.epicId ?? "__none__"))
    const rows: SwimlaneRow[] = [
      ...scopedEpics.filter(e => usedEpicIds.has(e.id)).map(e => ({
        id:        e.id,
        labelNode: <EpicChip title={e.title} color={e.color} />,
        issues:    filtered.filter(i => i.epicId === e.id),
      })),
      ...(usedEpicIds.has("__none__") ? [{
        id:        "__none__",
        labelNode: <span className="text-xs font-semibold text-muted-foreground">No Epic</span>,
        issues:    filtered.filter(i => !i.epicId),
      }] : []),
    ]
    return (
      <SwimlaneTable
        headerLabel="Epic"
        rows={rows}
        tenantEpics={tenantEpics}
        defaultLabelW={180}
        minLabelW={120}
        maxLabelW={360}
        onCardClick={onCardClick}
      />
    )
  }

  // ── No group — simple flat kanban ────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto">
      <table className="border-separate border-spacing-0 min-w-max w-full ring-1 ring-border">
        <thead className="sticky top-0 z-20">
          <tr>
            {KANBAN_COLUMNS.map(col => (
              <th
                key={col.status}
                className="border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[col.status])} />
                  {col.label}
                  <Badge variant="secondary" className="ml-1 h-4 min-w-[20px] px-1.5 text-[10px]">
                    {filtered.filter(i => i.status === col.status).length}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            {KANBAN_COLUMNS.map(col => {
              const cellItems = filtered.filter(i => i.status === col.status)
              return (
                <td key={col.status} className="border-r border-border last:border-r-0 p-2 min-w-[220px]">
                  {cellItems.length === 0 ? (
                    <div className="flex items-center justify-center h-14 text-[11px] text-muted-foreground/40 select-none">Empty</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {cellItems.map(issue => (
                        <IssueCard key={issue.id} issue={issue} epics={tenantEpics} onClick={() => onCardClick(issue.id)} />
                      ))}
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
