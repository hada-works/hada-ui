import * as React from "react"
import type { Issue, Epic } from "@/types"
import { cn } from "@/lib/utils"
import { KANBAN_COLUMNS, STATUS_DOT } from "../constants"
import { IssueCard } from "./IssueCard"

// ─── Row descriptor ───────────────────────────────────────────────────────────

export interface SwimlaneRow {
  id:        string
  /** Content rendered above the issue-count line in the sticky label cell */
  labelNode: React.ReactNode
  issues:    Issue[]
}

interface SwimlaneTableProps {
  headerLabel:    string
  rows:           SwimlaneRow[]
  tenantEpics:    Epic[]
  defaultLabelW?: number   // initial width of the label column (px)
  minLabelW?:     number   // drag min
  maxLabelW?:     number   // drag max
  onCardClick:    (id: string) => void
}

export function SwimlaneTable({
  headerLabel,
  rows,
  tenantEpics,
  defaultLabelW = 160,
  minLabelW     = 100,
  maxLabelW     = 320,
  onCardClick,
}: SwimlaneTableProps) {
  const [labelW, setLabelW] = React.useState(defaultLabelW)
  const isDragging          = React.useRef(false)
  const startX              = React.useRef(0)
  const startW              = React.useRef(defaultLabelW)

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current         = true
    startX.current             = e.clientX
    startW.current             = labelW
    document.body.style.cursor     = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const next = Math.max(minLabelW, Math.min(maxLabelW, startW.current + ev.clientX - startX.current))
      setLabelW(next)
    }
    const onUp = () => {
      isDragging.current             = false
      document.body.style.cursor     = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="border-separate border-spacing-0 min-w-max w-full">
        {/* ── Header ── */}
        <thead className="sticky top-0 z-20">
          <tr>
            {/* Resizable label column — sticky left + highest z */}
            <th
              style={{ width: labelW, minWidth: labelW }}
              className="relative bg-muted border-b border-r border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground select-none sticky left-0 z-30 shadow-[2px_0_4px_-1px_hsl(var(--border))]"
            >
              {headerLabel}
              <div
                onMouseDown={onMouseDown}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize group z-10"
              >
                <div className="absolute inset-y-0 right-0 w-[3px] rounded-full opacity-0 group-hover:opacity-100 bg-primary/40 transition-opacity duration-150" />
              </div>
            </th>
            {KANBAN_COLUMNS.map(col => (
              <th key={col.status} className="border-b border-r border-border last:border-r-0 bg-muted px-3 py-2.5 text-left text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[col.status])} />
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Rows ── */}
        <tbody>
          {rows.map((row, rowIdx) => {
            const isLast = rowIdx === rows.length - 1
            return (
              <tr key={row.id} className="align-top">
                {/* Sticky label cell — z-10 so it stays above body cells but below header */}
                <td
                  style={{ width: labelW, minWidth: labelW }}
                  className={cn(
                    "bg-background border-r border-border px-3 py-3 sticky left-0 z-10 shadow-[2px_0_4px_-1px_hsl(var(--border))]",
                    !isLast && "border-b"
                  )}
                >
                  {row.labelNode}
                  <p className="text-[10px] text-muted-foreground mt-1.5">{row.issues.length} issues</p>
                </td>

                {/* Status cells */}
                {KANBAN_COLUMNS.map(col => {
                  const cellItems = row.issues.filter(i => i.status === col.status)
                  return (
                    <td key={col.status} className={cn(
                      "border-r border-border last:border-r-0 p-2 min-w-[200px]",
                      !isLast && "border-b"
                    )}>
                      {cellItems.length === 0 ? (
                        <div className="flex items-center justify-center h-10 text-[10px] text-muted-foreground/30 select-none">—</div>
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
