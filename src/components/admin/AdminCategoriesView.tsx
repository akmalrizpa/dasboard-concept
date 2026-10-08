'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import { useToast } from '@/hooks/use-toast'
import type { Category, Brand } from '@/lib/types'

export default function AdminCategoriesView() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()

  const [categories, setCategories] = useState<(Category & { productCount?: number })[]>([])
  const [brands, setBrands] = useState<(Brand & { productCount?: number })[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<'category' | 'brand'>('category')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'brand'; id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/brands', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const catData = await catRes.json()
      const brandData = await brandRes.json()
      if (catRes.ok) setCategories(catData.categories)
      if (brandRes.ok) setBrands(brandData.brands)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = (type: 'category' | 'brand') => {
    setEditingType(type)
    setEditingId(null)
    setName('')
    setIcon('')
    setIsFeatured(true)
    setDialogOpen(true)
  }

  const openEdit = (type: 'category' | 'brand', item: Category | Brand) => {
    setEditingType(type)
    setEditingId(item.id)
    setName(item.name)
    setIcon((item as Category).icon || '')
    setIsFeatured((item as Brand).isFeatured ?? false)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Nama wajib diisi', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const base = editingType === 'category' ? '/api/admin/categories' : '/api/admin/brands'
      const url = editingId ? `${base}/${editingId}` : base
      const body =
        editingType === 'category'
          ? { name, icon: icon || '✨' }
          : { name, isFeatured }
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: editingId ? 'Perubahan disimpan ✓' : 'Berhasil ditambahkan ✓',
        description: name,
      })
      setDialogOpen(false)
      load()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const base =
        deleteTarget.type === 'category' ? '/api/admin/categories' : '/api/admin/brands'
      const res = await fetch(`${base}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Berhasil dihapus', description: deleteTarget.name })
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const toggleFeatured = async (brand: Brand & { productCount?: number }) => {
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isFeatured: !brand.isFeatured }),
      })
      if (!res.ok) throw new Error('Gagal')
      setBrands((list) =>
        list.map((b) => (b.id === brand.id ? { ...b, isFeatured: !b.isFeatured } : b))
      )
    } catch {
      toast({ title: 'Gagal mengubah status unggulan', variant: 'destructive' })
    }
  }

  return (
    <div>
      <Tabs defaultValue="categories">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Kategori ({categories.length})</TabsTrigger>
          <TabsTrigger value="brands">Brand ({brands.length})</TabsTrigger>
        </TabsList>

        {/* Tab kategori */}
        <TabsContent value="categories">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => openCreate('category')}
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Kategori</th>
                        <th className="px-4 py-3 font-semibold">Slug</th>
                        <th className="px-4 py-3 font-semibold">Jumlah Produk</th>
                        <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {categories.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2 font-semibold">
                              <span aria-hidden>{c.icon}</span> {c.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                          <td className="px-4 py-3">{c.productCount || 0} produk</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => openEdit('category', c)}
                                aria-label={`Edit ${c.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                onClick={() =>
                                  setDeleteTarget({ type: 'category', id: c.id, name: c.name })
                                }
                                aria-label={`Hapus ${c.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab brand */}
        <TabsContent value="brands">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => openCreate('brand')}
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Tambah Brand
            </Button>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Brand</th>
                        <th className="px-4 py-3 font-semibold">Slug</th>
                        <th className="px-4 py-3 font-semibold">Jumlah Produk</th>
                        <th className="px-4 py-3 font-semibold">Unggulan</th>
                        <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {brands.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold">{b.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.slug}</td>
                          <td className="px-4 py-3">{b.productCount || 0} produk</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleFeatured(b)}
                              className="flex items-center gap-1.5"
                              title="Toggle brand unggulan"
                            >
                              {b.isFeatured ? (
                                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Unggulan
                                </span>
                              ) : (
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                                  Reguler
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => openEdit('brand', b)}
                                aria-label={`Edit ${b.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                onClick={() =>
                                  setDeleteTarget({ type: 'brand', id: b.id, name: b.name })
                                }
                                aria-label={`Hapus ${b.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog tambah/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Tambah'} {editingType === 'category' ? 'Kategori' : 'Brand'}
            </DialogTitle>
            <DialogDescription>
              {editingType === 'category'
                ? 'Kategori membantu pelanggan menemukan produk lebih mudah.'
                : 'Brand unggulan akan tampil di beranda toko.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Nama *</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={editingType === 'category' ? 'Contoh: Men Health' : 'Contoh: Luxcrime'}
                required
              />
            </div>
            {editingType === 'category' && (
              <div className="space-y-1.5">
                <Label htmlFor="item-icon">Ikon Emoji</Label>
                <Input
                  id="item-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="✨"
                  maxLength={4}
                />
              </div>
            )}
            {editingType === 'brand' && (
              <div className="flex items-center justify-between rounded-xl border p-3.5">
                <div>
                  <Label htmlFor="item-featured" className="flex items-center gap-1.5 font-semibold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Brand Unggulan
                  </Label>
                  <p className="text-xs text-muted-foreground">Tampil di beranda toko</p>
                </div>
                <Switch
                  id="item-featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="gap-1.5 bg-primary hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {deleteTarget?.type === 'category' ? 'kategori' : 'brand'} ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; akan dihapus. Kategori/brand yang masih memiliki
              produk tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
