import { useState } from "react"
import { MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { BulkComment } from "@/types"
import { CURRENT_NAME, CURRENT_ROLE } from "./bulk-buy.constants"

const ROLE_COLOR: Record<BulkComment["role"], string> = {
  MDM:       "bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))]",
  SCM:       "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]",
  Requester: "bg-secondary text-secondary-foreground",
}

interface CommentSectionProps {
  comments: BulkComment[]
  onAdd:    (text: string) => void
}

export function CommentSection({ comments, onAdd }: CommentSectionProps) {
  const [text, setText] = useState("")

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim())
    setText("")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Trao đổi ({comments.length})
        </p>
      </div>

      {/* Thread */}
      <div className="space-y-2.5 max-h-48 overflow-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 italic">Chưa có bình luận.</p>
        ) : comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <Avatar className="size-5 shrink-0 mt-0.5">
              <AvatarFallback className="text-[8px]">
                {c.author.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium">{c.author}</span>
                <span className={cn("text-[9px] font-semibold px-1 py-0.5 rounded", ROLE_COLOR[c.role])}>
                  {c.role}
                </span>
                <span className="text-[10px] text-muted-foreground/60">{c.time}</span>
              </div>
              <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="flex items-start gap-2">
        <Avatar className="size-5 shrink-0 mt-1">
          <AvatarFallback className="text-[8px]">
            {CURRENT_NAME.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Textarea
            className="text-xs min-h-[56px] resize-none"
            placeholder="Nhập bình luận… (Ctrl+Enter để gửi)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit() }}
          />
          <div className="flex justify-end">
            <Button size="sm" className="h-6 text-xs gap-1 px-2" disabled={!text.trim()} onClick={submit}>
              <Send className="size-3" />Gửi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
