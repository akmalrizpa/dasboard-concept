'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, TicketPercent, Loader2, AlertTriangle } from 'lucide-react'
import { useAdminStore, adminFetch } from '@/store/useAdminStore'
import { useToast } from '@/hooks/use-toast'
import { formatIDR, formatDateID } from '@/lib/format'
import type { VoucherFull } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  PERCENT: 'Persen (%)',
  FIXED: 'Nominal (Rp)',
  FREE_SHIPPING: 'Gratis Ongkir',
}

interface VoucherForm {
  code: string
  description: string
  type: string
  value: string
  minPurchase: string
  maxDiscount: string
  usageLimit: string
  startsAt: string
  expiresAt: string
  isActive: boolean
}

const emptyForm: VoucherForm = {
  code: '',
  description: '',
  type: 'PERCENT',
  value: '',
  minPurchase: '',
  maxDiscount: '',
  usageLimit: '',
  startsAt: new Date().toISOString().slice(0, 10),
  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  isActive: true,
}

/** Format tanggal untuk input type="date" */
function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export default function AdminVouchersView() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()

  const [vouchers, setVouchers] = useState<VoucherFull[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VoucherFull | null>(null)
  const [form, setForm] = useState<VoucherForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VoucherFull | null>(null)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/vouchers', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVouchers(data.vouchers)
    } catch (e) {
      console.error(e)
      toast({ title: 'Gagal memuat voucher', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (v: VoucherFull) => {
    setEditing(v)
    setForm({
      code: v.code,
      description: v.description,
      type: v.type,
      value: String(v.value),
      minPurchase: String(v.minPurchase),
      maxDiscount: String(v.maxDiscount),
      usageLimit: String(v.usageLimit),
      startsAt: toDateInput(v.startsAt),
      expiresAt: toDateInput(v.expiresAt),
      isActive: v.isActive,
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.code.trim()) {
      setFormError('Kode voucher wajib diisi')
      return
    }
    if (!form.expiresAt) {
      setFormError('Tanggal kedaluwarsa wajib diisi')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        type: form.type,
        value: form.value || 0,
        minPurchase: form.minPurchase || 0,
        maxDiscount: form.maxDiscount || 0,
        usageLimit: form.usageLimit || 0,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      }
      const res = await adminFetch(
        editing ? `/api/admin/vouchers/${editing.id}` : '/api/admin/vouchers',
        token,
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: editing ? 'Voucher diperbarui' : 'Voucher dibuat',
        description: `${payload.code} berhasil disimpan`,
      })
      setDialogOpen(false)
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan voucher')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setSaving(true)
    try {
      const res = await adminFetch(`/api/admin/vouchers/${deleteTarget.id}`, token, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Voucher dihapus', description: `${deleteTarget.code} sudah dihapus` })
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast({
        title: 'Gagal menghapus',
        description: e instanceof Error ? e.message : 'Coba lagi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Kelola kode promo yang bisa dipakai pelanggan saat checkout. Perubahan langsung berlaku.
        </p>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Voucher Baru
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <TicketPercent className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-semibold">Belum ada voucher</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat voucher pertama untuk menarik pelanggan berbelanja.
            </p>
            <Button onClick={openCreate} className="mt-4 gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Buat Voucher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead className="hidden md:table-cell">Tipe & Nilai</TableHead>
                  <TableHead className="hidden lg:table-cell">Min. Belanja</TableHead>
                  <TableHead className="hidden lg:table-cell">Pemakaian</TableHead>
                  <TableHead className="hidden md:table-cell">Berlaku s/d</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => {
                  const expired = new Date(v.expiresAt) < now
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <p className="font-mono font-bold">{v.code}</p>
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {v.description}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {v.type === 'PERCENT' && `Diskon ${v.value}%${v.maxDiscount > 0 ? ` (max ${formatIDR(v.maxDiscount)})` : ''}`}
                        {v.type === 'FIXED' && `Potongan ${formatIDR(v.value)}`}
                        {v.type === 'FREE_SHIPPING' && 'Gratis Ongkir'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {v.minPurchase > 0 ? formatIDR(v.minPurchase) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {v.usageLimit > 0 ? `${v.usedCount}/${v.usageLimit}` : `${v.usedCount}x`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {formatDateID(v.expiresAt)}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="outline" className="border-neutral-300 text-neutral-500">
                            Kedaluwarsa
                          </Badge>
                        ) : v.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-neutral-300 text-neutral-500">
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(v)}
                            aria-label={`Edit ${v.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(v)}
                            aria-label={`Hapus ${v.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Dialog buat/edit voucher */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Voucher' : 'Voucher Baru'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Perubahan langsung berlaku untuk pelanggan.'
                : 'Voucher baru langsung bisa dipakai pelanggan setelah disimpan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="v-code">Kode Voucher *</Label>
                <Input
                  id="v-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="CONTOH: BEAUTY10"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipe Diskon</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Persen (%)</SelectItem>
                    <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Gratis Ongkir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-desc">Deskripsi (tampil di checkout)</Label>
              <Textarea
                id="v-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Diskon 10% maksimal Rp50.000, min. belanja Rp100.000"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {form.type === 'PERCENT' && (
                <div className="space-y-1.5">
                  <Label htmlFor="v-value">Persen Diskon</Label>
                  <Input
                    id="v-value"
                    type="number"
                    min={1}
                    max={100}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="10"
                  />
                </div>
              )}
              {form.type === 'FIXED' && (
                <div className="space-y-1.5">
                  <Label htmlFor="v-value">Nominal Potongan (Rp)</Label>
                  <Input
                    id="v-value"
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="20000"
                  />
                </div>
              )}
              {form.type === 'PERCENT' && (
                <div className="space-y-1.5">
                  <Label htmlFor="v-max">Maks. Diskon (Rp, 0 = tanpa batas)</Label>
                  <Input
                    id="v-max"
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="v-min">Min. Belanja (Rp)</Label>
                <Input
                  id="v-min"
                  type="number"
                  min={0}
                  value={form.minPurchase}
                  onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-limit">Batas Pemakaian (0 = tanpa batas)</Label>
                <Input
                  id="v-limit"
                  type="number"
                  min={0}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-start">Berlaku Mulai</Label>
                <Input
                  id="v-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-exp">Berlaku Sampai *</Label>
                <Input
                  id="v-exp"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold">Voucher Aktif</p>
                <p className="text-xs text-muted-foreground">Nonaktifkan untuk menghentikan sementara</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                aria-label="Status voucher"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-destructive/10 p-2.5 text-sm font-medium text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Buat Voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Hapus voucher?
            </DialogTitle>
            <DialogDescription>
              Voucher <span className="font-mono font-bold">{deleteTarget?.code}</span> akan dihapus permanen
              dan tidak bisa dipakai pelanggan lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
