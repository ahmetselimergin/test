# Kanban Board UX Enhancements Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the existing Kanban board with three UX features: a live filter bar, card quick actions (priority + assignee popovers), and column drag-to-reorder + inline rename — all with 21st.dev / Framer Motion aesthetics.

**Architecture:** Two new focused client components (`FilterBar`, `IssueCardQuickActions`) + targeted modifications to `BoardColumn`, `KanbanBoard`, `BoardView`, `BoardToolbar`, and `IssueCard`. Filter state lives in `BoardView` (client state only — no URL params). Drag-and-drop still operates on full store state; filters only affect the rendered subset.

**Tech Stack:** Next.js 16 App Router, dnd-kit (existing), Framer Motion v12, Radix UI Popover (existing via shadcn), Zustand stores (existing), Supabase client (existing).

---

## 1. Data Types

```ts
// src/components/board/FilterBar.tsx (exported)
export interface BoardFilters {
  assignees: string[]   // user IDs
  priorities: Priority[]
  types: IssueType[]
  labels: string[]
}

export function isFilterActive(filters: BoardFilters): boolean {
  return (
    filters.assignees.length > 0 ||
    filters.priorities.length > 0 ||
    filters.types.length > 0 ||
    filters.labels.length > 0
  )
}

export function matchesFilters(issue: Issue, filters: BoardFilters): boolean {
  if (filters.assignees.length > 0 && !filters.assignees.includes(issue.assignee_id ?? '')) return false
  if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) return false
  if (filters.types.length > 0 && !filters.types.includes(issue.type)) return false
  if (filters.labels.length > 0 && !filters.labels.some(l => issue.labels.includes(l))) return false
  return true
}
```

---

## 2. Filter Bar

### `src/components/board/FilterBar.tsx` — new client component

Props:
```ts
interface FilterBarProps {
  filters: BoardFilters
  onChange: (filters: BoardFilters) => void
  members: MemberSummary[]
  allLabels: string[]   // derived from all issues in the project
}
```

**Layout:** Single horizontal row with `overflow-x-auto`. Four filter groups rendered as pill-style toggle buttons, each with a dropdown/popover for multi-selection.

**Filter groups:**
| Group | Picker | Display |
|-------|--------|---------|
| Assignee | Avatar + name list, multi-select | Avatar chips |
| Priority | Color dot + label, multi-select | `Priority: critical, high` chip |
| Type | TypeIcon + label, multi-select | `Type: bug, task` chip |
| Label | Label text list, multi-select | `Label: design` chip |

**Active filter chips:** Displayed inline in the row. Each chip has a `×` button to remove that specific filter value. A "Tümünü temizle" button appears at the right end when `isFilterActive(filters)` is true.

**Animation:** Rendered inside `AnimatePresence` in `BoardView`. Slides down with:
```ts
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
```

### `src/components/board/BoardView.tsx` — modify

Add state:
```ts
const [filters, setFilters] = useState<BoardFilters>({ assignees: [], priorities: [], types: [], labels: [] })
const [filterBarOpen, setFilterBarOpen] = useState(false)

const allLabels = useMemo(
  () => [...new Set(issues.flatMap(i => i.labels))],
  [issues]
)
```

Pass `filterBarOpen` + `setFilterBarOpen` to `BoardToolbar`.
Wrap `FilterBar` in `AnimatePresence`, render below `BoardToolbar` when `filterBarOpen`.
Pass `filters` to `KanbanBoard`.

### `src/components/board/BoardToolbar.tsx` — modify

Add props:
```ts
filterBarOpen: boolean
onFilterToggle: () => void
activeFilterCount: number
```

The existing stub `Filter` button becomes a real toggle. When `activeFilterCount > 0`, show a badge:
```tsx
<Button onClick={onFilterToggle} variant={filterBarOpen ? 'secondary' : 'outline'} ...>
  <Filter size={14} />
  Filter
  {activeFilterCount > 0 && (
    <span className="ml-1 size-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
      {activeFilterCount}
    </span>
  )}
</Button>
```

`activeFilterCount` = sum of all active filter array lengths.

### `src/components/board/KanbanBoard.tsx` — modify

Add `filters` prop:
```ts
interface KanbanBoardProps {
  ...
  filters?: BoardFilters
}
```

In the column render, apply filter:
```ts
const columnIssues = issues
  .filter(i => i.board_column_id === column.id)
  .filter(i => !filters || matchesFilters(i, filters))
```

Drag logic is unchanged — always operates on full `useIssueStore` state.

---

## 3. Card Quick Actions

### `src/components/issues/IssueCardQuickActions.tsx` — new client component

Props:
```ts
interface IssueCardQuickActionsProps {
  issue: Issue
  members: MemberSummary[]
}
```

Renders two interactive elements intended to **replace** the priority dot and assignee avatar in `IssueCard`'s footer. Both use Radix `Popover`.

**Priority popover:**
- Trigger: priority dot (`size-[6px] rounded-full`) with `hover:ring-2 hover:ring-current/30 hover:scale-125 cursor-pointer transition-all`
- Content: 4 priority options, each with color dot + label. Active one has checkmark.
- On select:
  ```ts
  useIssueStore.getState().updateIssue(issue.id, { priority: selected })
  supabase.from('issues').update({ priority: selected }).eq('id', issue.id)
  ```
- `e.stopPropagation()` on trigger click to prevent card double-click firing

**Assignee popover:**
- Trigger: existing avatar element with `hover:ring-2 hover:ring-accent/40 cursor-pointer transition-all`
- Content: member list (avatar + name), "Atama kaldır" option at bottom
- On select: same optimistic + Supabase pattern as priority
- `e.stopPropagation()` on trigger click

### `src/components/issues/IssueCard.tsx` — modify

Replace the static priority dot and assignee avatar in the footer with `<IssueCardQuickActions issue={issue} members={members} />`.

`members` is already available via `useProjectStore((s) => s.members)` in `IssueCard`.

---

## 4. Column Reorder + Rename

### `src/components/board/BoardColumn.tsx` — modify

**Rename:** Replace `<h3>{column.name}</h3>` with a controlled input:
```tsx
const [name, setName] = useState(column.name)

async function handleRename() {
  const trimmed = name.trim()
  if (!trimmed || trimmed === column.name) { setName(column.name); return }
  useProjectStore.getState().renameColumn(column.id, trimmed)   // optimistic
  const result = await renameBoardColumn(column.id, trimmed)
  if (result.error) {
    toast.error(result.error)
    setName(column.name)  // rollback
    useProjectStore.getState().renameColumn(column.id, column.name)
  }
}

<input
  value={name}
  onChange={e => setName(e.target.value)}
  onBlur={handleRename}
  onKeyDown={e => {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') { setName(column.name); e.currentTarget.blur() }
  }}
  className="bg-transparent text-[12px] font-semibold outline-none focus:ring-1 
             focus:ring-accent/40 rounded px-1 -mx-1 w-full truncate tracking-tight"
/>
```

**Sortable:** Replace `useDroppable` with `useSortable`, keeping the same `id: column.id` so existing `handleDragOver` issue-drop detection (`columns.find(c => c.id === overId)`) continues to work. Use `data: { type: 'column' }` to distinguish column drags from issue drags without changing any IDs.

```ts
const {
  attributes, listeners, setNodeRef,
  transform, transition, isDragging,
} = useSortable({ id: column.id, data: { type: 'column' } })
```

The column header area gets `{...attributes, ...listeners}` as the drag handle (not the whole column, to avoid conflicts with issue drag). A `GripVertical` icon in the header acts as the visual handle.

### `src/components/board/KanbanBoard.tsx` — modify

**Distinguish column vs issue drag:** Use `data.current.type` set by `useSortable` in `BoardColumn`:
```ts
const isColumnDrag = (event: { active: { data: { current?: { type?: string } } } }) =>
  event.active.data.current?.type === 'column'
```

`handleDragStart`: if column drag, set `activeColumn` state instead of `activeIssue`.
`handleDragOver`: if column drag, skip issue reorder logic entirely.
`handleDragEnd`: 
```ts
if (active.data.current?.type === 'column') {
  // Column reorder
  const { columns: freshCols, setColumns } = useProjectStore.getState()
  const oldIdx = freshCols.findIndex(c => c.id === active.id)
  const newIdx = freshCols.findIndex(c => c.id === over?.id)
  if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
    const reordered = arrayMove(freshCols, oldIdx, newIdx).map((c, i) => ({ ...c, order: i }))
    setColumns(reordered)
    reorderBoardColumns(reordered.map(c => ({ id: c.id, order: c.order })))
  }
  setActiveColumn(null)
  return
}
// ... existing issue drag end logic
```

`DragOverlay`: render `activeColumn` preview (column header only, no issues) when column is being dragged.

### `src/app/actions/board.ts` — modify

Add two server actions:

```ts
export async function renameBoardColumn(columnId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('board_columns')
    .update({ name })
    .eq('id', columnId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderBoardColumns(
  columns: Array<{ id: string; order: number }>
) {
  const supabase = await createClient()
  await Promise.all(
    columns.map(({ id, order }) =>
      supabase.from('board_columns').update({ order }).eq('id', id)
    )
  )
  return { success: true }
}
```

### `src/lib/stores/project.store.ts` — modify

Add `renameColumn` and `setColumns` actions:
```ts
renameColumn: (id: string, name: string) =>
  set(s => ({ columns: s.columns.map(c => c.id === id ? { ...c, name } : c) }))

setColumns: (columns: BoardColumn[]) => set({ columns })
```

---

## 5. Empty & Error States

| Scenario | Behaviour |
|----------|-----------|
| Filter matches no issues in a column | Column shows empty drop area (same as currently) |
| Rename to empty string | Revert to original name, no server call |
| Rename server error | Toast error, revert store to original name |
| Column reorder server error | No rollback (order persists in UI; user can drag again) |
| Quick action server error | Toast error, no store rollback (issue retains new value in UI) |

---

## 6. Animations

| Element | Animation |
|---------|-----------|
| FilterBar open/close | height + opacity, 0.2s spring |
| Filter chip appear | `scale: 0.8 → 1`, `opacity: 0 → 1`, 0.12s |
| Priority popover | Radix default (fade + scale) |
| Assignee popover | Radix default (fade + scale) |
| Column drag overlay | 5deg rotation + 0.95 opacity (same as issue card overlay) |
| Renamed column | No animation — instant text update |
