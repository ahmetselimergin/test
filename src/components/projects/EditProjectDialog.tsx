'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Settings2, Loader2, Upload, X, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProjectSettings, deleteProject } from '@/app/actions/workspace'
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
} from '@/components/ui/dialog'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface Props {
  project: {
    id: string
    name: string
    key: string
    color: string
    logo_url: string | null
    pattern: string | null
  }
}

export function EditProjectDialog({ project }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [state, action, pending] = useActionState(updateProjectSettings, null)
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [pattern, setPattern] = useState(project.pattern ?? 'dots')
  const [logoUrl, setLogoUrl] = useState(project.logo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toastId = useRef<string | number | null>(null)

  useEffect(() => {
    if (!open) return
    setName(project.name)
    setColor(project.color)
    setPattern(project.pattern ?? 'dots')
    setLogoUrl(project.logo_url ?? '')
    setConfirmDelete(false)
    setDeleteInput('')
  }, [open, project])

  async function handleDelete() {
    if (deleteInput !== project.key) return
    setDeleting(true)
    const fd = new FormData()
    fd.append('project_id', project.id)
    await deleteProject(fd)
  }

  useEffect(() => {
    if (pending) {
      toastId.current = toast.loading('Kaydediliyor...')
    } else {
      if (toastId.current) { toast.dismiss(toastId.current); toastId.current = null }
      if (state?.error) toast.error(state.error)
      if (state?.success) {
        toast.success('Proje güncellendi')
        setOpen(false)
        router.refresh()
      }
    }
  }, [pending, state, router])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${project.id}.${ext}`
      const { error } = await supabase.storage
        .from('project-logos')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('project-logos').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch {
      toast.error('Logo yüklenemedi')
    } finally {
      setUploading(false)
    }
  }

  const preview = logoUrl ? null : project.key.slice(0, 2)

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="size-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors"
        title="Düzenle"
      >
        <Settings2 size={13} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-subtle">
          <DialogHeader>
            <DialogTitle>Projeyi Düzenle</DialogTitle>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="color" value={color} />
            <input type="hidden" name="pattern" value={pattern} />
            <input type="hidden" name="logo_url" value={logoUrl} />

            {/* Preview + Logo Upload */}
            <div className="flex items-center gap-4 p-3 rounded-xl border border-subtle bg-subtle/40">
              <div className="relative group/logo shrink-0">
                <div
                  className="size-14 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden"
                  style={{ backgroundColor: logoUrl ? 'transparent' : color }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="logo" className="size-full object-cover rounded-xl" />
                  ) : (
                    <span style={{ backgroundColor: color }} className="size-full flex items-center justify-center rounded-xl">
                      {preview}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || pending}
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
                <p className="text-[11px] text-muted font-mono">{project.key}</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || pending}
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

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-[12px]">Proje Adı</Label>
              <Input
                id="edit-name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                className="h-9"
              />
            </div>

            {/* Renk + Pattern */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[12px]">Arka plan rengi</Label>
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

            <Button type="submit" disabled={pending || uploading} className="w-full bg-accent text-white h-9">
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  Kaydediliyor
                </span>
              ) : 'Kaydet'}
            </Button>
          </form>

          {/* Danger zone */}
          <div className="border-t border-subtle pt-4 mt-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-[12px] text-muted hover:text-rose-400 transition-colors"
              >
                <Trash2 size={13} />
                Projeyi sil
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/8 border border-rose-500/20">
                  <AlertTriangle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted">
                    Tüm issue&apos;lar silinecek. Onaylamak için{' '}
                    <span className="font-mono font-semibold text-foreground">{project.key}</span>{' '}
                    yazın.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                    placeholder={project.key}
                    className="h-8 text-[12px] font-mono uppercase flex-1"
                    disabled={deleting}
                  />
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteInput !== project.key || deleting}
                    className="h-8 bg-rose-500 hover:bg-rose-600 text-white text-[12px] px-3 shrink-0"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Sil'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(false); setDeleteInput('') }}
                    className="h-8 px-3 text-[12px] text-muted hover:text-foreground"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
