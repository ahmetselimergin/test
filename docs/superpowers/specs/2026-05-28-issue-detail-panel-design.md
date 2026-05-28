# Issue Detail Panel Enhancement Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the existing Issue Detail Panel with inline title editing, editable labels/estimate/assignee, a comment thread (TipTap rich text), and an activity log — all in separate focused components wired into the existing panel.

**Architecture:** Three new client components (`IssueCommentThread`, `IssueActivityLog`, `IssueDetailTabs`) + targeted modifications to `IssueDetailPanel.tsx`. The existing `IssueDetailContent` function gains inline editing for title, labels, estimate, and assignee. Comment/activity data is loaded from Supabase on panel open and stored in the existing `comments`/`activityLogs` Zustand slots.

**Tech Stack:** Next.js 16 App Router, TipTap (existing), Supabase JS v2 client, Zustand stores (existing), Framer Motion (existing), shadcn/ui components (existing).

---

## 1. New Files

| File | Responsibility |
|------|----------------|
| `src/components/issues/IssueCommentThread.tsx` | Comment list (read-only TipTap) + new comment TipTap input + submit |
| `src/components/issues/IssueActivityLog.tsx` | Activity event list loaded from `activity_logs` table |
| `src/components/issues/IssueDetailTabs.tsx` | "Yorumlar / Aktivite" tab switcher wrapping the two components above |

## 2. Modified Files

| File | Changes |
|------|---------|
| `src/components/issues/IssueDetailPanel.tsx` | Inline title edit, label edit, estimate edit, assignee-when-assigned edit, integrate `IssueDetailTabs` |

---

## 3. IssueDetailPanel.tsx Modifications

### 3.1 Inline Title Editing

The static `<h2>` gains a `Pencil` icon (hover-visible, `lucide-react`). Clicking the icon switches to an editable state.

```tsx
const [editingTitle, setEditingTitle] = useState(false)
const [titleDraft, setTitleDraft] = useState(issue.title)

async function handleTitleSave() {
  const trimmed = titleDraft.trim()
  if (!trimmed || trimmed === issue.title) { setTitleDraft(issue.title); setEditingTitle(false); return }
  updateIssue(issue.id, { title: trimmed })
  setEditingTitle(false)
  const supabase = createClient()
  await supabase.from('issues').update({ title: trimmed }).eq('id', issue.id)
}
```

When `editingTitle` is false:
```tsx
<div className="flex items-start gap-2 group/title">
  <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground flex-1">
    {issue.title}
  </h2>
  <button
    onClick={() => { setTitleDraft(issue.title); setEditingTitle(true) }}
    className="opacity-0 group-hover/title:opacity-100 transition-opacity text-muted hover:text-foreground shrink-0 mt-0.5"
  >
    <Pencil size={13} />
  </button>
</div>
```

When `editingTitle` is true:
```tsx
<textarea
  autoFocus
  value={titleDraft}
  onChange={e => setTitleDraft(e.target.value)}
  onBlur={handleTitleSave}
  onKeyDown={e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
    if (e.key === 'Escape') { setTitleDraft(issue.title); setEditingTitle(false) }
  }}
  rows={2}
  className="w-full text-[17px] font-semibold leading-snug tracking-tight bg-subtle border border-accent/30 rounded-lg px-2 py-1 outline-none resize-none text-foreground"
/>
```

### 3.2 Label Editing

Labels are shown as chips. A `+` button opens a small inline text input. Each chip has a `×` remove button. Changes are persisted immediately.

```tsx
const [labelInput, setLabelInput] = useState('')
const [showLabelInput, setShowLabelInput] = useState(false)

async function addLabel(label: string) {
  const trimmed = label.trim()
  if (!trimmed || issue.labels.includes(trimmed)) return
  const updated = [...issue.labels, trimmed]
  updateIssue(issue.id, { labels: updated })
  const supabase = createClient()
  await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
}

async function removeLabel(label: string) {
  const updated = issue.labels.filter(l => l !== label)
  updateIssue(issue.id, { labels: updated })
  const supabase = createClient()
  await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
}
```

UI (in main content area, below description):
```tsx
<div>
  <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Etiketler</p>
  <div className="flex flex-wrap gap-1.5 items-center">
    {issue.labels.map(label => (
      <span key={label} className="flex items-center gap-1 text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5">
        {label}
        <button onClick={() => removeLabel(label)} className="text-muted hover:text-foreground"><X size={9} /></button>
      </span>
    ))}
    {showLabelInput ? (
      <input
        autoFocus
        value={labelInput}
        onChange={e => setLabelInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { addLabel(labelInput); setLabelInput(''); setShowLabelInput(false) }
          if (e.key === 'Escape') { setLabelInput(''); setShowLabelInput(false) }
        }}
        onBlur={() => { setLabelInput(''); setShowLabelInput(false) }}
        placeholder="Etiket ekle..."
        className="text-[11px] bg-subtle border border-accent/30 rounded px-2 py-0.5 outline-none w-28"
      />
    ) : (
      <button onClick={() => setShowLabelInput(true)} className="text-[11px] text-muted hover:text-foreground border border-dashed border-subtle rounded px-2 py-0.5">
        + Ekle
      </button>
    )}
  </div>
</div>
```

### 3.3 Estimate Editing

In the sidebar `PropRow`:
```tsx
const [editingEstimate, setEditingEstimate] = useState(false)
const [estimateDraft, setEstimateDraft] = useState(String(issue.estimate ?? ''))

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

Display (not editing):
```tsx
<button onClick={() => { setEstimateDraft(String(issue.estimate ?? '')); setEditingEstimate(true) }}
  className="text-[12px] text-foreground font-medium tabular-nums hover:text-accent transition-colors">
  {issue.estimate !== null ? `${issue.estimate} pts` : '—'}
</button>
```

Input (editing):
```tsx
<input
  autoFocus type="number" min={0}
  value={estimateDraft}
  onChange={e => setEstimateDraft(e.target.value)}
  onBlur={handleEstimateSave}
  onKeyDown={e => {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') { setEstimateDraft(String(issue.estimate ?? '')); setEditingEstimate(false) }
  }}
  className="w-16 text-[12px] bg-subtle border border-accent/30 rounded px-1.5 py-0.5 outline-none tabular-nums"
/>
```

### 3.4 Assignee When Assigned

Currently when an assignee is set, a static avatar + name is shown with a separate "Kaldır" button. Replace with `MemberPicker` always visible (both when assigned and unassigned), passing the current `assignee_id` as `value`. The `MemberPicker` already supports this — it shows the current assignee and allows changing.

Remove the "assignee ? show avatar : show picker" conditional. Always render:
```tsx
<MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
```

### 3.5 Activity Logging for Edits

Add `activity_logs` inserts for title, status, priority, assignee, and label changes (where old value differs from new value):

```ts
// After any field update, insert to activity_logs:
await supabase.from('activity_logs').insert({
  issue_id: issue.id,
  actor_id: (await supabase.auth.getUser()).data.user?.id,
  action: 'field_changed',  // or specific: 'status_changed', 'priority_changed', etc.
  old_value: String(oldValue),
  new_value: String(newValue),
})
```

Actions to log:
| Handler | action value |
|---------|-------------|
| `handleStatusChange` | `status_changed` |
| `handlePriorityChange` | `priority_changed` |
| `handleAssigneeChange` | `assignee_changed` |
| `handleTitleSave` | `title_changed` |

---

## 4. IssueCommentThread.tsx

### Props
```ts
interface IssueCommentThreadProps {
  issueId: string
}
```

### Data Loading
```ts
useEffect(() => {
  const supabase = createClient()
  supabase
    .from('comments')
    .select('*, author:profiles(full_name, avatar_url)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true })
    .then(({ data }) => {
      if (data) useIssueStore.getState().setComments(data as any)
    })
}, [issueId])
```

### Comment Submission

Use `useEditor` directly (not the `IssueEditor` wrapper) so the editor instance is accessible for `isEmpty` check and `clearContent()`:

```ts
const editor = useEditor({
  extensions: [StarterKit, Placeholder.configure({ placeholder: 'Yorum yaz...' })],
})

async function handleSubmit() {
  if (!editor || editor.isEmpty) return
  const content = editor.getHTML()
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
    useIssueStore.getState().setComments([...useIssueStore.getState().comments, comment as any])
    editor.commands.clearContent()
  }
}
```

### Layout
```
[avatar] [author name · date]
         [TipTap read-only content]

[avatar] [author name · date]
         [TipTap read-only content]

────────────────────────────────
[TipTap write editor            ]
[Bold Italic Code ...   [Gönder]]
```

Submit triggers on button click or `Ctrl+Enter` keyboard shortcut.

Empty state: "Henüz yorum yok. İlk yorumu sen yaz."

---

## 5. IssueActivityLog.tsx

### Props
```ts
interface IssueActivityLogProps {
  issueId: string
}
```

### Data Loading
```ts
useEffect(() => {
  const supabase = createClient()
  supabase
    .from('activity_logs')
    .select('*, actor:profiles(full_name, avatar_url)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })
    .then(({ data }) => {
      if (data) useIssueStore.getState().setActivityLogs(data as any)
    })
}, [issueId])
```

### Action → Human-readable text
```ts
function describeAction(log: ActivityLog & { actor: Profile | null }): string {
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
```

### Layout
Each row:
```
[avatar] [action text]            [relative date]
```

Relative date: "2 saat önce", "3 gün önce" — implemented with a simple helper using `Date.now() - created_at`.

Empty state: "Henüz aktivite yok."

---

## 6. IssueDetailTabs.tsx

Simple client component:

```tsx
'use client'
import { useState } from 'react'
import { IssueCommentThread } from './IssueCommentThread'
import { IssueActivityLog } from './IssueActivityLog'

interface IssueDetailTabsProps {
  issueId: string
}

export function IssueDetailTabs({ issueId }: IssueDetailTabsProps) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex border-b border-subtle shrink-0">
        {(['comments', 'activity'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-[12px] font-medium border-b-2 transition-colors',
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

---

## 7. Integration in IssueDetailPanel.tsx

`IssueDetailTabs` is rendered at the bottom of the main content area (below labels), inside the existing scrollable `flex-1` container:

```tsx
{/* ... existing: title, status/priority, description, labels ... */}
<IssueDetailTabs issueId={issue.id} />
```

---

## 8. Empty & Error States

| Scenario | Behaviour |
|----------|-----------|
| Title save to empty string | Revert to original, no server call |
| Estimate non-numeric input | Treat as null (clears estimate) |
| Comment submit when editor empty | Button disabled / no-op |
| Supabase error on comment submit | `toast.error(...)`, no store mutation |
| Activity/comment load error | Silently empty list (no crash) |
| Duplicate label add | Ignored (no-op if already exists) |
