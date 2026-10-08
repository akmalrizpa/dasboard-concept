'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Lock, User, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAdminStore } from '@/store/useAdminStore'

export default function AdminLoginView() {
  const navigate = useAppStore((s) => s.navigate)
  const login = useAdminStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login gagal')
      login(data.token, data.admin.name, data.admin.username)
      navigate({ name: 'admin-dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-rose-50 to-primary/20 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <ShieldCheck className="h-7 w-7 text-white" aria-hidden />
          </div>
          <CardTitle className="mt-3 text-xl">Dasbor Admin BeautyLoka</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk mengelola produk, pesanan, dan pelanggan
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-11 pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
                </>
              ) : (
                <>Masuk ke Dasbor</>
              )}
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-secondary p-4 text-center text-sm">
            <p className="font-semibold text-secondary-foreground">Demo Account</p>
            <p className="mt-1 text-muted-foreground">
              Username: <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">admin</code>{' '}
              • Password: <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">admin123</code>
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate({ name: 'home' })}
            className="mt-4 w-full gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Toko
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
