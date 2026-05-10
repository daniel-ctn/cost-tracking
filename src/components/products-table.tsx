'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit01Icon, Delete02Icon, PackageIcon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProduct, deleteProduct } from '@/app/actions'

type Product = {
  id: number
  name: string
  description: string | null
}

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const openEdit = (p: Product) => {
    setEditing(p)
    setEditName(p.name)
    setEditDesc(p.description ?? '')
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    await updateProduct(editing.id, editName, editDesc)
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent ring-1 ring-white/[0.06] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground pl-6">
                Product
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[80px] pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow
                key={p.id}
                className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/10">
                      <HugeiconsIcon icon={PackageIcon} className="size-4 text-violet-400" />
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.description ?? (
                    <span className="text-white/[0.15]">No description</span>
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(p)}
                      className="hover:bg-white/[0.06]"
                    >
                      <HugeiconsIcon icon={Edit01Icon} className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(p.id)}
                      className="hover:bg-red-500/10 hover:text-red-400"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
