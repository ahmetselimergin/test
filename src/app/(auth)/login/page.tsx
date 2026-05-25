'use client'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-subtle rounded-2xl p-8 glass">
      <h1 className="text-2xl font-semibold mb-1">Giriş Yap</h1>
      <p className="text-muted text-sm mb-6">Hesabına giriş yap</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
            className="bg-white/5 border-white/10"
          />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500"
          disabled={loading}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Hesabın yok mu?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Kayıt ol
        </Link>
      </p>
    </div>
  )
}
