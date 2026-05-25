# Rich Task Creation & Assignee System — Design Spec

> **Ajanlar için:** Bu spec'i task-task implement etmek için `superpowers:subagent-driven-development` veya `superpowers:executing-plans` kullanın.

**Hedef:** CreateIssueDialog'u Figma-dark estetiğiyle tam yeniden tasarlamak; TipTap rich text, animasyonlu atayan picker (kişi + job_title), pill seçiciler, tag etiketler, profil ayarları.

**Mimari:** Sunucu tarafında members fetch edilir, prop zinciriyle BoardColumn'a iletilir. `MemberPicker` yeni standalone bileşen. `IssueEditor` token-uyumlu yeniden yazım.

**Tech stack:** Next.js App Router, Supabase, TipTap v3, Framer Motion v12, Tailwind v4, shadcn/ui (base-ui)

---

## Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/migrations/005_profile_job_title.sql` | Yeni — job_title kolonu |
| `src/app/actions/workspace.ts` | `updateProfile` + `getWorkspaceMembers` eklenir |
| `src/app/(dashboard)/[workspace]/[project]/board/page.tsx` | Members fetch + BoardView'e prop |
| `src/components/board/BoardView.tsx` | Members prop alır, KanbanBoard'a iletir |
| `src/components/board/KanbanBoard.tsx` | Members prop alır, BoardColumn'a iletir |
| `src/components/board/BoardColumn.tsx` | Members prop alır, CreateIssueDialog'a iletir |
| `src/components/board/CreateIssueDialog.tsx` | Tam yeniden yazım |
| `src/components/issues/IssueEditor.tsx` | Token tabanlı stil + minimal toolbar |
| `src/components/issues/MemberPicker.tsx` | Yeni bileşen |
| `src/components/issues/IssueCard.tsx` | Assignee avatar + members prop |
| `src/components/issues/IssueDetailPanel.tsx` | Atanan satırı + MemberPicker |
| `src/app/(dashboard)/profile/page.tsx` | job_title input alanı |
| `src/lib/supabase/types.ts` | `MemberSummary` tip eklenir |

---

## Task 1: Migration — profiles.job_title

**Dosyalar:**
- Oluştur: `supabase/migrations/005_profile_job_title.sql`

- [ ] **Adım 1: SQL dosyasını yaz**

```sql
alter table profiles add column if not exists job_title text;
```

- [ ] **Adım 2: Commit**

```bash
git add supabase/migrations/005_profile_job_title.sql
git commit -m "feat: add job_title column to profiles"
```

---

## Task 2: MemberSummary tipi + getWorkspaceMembers action

**Dosyalar:**
- Değiştir: `src/lib/supabase/types.ts`
- Değiştir: `src/app/actions/workspace.ts`

- [ ] **Adım 1: `types.ts`'e MemberSummary ekle**

Mevcut `WorkspaceMemberWithProfile` export'unun altına:

```ts
export interface MemberSummary {
  id: string          // user_id
  full_name: string | null
  email: string | null
  avatar_url: string | null
  job_title: string | null
}
```

- [ ] **Adım 2: `workspace.ts`'e getWorkspaceMembers action'ı ekle**

`workspace.ts` dosyasının sonuna ekle:

```ts
export async function getWorkspaceMembers(workspaceSlug: string): Promise<MemberSummary[]> {
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) return []

  const { data } = await supabase
    .from('workspace_members')
    .select('user_id, profiles(id, full_name, email, avatar_url, job_title)')
    .eq('workspace_id', workspace.id)

  if (!data) return []

  return data.map((row) => {
    const p = row.profiles as { id: string; full_name: string | null; email: string | null; avatar_url: string | null; job_title: string | null } | null
    return {
      id: row.user_id,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      avatar_url: p?.avatar_url ?? null,
      job_title: p?.job_title ?? null,
    }
  })
}
```

- [ ] **Adım 3: `workspace.ts`'deki updateProfile'a job_title ekle**

Mevcut `updateProfile` fonksiyonunda `full_name` güncelleme bloğunu bul ve profiles upsert'ini genişlet:

```ts
// Mevcut kod:
const fullName = (formData.get('full_name') as string)?.trim()
// Ekle:
const jobTitle = (formData.get('job_title') as string)?.trim() || null
```

Profiles upsert satırını şöyle güncelle:
```ts
await supabase.from('profiles').upsert({
  id: user.id,
  email: user.email ?? null,
  full_name: fullName,
  job_title: jobTitle,
})
```

- [ ] **Adım 4: Import ekle (types.ts'den MemberSummary)**

`workspace.ts` dosyasının import'larına:
```ts
import type { MemberSummary } from '@/lib/supabase/types'
```

- [ ] **Adım 5: Commit**

```bash
git add src/lib/supabase/types.ts src/app/actions/workspace.ts
git commit -m "feat: MemberSummary type + getWorkspaceMembers action"
```

---

## Task 3: Members prop zinciri (board page → BoardColumn)

**Dosyalar:**
- Değiştir: `src/app/(dashboard)/[workspace]/[project]/board/page.tsx`
- Değiştir: `src/components/board/BoardView.tsx`
- Değiştir: `src/components/board/KanbanBoard.tsx`
- Değiştir: `src/components/board/BoardColumn.tsx`

- [ ] **Adım 1: board/page.tsx — members fetch ekle**

Mevcut `Promise.all` içine 4. fetch'i ekle:

```ts
import { getWorkspaceMembers } from '@/app/actions/workspace'

// Promise.all içinde yeni satır:
getWorkspaceMembers(workspace),
```

Yıkımla al:
```ts
const [
  { data: project },
  { data: columns },
  { data: issues },
  members,
] = await Promise.all([...])
```

BoardView'e geçir:
```tsx
<BoardView
  project={project}
  workspaceSlug={workspace}
  columns={columns ?? []}
  issues={issues ?? []}
  members={members}
/>
```

- [ ] **Adım 2: BoardView.tsx — members prop ekle**

```ts
import type { MemberSummary } from '@/lib/supabase/types'

interface Props {
  // ... mevcut props
  members: MemberSummary[]
}
```

`KanbanBoard`'a ilet:
```tsx
<KanbanBoard
  project={project}
  workspaceSlug={workspaceSlug}
  columns={columns}
  issues={issues}
  members={members}
/>
```

- [ ] **Adım 3: KanbanBoard.tsx — members prop ekle**

```ts
interface KanbanBoardProps {
  // ... mevcut
  members?: MemberSummary[]
}
```

`BoardColumnComponent`'e ilet:
```tsx
<BoardColumnComponent
  key={column.id}
  column={column}
  issues={issues.filter((i) => i.board_column_id === column.id)}
  project={project}
  workspaceSlug={workspaceSlug}
  members={members ?? []}
/>
```

`IssueCard` (DragOverlay'de) `members` almaz — sadece `issue` ve `project` yeterli.

- [ ] **Adım 4: BoardColumn.tsx — members prop ekle**

```ts
interface BoardColumnProps {
  // ... mevcut
  members: MemberSummary[]
}
```

`CreateIssueDialog`'a ilet:
```tsx
<CreateIssueDialog
  project={project}
  column={column}
  workspaceSlug={workspaceSlug}
  members={members}
  open={createOpen}
  onOpenChange={setCreateOpen}
/>
```

- [ ] **Adım 5: tsc --noEmit ile kontrol**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Adım 6: Commit**

```bash
git add src/app/(dashboard)/[workspace]/[project]/board/page.tsx \
        src/components/board/BoardView.tsx \
        src/components/board/KanbanBoard.tsx \
        src/components/board/BoardColumn.tsx
git commit -m "feat: pipe workspace members through board component tree"
```

---

## Task 4: MemberPicker bileşeni

**Dosyalar:**
- Oluştur: `src/components/issues/MemberPicker.tsx`

- [ ] **Adım 1: Bileşeni yaz**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, UserCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { MemberSummary } from '@/lib/supabase/types'

interface Props {
  members: MemberSummary[]
  value: string | null
  onChange: (id: string | null) => void
}

function initials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] ?? '?').toUpperCase()
}

export function MemberPicker({ members, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = members.find((m) => m.id === value) ?? null

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.job_title?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    onChange(value === id ? null : id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 h-7 px-2 rounded-md border text-[12px] transition-all',
          open
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-subtle bg-transparent text-muted hover:border-strong hover:text-foreground'
        )}
      >
        {selected ? (
          <>
            <Avatar className="size-4 shrink-0">
              <AvatarFallback className="text-[9px] bg-accent-muted text-accent font-medium">
                {initials(selected.full_name, selected.email)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {selected.full_name ?? selected.email}
            </span>
            {selected.job_title && (
              <span className="text-[10px] text-muted bg-subtle border border-subtle rounded px-1.5 py-0">
                {selected.job_title}
              </span>
            )}
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="ml-0.5 text-muted hover:text-foreground"
            >
              <X size={10} />
            </span>
          </>
        ) : (
          <>
            <UserCircle2 size={13} />
            <span>Ata...</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-1 z-50 w-64 rounded-lg border border-subtle bg-[rgb(var(--bg-elevated))] shadow-panel overflow-hidden"
          >
            {/* Arama */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-subtle">
              <Search size={12} className="text-muted shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim veya rol ara..."
                className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted/50"
              />
            </div>

            {/* Liste */}
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-muted text-center py-4">Üye bulunamadı</p>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-subtle',
                      value === m.id && 'bg-accent/10'
                    )}
                  >
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="text-[10px] bg-accent-muted text-accent font-medium">
                        {initials(m.full_name, m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {m.full_name ?? m.email}
                      </p>
                      {m.job_title && (
                        <p className="text-[10px] text-muted truncate">{m.job_title}</p>
                      )}
                    </div>
                    {value === m.id && (
                      <span className="size-1.5 rounded-full bg-accent shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Adım 2: tsc --noEmit**

```bash
npx tsc --noEmit
```

- [ ] **Adım 3: Commit**

```bash
git add src/components/issues/MemberPicker.tsx
git commit -m "feat: MemberPicker — animated assignee dropdown with job_title"
```

---

## Task 5: IssueEditor — token tabanlı yeniden yazım + toolbar

**Dosyalar:**
- Değiştir: `src/components/issues/IssueEditor.tsx`

- [ ] **Adım 1: IssueEditor'ı yeniden yaz**

İki mod: `mode="edit"` (mevcut davranış, onBlur'da Supabase'e kaydeder) ve `mode="create"` (dışarıdan `value/onChange` alır).

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback } from 'react'
import { Bold, Italic, List, ListOrdered, Code, Strikethrough } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Create modu (dışarıdan value/onChange alır) ---
interface CreateModeProps {
  mode: 'create'
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// --- Edit modu (issueId + Supabase) ---
interface EditModeProps {
  mode?: 'edit'
  issueId: string
  initialContent: string
}

type IssueEditorProps = CreateModeProps | EditModeProps

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        'size-6 flex items-center justify-center rounded transition-colors',
        active
          ? 'bg-accent/20 text-accent'
          : 'text-muted hover:text-foreground hover:bg-subtle'
      )}
    >
      {children}
    </button>
  )
}

export function IssueEditor(props: IssueEditorProps) {
  const isCreate = props.mode === 'create'

  // --- Edit modunda Supabase kaydetme ---
  // Dinamik import yapılmaz — server action yeterli
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const saveContent = useCallback(
    async (content: string) => {
      if (isCreate) return
      const editProps = props as EditModeProps
      const { updateIssue } = (await import('@/lib/stores/issue.store')).useIssueStore.getState()
      const { createClient } = await import('@/lib/supabase/client')
      updateIssue(editProps.issueId, { description: content })
      const supabase = createClient()
      await supabase.from('issues').update({ description: content }).eq('id', editProps.issueId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCreate, isCreate ? '' : (props as EditModeProps).issueId]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: isCreate
          ? (props as CreateModeProps).placeholder ?? 'Açıklama ekle...'
          : 'Açıklama ekle...',
      }),
    ],
    content: isCreate ? (props as CreateModeProps).value : (props as EditModeProps).initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] text-[13px] leading-relaxed text-foreground [&_.is-editor-empty]:text-muted',
      },
    },
    onUpdate: ({ editor }) => {
      if (isCreate) {
        ;(props as CreateModeProps).onChange(editor.getHTML())
      }
    },
    onBlur: ({ editor }) => {
      if (!isCreate) saveContent(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-lg border border-subtle bg-[rgb(var(--bg-subtle)/0.5)] overflow-hidden focus-within:border-accent/40 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-subtle">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold size={12} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic size={12} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
          <Strikethrough size={12} />
        </ToolbarButton>
        <div className="w-px h-3.5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List size={12} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered size={12} />
        </ToolbarButton>
        <div className="w-px h-3.5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
          <Code size={12} />
        </ToolbarButton>
      </div>
      {/* Editor */}
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
```

- [ ] **Adım 2: tsc --noEmit**

```bash
npx tsc --noEmit
```

- [ ] **Adım 3: Commit**

```bash
git add src/components/issues/IssueEditor.tsx
git commit -m "feat: IssueEditor — token styles + bold/italic/list/code toolbar, dual mode"
```

---

## Task 6: CreateIssueDialog — tam yeniden yazım

**Dosyalar:**
- Değiştir: `src/components/board/CreateIssueDialog.tsx`

- [ ] **Adım 1: CreateIssueDialog'u yeniden yaz**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TypeIcon } from '@/components/issues/TypeIcon'
import { IssueEditor } from '@/components/issues/IssueEditor'
import { MemberPicker } from '@/components/issues/MemberPicker'
import { createIssue } from '@/app/actions/board'
import { useIssueStore } from '@/lib/stores/issue.store'
import { cn, priorityConfig, typeConfig } from '@/lib/utils'
import type { BoardColumn, Project, IssueType, Priority, MemberSummary } from '@/lib/supabase/types'

const ISSUE_TYPES: IssueType[] = ['task', 'story', 'bug', 'feature']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

const priorityDot: Record<Priority, string> = {
  critical: 'bg-rose-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

interface Props {
  project: Project
  column: BoardColumn
  workspaceSlug: string
  members: MemberSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
}

export function CreateIssueDialog({
  project, column, workspaceSlug, members, open, onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimate, setEstimate] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const addIssue = useIssueStore((s) => s.addIssue)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => titleRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      setTitle(''); setDescription(''); setType('task'); setPriority('medium')
      setAssigneeId(null); setLabelInput(''); setLabels([]); setEstimate('')
    }
  }, [open])

  function addLabel(val: string) {
    const t = val.trim()
    if (t && !labels.includes(t)) setLabels((p) => [...p, t])
    setLabelInput('')
  }

  function handleLabelKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLabel(labelInput) }
    else if (e.key === 'Backspace' && !labelInput && labels.length > 0) setLabels((p) => p.slice(0, -1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const formData = new FormData()
    formData.set('project_id', project.id)
    formData.set('board_column_id', column.id)
    formData.set('workspace_slug', workspaceSlug)
    formData.set('title', title.trim())
    formData.set('description', description.trim())
    formData.set('type', type)
    formData.set('priority', priority)
    formData.set('labels', JSON.stringify(labels))
    if (estimate) formData.set('estimate', estimate)
    if (assigneeId) formData.set('assignee_id', assigneeId)

    const result = await createIssue(formData)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    if (result.issue) addIssue(result.issue)
    toast.success('Issue oluşturuldu')
    onOpenChange(false)
    router.refresh()
  }

  const pill = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-all cursor-pointer select-none',
      active
        ? 'border-accent/40 bg-accent/10 text-accent'
        : 'border-subtle bg-transparent text-muted hover:border-strong hover:text-foreground'
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <form onSubmit={handleSubmit}>
            {/* Başlık */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-2">
              <div className="mt-[3px] shrink-0">
                <TypeIcon type={type} size={17} />
              </div>
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Issue başlığı..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-[15px] font-semibold placeholder:text-muted/40 outline-none leading-snug overflow-hidden tracking-tight"
                style={{ height: 'auto' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
              />
            </div>

            {/* Rich Text Açıklama */}
            <div className="px-5 pb-4 pl-[52px]">
              <IssueEditor
                mode="create"
                value={description}
                onChange={setDescription}
              />
            </div>

            <div className="h-px bg-border mx-5" />

            {/* Özellikler */}
            <motion.div
              className="px-5 py-4 space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate={open ? 'show' : 'hidden'}
            >
              {/* Tür */}
              <motion.div variants={rowVariants} className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-[76px] shrink-0 font-medium uppercase tracking-wider">Tür</span>
                <div className="flex flex-wrap gap-1.5">
                  {ISSUE_TYPES.map((t) => (
                    <motion.button key={t} type="button" onClick={() => setType(t)} whileTap={{ scale: 0.92 }} className={pill(type === t)}>
                      <TypeIcon type={t} size={12} />
                      {typeConfig[t].label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Öncelik */}
              <motion.div variants={rowVariants} className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-[76px] shrink-0 font-medium uppercase tracking-wider">Öncelik</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => (
                    <motion.button key={p} type="button" onClick={() => setPriority(p)} whileTap={{ scale: 0.92 }} className={pill(priority === p)}>
                      <span className={cn('size-[7px] rounded-full shrink-0', priorityDot[p])} />
                      {priorityConfig[p].label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Atanan */}
              <motion.div variants={rowVariants} className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-[76px] shrink-0 font-medium uppercase tracking-wider">Atanan</span>
                <MemberPicker members={members} value={assigneeId} onChange={setAssigneeId} />
              </motion.div>

              {/* Etiketler */}
              <motion.div variants={rowVariants} className="flex items-start gap-3">
                <span className="text-[11px] text-muted w-[76px] shrink-0 font-medium uppercase tracking-wider pt-1">Etiketler</span>
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  <AnimatePresence>
                    {labels.map((l) => (
                      <motion.span key={l} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
                        className="flex items-center gap-1 text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5 text-foreground">
                        {l}
                        <button type="button" onClick={() => setLabels((p) => p.filter((x) => x !== l))} className="text-muted hover:text-foreground">
                          <X size={10} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={handleLabelKey} onBlur={() => labelInput && addLabel(labelInput)}
                    placeholder={labels.length === 0 ? 'Etiket ekle...' : '+'}
                    className="text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted/40 min-w-[72px] flex-1 py-0.5" />
                </div>
              </motion.div>

              {/* Tahmin */}
              <motion.div variants={rowVariants} className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-[76px] shrink-0 font-medium uppercase tracking-wider">Tahmin</span>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={estimate} onChange={(e) => setEstimate(e.target.value)}
                    placeholder="—"
                    className="w-14 h-7 text-[12px] bg-subtle border border-subtle rounded-md px-2 outline-none focus:border-accent/50 transition-colors text-center tabular-nums" />
                  <span className="text-[11px] text-muted">story point</span>
                </div>
              </motion.div>
            </motion.div>

            <div className="h-px bg-border mx-5" />

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span>Kolon:</span>
                <span className="font-medium px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider"
                  style={{ backgroundColor: column.color + '22', color: column.color }}>
                  {column.name}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs px-3">İptal</Button>
                <Button type="submit" disabled={loading || !title.trim()} size="sm"
                  className="h-7 text-xs px-3 bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
                  {loading ? 'Oluşturuluyor...' : 'Issue Oluştur'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Adım 2: board.ts — assignee_id ekle**

`createIssue` action'ında insert bloğuna:
```ts
const assigneeId = (formData.get('assignee_id') as string) || null
```
Ve insert objesine:
```ts
assignee_id: assigneeId,
```

- [ ] **Adım 3: tsc --noEmit**

```bash
npx tsc --noEmit
```

- [ ] **Adım 4: Commit**

```bash
git add src/components/board/CreateIssueDialog.tsx src/app/actions/board.ts
git commit -m "feat: CreateIssueDialog — rich text, MemberPicker, animated property rows"
```

---

## Task 7: IssueDetailPanel — Atanan satırı

**Dosyalar:**
- Değiştir: `src/components/issues/IssueDetailPanel.tsx`

- [ ] **Adım 1: MemberPicker import + state ekle**

`IssueDetailContent`'e `members` prop ekle:
```ts
function IssueDetailContent({
  issue, issueKey, onClose, members,
}: {
  issue: Issue
  issueKey: string | null
  onClose: () => void
  members: MemberSummary[]
})
```

- [ ] **Adım 2: handleAssigneeChange fonksiyonu ekle**

```ts
async function handleAssigneeChange(id: string | null) {
  updateIssue(issue.id, { assignee_id: id })
  const supabase = createClient()
  await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
}
```

- [ ] **Adım 3: Details tab'ına Atanan satırı ekle**

`IssuePropertyRow` listesine Priority'nin hemen altına:
```tsx
<IssuePropertyRow label="Atanan">
  <MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
</IssuePropertyRow>
```

- [ ] **Adım 4: `IssueDetailPanel` export'unda members state'i**

`IssueDetailPanel`, `useProjectStore`'dan üyeleri çekemez (orada yok). Şimdilik `members={[]}` geçer — ileride store'a taşınabilir:
```tsx
<IssueDetailContent
  issue={selectedIssue}
  issueKey={issueKey}
  onClose={() => setSelectedIssue(null)}
  members={[]}
/>
```

- [ ] **Adım 5: IssueEditor import'unu güncelle**

`IssueDetailPanel` içindeki `IssueEditor` kullanımını `mode="edit"` ile açıkça belirt:
```tsx
<IssueEditor mode="edit" issueId={issue.id} initialContent={issue.description ?? ''} />
```

- [ ] **Adım 6: tsc --noEmit**

```bash
npx tsc --noEmit
```

- [ ] **Adım 7: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx
git commit -m "feat: IssueDetailPanel — assignee row with MemberPicker"
```

---

## Task 8: Profil sayfası — job_title input

**Dosyalar:**
- Değiştir: `src/app/(dashboard)/profile/page.tsx`
- Değiştir: `src/app/actions/workspace.ts` (updateProfile — Task 2'de kısmen yapıldı)

- [ ] **Adım 1: Profile sayfasında job_title inputu ekle**

`full_name` input bloğunun hemen altına:
```tsx
<div className="space-y-2">
  <Label htmlFor="job_title">Ünvan / Rol</Label>
  <Input
    id="job_title"
    name="job_title"
    defaultValue={profile?.job_title ?? ''}
    placeholder="Developer, QA Engineer, Designer..."
    className="h-10"
  />
</div>
```

- [ ] **Adım 2: tsc --noEmit**

```bash
npx tsc --noEmit
```

- [ ] **Adım 3: Commit**

```bash
git add src/app/(dashboard)/profile/page.tsx
git commit -m "feat: profile page — job_title input"
```

---

## Doğrulama Kontrol Listesi

- [ ] `npx tsc --noEmit` hatasız geçiyor
- [ ] CreateIssueDialog açılışta animasyonlu (scale + fade)
- [ ] Property satırları stagger ile geliyor
- [ ] MemberPicker açılır/kapanır animasyonlu
- [ ] Atanan seçilince trigger'da görünüyor (avatar + isim + job_title badge)
- [ ] TipTap toolbar çalışıyor (bold, italic, liste, kod)
- [ ] Etiket chip'leri animasyonlu eklenir/çıkar
- [ ] Issue oluşturunca board'da görünüyor
- [ ] Profile sayfasında job_title kaydediliyor
