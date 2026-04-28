import * as React from "react"
import { Bug, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { EpicChip } from "@/components/shared/EpicChip"
import type { Issue, Epic, Sprint } from "@/types"
import { TableHead } from "./TableHead"
import { IssueRow } from "./IssueRow"
import { SprintBadge } from "./SprintBadge"
import type { GroupBy } from "./issues.constants"

interface IssueListViewProps {
  filtered:        Issue[]
  tenantEpics:     Epic[]
  relevantSprints: Sprint[]
  groupBy:         GroupBy
  projectId?:      string
  onRowClick:      (id: string) => void
}

export function IssueListView({
  filtered, tenantEpics, relevantSprints,
  groupBy, projectId, onRowClick,
}: IssueListViewProps) {

  // ── Sprint grouping ──────────────────────────────────────────────────────────
  if (groupBy === "sprint") {
    const ordered = [...relevantSprints].sort((a, b) => {
      const o = { active: 0, upcoming: 1, completed: 2 } as Record<string, number>
      return (o[a.status] ?? 3) - (o[b.status] ?? 3)
    })
    const usedIds       = new Set(filtered.map(i => i.sprintId))
    const noSprintItems = filtered.filter(i => !i.sprintId)
    const groups = [
      ...ordered.filter(s => usedIds.has(s.id)).map(s => ({
        key:    s.id,
        sprint: s as Sprint | null,
        items:  filtered.filter(i => i.sprintId === s.id),
      })),
      ...(noSprintItems.length > 0
        ? [{ key: "__none__", sprint: null as Sprint | null, items: noSprintItems }]
        : []),
    ]

    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-separate border-spacing-0 ring-1 ring-border">
          <TableHead sticky />
          <tbody>
            {groups.map(({ key, sprint, items }) => (
              <React.Fragment key={key}>
                <tr className="bg-muted/40">
                  <td colSpan={7} className="py-2 pl-4 pr-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold">{sprint ? sprint.name : "No Sprint"}</span>
                      {sprint && <SprintBadge status={sprint.status} />}
                      {sprint?.goal && (
                        <span className="text-xs text-muted-foreground truncate">— {sprint.goal}</span>
                      )}
                      <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{items.length}</Badge>
                    </div>
                  </td>
                </tr>
                {items.map(issue => (
                  <IssueRow key={issue.id} issue={issue} epics={tenantEpics} onClick={() => onRowClick(issue.id)} />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Epic grouping ────────────────────────────────────────────────────────────
  if (groupBy === "epic") {
    const scopedEpics = tenantEpics.filter(e => !projectId || e.projectId === projectId)
    const usedEpicIds = new Set(filtered.map(i => i.epicId))
    const noEpicItems = filtered.filter(i => !i.epicId)
    const groups = [
      ...scopedEpics.filter(e => usedEpicIds.has(e.id)).map(e => ({
        key:   e.id,
        epic:  e as Epic | null,
        items: filtered.filter(i => i.epicId === e.id),
      })),
      ...(noEpicItems.length > 0
        ? [{ key: "__none__", epic: null as Epic | null, items: noEpicItems }]
        : []),
    ]

    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <TableHead sticky />
          <tbody>
            {groups.map(({ key, epic, items }) => (
              <React.Fragment key={key}>
                <tr className="bg-muted/40">
                  <td colSpan={7} className="py-2 pl-4 pr-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      {epic
                        ? <EpicChip title={epic.title} color={epic.color} />
                        : <span className="text-xs font-semibold text-muted-foreground">No Epic</span>}
                      <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{items.length}</Badge>
                    </div>
                  </td>
                </tr>
                {items.map(issue => (
                  <IssueRow key={issue.id} issue={issue} epics={tenantEpics} onClick={() => onRowClick(issue.id)} />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Flat list (no group) ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto">
      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Bug}
            title="No issues found"
            description="Adjust your filters or create a new issue."
            action={{ label: "Create Issue", onClick: () => {} }}
          />
        </div>
      ) : (
        <table className="w-full text-sm border-separate border-spacing-0 ring-1 ring-border">
          <TableHead sticky />
          <tbody>
            {filtered.map(issue => (
              <IssueRow
                key={issue.id}
                issue={issue}
                epics={tenantEpics}
                onClick={() => onRowClick(issue.id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

