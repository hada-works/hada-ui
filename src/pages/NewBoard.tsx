import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { EmojiPicker } from "@/components/ui/emoji-picker"

const PRESET_TOPICS = [
  "Feature Requests", "Bug Reports", "UI / Design", "Performance",
  "Integrations", "Mobile", "Security", "Accessibility",
]

export function NewBoard() {
  const navigate  = useNavigate()
  const [name,      setName]      = useState("")
  const [emoji,     setEmoji]     = useState("📦")
  const [desc,      setDesc]      = useState("")
  const [isPriv,    setIsPriv]    = useState(false)

  const canSave = name.trim().length > 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/feedbacks")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">Feedbacks</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium">New Board</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/feedbacks")}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => navigate("/feedbacks")}>Create Board</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-8 py-10 space-y-6">

          {/* Board Name — emoji picker inline as prefix */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Board Name <span className="text-destructive">*</span></label>
            <div className="flex gap-2">
              <EmojiPicker value={emoji} onChange={setEmoji} className="h-9 w-14 shrink-0 px-0" />

              <Input
                placeholder="e.g. Feature Requests"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="flex-1"
              />
            </div>

            {/* Preset name chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {PRESET_TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setName(t)}
                  className="text-xs border rounded-full px-2.5 py-0.5 hover:bg-accent transition-colors text-muted-foreground"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              placeholder="What kind of feedback goes here? (optional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Visibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Visibility</label>
            <div className="flex flex-col gap-2">
              {([
                { val: false, label: "Public",  desc: "Anyone in the workspace can submit and see feedback" },
                { val: true,  label: "Private", desc: "Only admins and members can see this board" },
              ] as const).map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setIsPriv(opt.val)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors
                    ${isPriv === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"}`}
                >
                  <div className={`mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0
                    ${isPriv === opt.val ? "border-primary" : "border-muted-foreground"}`}>
                    {isPriv === opt.val && <div className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Preview</label>
            <div className="inline-flex items-center gap-2 rounded-md border bg-sidebar-accent px-3 py-2">
              <span className="text-base">{emoji}</span>
              <span className="text-sm font-medium">{name || <span className="text-muted-foreground italic">Board name</span>}</span>
              {isPriv && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Private</Badge>}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
