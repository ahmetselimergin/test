# FlowTrack — "Figma Dark Core" Design Spec

**Date:** 2026-05-25  
**Status:** Approved  
**Scope:** Full application visual overhaul — tokens, layout, components, motion

---

## Goal

Elevate FlowTrack's design to a premium, tool-focused aesthetic inspired by Figma: high information density, neutral gray-black palette, accent used sparingly, rich-but-fast motion. Dark mode is the primary experience.

---

## 1. Token System

### CSS Variable Changes (`src/app/globals.css`)

**Dark mode:**

| Token | Current | New |
|---|---|---|
| `--bg` | `9 9 11` | `8 8 10` |
| `--bg-elevated` | `18 18 22` | `16 16 20` |
| `--bg-card` | `24 24 30` | `22 22 28` |
| `--bg-subtle` | `15 15 18` | `13 13 16` |
| `--bg-muted` | `39 39 48` | `34 34 42` |
| `--border` | `39 39 48` | `38 38 46` |
| `--border-strong` | `63 63 70` | `58 58 68` |
| `--text` | `250 250 250` | `248 248 250` |
| `--text-muted` | `161 161 170` | `120 120 132` |
| `--accent` | `99 102 241` | `99 102 241` (unchanged, used sparingly) |

**Light mode:**

| Token | Current | New |
|---|---|---|
| `--bg` | `248 250 252` | `248 248 250` (neutral, remove blue tint) |
| `--text-muted` | `100 116 139` | `113 113 122` (zinc-500) |

**Layout tokens:**

| Token | Current | New |
|---|---|---|
| `--sidebar-w` | `260px` | `220px` |
| `--header-h` | `52px` | `44px` |

**Board background — replace dot grid with line grid:**
```css
.grid-board-bg {
  background-image:
    linear-gradient(rgb(var(--border) / 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--border) / 0.4) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**Global transition easing:**
```css
* {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 2. Sidebar (`src/components/layout/Sidebar.tsx`)

- Logo: `size-8 → size-7`, workspace name `text-sm → text-[13px]`
- Section labels: `mb-2 → mb-1`, spacing tightened
- NavLink: `px-3 py-2 → px-2 py-1.5`, icon size `16 → 15`
- Active state: Replace `bg-accent-muted` fill with `border-l-2 border-accent pl-[6px]` left indicator. Background becomes `bg-subtle/60` only.
- Project items: Color avatar `size-6 → size-5`
- Bottom section: Replace `<Separator />` with `border-t border-subtle`, no gap

---

## 3. Header (`src/components/layout/AppHeader.tsx`)

- Breadcrumb: `text-sm → text-[13px]`
- Search input: `h-9 → h-7`, `max-w-md → max-w-xs`, placeholder `text-xs`
- Action buttons: `size-8 → size-7`
- Create button: Always visible, `h-7 text-xs px-2.5`
- Header background: Add `backdrop-blur-sm` + `bg-[rgb(var(--bg-elevated)/0.95)]` for frosted glass effect (subtle, not decorative)

---

## 4. Kanban Board

### BoardColumn (`src/components/board/BoardColumn.tsx`)

- Width: `w-[300px] → w-[272px]`
- Column header text: `text-xs → text-[11px]`, tracking-widest
- Color dot: `size-2 → size-1.5`
- Issue count badge: `px-1.5 py-0.5 → px-1 py-0`
- Drop zone: `rounded-xl → rounded-lg`, `p-2 → p-1.5`, `space-y-2 → gap-1.5`
- Empty state button: `py-6 → py-5`

### IssueCard (`src/components/issues/IssueCard.tsx`)

- Padding: `pl-3 pr-3 py-2.5 → pl-[10px] pr-2.5 py-2`
- Header row margin: `mb-1.5 → mb-1`
- Title margin: `mb-2.5 → mb-2`
- Title: `text-[13px] → text-[12.5px]`, `line-clamp-3 → line-clamp-2`
- Label badge: `max-w-[72px] → max-w-[64px]`
- Hover: Remove `hover:shadow-sm`, replace with `hover:bg-card/80` — subtle background shift
- DragOverlay: `opacity-60 → opacity-70`, `ring-2 ring-accent/30 → ring-1 ring-accent/20`

---

## 5. Issue Detail Panel (`src/components/issues/IssueDetailPanel.tsx`)

- Panel header: `h-14 → h-11`
- Title section: `py-4 → py-3`
- Backdrop: `bg-black/50 backdrop-blur-[2px] → bg-black/40 backdrop-blur-[1px]`
- Spring: `damping:32 stiffness:380 → damping:36 stiffness:420`

### IssuePropertyRow (`src/components/issues/IssuePropertyRow.tsx`)

- Layout: 2-column grid — label fixed `w-20`, value `flex-1`
- Row: `py-3 → py-2`, `text-[12px]`
- Status/Priority selectors: `flex-wrap gap-1.5 → flex gap-1 overflow-x-auto` (horizontal scroll, no wrap)

---

## 6. Auth Pages

### Layout (`src/app/(auth)/layout.tsx`)

- Left panel background: `bg-subtle → bg-[rgb(var(--bg))]` (near black)
- Replace gradient with line grid + subtle indigo radial glow at top
- Tagline: `text-3xl → text-2xl font-medium`
- Add small `"Beta"` badge below logo

### Login / Register pages

- Remove `<Card>` wrapper — borderless form on plain background
- Input border: `border-subtle → border-[rgb(var(--border-strong))]` (more visible)
- Title: `text-xl → text-lg font-medium tracking-tight`
- Submit button: flat `bg-accent` with `hover:brightness-110` (no gradient)

---

## 7. Motion

### Framer Motion Spring Standards

| Context | Current | New |
|---|---|---|
| Panel slide-in | damping:32 stiffness:380 | damping:36 stiffness:420 |
| Card mount | opacity+y:6 | opacity+y:4, duration:0.12 |
| Card exit | scale:0.98, default | scale:0.97, duration:0.08 |
| Dialog open | — | scale:0.97→1 + opacity, duration:0.15 |

### Sidebar ChevronDown rotation
```tsx
<motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
  <ChevronDown size={14} />
</motion.div>
```

### Issue card priority bar on hover
- Priority left bar: `opacity: 0.7 → 1.0` on card hover (CSS group-hover)

### Toast (Sonner)
- `position="bottom-right"`
- Custom style: `background: rgb(var(--bg-card))`, `border: 1px solid rgb(var(--border-strong))`

---

## Files to Change

| File | Change Type |
|---|---|
| `src/app/globals.css` | Token values, board grid, global easing |
| `src/components/layout/Sidebar.tsx` | Size, spacing, active state |
| `src/components/layout/AppHeader.tsx` | Size, blur, button sizes |
| `src/components/board/BoardColumn.tsx` | Width, header, drop zone |
| `src/components/issues/IssueCard.tsx` | Padding, font, hover, motion |
| `src/components/issues/IssueDetailPanel.tsx` | Header, backdrop, spring |
| `src/components/issues/IssuePropertyRow.tsx` | Grid layout, spacing |
| `src/app/(auth)/layout.tsx` | Left panel background, grid, tagline |
| `src/app/(auth)/login/page.tsx` | Remove Card, input border, title |
| `src/app/(auth)/register/page.tsx` | Same as login |
| `src/components/board/CreateIssueDialog.tsx` | Mount animation |
| `src/components/layout/Providers.tsx` | Toast config |
| `src/components/board/AddColumnButton.tsx` | Width `w-[272px]` to match column |

---

## Non-Goals

- No new features or new pages
- No changes to Supabase schema or stores
- No changes to routing or data fetching
- No dependency additions (all changes are CSS + existing Framer Motion)
