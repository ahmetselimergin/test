'use client'

import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signUp(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium tracking-tight mb-1">Hesap Oluştur</h1>
        <p className="text-sm text-muted-foreground">Takımınla işleri takip etmeye başla</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[12px]">Ad Soyad</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Ali Veli"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px]">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="sen@sirket.com"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px]">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="En az 6 karakter"
            className="h-10"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Oluşturuluyor…
            </>
          ) : (
            'Hesap Oluştur'
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Zaten hesabın var mı?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  )
}
