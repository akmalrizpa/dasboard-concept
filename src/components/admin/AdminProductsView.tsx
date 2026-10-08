 
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import { useToast } from '@/hooks/use-toast'
import { formatIDR } from '@/lib/format'
import type { Product, Category, Brand } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductForm {
  name: string
  description: string
  price: string
  originalPrice: string
  stock: string
  image: string
  categoryId: string
  brandId: string
  isFlashSale: boolean
  flashPrice: string
  isActive: boolean
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  stock: '',
  image: '',
  categoryId: '',
  brandId: '',
  isFlashSale: false,
  flashPrice: '',
  isActive: true,
}

export default function AdminProductsView() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProducts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (categoryFilter !== 'ALL') params.set('categoryId', categoryFilter)
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setProducts(data.products)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, search, categoryFilter])

  useEffect(() => {
    const t = setTimeout(loadProducts, 250)
    return () => clearTimeout(t)
  }, [loadProducts])

  useEffect(() => {
    if (!token || categories.length > 0) return
    Promise.all([
      fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/brands', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([catRes, brandRes]) => {
        const catData = await catRes.json()
        const brandData = await brandRes.json()
        if (catRes.ok) setCategories(catData.categories)
        if (brandRes.ok) setBrands(brandData.brands)
      })
      .catch(console.error)
  }, [token, categories.length])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '', brandId: brands[0]?.id || '' })
    setDialogOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      stock: String(p.stock),
      image: p.image,
      categoryId: p.categoryId,
      brandId: p.brandId,
      isFlashSale: p.isFlashSale,
      flashPrice: p.flashPrice ? String(p.flashPrice) : '',
      isActive: p.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.categoryId || !form.brandId) {
      toast({
        title: 'Form belum lengkap',
        description: 'Nama, harga, kategori, dan brand wajib diisi.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          stock: Number(form.stock || 0),
          flashPrice: form.isFlashSale && form.flashPrice ? Number(form.flashPrice) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')
      toast({
        title: editingId ? 'Produk diperbarui ✓' : 'Produk ditambahkan ✓',
        description: form.name,
      })
      setDialogOpen(false)
      loadProducts()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan',
        description: err instanceof Error ? err.message : 'Coba lagi',
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
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: 'Produk dihapus',
        description: data.softDeleted
          ? 'Produk pernah dipesan — dinonaktifkan agar riwayat pesanan aman.'
          : deleteTarget.name,
      })
      setDeleteTarget(null)
      loadProducts()
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: err instanceof Error ? err.message : 'Coba lagi',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (p: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      if (!res.ok) throw new Error('Gagal mengubah status')
      setProducts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x))
      )
    } catch (e) {
      toast({ title: 'Gagal mengubah status', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk / brand..."
            className="pl-9"
            aria-label="Cari produk"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44" aria-label="Filter kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" /> {products.length} produk
        </div>
        <Button onClick={openCreate} className="gap-1.5 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {/* Tabel */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-800 text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Harga</th>
                    <th className="px-4 py-3 font-semibold">Stok</th>
                    <th className="px-4 py-3 font-semibold">Terjual</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        Tidak ada produk ditemukan.
                      </td>
                    </tr>
                  )}
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-neutral-50">
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 max-w-64">
                            <p className="line-clamp-1 font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.brand.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.category.name}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{formatIDR(p.price)}</p>
                        {p.isFlashSale && p.flashPrice && (
                          <Badge className="mt-0.5 gap-1 bg-primary px-1.5 py-0 text-[10px] hover:bg-primary">
                            <Zap className="h-2.5 w-2.5 fill-white" /> {formatIDR(p.flashPrice)}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-bold',
                            p.stock === 0
                              ? 'text-rose-600'
                              : p.stock <= 10
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                          )}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">{p.sold}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          )}
                          title={p.isActive ? 'Nonaktifkan produk' : 'Aktifkan produk'}
                        >
                          {p.isActive ? (
                            <>
                              <Eye className="h-3 w-3" /> Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" /> Nonaktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEdit(p)}
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`Hapus ${p.name}`}
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

      {/* Dialog tambah/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Perbarui informasi produk di bawah ini.'
                : 'Lengkapi data produk baru yang akan ditampilkan di toko.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-name">Nama Produk *</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Hydrasoothe Sunscreen Gel SPF 45"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand *</Label>
              <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Harga Jual (Rp) *</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="69000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-orig">Harga Sebelum Diskon (Rp)</Label>
              <Input
                id="p-orig"
                type="number"
                min={0}
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="89000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stok</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-image">URL Gambar Produk</Label>
              <Input
                id="p-image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-desc">Deskripsi</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi lengkap produk, kandungan, dan manfaatnya..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div>
                <Label htmlFor="p-flash" className="flex items-center gap-1.5 font-semibold">
                  <Zap className="h-4 w-4 fill-amber-400 text-amber-400" /> Flash Sale
                </Label>
                <p className="text-xs text-muted-foreground">Tampilkan di section flash sale</p>
              </div>
              <Switch
                id="p-flash"
                checked={form.isFlashSale}
                onCheckedChange={(v) => setForm({ ...form, isFlashSale: v })}
              />
            </div>
            {form.isFlashSale ? (
              <div className="space-y-1.5">
                <Label htmlFor="p-flashprice">Harga Flash Sale (Rp)</Label>
                <Input
                  id="p-flashprice"
                  type="number"
                  min={0}
                  value={form.flashPrice}
                  onChange={(e) => setForm({ ...form, flashPrice: e.target.value })}
                  placeholder="55000"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border p-3.5">
                <div>
                  <Label htmlFor="p-active" className="font-semibold">
                    Tampilkan di Toko
                  </Label>
                  <p className="text-xs text-muted-foreground">Produk aktif bisa dibeli</p>
                </div>
                <Switch
                  id="p-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            )}
            {form.isFlashSale && (
              <div className="flex items-center justify-between rounded-xl border p-3.5 sm:col-span-2">
                <div>
                  <Label htmlFor="p-active2" className="font-semibold">
                    Tampilkan di Toko
                  </Label>
                  <p className="text-xs text-muted-foreground">Produk aktif bisa dibeli</p>
                </div>
                <Switch
                  id="p-active2"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            )}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="gap-1.5 bg-primary hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; akan dihapus dari katalog. Jika produk sudah pernah
              dipesan, produk hanya akan dinonaktifkan agar riwayat pesanan tetap aman. Tindakan
              ini tidak dapat dibatalkan.
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
