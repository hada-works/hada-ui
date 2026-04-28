import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ─── Converts a full name → two-letter initials ───────────────────────────────
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

interface UserAvatarProps {
  name: string
  className?: string
  /** Tailwind size class for the avatar — default "size-6" */
  size?: string
  /** Tailwind text size class for the initials — default "text-[10px]" */
  textSize?: string
}

export function UserAvatar({ name, className, size = "size-6", textSize = "text-[10px]" }: UserAvatarProps) {
  return (
    <Avatar className={cn(size, className)}>
      <AvatarFallback className={textSize}>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

/** Standalone helper — use when you only need the initials string */
export { initials as getInitials }
