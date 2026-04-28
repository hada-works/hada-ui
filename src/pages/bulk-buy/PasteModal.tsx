import { useState } from "react"
import { ClipboardPaste } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { BulkItem } from "@/types"

interface PasteModalProps {
  onClose:  () => void
  onImport: (items: Partial<BulkItem>[]) => void
}

export function PasteModal({ onClose, onImport }: PasteModalProps) {
  const [raw,   setRaw]   = useState("")
  const [count, setCount] = useState(0)
  const [error, setError] = useState("")

  const parse = (text: string) => {
    setRaw(text)
    if (!text.trim()) { setCount(0); setError(""); return }
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    const valid = lines.filter(l => {
      const cols = l.split(/\t|,/)
      return cols.length >= 3 && cols[0].trim() && cols[1].trim()
    })
    setCount(valid.length)
    setError(valid.length === 0
      ? "Không nhận dạng được dữ liệu. Tối thiểu: SKU ⇥ Tên sản phẩm ⇥ Nhà cung cấp"
      : "")
  }

  const doImport = () => {
    const rows: Partial<BulkItem>[] = raw
      .trim().split(/\r?\n/).filter(Boolean)
      .map(l => l.split(/\t|,/).map(c => c.trim().replace(/^"|"$/g, "")))
      .filter(c => c.length >= 3 && c[0] && c[1])
      .map(c => ({
        sku:             c[0],
        productName:     c[1],
        supplier:        c[2]  || "—",
        category:        c[3]  || "Uncategorized",
        qtyOrdered:      parseInt(c[4]?.replace(/\D/g, "") || "0") || 0,
        unitPrice:       parseInt(c[5]?.replace(/\D/g, "") || "0") || 0,
        orderValue:      (parseInt(c[4]?.replace(/\D/g, "") || "0") || 0) *
                         (parseInt(c[5]?.replace(/\D/g, "") || "0") || 0),
        expectedArrival: c[6]  || "",
        dealStart:       c[7]  || "",
        dealEnd:         c[8]  || "",
        scmDeadline:     c[9]  || "",
        promotion:       c[10] || "—",
        feasibilityNote: c[11] || "",
        requestedBy:     "Current User",
        requestedAt:     new Date().toISOString().slice(0, 10),
      }))
    onImport(rows)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Paste hàng loạt từ Excel / CSV</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>✕</Button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 flex-1 overflow-auto">
          <p className="text-xs text-muted-foreground">Định dạng mỗi dòng (tab-separated hoặc CSV):</p>
          <code className="block px-2.5 py-2 bg-muted rounded text-[10px] font-mono leading-relaxed">
            SKU ⇥ Tên sản phẩm ⇥ NCC ⇥ Danh mục ⇥ SL đặt ⇥ Đơn giá ⇥ Ngày nhập ⇥ Bắt đầu deal ⇥ Bán hết lô ⇥ Deadline SCM ⇥ CTKM ⇥ Giải thích
          </code>
          <Textarea
            className="font-mono text-xs min-h-[140px] resize-none"
            placeholder={"FRZ-0021\tFrozen Chicken 2kg\tVissan\tFrozen\t2400\t85000\t2026-05-05\t05/10/2026\t05/31/2026\t05/01/2026\tGiảm 15%\tDeal Q2..."}
            value={raw}
            onChange={e => parse(e.target.value)}
            autoFocus
          />
          {error  && <p className="text-xs text-destructive">{error}</p>}
          {count > 0 && <p className="text-xs text-[hsl(var(--success))]">✓ Nhận dạng được {count} dòng hợp lệ</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Huỷ</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" disabled={count === 0} onClick={doImport}>
            <ClipboardPaste className="size-3.5" />Import {count > 0 && `${count} dòng`}
          </Button>
        </div>
      </div>
    </div>
  )
}
