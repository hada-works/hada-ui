import { Check, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type FieldState = "ok" | "missing" | "partial"

interface FieldIconProps {
  state:      FieldState
  className?: string
}

export function FieldIcon({ state, className }: FieldIconProps) {
  if (state === "ok")      return <Check         className={cn("size-3.5 text-[hsl(var(--success))]",  className)} />
  if (state === "partial") return <AlertTriangle className={cn("size-3.5 text-[hsl(var(--warning))]", className)} />
  return                          <X             className={cn("size-3.5 text-destructive",            className)} />
}

/** Convenience: boolean → FieldState */
export const fieldState = (ok: boolean): FieldState => ok ? "ok" : "missing"

/** For photo count: ok if ≥5, partial if 1-4, missing if 0 */
export const photoState = (count: number): FieldState =>
  count >= 5 ? "ok" : count > 0 ? "partial" : "missing"
