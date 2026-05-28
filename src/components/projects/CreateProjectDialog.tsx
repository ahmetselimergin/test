'use client'

import { useRef, useState } from 'react'
import { Plus, Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createProjectAction } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface Props {
  workspaceId: string
}

export function CreateProjectDialog({ workspaceId }: Props) {
  const [color, setColor] = useState('#6366f1')
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const autoKey = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('project-logos')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('project-logos').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch {
      alert('Logo yüklenemedi. Supabase Storage ayarlarını kontrol et.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-sm font-medium text-white hover:opacity-90 transition-opacity">
        <Plus size={16} />
        Yeni Proje
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-subtle">
        <DialogHeader>
          <DialogTitle>Proje Oluştur</DialogTitle>
        </DialogHeader>
        <form
          action={createProjectAction as unknown as (formData: FormData) => void}
          className="space-y-4"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="logo_url" value={logoUrl} />

          {/* Preview + Logo Upload */}
          <div className="flex items-center gap-4 p-3 rounded-xl border border-subtle bg-subtle/40">
            <div className="relative group/logo shrink-0">
              <div
                className="size-14 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden transition-colors"
                style={{ backgroundColor: logoUrl ? 'transparent' : color }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="size-full object-cover rounded-xl" />
                ) : (
                  <span>{key || autoKey(name) || '?'}</span>
                )}
              </div>
              {/* Upload overlay */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading
                  ? <Loader2 size={16} className="text-white animate-spin" />
                  : <Upload size={16} className="text-white" />
                }
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors z-10"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">{name || 'Proje adı'}</p>
              <p className="text-[11px] text-muted">{key || autoKey(name) || 'Önizleme'}</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-1.5 text-[11px] text-accent hover:underline flex items-center gap-1"
              >
                <Upload size={10} />
                {logoUrl ? 'Logoyu değiştir' : 'Logo yükle'}
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[12px]">Proje Adı</Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!key) setKey(autoKey(e.target.value))
              }}
              placeholder="Ör: Mobile App"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key" className="text-[12px]">Proje Kodu</Label>
            <Input
              id="key"
              name="key"
              required
              maxLength={5}
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="MA"
              className="h-9 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="methodology" className="text-[12px]">Metodoloji</Label>
            <select
              id="methodology"
              name="methodology"
              defaultValue="both"
              className="w-full h-9 rounded-lg border border-subtle bg-card px-3 text-sm text-foreground"
            >
              <option value="both">Kanban + Scrum</option>
              <option value="kanban">Kanban</option>
              <option value="scrum">Scrum</option>
            </select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-[12px]">Arka plan rengi</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-7 rounded-lg transition-all hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full bg-accent text-white h-9">
            Oluştur
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
