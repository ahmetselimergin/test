# Issue Detail Panel Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Issue Detail Panel with inline title/label/estimate editing, always-visible assignee picker, a TipTap comment thread, an activity log, and activity logging for field changes — all wired into the existing panel via a tabbed sub-section.

**Architecture:** Three new client components (`IssueActivityLog`, `IssueCommentThread`, `IssueDetailTabs`) + targeted modifications to `IssueDetailPanel.tsx` (`IssueDetailContent` function gains inline editing + activity inserts + tab integration). Comments and activity data loaded from Supabase on panel open; stored in the existing `comments`/`activityLogs` Zustand slots.

**Tech Stack:** Next.js 16 App Router, TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`), Supabase JS v2 client (`await` required — lazy thenable), Zustand stores (existing), shadcn/ui (`Avatar`, `AvatarFallback`), `sonner` toast, `lucide-react` icons.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/issues/IssueActivityLog.tsx` | Activity event list from `activity_logs` table |
| Create | `src/components/issues/IssueCommentThread.tsx` | Comment list (read-only TipTap) + TipTap write area + submit |
| Create | `src/components/issues/IssueDetailTabs.tsx` | "Yorumlar / Aktivite" tab switcher |
| Modify | `src/components/issues/IssueDetailPanel.tsx` | Inline editing + activity inserts + integrate IssueDetailTabs |

---

## Task 1: IssueActivityLog.tsx

**Files:**
- Create: `src/components/issues/IssueActivityLog.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog } from '@/lib/supabase/types'

interface ActivityLogWithActor extends ActivityLog {
  actor: { full_name: string | null; avatar_url: string | null } | null
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'az önce'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} dakika önce`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} saat önce`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} gün önce`
}

function describeAction(log: ActivityLogWithActor): string {
  const who = log.actor?.full_name ?? 'Biri'
  switch (log.action) {
    case 'issue_created':    return `${who} issue'yu oluşturdu`
    case 'status_changed':   return `${who} durumu değiştirdi: ${log.old_value} → ${log.new_value}`
    case 'priority_changed': return `${who} önceliği değiştirdi: ${log.old_value} → ${log.new_value}`
    case 'assignee_changed': return `${who} atananı değiştirdi`
    case 'title_changed':    return `${who} başlığı değiştirdi`
    default:                 return `${who} bir değişiklik yaptı`
  }
}

interface IssueActivityLogProps {
  issueId: string
}

export function IssueActivityLog({ issueId }: IssueActivityLogProps) {
  const activityLogs = useIssueStore((s) => s.activityLogs)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('activity_logs')
      .select('*, actor:profiles(full_name, avatar_url)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) useIssueStore.getState().setActivityLogs(data as ActivityLogWithActor[])
      })
  }, [issueId])

  if (activityLogs.length === 0) {
    return (
      <p className="text-[12px] text-muted px-4 py-6 text-center">
        Henüz aktivite yok.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 py-3 px-4">
      {(activityLogs as ActivityLogWithActor[]).map((log) => (
        <div key={log.id} className="flex items-start gap-2.5 py-2">
          <Avatar className="size-6 shrink-0 mt-0.5">
            {log.actor?.avatar_url ? (
              <img
                src={log.actor.avatar_url}
                alt={log.actor.full_name ?? ''}
                className="size-full object-cover rounded-full"
              />
            ) : (
              <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-bold">
                {(log.actor?.full_name ?? '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span className="text-[12px] text-foreground leading-snug">
              {describeAction(log)}
            </span>
            <span className="text-[11px] text-muted shrink-0 whitespace-nowrap">
              {relativeTime(log.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors for `IssueActivityLog.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/IssueActivityLog.tsx
git commit -m "feat: add IssueActivityLog component"
```

---

## Task 2: IssueCommentThread.tsx

**Files:**
- Create: `src/components/issues/IssueCommentThread.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Code } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Comment } from '@/lib/supabase/types'

interface CommentWithAuthor extends Comment {
  author: { full_name: string | null; avatar_url: string | null } | null
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: comment.content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none text-[13px] leading-relaxed text-foreground prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 focus:outline-none',
      },
    },
  })

  return (
    <div className="flex items-start gap-2.5 py-3">
      <Avatar className="size-6 shrink-0 mt-0.5">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.full_name ?? ''}
            className="size-full object-cover rounded-full"
          />
        ) : (
          <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-bold">
            {(comment.author?.full_name ?? '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium text-foreground">
            {comment.author?.full_name ?? 'Anonim'}
          </span>
          <span className="text-[11px] text-muted">{formatDate(comment.created_at)}</span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

interface IssueCommentThreadProps {
  issueId: string
}

export function IssueCommentThread({ issueId }: IssueCommentThreadProps) {
  const comments = useIssueStore((s) => s.comments)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('comments')
      .select('*, author:profiles(full_name, avatar_url)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) useIssueStore.getState().setComments(data as CommentWithAuthor[])
      })
  }, [issueId])

  const writeEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Yorum yaz...' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[60px] text-[13px] leading-relaxed text-foreground prose-p:my-0.5',
      },
    },
    onKeyDown: ({ event }) => {
      if (event.ctrlKey && event.key === 'Enter') {
        handleSubmit()
        return true
      }
      return false
    },
  })

  async function handleSubmit() {
    if (!writeEditor || writeEditor.isEmpty) return
    const content = writeEditor.getHTML()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ issue_id: issueId, author_id: user.id, content })
      .select('*, author:profiles(full_name, avatar_url)')
      .single()
    if (error) { toast.error(error.message); return }
    if (comment) {
      useIssueStore.getState().setComments([...useIssueStore.getState().comments, comment as CommentWithAuthor])
      writeEditor.commands.clearContent()
    }
  }

  return (
    <div className="flex flex-col px-4 py-2">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-[12px] text-muted py-4 text-center">
          Henüz yorum yok. İlk yorumu sen yaz.
        </p>
      ) : (
        <div className="divide-y divide-subtle/40">
          {(comments as CommentWithAuthor[]).map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}

      {/* Write area */}
      <div className="mt-3 rounded-lg border border-subtle bg-[rgb(var(--bg-subtle)/0.5)] overflow-hidden focus-within:border-accent/40 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-subtle">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleBold().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('bold') ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground hover:bg-subtle'
            )}
          >
            <Bold size={12} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleItalic().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('italic') ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground hover:bg-subtle'
            )}
          >
            <Italic size={12} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleCode().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('code') ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground hover:bg-subtle'
            )}
          >
            <Code size={12} />
          </button>
          <div className="flex-1" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!writeEditor || writeEditor.isEmpty}
            className="h-6 px-2.5 text-[11px] font-medium"
          >
            Gönder
          </Button>
        </div>
        <div className="px-3 py-2">
          <EditorContent editor={writeEditor} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors for `IssueCommentThread.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/IssueCommentThread.tsx
git commit -m "feat: add IssueCommentThread component"
```

---

## Task 3: IssueDetailTabs.tsx

**Files:**
- Create: `src/components/issues/IssueDetailTabs.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IssueCommentThread } from './IssueCommentThread'
import { IssueActivityLog } from './IssueActivityLog'

interface IssueDetailTabsProps {
  issueId: string
}

export function IssueDetailTabs({ issueId }: IssueDetailTabsProps) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')

  return (
    <div className="flex flex-col min-h-0 border-t border-subtle mt-2">
      <div className="flex border-b border-subtle shrink-0">
        {(['comments', 'activity'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {t === 'comments' ? 'Yorumlar' : 'Aktivite'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'comments' ? (
          <IssueCommentThread issueId={issueId} />
        ) : (
          <IssueActivityLog issueId={issueId} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/IssueDetailTabs.tsx
git commit -m "feat: add IssueDetailTabs component"
```

---

## Task 4: IssueDetailPanel — Inline editing (title, labels, estimate, assignee)

**Files:**
- Modify: `src/components/issues/IssueDetailPanel.tsx`

Context: `IssueDetailContent` is a React component declared as a plain function. The file already has `'use client'` at the top. Currently there are no `useState` calls — they need to be added. The existing `X` lucide icon is already imported; `Pencil` needs to be added.

- [ ] **Step 1: Add `useState` import and `Pencil` icon**

Find this line in `IssueDetailPanel.tsx`:
```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Link2, Check, ChevronDown } from 'lucide-react'
```

Replace with:
```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Link2, Check, ChevronDown, Pencil } from 'lucide-react'
```

- [ ] **Step 2: Add inline-edit state to `IssueDetailContent`**

Find the opening of `IssueDetailContent`:
```tsx
  const { updateIssue, removeIssue } = useIssueStore()
  const assignee = members.find((m) => m.id === issue.assignee_id)
```

Replace with:
```tsx
  const { updateIssue, removeIssue } = useIssueStore()
  const assignee = members.find((m) => m.id === issue.assignee_id)

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(issue.title)

  // Label editing
  const [labelInput, setLabelInput] = useState('')
  const [showLabelInput, setShowLabelInput] = useState(false)

  // Estimate editing
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateDraft, setEstimateDraft] = useState(String(issue.estimate ?? ''))
```

- [ ] **Step 3: Add title save handler**

After the existing `copyKey` function (around line 101), add:

```tsx
  async function handleTitleSave() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === issue.title) { setTitleDraft(issue.title); setEditingTitle(false); return }
    updateIssue(issue.id, { title: trimmed })
    setEditingTitle(false)
    const supabase = createClient()
    await supabase.from('issues').update({ title: trimmed }).eq('id', issue.id)
  }
```

- [ ] **Step 4: Add label handlers**

After `handleTitleSave`, add:

```tsx
  async function addLabel(label: string) {
    const trimmed = label.trim()
    if (!trimmed || issue.labels.includes(trimmed)) return
    const updated = [...issue.labels, trimmed]
    updateIssue(issue.id, { labels: updated })
    const supabase = createClient()
    await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
  }

  async function removeLabel(label: string) {
    const updated = issue.labels.filter((l) => l !== label)
    updateIssue(issue.id, { labels: updated })
    const supabase = createClient()
    await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
  }
```

- [ ] **Step 5: Add estimate save handler**

After `removeLabel`, add:

```tsx
  async function handleEstimateSave() {
    setEditingEstimate(false)
    const parsed = estimateDraft.trim() === '' ? null : parseInt(estimateDraft, 10)
    const value = isNaN(parsed as number) ? null : parsed
    if (value === issue.estimate) return
    updateIssue(issue.id, { estimate: value })
    const supabase = createClient()
    await supabase.from('issues').update({ estimate: value }).eq('id', issue.id)
  }
```

- [ ] **Step 6: Replace static title `<h2>` with inline-editable version**

Find this in the main content area:
```tsx
          {/* Title */}
          <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground">
            {issue.title}
          </h2>
```

Replace with:
```tsx
          {/* Title */}
          {editingTitle ? (
            <textarea
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
                if (e.key === 'Escape') { setTitleDraft(issue.title); setEditingTitle(false) }
              }}
              rows={2}
              className="w-full text-[17px] font-semibold leading-snug tracking-tight bg-subtle border border-accent/30 rounded-lg px-2 py-1 outline-none resize-none text-foreground"
            />
          ) : (
            <div className="flex items-start gap-2 group/title">
              <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground flex-1">
                {issue.title}
              </h2>
              <button
                type="button"
                onClick={() => { setTitleDraft(issue.title); setEditingTitle(true) }}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity text-muted hover:text-foreground shrink-0 mt-0.5"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
```

- [ ] **Step 7: Replace static labels section with editable version**

Find the current labels section (shows only when labels exist):
```tsx
          {/* Labels */}
          {issue.labels.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Etiketler</p>
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <span key={label} className="text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5 text-foreground">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
```

Replace with (always visible, with add/remove):
```tsx
          {/* Labels */}
          <div>
            <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Etiketler</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {issue.labels.map((label) => (
                <span key={label} className="flex items-center gap-1 text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5">
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="text-muted hover:text-foreground"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              {showLabelInput ? (
                <input
                  autoFocus
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { addLabel(labelInput); setLabelInput(''); setShowLabelInput(false) }
                    if (e.key === 'Escape') { setLabelInput(''); setShowLabelInput(false) }
                  }}
                  onBlur={() => { setLabelInput(''); setShowLabelInput(false) }}
                  placeholder="Etiket ekle..."
                  className="text-[11px] bg-subtle border border-accent/30 rounded px-2 py-0.5 outline-none w-28"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLabelInput(true)}
                  className="text-[11px] text-muted hover:text-foreground border border-dashed border-subtle rounded px-2 py-0.5"
                >
                  + Ekle
                </button>
              )}
            </div>
          </div>
```

- [ ] **Step 8: Replace assignee conditional with always-MemberPicker**

Find the assignee PropRow:
```tsx
          <PropRow label="Atanan">
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="size-5 border border-subtle shrink-0">
                  {assignee.avatar_url ? (
                    <img src={assignee.avatar_url} alt={assignee.full_name ?? ''} className="size-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-semibold">
                      {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-[12px] text-foreground truncate">{assignee.full_name ?? assignee.email}</span>
              </div>
            ) : (
              <MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
            )}
            {assignee && (
              <button
                type="button"
                onClick={() => handleAssigneeChange(null)}
                className="text-[10px] text-muted hover:text-foreground mt-0.5 block"
              >
                Kaldır
              </button>
            )}
          </PropRow>
```

Replace with:
```tsx
          <PropRow label="Atanan">
            <MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
          </PropRow>
```

- [ ] **Step 9: Replace static estimate display with editable version**

Find the estimate PropRow:
```tsx
          {issue.estimate !== null && (
            <PropRow label="Tahmin">
              <span className="text-[12px] text-foreground font-medium tabular-nums">{issue.estimate} pts</span>
            </PropRow>
          )}
```

Replace with (always visible, editable):
```tsx
          <PropRow label="Tahmin">
            {editingEstimate ? (
              <input
                autoFocus
                type="number"
                min={0}
                value={estimateDraft}
                onChange={(e) => setEstimateDraft(e.target.value)}
                onBlur={handleEstimateSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') { setEstimateDraft(String(issue.estimate ?? '')); setEditingEstimate(false) }
                }}
                className="w-16 text-[12px] bg-subtle border border-accent/30 rounded px-1.5 py-0.5 outline-none tabular-nums"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setEstimateDraft(String(issue.estimate ?? '')); setEditingEstimate(true) }}
                className="text-[12px] text-foreground font-medium tabular-nums hover:text-accent transition-colors"
              >
                {issue.estimate !== null ? `${issue.estimate} pts` : '—'}
              </button>
            )}
          </PropRow>
```

- [ ] **Step 10: Remove unused `Avatar`, `AvatarFallback` imports (now replaced by always-MemberPicker)**

The `Avatar` and `AvatarFallback` imports are no longer used in `IssueDetailPanel.tsx` after replacing the conditional assignee display with `MemberPicker`. Find:
```tsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
```
Delete this line.

- [ ] **Step 11: Type-check**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. If there are unused variable warnings for `assignee`, also remove the `const assignee = members.find(...)` line — it's no longer needed.

- [ ] **Step 12: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx
git commit -m "feat: inline title/label/estimate editing and always-visible assignee picker"
```

---

## Task 5: IssueDetailPanel — Activity logging + integrate IssueDetailTabs

**Files:**
- Modify: `src/components/issues/IssueDetailPanel.tsx`

Context: The existing `handleStatusChange`, `handlePriorityChange`, `handleAssigneeChange` handlers need activity_log inserts after the Supabase update. The new `handleTitleSave` (added in Task 4) also needs one. `IssueDetailTabs` gets rendered at the bottom of the main content area.

- [ ] **Step 1: Add activity logging to `handleStatusChange`**

Find:
```tsx
  async function handleStatusChange(status: IssueStatus) {
    updateIssue(issue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', issue.id)
  }
```

Replace with:
```tsx
  async function handleStatusChange(status: IssueStatus) {
    const oldStatus = issue.status
    updateIssue(issue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldStatus !== status) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'status_changed',
        old_value: oldStatus,
        new_value: status,
      })
    }
  }
```

- [ ] **Step 2: Add activity logging to `handlePriorityChange`**

Find:
```tsx
  async function handlePriorityChange(priority: Priority) {
    updateIssue(issue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', issue.id)
  }
```

Replace with:
```tsx
  async function handlePriorityChange(priority: Priority) {
    const oldPriority = issue.priority
    updateIssue(issue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldPriority !== priority) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'priority_changed',
        old_value: oldPriority,
        new_value: priority,
      })
    }
  }
```

- [ ] **Step 3: Add activity logging to `handleAssigneeChange`**

Find:
```tsx
  async function handleAssigneeChange(id: string | null) {
    updateIssue(issue.id, { assignee_id: id })
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
  }
```

Replace with:
```tsx
  async function handleAssigneeChange(id: string | null) {
    const oldAssigneeId = issue.assignee_id
    updateIssue(issue.id, { assignee_id: id })
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldAssigneeId !== id) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'assignee_changed',
        old_value: oldAssigneeId ?? null,
        new_value: id ?? null,
      })
    }
  }
```

- [ ] **Step 4: Add activity logging to `handleTitleSave`**

Find the `handleTitleSave` added in Task 4:
```tsx
  async function handleTitleSave() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === issue.title) { setTitleDraft(issue.title); setEditingTitle(false); return }
    updateIssue(issue.id, { title: trimmed })
    setEditingTitle(false)
    const supabase = createClient()
    await supabase.from('issues').update({ title: trimmed }).eq('id', issue.id)
  }
```

Replace with:
```tsx
  async function handleTitleSave() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === issue.title) { setTitleDraft(issue.title); setEditingTitle(false); return }
    const oldTitle = issue.title
    updateIssue(issue.id, { title: trimmed })
    setEditingTitle(false)
    const supabase = createClient()
    await supabase.from('issues').update({ title: trimmed }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'title_changed',
        old_value: oldTitle,
        new_value: trimmed,
      })
    }
  }
```

- [ ] **Step 5: Import `IssueDetailTabs` and add it to the panel**

Add the import at the top of the file (with other local imports):
```tsx
import { IssueDetailTabs } from './IssueDetailTabs'
```

Then find the closing of the main content flex column (just before the closing `</div>` of `{/* ── Main content ── */}`). The current structure ends with the labels section. Add `<IssueDetailTabs>` right after the labels section:

Find (in main content area, end of the `flex-1 flex flex-col` div):
```tsx
          {/* Labels */}
          <div>
```

The labels section ends with `</div>` followed by `</div>` (close main content) then `{/* ── Right sidebar ── */}`. Add the tabs component after the labels `</div>`:

Locate this exact closing sequence after the labels block:
```tsx
          </div>
        </div>

        {/* ── Right sidebar ── */}
```

Replace with:
```tsx
          </div>

          <IssueDetailTabs issueId={issue.id} />
        </div>

        {/* ── Right sidebar ── */}
```

- [ ] **Step 6: Clear stale comments/activityLogs when panel opens a new issue**

The `IssueDetailContent` is keyed by `issue.id` (`key={selectedIssue.id}` in `IssueDetailPanel`), so it remounts when switching issues. The Zustand store however persists. To avoid showing stale data from the previous issue, clear the store in a `useEffect` on mount.

Add this `useEffect` right after the state declarations in `IssueDetailContent`:
```tsx
  useEffect(() => {
    useIssueStore.getState().setComments([])
    useIssueStore.getState().setActivityLogs([])
  }, [])
```

Also add the `useEffect` import — it's not yet imported. Update the React import:
```tsx
import { useState, useEffect } from 'react'
```

- [ ] **Step 7: Type-check**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx
git commit -m "feat: activity logging + integrate IssueDetailTabs in panel"
```

---

## Task 6: Build verification

**Files:**
- Read: build output

- [ ] **Step 1: Run Next.js build**

```bash
cd /Users/ahmetselim/Desktop/test && npx next build 2>&1 | tail -30
```

Expected: build completes successfully. No TypeScript or module resolution errors.

- [ ] **Step 2: Verify feature checklist (manual — describe expected behavior)**

After starting the dev server (`npm run dev`), open any issue panel and verify:

1. **Title editing:** Hover over the title — a pencil icon appears. Click it — a textarea appears. Edit and press Enter or click away — title saves. Press Escape — reverts to original.
2. **Label editing:** The labels section always shows. A `+ Ekle` button is visible. Click it — a text input appears. Type a label and press Enter — chip is added. Click `×` on a chip — label is removed.
3. **Estimate editing:** Click the estimate value (or `—`) in the sidebar — a number input appears. Type a number and press Enter or click away — estimate saves. Clear the input and blur — estimate clears to null.
4. **Assignee picker:** The sidebar always shows `MemberPicker`. Select a member — assignee updates. The picker handles clearing internally.
5. **Activity tab:** Click "Aktivite" tab — activity events load. Status and priority changes should create new entries.
6. **Comments tab:** "Yorumlar" tab shows comment thread. Type in editor, click Gönder — comment appears in list. Ctrl+Enter also submits.

- [ ] **Step 3: Final commit (if any last-minute fixes)**

```bash
git add -p
git commit -m "fix: post-build corrections for issue detail panel"
```

Only needed if Step 1 or Step 2 surfaced issues. If clean, skip.
