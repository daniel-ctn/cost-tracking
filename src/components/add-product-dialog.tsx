'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PackageIcon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProduct } from '@/app/actions'

export function AddProductDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    await createProduct(name, description)
    setSaving(false)
    setOpen(false)
    setName('')
    setDescription('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
            Add Product
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center size-10 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <HugeiconsIcon icon={PackageIcon} className="size-5 text-violet-400" />
            </div>
            <DialogTitle>Add Product</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SaaS App"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
