'use client'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-subtle rounded-2xl p-8 glass">
      <h1 className="text-2xl font-semibold mb-1">Hesap Oluştur</h1>
      <p className="text-muted text-sm mb-6">FlowTrack&apos;e katıl</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Ali Veli"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ornek@sirket.com"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="En az 6 karakter"
            className="bg-white/5 border-white/10"
          />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500"
          disabled={loading}
        >
          {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Hesabın var mı?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Giriş yap
        </Link>
      </p>
    </div>
  )
}
