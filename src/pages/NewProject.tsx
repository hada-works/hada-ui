import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { ProjectStatus } from "@/types"

export function NewProject() {
  const navigate = useNavigate()
  const [name,        setName]        = useState("")
  const [emoji,       setEmoji]       = useState("🚀")
  const [identifier,  setIdentifier]  = useState("")
  const [desc,        setDesc]        = useState("")
  const [status,      setStatus]      = useState<ProjectStatus>("planning")
  const [startDate,   setStartDate]   = useState("")
  const [targetDate,  setTargetDate]  = useState("")

  const handleNameChange = (v: string) => {
    setName(v)
    const auto = v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)
    setIdentifier(auto)
  }

  const canSave = name.trim().length > 0 && identifier.trim().length > 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/projects")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">Projects</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium">New Project</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => navigate("/projects")}>Create Project</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-8 py-10 space-y-6">

          {/* Name + Identifier — emoji picker inline as prefix */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                <EmojiPicker value={emoji} onChange={setEmoji} className="h-9 w-14 shrink-0 px-0" />
                <Input
                  placeholder="e.g. Auth System Overhaul"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  autoFocus
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Identifier <span className="text-destructive">*</span></label>
              <Input
                placeholder="AUTH"
                value={identifier}
                onChange={e => setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                className="font-mono uppercase max-w-[160px]"
              />
              <p className="text-[11px] text-muted-foreground">Used as prefix for issue IDs (e.g. {identifier || "AUTH"}-1)</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              placeholder="What is this project about? (optional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Status + Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as ProjectStatus)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick start date" className="h-9 text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <DatePicker value={targetDate} onChange={setTargetDate} placeholder="Pick target date" className="h-9 text-xs" />
            </div>
          </div>

          {/* Preview */}
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Preview</label>
            <div className="inline-flex items-center gap-2 rounded-md border bg-sidebar-accent px-3 py-2">
              <span className="text-base">{emoji}</span>
              <span className="text-sm font-medium">{name || <span className="text-muted-foreground italic">Project name</span>}</span>
              {identifier && (
                <span className="font-mono text-xs text-muted-foreground border rounded px-1.5 py-0.5">{identifier}</span>
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
