# Backlog / Sprint / Roadmap — Tam İşlevsellik Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backlog, Sprint ve Roadmap görünümlerini read-only durumdan tam işlevsel hale getirmek — IssueRow paylaşımlı bileşen, sprint/epic oluşturma, backlog-to-sprint atama, burndown düzeltme.

**Architecture:** `IssueRow` foundation component (Task 1) backlog ve sprint listelerini besler. Yeni Server Actions (`sprint.ts`, `roadmap.ts`) insert/update işlemlerini yapar. Context menu'ye sprint atama eklenir. Backlog, Sprint, Roadmap view'ları birer aksiyon noktası kazanır.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Zustand (`project.store`, `issue.store`), shadcn/ui (Dialog, Collapsible, Popover), date-fns

---

## Codebase Bağlamı

Okuman gereken dosyalar:
- `src/lib/supabase/types.ts` — `Issue`, `Sprint`, `Epic`, `BoardColumn`, `MemberSummary` tipleri
- `src/lib/stores/project.store.ts` — `sprints`, `epics`, `columns`, `members`, `setSprints`, `setEpics`
- `src/lib/stores/issue.store.ts` — `updateIssue`, `issues`
- `src/components/issues/IssueCardContextMenu.tsx` — mevcut context menu (genişletilecek)
- `src/components/issues/TypeIcon.tsx` — `TypeIcon` component
- `src/lib/utils.ts` — `formatIssueId`, `formatEstimate`, `priorityConfig`, `cn`
- `src/app/actions/board.ts` — mevcut Server Action pattern'i takip et

Tip özeti:
```ts
// Issue: id, project_id, epic_id, sprint_id, board_column_id, type, title,
//        status ('todo'|'in_progress'|'review'|'done'), priority, assignee_id,
//        labels: string[], estimate: number|null, issue_number, created_at
// Sprint: id, project_id, name, goal, start_date, end_date,
//         status ('planned'|'active'|'completed')
// Epic:   id, project_id, title, description, color, start_date, end_date,
//         status ('active'|'completed'|'cancelled')
// BoardColumn: id, project_id, name, order, wip_limit, color
// MemberSummary: id, full_name, email, avatar_url
```

---

## Task 1: Store — addSprint, addEpic, updateEpic

**Files:**
- Modify: `src/lib/stores/project.store.ts`

- [ ] **Step 1: Interface'e 3 aksiyon ekle**

`ProjectState` interface'ine şunları ekle (mevcut `setSprints` satırından sonra):

```ts
addSprint: (sprint: Sprint) => void
addEpic: (epic: Epic) => void
updateEpic: (id: string, updates: Partial<Epic>) => void
```

- [ ] **Step 2: Implementation'larını ekle**

`setSprints` implementasyonundan sonra:

```ts
addSprint: (sprint) =>
  set((state) => ({ sprints: [...state.sprints, sprint] })),
addEpic: (epic) =>
  set((state) => ({ epics: [...state.epics, epic] })),
updateEpic: (id, updates) =>
  set((state) => ({
    epics: state.epics.map((e) => (e.id === id ? { ...e, ...updates } : e)),
  })),
```

- [ ] **Step 3: TypeScript doğrula**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/lib/stores/project.store.ts
git commit -m "feat: add addSprint, addEpic, updateEpic to project store"
```

---

## Task 2: IssueRow — paylaşımlı satır bileşeni

**Files:**
- Create: `src/components/issues/IssueRow.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```tsx
'use client'

import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { IssueCardContextMenu } from './IssueCardContextMenu'
import { TypeIcon } from './TypeIcon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, formatEstimate, cn, priorityConfig } from '@/lib/utils'
import type { Issue, Project } from '@/lib/supabase/types'

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

interface IssueRowProps {
  issue: Issue
  project: Project
}

export function IssueRow({ issue, project }: IssueRowProps) {
  const { setSelectedIssue } = useIssueStore()
  const members = useProjectStore((s) => s.members)
  const assignee = members.find((m) => m.id === issue.assignee_id)

  return (
    <IssueCardContextMenu issue={issue}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
        onClick={() => setSelectedIssue(issue)}
      >
        <TypeIcon type={issue.type} size={13} className="shrink-0 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-mono tracking-tight shrink-0 w-14">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <span className="flex-1 text-[13px] text-foreground truncate">{issue.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground"
            >
              {label}
            </span>
          ))}
          <span
            className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[issue.priority])}
            title={priorityConfig[issue.priority].label}
          />
          {assignee ? (
            <Avatar className="size-5">
              {assignee.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt={assignee.full_name ?? ''}
                  className="size-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
                  {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          ) : (
            <span className="size-5 rounded-full border border-dashed border-border shrink-0" />
          )}
          {issue.estimate !== null && (
            <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 tabular-nums">
              {formatEstimate(issue.estimate)}
            </span>
          )}
        </div>
      </div>
    </IssueCardContextMenu>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/IssueRow.tsx
git commit -m "feat: IssueRow — shared compact list row component"
```

---

## Task 3: Server Actions — sprint.ts

**Files:**
- Create: `src/app/actions/sprint.ts`

- [ ] **Step 1: Dosyayı oluştur**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createSprint(params: {
  projectId: string
  name: string
  goal?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { data: sprint, error } = await supabase
    .from('sprints')
    .insert({
      project_id: params.projectId,
      name: params.name,
      goal: params.goal ?? null,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { sprint }
}

export async function assignIssueToSprint(issueId: string, sprintId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { error } = await supabase
    .from('issues')
    .update({ sprint_id: sprintId })
    .eq('id', issueId)

  if (error) return { error: error.message }
  return { success: true }
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/sprint.ts
git commit -m "feat: createSprint and assignIssueToSprint server actions"
```

---

## Task 4: Server Actions — roadmap.ts

**Files:**
- Create: `src/app/actions/roadmap.ts`

- [ ] **Step 1: Dosyayı oluştur**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createEpic(params: {
  projectId: string
  title: string
  color: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { data: epic, error } = await supabase
    .from('epics')
    .insert({
      project_id: params.projectId,
      title: params.title,
      color: params.color,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
      status: 'active',
      description: null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { epic }
}

export async function updateEpicDates(
  epicId: string,
  startDate: string | null,
  endDate: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { error } = await supabase
    .from('epics')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', epicId)

  if (error) return { error: error.message }
  return { success: true }
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/roadmap.ts
git commit -m "feat: createEpic and updateEpicDates server actions"
```

---

## Task 5: Context Menu — "Sprint'e Ekle" submenüsü

**Files:**
- Modify: `src/components/issues/IssueCardContextMenu.tsx`

- [ ] **Step 1: Import'lara ekle**

Dosyanın import bloğuna ekle (mevcut importlar korunur):

```ts
import { assignIssueToSprint } from '@/app/actions/sprint'
```

`Calendar` ikonunu `lucide-react` import satırına ekle:

```ts
import { Trash2, ExternalLink, ArrowRight, Calendar } from 'lucide-react'
```

- [ ] **Step 2: Bileşen içine sprints ve handler ekle**

`const columns = ...` satırından sonra:

```ts
const sprints = useProjectStore((s) => s.sprints).filter(
  (s) => s.status !== 'completed'
)

async function handleSprintAssign(sprintId: string | null) {
  const prevSprintId = issue.sprint_id
  updateIssue(issue.id, { sprint_id: sprintId })
  const result = await assignIssueToSprint(issue.id, sprintId)
  if ('error' in result && result.error) {
    updateIssue(issue.id, { sprint_id: prevSprintId })
    toast.error(result.error)
  }
}
```

- [ ] **Step 3: JSX'e submenü ekle**

`{/* Move to column */}` bloğundan sonra, `{/* Change priority */}` bloğundan önce:

```tsx
{/* Assign to sprint */}
<ContextMenuSub>
  <ContextMenuSubTrigger className="gap-2 cursor-pointer">
    <Calendar size={13} className="text-muted-foreground" />
    Sprint'e Ekle
  </ContextMenuSubTrigger>
  <ContextMenuSubContent className="w-48">
    {sprints.length === 0 ? (
      <ContextMenuItem disabled className="text-[12px] text-muted-foreground">
        Sprint yok
      </ContextMenuItem>
    ) : (
      sprints.map((sprint) => (
        <ContextMenuItem
          key={sprint.id}
          className="gap-2 cursor-pointer"
          onClick={() => handleSprintAssign(sprint.id)}
          disabled={issue.sprint_id === sprint.id}
        >
          <span
            className={cn(
              'size-1.5 rounded-full shrink-0',
              sprint.status === 'active' ? 'bg-indigo-400' : 'bg-muted-foreground'
            )}
          />
          <span className="truncate flex-1">{sprint.name}</span>
          {issue.sprint_id === sprint.id && (
            <span className="ml-auto text-[11px] text-muted-foreground">✓</span>
          )}
        </ContextMenuItem>
      ))
    )}
    {issue.sprint_id && (
      <div className="border-t border-border mt-1 pt-1">
        <ContextMenuItem
          className="gap-2 cursor-pointer text-muted-foreground"
          onClick={() => handleSprintAssign(null)}
        >
          Sprint'ten çıkar
        </ContextMenuItem>
      </div>
    )}
  </ContextMenuSubContent>
</ContextMenuSub>
```

- [ ] **Step 4: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/issues/IssueCardContextMenu.tsx
git commit -m "feat: context menu — Sprint'e Ekle submenüsü"
```

---

## Task 6: CreateIssueDialog — defaultEpicId prop

**Files:**
- Modify: `src/components/board/CreateIssueDialog.tsx`

- [ ] **Step 1: Props interface'ine ekle**

`interface Props` bloğuna ekle:

```ts
defaultEpicId?: string
```

- [ ] **Step 2: Prop'u destructure et ve state olarak kullan**

`export function CreateIssueDialog({` satırında:

```ts
export function CreateIssueDialog({
  project,
  column,
  workspaceSlug,
  members,
  open,
  onOpenChange,
  defaultEpicId,
}: Props) {
```

- [ ] **Step 3: handleSubmit'e epic_id ekle**

`formData.set('project_id', ...)` satırından sonra:

```ts
if (defaultEpicId) formData.set('epic_id', defaultEpicId)
```

- [ ] **Step 4: createIssue action'ının epic_id'yi işlediğini doğrula**

`src/app/actions/board.ts`'i oku (Task 4 satırından itibaren). `createIssue` fonksiyonu `formData.get('epic_id')` okumuyor olabilir. Yoksa ekle:

```ts
const epicId = (formData.get('epic_id') as string) || null
```

ve insert objesine:

```ts
epic_id: epicId,
```

- [ ] **Step 5: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/components/board/CreateIssueDialog.tsx src/app/actions/board.ts
git commit -m "feat: CreateIssueDialog — defaultEpicId prop for backlog create"
```

---

## Task 7: BacklogGroup — IssueRow + "+ Issue Ekle" butonu

**Files:**
- Modify: `src/components/backlog/BacklogGroup.tsx`

- [ ] **Step 1: Yeni interface ile dosyayı yeniden yaz**

```tsx
'use client'

import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Issue, Project, BoardColumn, MemberSummary } from '@/lib/supabase/types'
import { IssueRow } from '@/components/issues/IssueRow'
import { CreateIssueDialog } from '@/components/board/CreateIssueDialog'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'

interface BacklogGroupProps {
  title: string
  issues: Issue[]
  project: Project
  color?: string
  epicId?: string
  defaultColumn?: BoardColumn
  workspaceSlug?: string
  members?: MemberSummary[]
}

export function BacklogGroup({
  title,
  issues,
  project,
  color,
  epicId,
  defaultColumn,
  workspaceSlug,
  members = [],
}: BacklogGroupProps) {
  const [open, setOpen] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} defaultOpen>
        <div className="border border-border rounded-xl overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition-colors">
            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
            {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
              {issues.length}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-2 py-1">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} project={project} />
              ))}
              {issues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">Issue yok</p>
              )}
              {defaultColumn && workspaceSlug && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Issue Ekle
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {defaultColumn && workspaceSlug && (
        <CreateIssueDialog
          project={project}
          column={defaultColumn}
          workspaceSlug={workspaceSlug}
          members={members}
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultEpicId={epicId}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/backlog/BacklogGroup.tsx
git commit -m "feat: BacklogGroup — IssueRow + Issue Ekle butonu"
```

---

## Task 8: BacklogView — workspaceSlug prop + store bağlantısı

**Files:**
- Modify: `src/components/backlog/BacklogView.tsx`
- Modify: `src/app/(dashboard)/[workspace]/[project]/backlog/page.tsx`

- [ ] **Step 1: BacklogView'a workspaceSlug prop ekle**

```tsx
'use client'
import { useMemo, useState } from 'react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { BacklogGroup } from './BacklogGroup'
import type { Project } from '@/lib/supabase/types'

type GroupBy = 'epic' | 'priority' | 'none'

const groupByLabels: Record<GroupBy, string> = {
  epic: "Epic'e Göre",
  priority: 'Önceliğe Göre',
  none: 'Gruplandırma Yok',
}

interface BacklogViewProps {
  project: Project
  workspaceSlug: string
}

export function BacklogView({ project, workspaceSlug }: BacklogViewProps) {
  const { issues } = useIssueStore()
  const { epics, columns, members } = useProjectStore()
  const [groupBy, setGroupBy] = useState<GroupBy>('epic')

  const defaultColumn = columns[0]

  const backlogIssues = useMemo(
    () => issues.filter((i) => !i.sprint_id),
    [issues]
  )

  const groups = useMemo(() => {
    if (groupBy === 'epic') {
      const epicGroups = epics.map((epic) => ({
        id: epic.id,
        title: epic.title,
        color: epic.color,
        epicId: epic.id,
        issues: backlogIssues.filter((i) => i.epic_id === epic.id),
      }))
      const noEpic = backlogIssues.filter((i) => !i.epic_id)
      return [
        ...epicGroups,
        { id: 'none', title: 'Epic Yok', color: undefined, epicId: undefined, issues: noEpic },
      ]
    }

    if (groupBy === 'priority') {
      return (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
        id: p,
        title: p.charAt(0).toUpperCase() + p.slice(1),
        color: undefined,
        epicId: undefined,
        issues: backlogIssues.filter((i) => i.priority === p),
      }))
    }

    return [
      {
        id: 'all',
        title: "Tüm Issue'lar",
        color: undefined,
        epicId: undefined,
        issues: backlogIssues,
      },
    ]
  }, [backlogIssues, epics, groupBy])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Backlog</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Grupla:</span>
          <div className="flex gap-1">
            {(Object.keys(groupByLabels) as GroupBy[]).map((key) => (
              <button
                key={key}
                onClick={() => setGroupBy(key)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  groupBy === key
                    ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                    : 'text-muted-foreground hover:bg-white/5'
                }`}
              >
                {groupByLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <BacklogGroup
            key={group.id}
            title={group.title}
            issues={group.issues}
            project={project}
            color={group.color}
            epicId={group.epicId}
            defaultColumn={defaultColumn}
            workspaceSlug={workspaceSlug}
            members={members}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: backlog/page.tsx'e workspaceSlug geçir**

`src/app/(dashboard)/[workspace]/[project]/backlog/page.tsx` dosyasında:

```ts
// params destructuring:
const { workspace: workspaceSlug, project: projectId } = await params

// BacklogView render:
<BacklogView project={project} workspaceSlug={workspaceSlug} />
```

- [ ] **Step 3: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/backlog/BacklogView.tsx "src/app/(dashboard)/[workspace]/[project]/backlog/page.tsx"
git commit -m "feat: BacklogView — workspaceSlug, store members/columns, create entrypoint"
```

---

## Task 9: CreateSprintDialog

**Files:**
- Create: `src/components/sprint/CreateSprintDialog.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createSprint } from '@/app/actions/sprint'
import { useProjectStore } from '@/lib/stores/project.store'

interface CreateSprintDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSprintDialog({
  projectId,
  open,
  onOpenChange,
}: CreateSprintDialogProps) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const addSprint = useProjectStore((s) => s.addSprint)

  function handleClose() {
    setName(''); setGoal(''); setStartDate(''); setEndDate('')
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const result = await createSprint({
      projectId,
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setLoading(false)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('sprint' in result && result.sprint) {
      addSprint(result.sprint)
      toast.success('Sprint oluşturuldu')
      handleClose()
    }
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sprint Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              İsim *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Hedef
            </label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Bu sprint'te neyi tamamlıyoruz?"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sprint/CreateSprintDialog.tsx
git commit -m "feat: CreateSprintDialog component"
```

---

## Task 10: SprintCard — collapsible issue listesi

**Files:**
- Modify: `src/components/sprint/SprintCard.tsx`

- [ ] **Step 1: Import'ları güncelle**

Mevcut import bloğunu şununla değiştir:

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle, Calendar, ChevronRight } from 'lucide-react'
import type { Sprint, Issue } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/lib/stores/project.store'
import { IssueRow } from '@/components/issues/IssueRow'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Bileşen içine issuesOpen state ve currentProject ekle**

`const { setSprints, sprints } = useProjectStore()` satırından sonra:

```ts
const currentProject = useProjectStore((s) => s.currentProject)
const [issuesOpen, setIssuesOpen] = useState(sprint.status === 'active')
```

- [ ] **Step 3: CardContent'ten sonra collapsible issue listesini ekle**

Kapanış `</Card>` tag'ından önce (mevcut `</CardContent>`'ten hemen sonra):

```tsx
{currentProject && (
  <Collapsible open={issuesOpen} onOpenChange={setIssuesOpen}>
    <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-2 border-t border-border hover:bg-muted/30 transition-colors">
      <motion.div animate={{ rotate: issuesOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
        <ChevronRight size={12} className="text-muted-foreground" />
      </motion.div>
      <span className="text-[11px] text-muted-foreground">
        Issue'lar ({issues.length})
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="px-2 pb-2">
        {issues.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-3">
            Issue yok — backlog&apos;dan sağ tıkla ekle
          </p>
        ) : (
          issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} project={currentProject} />
          ))
        )}
      </div>
    </CollapsibleContent>
  </Collapsible>
)}
```

- [ ] **Step 4: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/sprint/SprintCard.tsx
git commit -m "feat: SprintCard — collapsible issue list with IssueRow"
```

---

## Task 11: SprintView — "Sprint Oluştur" butonu

**Files:**
- Modify: `src/components/sprint/SprintView.tsx`

- [ ] **Step 1: Dosyayı yeniden yaz**

```tsx
'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { SprintCard } from './SprintCard'
import { BurndownChart } from './BurndownChart'
import { CreateSprintDialog } from './CreateSprintDialog'
import { Button } from '@/components/ui/button'

export function SprintView() {
  const { sprints, currentProject } = useProjectStore()
  const { issues } = useIssueStore()
  const [createOpen, setCreateOpen] = useState(false)

  const activeSprint = sprints.find((s) => s.status === 'active')
  const activeIssues = activeSprint
    ? issues.filter((i) => i.sprint_id === activeSprint.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sprint</h1>
        {currentProject && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Sprint Oluştur
          </Button>
        )}
      </div>

      {activeSprint && (
        <BurndownChart sprint={activeSprint} issues={activeIssues} />
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Sprint&apos;ler
        </h2>
        {sprints.length === 0 && (
          <p className="text-sm text-muted-foreground">Henüz sprint yok.</p>
        )}
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            issues={issues.filter((i) => i.sprint_id === sprint.id)}
          />
        ))}
      </div>

      {currentProject && (
        <CreateSprintDialog
          projectId={currentProject.id}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sprint/SprintView.tsx
git commit -m "feat: SprintView — Sprint Oluştur butonu ve CreateSprintDialog"
```

---

## Task 12: BurndownChart — gerçek burndown verisi

**Files:**
- Modify: `src/components/sprint/BurndownChart.tsx`

- [ ] **Step 1: Gerçek hesaplama ile dosyayı yeniden yaz**

```tsx
'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Sprint, Issue } from '@/lib/supabase/types'
import {
  eachDayOfInterval,
  format,
  parseISO,
  differenceInDays,
  isAfter,
} from 'date-fns'
import { tr } from 'date-fns/locale'

interface BurndownChartProps {
  sprint: Sprint
  issues: Issue[]
}

export function BurndownChart({ sprint, issues }: BurndownChartProps) {
  if (!sprint.start_date || !sprint.end_date) return null

  const start = parseISO(sprint.start_date)
  const end = parseISO(sprint.end_date)
  const today = new Date()

  const totalPoints = issues.reduce((sum, i) => sum + (i.estimate ?? 1), 0)
  const donePoints = issues
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + (i.estimate ?? 1), 0)
  const remaining = totalPoints - donePoints
  const days = eachDayOfInterval({ start, end })
  const sprintLength = Math.max(days.length - 1, 1)
  const daysPassed = Math.max(
    0,
    Math.min(differenceInDays(today, start), sprintLength)
  )

  const data = days.map((day, i) => {
    const ideal = Math.round(totalPoints - (totalPoints / sprintLength) * i)
    let actual: number | undefined
    if (!isAfter(day, today)) {
      actual =
        daysPassed === 0
          ? totalPoints
          : Math.max(
              0,
              Math.round(totalPoints - (totalPoints - remaining) * (i / daysPassed))
            )
    }
    return {
      date: format(day, 'd MMM', { locale: tr }),
      ideal,
      actual,
    }
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium mb-4">Burndown Chart</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
          />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} />
          <Tooltip
            contentStyle={{
              background: 'rgb(26, 26, 46)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'rgb(248, 250, 252)',
            }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="rgba(99,102,241,0.4)"
            strokeDasharray="5 5"
            dot={false}
            name="İdeal"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="rgb(99,102,241)"
            strokeWidth={2}
            dot={{ fill: 'rgb(99,102,241)', r: 3 }}
            connectNulls={false}
            name="Gerçek"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sprint/BurndownChart.tsx
git commit -m "fix: BurndownChart — gerçek burndown verisi (fake data kaldırıldı)"
```

---

## Task 13: CreateEpicDialog

**Files:**
- Create: `src/components/roadmap/CreateEpicDialog.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createEpic } from '@/app/actions/roadmap'
import { useProjectStore } from '@/lib/stores/project.store'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

interface CreateEpicDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEpicDialog({
  projectId,
  open,
  onOpenChange,
}: CreateEpicDialogProps) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const addEpic = useProjectStore((s) => s.addEpic)

  function handleClose() {
    setTitle(''); setStartDate(''); setEndDate('')
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const result = await createEpic({
      projectId,
      title: title.trim(),
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setLoading(false)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('epic' in result && result.epic) {
      addEpic(result.epic)
      toast.success('Epic oluşturuldu')
      handleClose()
    }
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Epic Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Başlık *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic başlığı..."
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Renk
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full transition-all',
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-white/40 scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading || !title.trim()}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/roadmap/CreateEpicDialog.tsx
git commit -m "feat: CreateEpicDialog component"
```

---

## Task 14: EpicDateDialog — tarihleri düzenle

**Files:**
- Create: `src/components/roadmap/EpicDateDialog.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { updateEpicDates } from '@/app/actions/roadmap'
import { useProjectStore } from '@/lib/stores/project.store'
import type { Epic } from '@/lib/supabase/types'

interface EpicDateDialogProps {
  epic: Epic
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EpicDateDialog({ epic, open, onOpenChange }: EpicDateDialogProps) {
  const [startDate, setStartDate] = useState(epic.start_date?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(epic.end_date?.slice(0, 10) ?? '')
  const [loading, setLoading] = useState(false)
  const updateEpic = useProjectStore((s) => s.updateEpic)

  async function handleSave() {
    setLoading(true)
    updateEpic(epic.id, {
      start_date: startDate || null,
      end_date: endDate || null,
    })
    const result = await updateEpicDates(
      epic.id,
      startDate || null,
      endDate || null
    )
    setLoading(false)
    if ('error' in result && result.error) {
      updateEpic(epic.id, { start_date: epic.start_date, end_date: epic.end_date })
      toast.error(result.error)
      return
    }
    onOpenChange(false)
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="truncate text-[14px]">{epic.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1.5">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1.5">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="button" size="sm" disabled={loading} onClick={handleSave}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/roadmap/EpicDateDialog.tsx
git commit -m "feat: EpicDateDialog — tarih düzenleme dialog'u"
```

---

## Task 15: GanttRow — onEdit callback

**Files:**
- Modify: `src/components/roadmap/GanttRow.tsx`

- [ ] **Step 1: onEdit prop ekle ve bar'a onClick bağla**

```tsx
import type { Epic } from '@/lib/supabase/types'
import { differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface GanttRowProps {
  epic: Epic
  viewStart: Date
  totalDays: number
  onEdit?: (epic: Epic) => void
}

export function GanttRow({ epic, viewStart, totalDays, onEdit }: GanttRowProps) {
  if (!epic.start_date || !epic.end_date) return null

  const epicStart = parseISO(epic.start_date)
  const epicEnd = parseISO(epic.end_date)

  const leftDays = differenceInDays(epicStart, viewStart)
  const widthDays = differenceInDays(epicEnd, epicStart) + 1

  const leftPct = (leftDays / totalDays) * 100
  const widthPct = (widthDays / totalDays) * 100

  if (leftPct > 100 || leftPct + widthPct < 0) return null

  const clampedLeft = Math.max(0, leftPct)
  const clampedWidth = Math.min(100 - clampedLeft, widthPct + Math.min(0, leftPct))

  return (
    <div className="relative h-8 flex items-center">
      <div
        title={epic.title}
        onClick={() => onEdit?.(epic)}
        className={cn(
          'absolute h-6 rounded-lg flex items-center px-2 text-xs font-medium text-white shadow-md transition-opacity',
          epic.status === 'completed' && 'opacity-50',
          onEdit && 'cursor-pointer hover:brightness-110 transition-all'
        )}
        style={{
          left: `${clampedLeft}%`,
          width: `${clampedWidth}%`,
          backgroundColor: epic.color,
          minWidth: '4px',
        }}
      >
        <span className="truncate">{epic.title}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/roadmap/GanttRow.tsx
git commit -m "feat: GanttRow — onEdit callback, tıklanabilir bar"
```

---

## Task 16: RoadmapView — Epic Oluştur butonu + tarih düzenleme

**Files:**
- Modify: `src/components/roadmap/RoadmapView.tsx`

- [ ] **Step 1: Dosyayı yeniden yaz**

```tsx
'use client'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useProjectStore } from '@/lib/stores/project.store'
import { GanttRow } from './GanttRow'
import { CreateEpicDialog } from './CreateEpicDialog'
import { EpicDateDialog } from './EpicDateDialog'
import { Button } from '@/components/ui/button'
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  differenceInDays,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Epic } from '@/lib/supabase/types'

export function RoadmapView() {
  const { epics, currentProject } = useProjectStore()
  const [viewStart, setViewStart] = useState(() => startOfMonth(new Date()))
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)

  const viewEnd = useMemo(() => endOfMonth(addMonths(viewStart, 5)), [viewStart])
  const months = useMemo(
    () => eachMonthOfInterval({ start: viewStart, end: viewEnd }),
    [viewStart, viewEnd]
  )
  const totalDays = useMemo(
    () => differenceInDays(viewEnd, viewStart) + 1,
    [viewStart, viewEnd]
  )

  const visibleEpics = useMemo(
    () => epics.filter((e) => e.start_date && e.end_date),
    [epics]
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Roadmap</h1>
        <div className="flex items-center gap-2">
          {currentProject && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Epic Oluştur
            </Button>
          )}
          <button
            onClick={() => setViewStart((s) => addMonths(s, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted-foreground w-40 text-center">
            {format(viewStart, 'MMM yyyy', { locale: tr })} —{' '}
            {format(viewEnd, 'MMM yyyy', { locale: tr })}
          </span>
          <button
            onClick={() => setViewStart((s) => addMonths(s, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <ScrollArea className="w-full">
          <div className="flex border-b border-border">
            <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-border">
              <span className="text-xs text-muted-foreground">Epic</span>
            </div>
            <div className="flex-1 flex">
              {months.map((month) => (
                <div
                  key={month.toISOString()}
                  className="flex-1 text-center py-2 text-xs text-muted-foreground border-r border-border last:border-0"
                >
                  {format(month, 'MMM yyyy', { locale: tr })}
                </div>
              ))}
            </div>
          </div>

          {visibleEpics.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tarih girilmiş epic bulunamadı
            </div>
          )}

          {visibleEpics.map((epic) => (
            <div
              key={epic.id}
              className="flex border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-48 flex-shrink-0 px-4 flex items-center gap-2 border-r border-border py-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: epic.color }}
                />
                <span className="text-sm truncate">{epic.title}</span>
              </div>
              <div className="flex-1 relative px-2 py-1">
                <GanttRow
                  epic={epic}
                  viewStart={viewStart}
                  totalDays={totalDays}
                  onEdit={setEditingEpic}
                />
              </div>
            </div>
          ))}

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {currentProject && (
        <CreateEpicDialog
          projectId={currentProject.id}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {editingEpic && (
        <EpicDateDialog
          epic={editingEpic}
          open={!!editingEpic}
          onOpenChange={(open) => { if (!open) setEditingEpic(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript doğrula**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/roadmap/RoadmapView.tsx
git commit -m "feat: RoadmapView — Epic Oluştur butonu ve tarih düzenleme"
```

---

## Son: Tüm değişiklikleri kontrol et

- [ ] **TypeScript son kontrol**

```bash
npx tsc --noEmit
```

- [ ] **Manuel test kontrol listesi**

Backlog:
- [ ] Issue'lar kart değil, satır olarak görünüyor
- [ ] Sağ tık → Sprint'e Ekle → sprint seçince issue backlog'dan kayboluyor
- [ ] "+ Issue Ekle" butonuna tıklayınca CreateIssueDialog açılıyor

Sprint:
- [ ] "Sprint Oluştur" butonuna tıklayınca dialog açılıyor
- [ ] Sprint oluşturulunca listede görünüyor
- [ ] Sprint kartında "Issue'lar" toggle çalışıyor
- [ ] Aktif sprint'te burndown chart görünüyor

Roadmap:
- [ ] "Epic Oluştur" butonu çalışıyor
- [ ] Gantt barına tıklayınca EpicDateDialog açılıyor
- [ ] Tarihler kaydedilince bar güncelleniyor
