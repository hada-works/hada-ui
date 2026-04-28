import { useState } from "react"
import { Check, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { APPROVE_REASONS, REJECT_REASONS, INFO_REASONS } from "./bulk-buy.constants"

interface ActionFormProps {
  action:   "approve" | "reject" | "info"
  onSubmit: (reasonGroup: string, note: string) => void
  onCancel: () => void
}

export function ActionForm({ action, onSubmit, onCancel }: ActionFormProps) {
  const [reasonGroup, setReasonGroup] = useState("")
  const [note, setNote]               = useState("")

  const reasons  = action === "approve" ? APPROVE_REASONS : action === "reject" ? REJECT_REASONS : INFO_REASONS
  const needNote = action !== "approve"

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
      <Select value={reasonGroup} onValueChange={setReasonGroup}>
        <SelectTrigger className="h-8 text-xs bg-background">
          <SelectValue placeholder="Chọn nhóm lý do…" />
        </SelectTrigger>
        <SelectContent>
          {reasons.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
        </SelectContent>
      </Select>

      <Textarea
        className="text-xs min-h-[64px] resize-none bg-background"
        placeholder={needNote ? "Ghi chú bổ sung (bắt buộc nếu không chọn lý do)…" : "Ghi chú thêm (tuỳ chọn)…"}
        value={note}
        onChange={e => setNote(e.target.value)}
        autoFocus={!reasonGroup}
      />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          size="sm"
          className={cn(
            "h-7 text-xs gap-1",
            action === "reject" && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
            action === "info"   && "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.9)] text-[hsl(var(--warning-foreground))]",
          )}
          disabled={!reasonGroup && needNote && !note.trim()}
          onClick={() => onSubmit(reasonGroup || note.trim(), note)}
        >
          {action === "approve" && <><Check       className="size-3" />Xác nhận duyệt</>}
          {action === "reject"  && <><XCircle     className="size-3" />Xác nhận từ chối</>}
          {action === "info"    && <><AlertCircle className="size-3" />Gửi yêu cầu TT</>}
        </Button>
      </div>
    </div>
  )
}
