'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Store, Megaphone, Home, Truck, CreditCard, Newspaper, Phone } from 'lucide-react'
import { useAdminStore, adminFetch } from '@/store/useAdminStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { useToast } from '@/hooks/use-toast'
import { formatDateID } from '@/lib/format'
import type { SettingsMap, FlashSaleFull } from '@/lib/types'
import { ShippingTab, PaymentTab, ArticleTab } from './AdminSettingsTables'

/** Item setting yang akan disimpan */
interface SettingItem {
  key: string
  value: unknown
}

// ============================================================
// Helper form: draf lokal + simpan seklik
// ============================================================
function SaveBar({
  saving,
  onSave,
  dirty,
  hint = 'Perubahan langsung tampil di toko setelah disimpan.',
}: {
  saving: boolean
  onSave: () => void
  dirty: boolean
  hint?: string
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-3">
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Button onClick={onSave} disabled={saving || !dirty} className="gap-2 bg-primary hover:bg-primary/90">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {dirty ? 'Simpan Perubahan' : 'Tersimpan'}
      </Button>
    </div>
  )
}

// ============================================================
// Tab Umum — identitas toko & teks pengumuman
// ============================================================
function GeneralTab({ settings, saveKeys, saving }: { settings: SettingsMap; saveKeys: (items: SettingItem[]) => Promise<boolean>; saving: boolean }) {
  // Inisialisasi langsung dari settings (tanpa useEffect) — komponen di-remount via key saat settings berubah
  const [form, setForm] = useState(() => ({
    name: getSetting<string>(settings, 'site.name', ''),
    tagline: getSetting<string>(settings, 'site.tagline', ''),
    metaTitle: getSetting<string>(settings, 'site.metaTitle', ''),
    metaDescription: getSetting<string>(settings, 'site.metaDescription', ''),
    searchPlaceholder: getSetting<string>(settings, 'site.searchPlaceholder', ''),
    announcementTexts: getSetting<string[]>(settings, 'announcement.texts', []).join('\n'),
    announcementActive: getSetting<boolean>(settings, 'announcement.active', true),
  }))

  const dirty =
    form.name !== getSetting<string>(settings, 'site.name', '') ||
    form.tagline !== getSetting<string>(settings, 'site.tagline', '') ||
    form.metaTitle !== getSetting<string>(settings, 'site.metaTitle', '') ||
    form.metaDescription !== getSetting<string>(settings, 'site.metaDescription', '') ||
    form.searchPlaceholder !== getSetting<string>(settings, 'site.searchPlaceholder', '') ||
    form.announcementTexts !== getSetting<string[]>(settings, 'announcement.texts', []).join('\n') ||
    form.announcementActive !== getSetting<boolean>(settings, 'announcement.active', true)

  const handleSave = () =>
    saveKeys([
      { key: 'site.name', value: form.name.trim() || 'Toko' },
      { key: 'site.tagline', value: form.tagline.trim() },
      { key: 'site.metaTitle', value: form.metaTitle.trim() },
      { key: 'site.metaDescription', value: form.metaDescription.trim() },
      { key: 'site.searchPlaceholder', value: form.searchPlaceholder.trim() },
      {
        key: 'announcement.texts',
        value: form.announcementTexts.split('\n').map((t) => t.trim()).filter(Boolean),
      },
      { key: 'announcement.active', value: form.announcementActive },
    ])

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4.5 w-4.5 text-primary" /> Identitas Toko
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nama Toko</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BeautyLoka" />
            <p className="text-[11px] text-muted-foreground">Muncul di header, footer & halaman sukses checkout.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Toko Kecantikan No. 1 Indonesia" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Judul Tab Browser (Meta Title)</Label>
            <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Deskripsi Website (Meta Description)</Label>
            <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Placeholder Kolom Pencarian</Label>
            <Input value={form.searchPlaceholder} onChange={(e) => setForm({ ...form, searchPlaceholder: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4.5 w-4.5 text-primary" /> Teks Pengumuman (Running Text)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Daftar Teks (satu per baris)</Label>
            <Textarea
              value={form.announcementTexts}
              onChange={(e) => setForm({ ...form, announcementTexts: e.target.value })}
              rows={4}
              placeholder={'Gratis ongkir min. belanja Rp300.000\nDiskon hingga 70% di Flash Sale'}
            />
            <p className="text-[11px] text-muted-foreground">
              Teks ini berjalan di bar hitam paling atas halaman toko.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-semibold">Tampilkan bar pengumuman</p>
              <p className="text-xs text-muted-foreground">Matikan untuk menyembunyikan running text</p>
            </div>
            <Switch
              checked={form.announcementActive}
              onCheckedChange={(v) => setForm({ ...form, announcementActive: v })}
              aria-label="Tampilkan pengumuman"
            />
          </div>
        </CardContent>
      </Card>

      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
    </div>
  )
}

// ============================================================
// Tab Homepage — judul section & jendela flash sale
// ============================================================
function HomepageTab({ settings, saveKeys, saving, token, onChanged }: {
  settings: SettingsMap
  saveKeys: (items: SettingItem[]) => Promise<boolean>
  saving: boolean
  token: string | null
  onChanged: () => void
}) {
  const { toast } = useToast()
  // Inisialisasi langsung dari settings (tanpa useEffect) — komponen di-remount via key saat settings berubah
  const [form, setForm] = useState(() => ({
    categoryTitle: getSetting<string>(settings, 'section.categoryTitle', ''),
    categoryEmoji: getSetting<string>(settings, 'section.categoryEmoji', ''),
    brandTitle: getSetting<string>(settings, 'section.brandTitle', ''),
    brandEmoji: getSetting<string>(settings, 'section.brandEmoji', ''),
    recommendTitle: getSetting<string>(settings, 'section.recommendTitle', ''),
    recommendEmoji: getSetting<string>(settings, 'section.recommendEmoji', ''),
    journalTitle: getSetting<string>(settings, 'section.journalTitle', ''),
    journalEmoji: getSetting<string>(settings, 'section.journalEmoji', ''),
  }))
  const [flashSales, setFlashSales] = useState<FlashSaleFull[]>([])
  const [active, setActive] = useState<FlashSaleFull | null>(null)
  const [flashLoading, setFlashLoading] = useState(true)
  const [flashForm, setFlashForm] = useState({ title: '', startsAt: '', endsAt: '', isActive: true })
  const [editingFlashId, setEditingFlashId] = useState<string | null>(null)
  const [flashSaving, setFlashSaving] = useState(false)

  const loadFlash = useCallback(async () => {
    if (!token) return
    setFlashLoading(true)
    try {
      const res = await adminFetch('/api/admin/flash-sale', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlashSales(data.flashSales)
      setActive(data.active)
      if (data.active) {
        setFlashForm({
          title: data.active.title,
          startsAt: toLocalInput(data.active.startsAt),
          endsAt: toLocalInput(data.active.endsAt),
          isActive: true,
        })
        setEditingFlashId(data.active.id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFlashLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadFlash()
  }, [loadFlash])

  /** Format ISO → nilai datetime-local (Asia/Jakarta) */
  function toLocalInput(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const dirty =
    form.categoryTitle !== getSetting<string>(settings, 'section.categoryTitle', '') ||
    form.categoryEmoji !== getSetting<string>(settings, 'section.categoryEmoji', '') ||
    form.brandTitle !== getSetting<string>(settings, 'section.brandTitle', '') ||
    form.brandEmoji !== getSetting<string>(settings, 'section.brandEmoji', '') ||
    form.recommendTitle !== getSetting<string>(settings, 'section.recommendTitle', '') ||
    form.recommendEmoji !== getSetting<string>(settings, 'section.recommendEmoji', '') ||
    form.journalTitle !== getSetting<string>(settings, 'section.journalTitle', '') ||
    form.journalEmoji !== getSetting<string>(settings, 'section.journalEmoji', '')

  const handleSave = () =>
    saveKeys([
      { key: 'section.categoryTitle', value: form.categoryTitle.trim() || 'Kategori Populer' },
      { key: 'section.categoryEmoji', value: form.categoryEmoji.trim() || '🧴' },
      { key: 'section.brandTitle', value: form.brandTitle.trim() || 'Brand Unggulan' },
      { key: 'section.brandEmoji', value: form.brandEmoji.trim() || '💎' },
      { key: 'section.recommendTitle', value: form.recommendTitle.trim() || 'Rekomendasi Untukmu' },
      { key: 'section.recommendEmoji', value: form.recommendEmoji.trim() || '✨' },
      { key: 'section.journalTitle', value: form.journalTitle.trim() || 'Beauty Journal' },
      { key: 'section.journalEmoji', value: form.journalEmoji.trim() || '📖' },
    ])

  const handleFlashSave = async () => {
    if (!token) return
    if (!flashForm.startsAt || !flashForm.endsAt) {
      toast({ title: 'Waktu mulai & selesai wajib diisi', variant: 'destructive' })
      return
    }
    setFlashSaving(true)
    try {
      const payload = {
        ...(editingFlashId ? { id: editingFlashId } : {}),
        title: flashForm.title.trim() || 'Flash Sale',
        startsAt: new Date(flashForm.startsAt).toISOString(),
        endsAt: new Date(flashForm.endsAt).toISOString(),
        isActive: flashForm.isActive,
      }
      const res = await adminFetch('/api/admin/flash-sale', token, {
        method: editingFlashId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Jendela flash sale disimpan', description: 'Countdown di beranda otomatis mengikuti.' })
      await loadFlash()
      onChanged()
    } catch (e) {
      toast({ title: 'Gagal menyimpan', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setFlashSaving(false)
    }
  }

  const handleFlashDelete = async (id: string) => {
    if (!token) return
    setFlashSaving(true)
    try {
      const res = await adminFetch('/api/admin/flash-sale', token, { method: 'DELETE', body: JSON.stringify({ id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Jendela dihapus' })
      if (editingFlashId === id) setEditingFlashId(null)
      await loadFlash()
      onChanged()
    } catch (e) {
      toast({ title: 'Gagal menghapus', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setFlashSaving(false)
    }
  }

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-4.5 w-4.5 text-primary" /> Judul Section Beranda
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['categoryTitle', 'Judul Section Kategori', 'Kategori Populer'],
              ['categoryEmoji', 'Emoji Kategori', '🧴'],
              ['brandTitle', 'Judul Section Brand', 'Brand Unggulan'],
              ['brandEmoji', 'Emoji Brand', '💎'],
              ['recommendTitle', 'Judul Section Rekomendasi', 'Rekomendasi Untukmu'],
              ['recommendEmoji', 'Emoji Rekomendasi', '✨'],
              ['journalTitle', 'Judul Section Jurnal', 'Beauty Journal'],
              ['journalEmoji', 'Emoji Jurnal', '📖'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div className="space-y-1.5" key={key}>
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            ⚡ Jendela Flash Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Atur judul & durasi flash sale. Countdown timer di beranda menghitung mundur ke waktu selesai.
            Produk flash sale diatur per-produk lewat menu <strong>Produk</strong> (harga flash & stok flash).
          </p>

          {active && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-bold text-emerald-800">Sedang berjalan: {active.title}</p>
              <p className="text-xs text-emerald-700">
                {formatDateID(active.startsAt)} → {formatDateID(active.endsAt)}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Judul Flash Sale</Label>
              <Input value={flashForm.title} onChange={(e) => setFlashForm({ ...flashForm, title: e.target.value })} placeholder="Flash Sale" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex h-10 items-center gap-3">
                <Switch
                  checked={flashForm.isActive}
                  onCheckedChange={(v) => setFlashForm({ ...flashForm, isActive: v })}
                  aria-label="Aktifkan flash sale"
                />
                <span className="text-sm text-muted-foreground">{flashForm.isActive ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mulai</Label>
              <Input type="datetime-local" value={flashForm.startsAt} onChange={(e) => setFlashForm({ ...flashForm, startsAt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Selesai</Label>
              <Input type="datetime-local" value={flashForm.endsAt} onChange={(e) => setFlashForm({ ...flashForm, endsAt: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleFlashSave} disabled={flashSaving} className="gap-2 bg-primary hover:bg-primary/90">
              {flashSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingFlashId ? 'Perbarui Jendela Ini' : 'Buat Jendela Baru'}
            </Button>
            {editingFlashId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingFlashId(null)
                  setFlashForm({ title: '', startsAt: '', endsAt: '', isActive: true })
                }}
              >
                Buat Baru Saja
              </Button>
            )}
          </div>

          {flashLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : flashSales.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Riwayat jendela:</p>
              {flashSales.map((fs) => (
                <div key={fs.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {fs.title}
                      {fs.id === active?.id && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Berjalan</Badge>}
                      {!fs.isActive && <Badge variant="outline">Nonaktif</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateID(fs.startsAt)} → {formatDateID(fs.endsAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFlashId(fs.id)
                        setFlashForm({
                          title: fs.title,
                          startsAt: toLocalInput(fs.startsAt),
                          endsAt: toLocalInput(fs.endsAt),
                          isActive: fs.isActive,
                        })
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-rose-500" onClick={() => handleFlashDelete(fs.id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
    </div>
  )
}

// ============================================================
// Tab Pengiriman — batas gratis ongkir + tabel metode
// ============================================================
function ShippingSettingsTab({ settings, saveKeys, saving }: { settings: SettingsMap; saveKeys: (items: SettingItem[]) => Promise<boolean>; saving: boolean }) {
  const [threshold, setThreshold] = useState(() => String(getSetting<number>(settings, 'shipping.freeThreshold', 0)))

  const dirty = threshold !== String(getSetting<number>(settings, 'shipping.freeThreshold', 0))

  const handleSave = () => saveKeys([{ key: 'shipping.freeThreshold', value: Math.max(0, parseInt(threshold, 10) || 0) }])

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4.5 w-4.5 text-primary" /> Batas Gratis Ongkir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5">
            <Label>Minimal belanja untuk gratis ongkir (Rp)</Label>
            <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="300000" />
            <p className="text-[11px] text-muted-foreground">Isi 0 untuk mematikan promo gratis ongkir.</p>
          </div>
        </CardContent>
      </Card>
      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
      <div className="mt-6">
        <ShippingTab />
      </div>
    </div>
  )
}

// ============================================================
// Tab Pembayaran — rekening + tabel metode
// ============================================================
function PaymentSettingsTab({ settings, saveKeys, saving }: { settings: SettingsMap; saveKeys: (items: SettingItem[]) => Promise<boolean>; saving: boolean }) {
  const [form, setForm] = useState(() => ({
    bankName: getSetting<string>(settings, 'checkout.bankName', ''),
    bankAccount: getSetting<string>(settings, 'checkout.bankAccount', ''),
    bankHolder: getSetting<string>(settings, 'checkout.bankHolder', ''),
  }))

  const dirty =
    form.bankName !== getSetting<string>(settings, 'checkout.bankName', '') ||
    form.bankAccount !== getSetting<string>(settings, 'checkout.bankAccount', '') ||
    form.bankHolder !== getSetting<string>(settings, 'checkout.bankHolder', '')

  const handleSave = () =>
    saveKeys([
      { key: 'checkout.bankName', value: form.bankName.trim() },
      { key: 'checkout.bankAccount', value: form.bankAccount.trim() },
      { key: 'checkout.bankHolder', value: form.bankHolder.trim() },
    ])

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4.5 w-4.5 text-primary" /> Rekening untuk Instruksi Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Nama Bank / VA</Label>
            <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BCA" />
          </div>
          <div className="space-y-1.5">
            <Label>Nomor Rekening</Label>
            <Input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="8808 1234 5678" />
          </div>
          <div className="space-y-1.5">
            <Label>Atas Nama</Label>
            <Input value={form.bankHolder} onChange={(e) => setForm({ ...form, bankHolder: e.target.value })} placeholder="PT BeautyLoka Indonesia" />
          </div>
          <p className="text-[11px] text-muted-foreground sm:col-span-3">
            Rekening ini ditampilkan di halaman sukses checkout sebagai instruksi transfer.
          </p>
        </CardContent>
      </Card>
      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
      <div className="mt-6">
        <PaymentTab />
      </div>
    </div>
  )
}

// ============================================================
// Tab Produk — teks jaminan
// ============================================================
function ProductTab({ settings, saveKeys, saving }: { settings: SettingsMap; saveKeys: (items: SettingItem[]) => Promise<boolean>; saving: boolean }) {
  const [form, setForm] = useState(() => ({
    guaranteeTitle: getSetting<string>(settings, 'product.guaranteeTitle', ''),
    guaranteeTexts: getSetting<string[]>(settings, 'product.guaranteeTexts', []).join('\n'),
  }))

  const dirty =
    form.guaranteeTitle !== getSetting<string>(settings, 'product.guaranteeTitle', '') ||
    form.guaranteeTexts !== getSetting<string[]>(settings, 'product.guaranteeTexts', []).join('\n')

  const handleSave = () =>
    saveKeys([
      { key: 'product.guaranteeTitle', value: form.guaranteeTitle.trim() },
      {
        key: 'product.guaranteeTexts',
        value: form.guaranteeTexts.split('\n').map((t) => t.trim()).filter(Boolean),
      },
    ])

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🛡️ Teks Jaminan Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Judul Jaminan</Label>
            <Input value={form.guaranteeTitle} onChange={(e) => setForm({ ...form, guaranteeTitle: e.target.value })} placeholder="Jaminan BeautyLoka" />
          </div>
          <div className="space-y-1.5">
            <Label>Poin Jaminan (satu per baris)</Label>
            <Textarea value={form.guaranteeTexts} onChange={(e) => setForm({ ...form, guaranteeTexts: e.target.value })} rows={5} />
            <p className="text-[11px] text-muted-foreground">
              Tampil di tab &quot;Pengiriman &amp; Jaminan&quot; pada halaman detail produk.
            </p>
          </div>
        </CardContent>
      </Card>
      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
    </div>
  )
}

// ============================================================
// Tab Footer — tentang, kontak, badge, sosmed
// ============================================================
interface TrustBadge {
  icon: string
  title: string
  desc: string
}
interface SocialLink {
  platform: string
  url: string
}

function FooterTab({ settings, saveKeys, saving }: { settings: SettingsMap; saveKeys: (items: SettingItem[]) => Promise<boolean>; saving: boolean }) {
  const [form, setForm] = useState(() => ({
    about: getSetting<string>(settings, 'footer.about', ''),
    copyright: getSetting<string>(settings, 'footer.copyright', ''),
    email: getSetting<string>(settings, 'footer.email', ''),
    phone: getSetting<string>(settings, 'footer.phone', ''),
    address: getSetting<string>(settings, 'footer.address', ''),
    trustBadges: getSetting<TrustBadge[]>(settings, 'footer.trustBadges', [])
      .map((b) => `${b.icon}|${b.title}|${b.desc}`)
      .join('\n'),
    paymentBadges: getSetting<string[]>(settings, 'footer.paymentBadges', []).join(', '),
    courierBadges: getSetting<string[]>(settings, 'footer.courierBadges', []).join(', '),
    socials: getSetting<SocialLink[]>(settings, 'footer.socials', [])
      .map((s) => `${s.platform}|${s.url}`)
      .join('\n'),
  }))

  const dirty =
    form.about !== getSetting<string>(settings, 'footer.about', '') ||
    form.copyright !== getSetting<string>(settings, 'footer.copyright', '') ||
    form.email !== getSetting<string>(settings, 'footer.email', '') ||
    form.phone !== getSetting<string>(settings, 'footer.phone', '') ||
    form.address !== getSetting<string>(settings, 'footer.address', '') ||
    form.trustBadges !==
      getSetting<TrustBadge[]>(settings, 'footer.trustBadges', []).map((b) => `${b.icon}|${b.title}|${b.desc}`).join('\n') ||
    form.paymentBadges !== getSetting<string[]>(settings, 'footer.paymentBadges', []).join(', ') ||
    form.courierBadges !== getSetting<string[]>(settings, 'footer.courierBadges', []).join(', ') ||
    form.socials !== getSetting<SocialLink[]>(settings, 'footer.socials', []).map((s) => `${s.platform}|${s.url}`).join('\n')

  const handleSave = () => {
    const trustBadges = form.trustBadges
      .split('\n')
      .map((line) => line.split('|').map((p) => p.trim()))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ icon: parts[0] || '✨', title: parts[1], desc: parts[2] || '' }))
    const socials = form.socials
      .split('\n')
      .map((line) => line.split('|').map((p) => p.trim()))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ platform: parts[0], url: parts[1] }))
    return saveKeys([
      { key: 'footer.about', value: form.about.trim() },
      { key: 'footer.copyright', value: form.copyright.trim() },
      { key: 'footer.email', value: form.email.trim() },
      { key: 'footer.phone', value: form.phone.trim() },
      { key: 'footer.address', value: form.address.trim() },
      { key: 'footer.trustBadges', value: trustBadges },
      {
        key: 'footer.paymentBadges',
        value: form.paymentBadges.split(',').map((t) => t.trim()).filter(Boolean),
      },
      {
        key: 'footer.courierBadges',
        value: form.courierBadges.split(',').map((t) => t.trim()).filter(Boolean),
      },
      { key: 'footer.socials', value: socials },
    ])
  }

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4.5 w-4.5 text-primary" /> Tentang & Kontak
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tentang Toko (footer)</Label>
            <Textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="halo@toko.id" />
          </div>
          <div className="space-y-1.5">
            <Label>Telepon</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(021) 555-0123" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Alamat</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jakarta Selatan, Indonesia" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Teks Hak Cipta</Label>
            <Input value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} placeholder="© 2026 Nama Toko. Seluruh hak cipta dilindungi." />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🏅 Badge & Media Sosial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Badge Kepercayaan (satu per baris: emoji|judul|deskripsi)</Label>
            <Textarea value={form.trustBadges} onChange={(e) => setForm({ ...form, trustBadges: e.target.value })} rows={4} placeholder={'🛡️|100% Original|Produk bergaransi resmi'} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Badge Pembayaran (pisahkan koma)</Label>
              <Input value={form.paymentBadges} onChange={(e) => setForm({ ...form, paymentBadges: e.target.value })} placeholder="BCA, Mandiri, GoPay, OVO" />
            </div>
            <div className="space-y-1.5">
              <Label>Badge Kurir (pisahkan koma)</Label>
              <Input value={form.courierBadges} onChange={(e) => setForm({ ...form, courierBadges: e.target.value })} placeholder="JNE, J&T Express, SiCepat" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Media Sosial (satu per baris: platform|url)</Label>
            <Textarea value={form.socials} onChange={(e) => setForm({ ...form, socials: e.target.value })} rows={4} placeholder={'Instagram|https://instagram.com/toko'} />
          </div>
        </CardContent>
      </Card>

      <SaveBar saving={saving} onSave={handleSave} dirty={dirty} />
    </div>
  )
}

// ============================================================
// Komponen utama — shell tab
// ============================================================
export default function AdminSettingsView() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()
  const bumpVersion = useSiteStore((s) => s.bumpVersion)
  const [settings, setSettings] = useState<SettingsMap | null>(null)
  const [settingsRev, setSettingsRev] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/settings', token)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data.settings)
      setSettingsRev((r) => r + 1)
    } catch (e) {
      console.error(e)
      toast({ title: 'Gagal memuat pengaturan', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    load()
  }, [load])

  const saveKeys = useCallback(
    async (items: SettingItem[]): Promise<boolean> => {
      if (!token) return false
      setSaving(true)
      try {
        const res = await adminFetch('/api/admin/settings', token, {
          method: 'PUT',
          body: JSON.stringify({ items }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSettings(data.settings)
        // Naikkan versi → storefront otomatis memuat ulang data baru
        bumpVersion()
        toast({ title: 'Pengaturan tersimpan', description: 'Perubahan sudah tampil di toko.' })
        return true
      } catch (e) {
        toast({
          title: 'Gagal menyimpan',
          description: e instanceof Error ? e.message : 'Coba lagi',
          variant: 'destructive',
        })
        return false
      } finally {
        setSaving(false)
      }
    },
    [token, toast, bumpVersion]
  )

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Semua teks, harga promo, ongkir, dan tampilan toko diatur di sini — tanpa menyentuh kode program.
      </p>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-neutral-100 p-1">
          <TabsTrigger value="general" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <Store className="h-3.5 w-3.5" /> Umum
          </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <Home className="h-3.5 w-3.5" /> Beranda & Flash Sale
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <Truck className="h-3.5 w-3.5" /> Pengiriman
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <CreditCard className="h-3.5 w-3.5" /> Pembayaran
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <Newspaper className="h-3.5 w-3.5" /> Produk & Artikel
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-1.5 rounded-full data-[state=active]:bg-white">
            <Phone className="h-3.5 w-3.5" /> Footer & Kontak
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralTab key={`general-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} />
        </TabsContent>
        <TabsContent value="homepage" className="mt-4">
          <HomepageTab key={`homepage-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} token={token} onChanged={bumpVersion} />
        </TabsContent>
        <TabsContent value="shipping" className="mt-4">
          <ShippingSettingsTab key={`shipping-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} />
        </TabsContent>
        <TabsContent value="payment" className="mt-4">
          <PaymentSettingsTab key={`payment-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} />
        </TabsContent>
        <TabsContent value="product" className="mt-4">
          <ProductTab key={`product-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} />
          <div className="mt-6">
            <ArticleTab />
          </div>
        </TabsContent>
        <TabsContent value="footer" className="mt-4">
          <FooterTab key={`footer-${settingsRev}`} settings={settings} saveKeys={saveKeys} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
