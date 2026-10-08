'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useAdminStore, adminFetch } from '@/store/useAdminStore'
import { useToast } from '@/hooks/use-toast'
import { formatIDR } from '@/lib/format'
import type { ShippingMethodDto, PaymentMethodDto, Article } from '@/lib/types'

// ============================================================
// Tab Pengiriman — CRUD metode & tarif ongkir
// ============================================================
interface ShippingForm {
  code: string
  label: string
  eta: string
  cost: string
  isActive: boolean
  sortOrder: string
}

export function ShippingTab() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()
  const [methods, setMethods] = useState<ShippingMethodDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShippingMethodDto | null>(null)
  const [form, setForm] = useState<ShippingForm>({ code: '', label: '', eta: '', cost: '', isActive: true, sortOrder: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ShippingMethodDto | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/shipping', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMethods(data.methods)
    } catch (e) {
      console.error(e)
      toast({ title: 'Gagal memuat metode pengiriman', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', label: '', eta: '', cost: '', isActive: true, sortOrder: String(methods.length + 1) })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (m: ShippingMethodDto) => {
    setEditing(m)
    setForm({
      code: m.code,
      label: m.label,
      eta: m.eta,
      cost: String(m.cost),
      isActive: m.isActive,
      sortOrder: String(m.sortOrder),
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.code.trim() || !form.label.trim()) {
      setFormError('Kode dan nama metode wajib diisi')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        eta: form.eta.trim(),
        cost: form.cost || 0,
        isActive: form.isActive,
        sortOrder: form.sortOrder || 0,
      }
      const res = await adminFetch(
        editing ? `/api/admin/shipping/${editing.id}` : '/api/admin/shipping',
        token,
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Metode pengiriman disimpan' })
      setDialogOpen(false)
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setSaving(true)
    try {
      const res = await adminFetch(`/api/admin/shipping/${deleteTarget.id}`, token, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Metode dihapus' })
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast({ title: 'Gagal menghapus', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Tarif ongkir di sini langsung dipakai di halaman checkout pelanggan.
        </p>
        <Button onClick={openCreate} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Metode Baru
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Estimasi</TableHead>
                  <TableHead>Ongkir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-semibold">{m.code}</TableCell>
                    <TableCell>{m.label}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{m.eta}</TableCell>
                    <TableCell className="font-semibold">{formatIDR(m.cost)}</TableCell>
                    <TableCell>
                      <span className={m.isActive ? 'text-emerald-600 font-semibold text-sm' : 'text-neutral-400 text-sm'}>
                        {m.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label={`Edit ${m.label}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-500"
                          onClick={() => setDeleteTarget(m)}
                          aria-label={`Hapus ${m.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Metode Pengiriman' : 'Metode Pengiriman Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kode *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="REGULER"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nama Tampil *</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Reguler" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Estimasi</Label>
              <Input value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} placeholder="2-4 hari kerja" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ongkir (Rp)</Label>
                <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-semibold">Aktif</p>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            {formError && <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Hapus metode?
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.label} akan dihapus dari pilihan pengiriman pelanggan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Tab Pembayaran — CRUD metode pembayaran & biaya
// ============================================================
interface PaymentForm {
  code: string
  label: string
  group: string
  desc: string
  fee: string
  isActive: boolean
  sortOrder: string
}

const PAYMENT_GROUPS = ['Transfer Bank', 'E-Wallet', 'Lainnya']

export function PaymentTab() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()
  const [methods, setMethods] = useState<PaymentMethodDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethodDto | null>(null)
  const [form, setForm] = useState<PaymentForm>({ code: '', label: '', group: 'Transfer Bank', desc: '', fee: '', isActive: true, sortOrder: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethodDto | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/payments', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMethods(data.methods)
    } catch (e) {
      console.error(e)
      toast({ title: 'Gagal memuat metode pembayaran', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', label: '', group: 'Transfer Bank', desc: '', fee: '', isActive: true, sortOrder: String(methods.length + 1) })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (m: PaymentMethodDto) => {
    setEditing(m)
    setForm({
      code: m.code,
      label: m.label,
      group: m.group,
      desc: m.desc,
      fee: String(m.fee),
      isActive: m.isActive,
      sortOrder: String(m.sortOrder),
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.code.trim() || !form.label.trim()) {
      setFormError('Kode dan nama metode wajib diisi')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        group: form.group,
        desc: form.desc.trim(),
        fee: form.fee || 0,
        isActive: form.isActive,
        sortOrder: form.sortOrder || 0,
      }
      const res = await adminFetch(
        editing ? `/api/admin/payments/${editing.id}` : '/api/admin/payments',
        token,
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Metode pembayaran disimpan' })
      setDialogOpen(false)
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setSaving(true)
    try {
      const res = await adminFetch(`/api/admin/payments/${deleteTarget.id}`, token, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Metode dihapus' })
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast({ title: 'Gagal menghapus', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Metode pembayaran di sini muncul di checkout. Biaya tambahan (mis. COD) otomatis dihitung.
        </p>
        <Button onClick={openCreate} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Metode Baru
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Grup</TableHead>
                  <TableHead>Biaya</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-semibold">{m.code}</TableCell>
                    <TableCell>
                      {m.label}
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{m.group}</TableCell>
                    <TableCell>{m.fee > 0 ? formatIDR(m.fee) : '—'}</TableCell>
                    <TableCell>
                      <span className={m.isActive ? 'text-emerald-600 font-semibold text-sm' : 'text-neutral-400 text-sm'}>
                        {m.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label={`Edit ${m.label}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-500"
                          onClick={() => setDeleteTarget(m)}
                          aria-label={`Hapus ${m.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Metode Pembayaran' : 'Metode Pembayaran Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kode *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="BCA"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nama Tampil *</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="BCA" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Grup</Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, group: g })}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      form.group === g
                        ? 'border-primary bg-primary text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-primary/40'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Virtual Account otomatis" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Biaya Tambahan (Rp)</Label>
                <Input type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-semibold">Aktif</p>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            {formError && <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Hapus metode?
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.label} akan dihapus dari pilihan pembayaran pelanggan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Tab Artikel — CRUD Beauty Journal
// ============================================================
interface ArticleForm {
  emoji: string
  tag: string
  title: string
  excerpt: string
  isActive: boolean
  sortOrder: string
}

export function ArticleTab() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState<ArticleForm>({ emoji: '📖', tag: '', title: '', excerpt: '', isActive: true, sortOrder: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/articles', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setArticles(data.articles)
    } catch (e) {
      console.error(e)
      toast({ title: 'Gagal memuat artikel', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ emoji: '📖', tag: '', title: '', excerpt: '', isActive: true, sortOrder: String(articles.length + 1) })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (a: Article) => {
    setEditing(a)
    setForm({
      emoji: a.emoji,
      tag: a.tag,
      title: a.title,
      excerpt: a.excerpt,
      isActive: a.isActive,
      sortOrder: String(a.sortOrder),
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.title.trim()) {
      setFormError('Judul artikel wajib diisi')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        emoji: form.emoji.trim() || '📖',
        tag: form.tag.trim() || 'Artikel',
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        isActive: form.isActive,
        sortOrder: form.sortOrder || 0,
      }
      const res = await adminFetch(
        editing ? `/api/admin/articles/${editing.id}` : '/api/admin/articles',
        token,
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Artikel disimpan' })
      setDialogOpen(false)
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setSaving(true)
    try {
      const res = await adminFetch(`/api/admin/articles/${deleteTarget.id}`, token, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Artikel dihapus' })
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast({ title: 'Gagal menghapus', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Artikel tampil di section &quot;Beauty Journal&quot; halaman depan toko.
        </p>
        <Button onClick={openCreate} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Artikel Baru
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada artikel. Buat artikel pertama untuk mengisi Beauty Journal.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl" aria-hidden>{a.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">{a.tag}</Badge>
                    <span className={`text-xs font-semibold ${a.isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
                      {a.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold leading-snug">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label={`Edit ${a.title}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-500"
                    onClick={() => setDeleteTarget(a)}
                    aria-label={`Hapus ${a.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Artikel' : 'Artikel Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
              <div className="space-y-1.5">
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>Tag</Label>
                <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Skincare 101" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Judul *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Urutan Skincare Pagi yang Benar" />
            </div>
            <div className="space-y-1.5">
              <Label>Ringkasan</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={3} placeholder="Ringkasan singkat artikel..." />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-semibold">Tampilkan di beranda</p>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            {formError && <p className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Hapus artikel?
            </DialogTitle>
            <DialogDescription>Artikel &quot;{deleteTarget?.title}&quot; akan dihapus dari beranda.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
