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
        <h1 className="text-lg font-medium tracking-tight mb-1">Create account</h1>
        <p className="text-sm text-muted">Start tracking work with your team</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[12px]">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Alex Morgan"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px]">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px]">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
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
          className="w-full h-10 bg-accent text-white hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Creating…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
