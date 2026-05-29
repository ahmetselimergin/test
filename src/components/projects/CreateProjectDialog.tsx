'use client'

import { useRef, useState } from 'react'
import { Plus, Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createProjectAction } from '@/app/actions/workspace'
import { PatternPicker } from '@/components/projects/PatternPicker'
import { getPattern } from '@/lib/patterns'
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
  const [pattern, setPattern] = useState('dots')
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const autoKey = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase()

  const pat = getPattern(pattern)

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
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white hover:opacity-90 transition-opacity">
        <Plus size={16} />
        Yeni Proje
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Proje Oluştur</DialogTitle>
        </DialogHeader>
        <form
          action={createProjectAction as unknown as (formData: FormData) => void}
          className="space-y-4"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="pattern" value={pattern} />
          <input type="hidden" name="logo_url" value={logoUrl} />

          {/* Card header preview */}
          <div className="relative h-20 rounded-xl overflow-hidden" style={{ backgroundColor: color }}>
            {pat.backgroundImage !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: pat.backgroundImage,
                  backgroundSize: pat.backgroundSize,
                  backgroundPosition: pat.backgroundPosition ?? '0 0',
                  opacity: pat.opacity,
                }}
              />
            )}
            {/* Logo avatar inside preview */}
            <div className="absolute bottom-2 left-3">
              <div className="relative group/logo size-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="size-full object-cover" />
                ) : (
                  <span className="text-sm">{key || autoKey(name) || '?'}</span>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                >
                  {uploading
                    ? <Loader2 size={12} className="text-white animate-spin" />
                    : <Upload size={12} className="text-white" />
                  }
                </button>
              </div>
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="absolute bottom-4 left-10 size-4 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 z-10"
              >
                <X size={8} />
              </button>
            )}
            <div className="absolute bottom-2 left-16 text-white">
              <p className="text-[12px] font-semibold truncate">{name || 'Proje adı'}</p>
              <p className="text-[10px] text-white/60 font-mono">{key || autoKey(name) || 'KEY'}</p>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute top-2 right-2 text-[10px] text-white/70 hover:text-white flex items-center gap-1 bg-black/20 hover:bg-black/40 px-2 py-1 rounded-md transition-colors"
            >
              <Upload size={10} />
              {logoUrl ? 'Logo değiştir' : 'Logo ekle'}
            </button>
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
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="both">Kanban + Scrum</option>
              <option value="kanban">Kanban</option>
              <option value="scrum">Scrum</option>
            </select>
          </div>

          {/* Renk + Pattern yan yana */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[12px]">Renk</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-6 rounded-md transition-all hover:scale-110"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Desen</Label>
              <PatternPicker color={color} selected={pattern} onChange={setPattern} />
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full bg-primary text-white h-9">
            Oluştur
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
