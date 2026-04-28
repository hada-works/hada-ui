"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Lazy-load heavy emoji-mart bundle only when picker is opened
const EmojiMartPicker = React.lazy(() =>
  Promise.all([
    import("@emoji-mart/react"),
    import("@emoji-mart/data"),
  ]).then(([mod, dataMod]) => ({
    default: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
      <mod.default
        data={dataMod.default}
        onEmojiSelect={(e: { native: string }) => onSelect(e.native)}
        theme="light"
        set="native"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
      />
    ),
  }))
)

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  /** Extra classes on the trigger button */
  className?: string
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={className}
          title="Choose icon"
        >
          <span className="text-lg leading-none">{value}</span>
          <ChevronDown className="size-3 text-muted-foreground ml-1 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 border-0 shadow-lg">
        <React.Suspense fallback={
          <div className="flex items-center justify-center w-[352px] h-[400px] text-xs text-muted-foreground">
            Loading…
          </div>
        }>
          <EmojiMartPicker onSelect={handleSelect} />
        </React.Suspense>
      </PopoverContent>
    </Popover>
  )
}
