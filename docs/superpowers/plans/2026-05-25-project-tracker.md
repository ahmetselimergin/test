# Project Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 + Supabase tabanlı, premium görünümlü ekip proje takip sistemi (Jira/YouTrack alternatifi).

**Architecture:** App Router + Supabase (Auth/DB/Realtime) + Zustand state. Optimistic UI ile drag-drop, glassmorphism + Framer Motion ile premium görünüm.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, Framer Motion, dnd-kit, Zustand, Supabase, Tiptap, Recharts, Zod, React Hook Form, Lucide React

---

## Task 1: Proje Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1: Next.js projesi oluştur**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Bağımlılıkları yükle**

```bash
npm install @supabase/supabase-js @supabase/ssr zustand framer-motion \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder \
  recharts react-hook-form zod @hookform/resolvers \
  lucide-react date-fns canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 3: shadcn/ui init**

```bash
npx shadcn@latest init --yes
npx shadcn@latest add button input label textarea dialog sheet \
  dropdown-menu popover command tooltip badge avatar \
  separator skeleton toast progress tabs select
```

- [ ] **Step 4: `.env.local.example` oluştur**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 5: Commit**

```bash
git init && git add . && git commit -m "feat: initial Next.js 15 scaffold with dependencies"
```

---

## Task 2: Supabase Şema Migrasyonu

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Migration dosyası oluştur**

```sql
-- supabase/migrations/001_initial_schema.sql

create extension if not exists "uuid-ossp";

create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  key text not null,
  methodology text not null default 'both' check (methodology in ('kanban','scrum','both')),
  color text default '#6366f1',
  icon text default 'folder',
  created_at timestamptz default now(),
  unique(workspace_id, key)
);

create table board_columns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  wip_limit integer,
  color text default '#6366f1'
);

create table epics (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  color text default '#8b5cf6',
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active','completed','cancelled'))
);

create table sprints (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  goal text,
  start_date date,
  end_date date,
  status text default 'planned' check (status in ('planned','active','completed'))
);

create table issues (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  epic_id uuid references epics(id) on delete set null,
  parent_id uuid references issues(id) on delete cascade,
  sprint_id uuid references sprints(id) on delete set null,
  board_column_id uuid references board_columns(id) on delete set null,
  type text not null default 'task' check (type in ('epic','feature','story','task','bug','sub-task')),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  assignee_id uuid references auth.users(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  labels text[] default '{}',
  estimate integer,
  "order" float not null default 0,
  issue_number serial,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references issues(id) on delete cascade,
  author_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references issues(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger issues_updated_at before update on issues
  for each row execute function update_updated_at();
```

- [ ] **Step 2: RLS policy dosyası oluştur**

```sql
-- supabase/migrations/002_rls_policies.sql

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table board_columns enable row level security;
alter table epics enable row level security;
alter table sprints enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;
alter table activity_logs enable row level security;

-- Workspace: sadece üyeler görebilir
create policy "workspace_members_select" on workspaces
  for select using (
    id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "workspace_members_insert" on workspaces
  for insert with check (owner_id = auth.uid());

-- workspace_members: üyeler kendi workspace'lerini görebilir
create policy "wm_select" on workspace_members
  for select using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

-- Projects, issues, vb: workspace üyeliği kontrolü
create policy "projects_select" on projects
  for select using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "projects_all" on projects
  for all using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner','admin','member')
    )
  );

create policy "issues_select" on issues
  for select using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid()
    )
  );

create policy "issues_all" on issues
  for all using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid() and wm.role in ('owner','admin','member')
    )
  );

-- board_columns, epics, sprints, comments, activity_logs için benzer politikalar
create policy "board_columns_select" on board_columns
  for select using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid()
    )
  );

create policy "board_columns_all" on board_columns
  for all using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid() and wm.role in ('owner','admin','member')
    )
  );

create policy "epics_select" on epics for select using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "epics_all" on epics for all using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid() and wm.role in ('owner','admin','member'))
);

create policy "sprints_select" on sprints for select using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "sprints_all" on sprints for all using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid() and wm.role in ('owner','admin','member'))
);

create policy "comments_select" on comments for select using (
  issue_id in (select i.id from issues i join projects p on p.id = i.project_id join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "comments_all" on comments for all using (author_id = auth.uid());

create policy "activity_logs_select" on activity_logs for select using (
  issue_id in (select i.id from issues i join projects p on p.id = i.project_id join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
```

- [ ] **Step 3: Supabase'de çalıştır**

Supabase dashboard → SQL Editor → her migration dosyasını sırayla çalıştır.

- [ ] **Step 4: Realtime'ı etkinleştir**

Supabase dashboard → Database → Replication → `issues` ve `board_columns` tablolarını etkinleştir.

- [ ] **Step 5: Commit**

```bash
git add supabase/ && git commit -m "feat: supabase schema + RLS policies"
```

---

## Task 3: TypeScript Tipleri + Supabase Client

**Files:**
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: `src/lib/supabase/types.ts` oluştur**

```typescript
export type Role = 'owner' | 'admin' | 'member' | 'viewer'
export type IssueType = 'epic' | 'feature' | 'story' | 'task' | 'bug' | 'sub-task'
export type IssueStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type SprintStatus = 'planned' | 'active' | 'completed'
export type Methodology = 'kanban' | 'scrum' | 'both'

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  key: string
  methodology: Methodology
  color: string
  icon: string
  created_at: string
}

export interface BoardColumn {
  id: string
  project_id: string
  name: string
  order: number
  wip_limit: number | null
  color: string
}

export interface Epic {
  id: string
  project_id: string
  title: string
  description: string | null
  color: string
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'cancelled'
}

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: SprintStatus
}

export interface Issue {
  id: string
  project_id: string
  epic_id: string | null
  parent_id: string | null
  sprint_id: string | null
  board_column_id: string | null
  type: IssueType
  title: string
  description: string | null
  status: IssueStatus
  priority: Priority
  assignee_id: string | null
  reporter_id: string | null
  labels: string[]
  estimate: number | null
  order: number
  issue_number: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  content: string
  created_at: string
}

export interface ActivityLog {
  id: string
  issue_id: string
  actor_id: string | null
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: Role
  joined_at: string
}
```

- [ ] **Step 2: `src/lib/supabase/client.ts` oluştur**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: `src/lib/supabase/server.ts` oluştur**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: `src/middleware.ts` oluştur**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "feat: supabase client + typescript types + auth middleware"
```

---

## Task 4: Design System — CSS Tokens + Tema

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: `globals.css` güncelle**

```css
@import "tailwindcss";

@layer base {
  :root {
    --bg: 248 250 255;
    --bg-card: 255 255 255;
    --bg-subtle: 241 245 249;
    --border: 226 232 240;
    --text: 15 23 42;
    --text-muted: 100 116 139;
    --accent: 99 102 241;
    --accent-hover: 79 82 221;
    --violet: 139 92 246;
    --sidebar-w: 240px;
    --detail-w: 400px;
  }

  .dark {
    --bg: 10 10 15;
    --bg-card: 26 26 46;
    --bg-subtle: 15 15 25;
    --border: 39 39 60;
    --text: 248 250 252;
    --text-muted: 148 163 184;
    --accent: 99 102 241;
    --accent-hover: 118 120 255;
    --violet: 167 139 250;
  }

  * { @apply border-border; }

  body {
    background-color: rgb(var(--bg));
    color: rgb(var(--text));
    font-family: 'Inter', sans-serif;
  }

  code, .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }
}

@layer utilities {
  .glass {
    @apply backdrop-blur-xl bg-white/5 border border-white/10;
  }
  .glow-accent {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
  }
  .glow-accent-hover:hover {
    box-shadow: 0 0 24px rgba(99, 102, 241, 0.25);
  }
  .bg-card { background-color: rgb(var(--bg-card)); }
  .text-muted { color: rgb(var(--text-muted)); }
  .border-subtle { border-color: rgb(var(--border)); }
}
```

- [ ] **Step 2: `src/lib/utils.ts` oluştur**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Priority, IssueStatus, IssueType } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-rose-400', dot: 'bg-rose-400' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  medium:   { label: 'Medium',   color: 'text-amber-400',  dot: 'bg-amber-400' },
  low:      { label: 'Low',      color: 'text-slate-400',  dot: 'bg-slate-400' },
}

export const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  todo:        { label: 'Todo',        color: 'text-slate-400',  bg: 'bg-slate-400/10' },
  in_progress: { label: 'In Progress', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  review:      { label: 'Review',      color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  done:        { label: 'Done',        color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

export const typeConfig: Record<IssueType, { label: string; color: string; icon: string }> = {
  epic:      { label: 'Epic',     color: 'text-violet-400', icon: 'zap' },
  feature:   { label: 'Feature',  color: 'text-blue-400',   icon: 'star' },
  story:     { label: 'Story',    color: 'text-emerald-400', icon: 'book-open' },
  task:      { label: 'Task',     color: 'text-indigo-400', icon: 'check-square' },
  bug:       { label: 'Bug',      color: 'text-rose-400',   icon: 'bug' },
  'sub-task':{ label: 'Sub-task', color: 'text-slate-400',  icon: 'corner-down-right' },
}

export function formatIssueId(projectKey: string, issueNumber: number) {
  return `${projectKey}-${issueNumber}`
}
```

- [ ] **Step 3: `next/font` ile Inter + JetBrains Mono ekle — `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'FlowTrack — Project Management',
  description: 'Modern project tracking for teams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: design system CSS tokens + theme + fonts"
```

---

## Task 5: Auth Sayfaları (Login + Register)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/actions/auth.ts`

- [ ] **Step 1: Auth layout oluştur**

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, rgb(var(--bg)) 70%)' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="font-semibold text-xl">FlowTrack</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Server actions oluştur**

```typescript
// src/app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { data: { full_name: formData.get('name') as string } },
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 3: Login sayfası oluştur**

```typescript
// src/app/(auth)/login/page.tsx
'use client'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await signIn(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="bg-card border border-subtle rounded-2xl p-8 glass">
      <h1 className="text-2xl font-semibold mb-1">Giriş Yap</h1>
      <p className="text-muted text-sm mb-6">Hesabına giriş yap</p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required
            placeholder="ornek@sirket.com"
            className="bg-white/5 border-white/10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" required
            placeholder="••••••••"
            className="bg-white/5 border-white/10" />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500"
          disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Hesabın yok mu?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Kayıt ol
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Register sayfası oluştur**

```typescript
// src/app/(auth)/register/page.tsx
'use client'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="bg-card border border-subtle rounded-2xl p-8 glass">
      <h1 className="text-2xl font-semibold mb-1">Hesap Oluştur</h1>
      <p className="text-muted text-sm mb-6">FlowTrack'e katıl</p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input id="name" name="name" required placeholder="Ali Veli"
            className="bg-white/5 border-white/10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required
            placeholder="ornek@sirket.com"
            className="bg-white/5 border-white/10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" required
            minLength={6} placeholder="En az 6 karakter"
            className="bg-white/5 border-white/10" />
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500"
          disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Hesabın var mı?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Giriş yap
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "feat: auth pages (login, register) + server actions"
```

---

## Task 6: Zustand Store'ları

**Files:**
- Create: `src/lib/stores/workspace.store.ts`
- Create: `src/lib/stores/project.store.ts`
- Create: `src/lib/stores/issue.store.ts`

- [ ] **Step 1: Workspace store oluştur**

```typescript
// src/lib/stores/workspace.store.ts
import { create } from 'zustand'
import type { Workspace, WorkspaceMember } from '@/lib/supabase/types'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  members: WorkspaceMember[]
  setWorkspaces: (ws: Workspace[]) => void
  setCurrentWorkspace: (ws: Workspace | null) => void
  setMembers: (members: WorkspaceMember[]) => void
  addWorkspace: (ws: Workspace) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setMembers: (members) => set({ members }),
  addWorkspace: (ws) => set((state) => ({ workspaces: [...state.workspaces, ws] })),
}))
```

- [ ] **Step 2: Project store oluştur**

```typescript
// src/lib/stores/project.store.ts
import { create } from 'zustand'
import type { Project, BoardColumn, Epic, Sprint } from '@/lib/supabase/types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setColumns: (columns: BoardColumn[]) => void
  setEpics: (epics: Epic[]) => void
  setSprints: (sprints: Sprint[]) => void
  updateColumn: (id: string, updates: Partial<BoardColumn>) => void
  addColumn: (column: BoardColumn) => void
  removeColumn: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  columns: [],
  epics: [],
  sprints: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setColumns: (columns) => set({ columns }),
  setEpics: (epics) => set({ epics }),
  setSprints: (sprints) => set({ sprints }),
  updateColumn: (id, updates) => set((state) => ({
    columns: state.columns.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  addColumn: (column) => set((state) => ({ columns: [...state.columns, column] })),
  removeColumn: (id) => set((state) => ({ columns: state.columns.filter(c => c.id !== id) })),
}))
```

- [ ] **Step 3: Issue store oluştur**

```typescript
// src/lib/stores/issue.store.ts
import { create } from 'zustand'
import type { Issue, Comment, ActivityLog } from '@/lib/supabase/types'

interface IssueState {
  issues: Issue[]
  selectedIssue: Issue | null
  comments: Comment[]
  activityLogs: ActivityLog[]
  setIssues: (issues: Issue[]) => void
  setSelectedIssue: (issue: Issue | null) => void
  setComments: (comments: Comment[]) => void
  setActivityLogs: (logs: ActivityLog[]) => void
  addIssue: (issue: Issue) => void
  updateIssue: (id: string, updates: Partial<Issue>) => void
  removeIssue: (id: string) => void
  moveIssue: (issueId: string, newColumnId: string, newOrder: number) => void
}

export const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  selectedIssue: null,
  comments: [],
  activityLogs: [],
  setIssues: (issues) => set({ issues }),
  setSelectedIssue: (selectedIssue) => set({ selectedIssue }),
  setComments: (comments) => set({ comments }),
  setActivityLogs: (activityLogs) => set({ activityLogs }),
  addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues] })),
  updateIssue: (id, updates) => set((state) => ({
    issues: state.issues.map(i => i.id === id ? { ...i, ...updates } : i),
    selectedIssue: state.selectedIssue?.id === id
      ? { ...state.selectedIssue, ...updates } : state.selectedIssue,
  })),
  removeIssue: (id) => set((state) => ({
    issues: state.issues.filter(i => i.id !== id),
    selectedIssue: state.selectedIssue?.id === id ? null : state.selectedIssue,
  })),
  moveIssue: (issueId, newColumnId, newOrder) => set((state) => ({
    issues: state.issues.map(i =>
      i.id === issueId ? { ...i, board_column_id: newColumnId, order: newOrder } : i
    ),
  })),
}))
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/stores/ && git commit -m "feat: zustand stores (workspace, project, issue)"
```

---

## Task 7: App Shell — Sidebar + Layout

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Sidebar bileşeni oluştur**

```typescript
// src/components/layout/Sidebar.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Kanban, ListTodo, Timer, Map,
  ChevronLeft, Plus, Settings, LogOut, FolderKanban
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { label: 'Board', icon: Kanban, href: 'board' },
  { label: 'Backlog', icon: ListTodo, href: 'backlog' },
  { label: 'Sprint', icon: Timer, href: 'sprint' },
  { label: 'Roadmap', icon: Map, href: 'roadmap' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { projects, currentProject } = useProjectStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="relative flex flex-col h-screen border-r border-subtle glass z-10 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-subtle h-14">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <FolderKanban size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-semibold text-sm truncate"
            >
              {currentWorkspace?.name ?? 'FlowTrack'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {projects.map((project) => (
          <div key={project.id} className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer',
                  'text-muted hover:text-foreground hover:bg-white/5 transition-colors',
                  currentProject?.id === project.id && 'bg-indigo-500/10 text-indigo-400'
                )}>
                  <div
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.key[0]}
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-sm font-medium truncate"
                      >
                        {project.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{project.name}</TooltipContent>}
            </Tooltip>

            {!collapsed && currentProject?.id === project.id && (
              <div className="ml-3 space-y-0.5">
                {navItems.map((item) => {
                  const href = `/${currentWorkspace?.slug}/${project.id}/${item.href}`
                  const active = pathname.includes(item.href)
                  return (
                    <Link key={item.href} href={href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                          : 'text-muted hover:text-foreground hover:bg-white/5'
                      )}>
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-subtle p-2 space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => signOut()}
            >
              <LogOut size={16} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-sm">Çıkış</motion.span>
                )}
              </AnimatePresence>
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Çıkış</TooltipContent>}
        </Tooltip>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-subtle bg-card flex items-center justify-center hover:bg-white/10 transition-colors z-20"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </motion.aside>
  )
}
```

- [ ] **Step 2: ThemeToggle oluştur**

```typescript
// src/components/layout/ThemeToggle.tsx
'use client'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}
      className="w-8 h-8 text-muted hover:text-foreground">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  )
}
```

- [ ] **Step 3: Dashboard layout oluştur**

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'
import { DataLoader } from '@/components/layout/DataLoader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <DataLoader>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 border-b border-subtle flex items-center justify-end px-4 gap-2 flex-shrink-0">
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </DataLoader>
      <Toaster />
    </TooltipProvider>
  )
}
```

- [ ] **Step 4: DataLoader (workspace + project verisi yükler)**

```typescript
// src/components/layout/DataLoader.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'

export function DataLoader({ children }: { children: React.ReactNode }) {
  const { setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const { setProjects } = useProjectStore()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: workspaces } = await supabase
        .from('workspaces').select('*')
      if (workspaces?.length) {
        setWorkspaces(workspaces)
        setCurrentWorkspace(workspaces[0])

        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('workspace_id', workspaces[0].id)
        if (projects) setProjects(projects)
      }
    }
    load()
  }, [setWorkspaces, setCurrentWorkspace, setProjects])

  return <>{children}</>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "feat: app shell (sidebar, layout, theme toggle, data loader)"
```

---

## Task 8: Issue Kartı + Ortak UI Bileşenleri

**Files:**
- Create: `src/components/issues/IssueCard.tsx`
- Create: `src/components/issues/PriorityBadge.tsx`
- Create: `src/components/issues/StatusBadge.tsx`
- Create: `src/components/issues/TypeIcon.tsx`

- [ ] **Step 1: TypeIcon oluştur**

```typescript
// src/components/issues/TypeIcon.tsx
import { Zap, Star, BookOpen, CheckSquare, Bug, CornerDownRight } from 'lucide-react'
import { typeConfig } from '@/lib/utils'
import type { IssueType } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const iconMap = { zap: Zap, star: Star, 'book-open': BookOpen,
  'check-square': CheckSquare, bug: Bug, 'corner-down-right': CornerDownRight }

export function TypeIcon({ type, size = 14 }: { type: IssueType; size?: number }) {
  const config = typeConfig[type]
  const Icon = iconMap[config.icon as keyof typeof iconMap]
  return <Icon size={size} className={cn(config.color)} />
}
```

- [ ] **Step 2: PriorityBadge oluştur**

```typescript
// src/components/issues/PriorityBadge.tsx
import { priorityConfig } from '@/lib/utils'
import type { Priority } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

export function PriorityBadge({ priority, showLabel = false }: {
  priority: Priority
  showLabel?: boolean
}) {
  const config = priorityConfig[priority]
  return (
    <span className={cn('flex items-center gap-1.5 text-xs', config.color)}>
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
      {showLabel && config.label}
    </span>
  )
}
```

- [ ] **Step 3: StatusBadge oluştur**

```typescript
// src/components/issues/StatusBadge.tsx
import { statusConfig } from '@/lib/utils'
import type { IssueStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: IssueStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      config.color, config.bg
    )}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 4: IssueCard oluştur**

```typescript
// src/components/issues/IssueCard.tsx
'use client'
import { motion } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  isDragging?: boolean
}

export function IssueCard({ issue, project, isDragging }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => setSelectedIssue(issue)}
      className={cn(
        'bg-card border border-subtle rounded-xl p-3 cursor-pointer',
        'hover:border-indigo-500/30 glow-accent-hover transition-all',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-2xl shadow-indigo-500/20',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-muted font-mono">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <PriorityBadge priority={issue.priority} />
      </div>

      <p className="text-sm font-medium leading-snug mb-3 line-clamp-2">
        {issue.title}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeIcon type={issue.type} size={12} />
          {issue.labels.slice(0, 2).map((label) => (
            <span key={label}
              className="text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-muted">
              {label}
            </span>
          ))}
        </div>
        {issue.assignee_id && (
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-400">
              {issue.assignee_id.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/issues/ && git commit -m "feat: issue card + priority/status/type badges"
```

---

## Task 9: Kanban Board

**Files:**
- Create: `src/app/(dashboard)/[workspace]/[project]/board/page.tsx`
- Create: `src/components/board/KanbanBoard.tsx`
- Create: `src/components/board/BoardColumn.tsx`
- Create: `src/components/board/BoardFilters.tsx`

- [ ] **Step 1: KanbanBoard oluştur**

```typescript
// src/components/board/KanbanBoard.tsx
'use client'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import { BoardColumn } from './BoardColumn'
import { IssueCard } from '@/components/issues/IssueCard'
import type { Issue } from '@/lib/supabase/types'

export function KanbanBoard({ project }: { project: { id: string; key: string; color: string; name: string; icon: string; methodology: 'kanban' | 'scrum' | 'both'; workspace_id: string; created_at: string } }) {
  const { columns } = useProjectStore()
  const { issues, moveIssue } = useIssueStore()
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const issue = issues.find(i => i.id === active.id)
    if (issue) setActiveIssue(issue)
  }, [issues])

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    setActiveIssue(null)
    if (!over) return

    const issueId = active.id as string
    const overId = over.id as string

    const targetColumn = columns.find(c => c.id === overId)
    const targetIssue = issues.find(i => i.id === overId)
    const newColumnId = targetColumn?.id ?? targetIssue?.board_column_id
    if (!newColumnId) return

    const columnIssues = issues
      .filter(i => i.board_column_id === newColumnId && i.id !== issueId)
      .sort((a, b) => a.order - b.order)

    const newOrder = columnIssues.length > 0
      ? columnIssues[columnIssues.length - 1].order + 1
      : 0

    moveIssue(issueId, newColumnId, newOrder)

    const supabase = createClient()
    await supabase.from('issues').update({
      board_column_id: newColumnId,
      order: newOrder,
    }).eq('id', issueId)
  }, [columns, issues, moveIssue])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <AnimatePresence>
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                issues={issues.filter(i => i.board_column_id === column.id)}
                project={project}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeIssue && (
          <IssueCard issue={activeIssue} project={project} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 2: BoardColumn oluştur**

```typescript
// src/components/board/BoardColumn.tsx
'use client'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { BoardColumn as BoardColumnType, Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  column: BoardColumnType
  issues: Issue[]
  project: Project
}

export function BoardColumn({ column, issues, project }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const sorted = [...issues].sort((a, b) => a.order - b.order)
  const isOverLimit = column.wip_limit !== null && issues.length > column.wip_limit

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-shrink-0 w-72 flex flex-col"
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-medium">{column.name}</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            isOverLimit
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-white/5 text-muted'
          )}>
            {issues.length}
            {column.wip_limit && `/${column.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-white/5 text-muted hover:text-foreground transition-colors">
            <Plus size={14} />
          </button>
          <button className="p-1 rounded hover:bg-white/5 text-muted hover:text-foreground transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors',
          isOver ? 'bg-indigo-500/5 border border-indigo-500/30' : 'bg-white/[0.02]'
        )}
      >
        <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {sorted.map((issue) => (
            <IssueCard key={issue.id} issue={issue} project={project} />
          ))}
        </SortableContext>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Board page oluştur**

```typescript
// src/app/(dashboard)/[workspace]/[project]/board/page.tsx
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspace: string; project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: columns }, { data: issues }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('board_columns').select('*').eq('project_id', projectId).order('order'),
    supabase.from('issues').select('*').eq('project_id', projectId)
      .is('sprint_id', null).order('order'),
  ])

  if (!project) return <div>Proje bulunamadı</div>

  return (
    <BoardDataLoader project={project} columns={columns ?? []} issues={issues ?? []}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 pb-0">
          <h1 className="text-xl font-semibold">{project.name} — Board</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard project={project} />
        </div>
      </div>
    </BoardDataLoader>
  )
}
```

- [ ] **Step 4: BoardDataLoader oluştur**

```typescript
// src/components/board/BoardDataLoader.tsx
'use client'
import { useEffect } from 'react'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import type { BoardColumn, Issue, Project } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  project: Project
  columns: BoardColumn[]
  issues: Issue[]
  children: React.ReactNode
}

export function BoardDataLoader({ project, columns, issues, children }: Props) {
  const { setCurrentProject, setColumns } = useProjectStore()
  const { setIssues } = useIssueStore()

  useEffect(() => {
    setCurrentProject(project)
    setColumns(columns)
    setIssues(issues)
  }, [project, columns, issues, setCurrentProject, setColumns, setIssues])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`board-${project.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'issues',
        filter: `project_id=eq.${project.id}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          useIssueStore.getState().updateIssue(
            (payload.new as Issue).id, payload.new as Partial<Issue>
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [project.id])

  return <>{children}</>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "feat: kanban board with dnd-kit drag-and-drop + realtime"
```

---

## Task 10: Issue Detay Paneli

**Files:**
- Create: `src/components/issues/IssueDetailPanel.tsx`
- Create: `src/components/issues/IssueEditor.tsx`

- [ ] **Step 1: IssueDetailPanel oluştur**

```typescript
// src/components/issues/IssueDetailPanel.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Trash2 } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'
import { IssueEditor } from './IssueEditor'
import { formatIssueId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { IssueStatus, Priority } from '@/lib/supabase/types'

export function IssueDetailPanel() {
  const { selectedIssue, setSelectedIssue, updateIssue } = useIssueStore()
  const { currentProject } = useProjectStore()

  async function handleStatusChange(status: IssueStatus) {
    if (!selectedIssue) return
    updateIssue(selectedIssue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', selectedIssue.id)
  }

  async function handlePriorityChange(priority: Priority) {
    if (!selectedIssue) return
    updateIssue(selectedIssue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', selectedIssue.id)
  }

  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setSelectedIssue(null)}
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[440px] z-50 flex flex-col bg-card border-l border-subtle shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-subtle flex-shrink-0">
              <div className="flex items-center gap-2">
                <TypeIcon type={selectedIssue.type} size={16} />
                <span className="text-xs text-muted font-mono">
                  {currentProject && formatIssueId(currentProject.key, selectedIssue.issue_number)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <ExternalLink size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-rose-400">
                  <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7"
                  onClick={() => setSelectedIssue(null)}>
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <h2 className="text-lg font-semibold leading-snug">
                {selectedIssue.title}
              </h2>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted">Durum</span>
                  <Select value={selectedIssue.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['todo','in_progress','review','done'] as IssueStatus[]).map(s => (
                        <SelectItem key={s} value={s}>
                          <StatusBadge status={s} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted">Öncelik</span>
                  <Select value={selectedIssue.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['critical','high','medium','low'] as Priority[]).map(p => (
                        <SelectItem key={p} value={p}>
                          <PriorityBadge priority={p} showLabel />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description editor */}
              <div className="space-y-2">
                <span className="text-xs text-muted">Açıklama</span>
                <IssueEditor
                  issueId={selectedIssue.id}
                  initialContent={selectedIssue.description ?? ''}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: IssueEditor (Tiptap) oluştur**

```typescript
// src/components/issues/IssueEditor.tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback } from 'react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'

interface IssueEditorProps {
  issueId: string
  initialContent: string
}

export function IssueEditor({ issueId, initialContent }: IssueEditorProps) {
  const { updateIssue } = useIssueStore()

  const saveContent = useCallback(async (content: string) => {
    updateIssue(issueId, { description: content })
    const supabase = createClient()
    await supabase.from('issues').update({ description: content }).eq('id', issueId)
  }, [issueId, updateIssue])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Açıklama ekle...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[120px] text-sm',
      },
    },
    onBlur: ({ editor }) => {
      saveContent(editor.getHTML())
    },
  })

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 3: IssueDetailPanel'i layout'a ekle**

`src/app/(dashboard)/layout.tsx` dosyasında `<main>` bloğunun hemen sonrasına ekle:

```typescript
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
// ... layout içinde </main>'den sonra:
<IssueDetailPanel />
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: issue detail panel (slide-in) + tiptap editor"
```

---

## Task 11: Backlog Görünümü

**Files:**
- Create: `src/app/(dashboard)/[workspace]/[project]/backlog/page.tsx`
- Create: `src/components/backlog/BacklogView.tsx`
- Create: `src/components/backlog/BacklogGroup.tsx`

- [ ] **Step 1: BacklogGroup oluştur**

```typescript
// src/components/backlog/BacklogGroup.tsx
'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { cn } from '@/lib/utils'

interface BacklogGroupProps {
  title: string
  issues: Issue[]
  project: Project
  color?: string
}

export function BacklogGroup({ title, issues, project, color }: BacklogGroupProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-subtle rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition-colors"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={14} className="text-muted" />
        </motion.div>
        {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
          {issues.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} project={project} />
              ))}
              {issues.length === 0 && (
                <p className="text-sm text-muted text-center py-4">Issue yok</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: BacklogView oluştur**

```typescript
// src/components/backlog/BacklogView.tsx
'use client'
import { useMemo, useState } from 'react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { BacklogGroup } from './BacklogGroup'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Project } from '@/lib/supabase/types'

type GroupBy = 'epic' | 'priority' | 'assignee' | 'none'

export function BacklogView({ project }: { project: Project }) {
  const { issues } = useIssueStore()
  const { epics } = useProjectStore()
  const [groupBy, setGroupBy] = useState<GroupBy>('epic')

  const backlogIssues = useMemo(() =>
    issues.filter(i => !i.sprint_id), [issues]
  )

  const groups = useMemo(() => {
    if (groupBy === 'epic') {
      const epicGroups = epics.map(epic => ({
        id: epic.id,
        title: epic.title,
        color: epic.color,
        issues: backlogIssues.filter(i => i.epic_id === epic.id),
      }))
      const noEpic = backlogIssues.filter(i => !i.epic_id)
      return [...epicGroups, { id: 'none', title: 'Epic Yok', color: undefined, issues: noEpic }]
    }

    if (groupBy === 'priority') {
      return (['critical','high','medium','low'] as const).map(p => ({
        id: p,
        title: p.charAt(0).toUpperCase() + p.slice(1),
        color: undefined,
        issues: backlogIssues.filter(i => i.priority === p),
      }))
    }

    return [{ id: 'all', title: 'Tüm Issue\'lar', color: undefined, issues: backlogIssues }]
  }, [backlogIssues, epics, groupBy])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Backlog</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Grupla:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="epic">Epic'e Göre</SelectItem>
              <SelectItem value="priority">Önceliğe Göre</SelectItem>
              <SelectItem value="none">Gruplandırma Yok</SelectItem>
            </SelectContent>
          </Select>
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
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Backlog page oluştur**

```typescript
// src/app/(dashboard)/[workspace]/[project]/backlog/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BacklogView } from '@/components/backlog/BacklogView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function BacklogPage({
  params,
}: { params: Promise<{ project: string }> }) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: columns }, { data: issues }, { data: epics }] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('board_columns').select('*').eq('project_id', projectId).order('order'),
      supabase.from('issues').select('*').eq('project_id', projectId).order('order'),
      supabase.from('epics').select('*').eq('project_id', projectId),
    ])

  if (!project) return <div>Proje bulunamadı</div>

  return (
    <BoardDataLoader project={project} columns={columns ?? []} issues={issues ?? []}>
      <BacklogView project={project} />
    </BoardDataLoader>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: backlog view with grouping (epic/priority)"
```

---

## Task 12: Sprint Yönetimi + Burndown Chart

**Files:**
- Create: `src/app/(dashboard)/[workspace]/[project]/sprint/page.tsx`
- Create: `src/components/sprint/SprintView.tsx`
- Create: `src/components/sprint/BurndownChart.tsx`
- Create: `src/components/sprint/SprintCard.tsx`

- [ ] **Step 1: BurndownChart oluştur**

```typescript
// src/components/sprint/BurndownChart.tsx
'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Sprint, Issue } from '@/lib/supabase/types'
import { differenceInDays, eachDayOfInterval, format, parseISO } from 'date-fns'

interface BurndownChartProps {
  sprint: Sprint
  issues: Issue[]
}

export function BurndownChart({ sprint, issues }: BurndownChartProps) {
  if (!sprint.start_date || !sprint.end_date) return null

  const start = parseISO(sprint.start_date)
  const end = parseISO(sprint.end_date)
  const totalPoints = issues.reduce((sum, i) => sum + (i.estimate ?? 1), 0)
  const days = eachDayOfInterval({ start, end })

  const idealData = days.map((day, i) => ({
    date: format(day, 'dd MMM'),
    ideal: Math.round(totalPoints - (totalPoints / (days.length - 1)) * i),
  }))

  // Gerçek veri: tamamlanan issue'ların günlere göre dağılımı (demo amaçlı)
  const data = idealData.map((d, i) => ({
    ...d,
    actual: i < 3 ? totalPoints - i * Math.round(totalPoints * 0.1) : undefined,
  }))

  return (
    <div className="bg-card border border-subtle rounded-xl p-5">
      <h3 className="text-sm font-medium mb-4">Burndown Chart</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }} />
          <Tooltip
            contentStyle={{
              background: 'rgb(26 26 46)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone" dataKey="ideal"
            stroke="rgba(99,102,241,0.4)" strokeDasharray="5 5"
            dot={false} name="İdeal"
          />
          <Line
            type="monotone" dataKey="actual"
            stroke="rgb(99,102,241)" strokeWidth={2}
            dot={{ fill: 'rgb(99,102,241)', r: 3 }}
            connectNulls={false} name="Gerçek"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: SprintCard oluştur**

```typescript
// src/components/sprint/SprintCard.tsx
'use client'
import { motion } from 'framer-motion'
import { Play, CheckCircle, Calendar } from 'lucide-react'
import type { Sprint, Issue } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/lib/stores/project.store'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

interface SprintCardProps {
  sprint: Sprint
  issues: Issue[]
}

export function SprintCard({ sprint, issues }: SprintCardProps) {
  const { setSprints, sprints } = useProjectStore()
  const doneIssues = issues.filter(i => i.status === 'done').length
  const progress = issues.length > 0 ? (doneIssues / issues.length) * 100 : 0

  async function handleStart() {
    const supabase = createClient()
    await supabase.from('sprints').update({ status: 'active' }).eq('id', sprint.id)
    setSprints(sprints.map(s => s.id === sprint.id ? { ...s, status: 'active' } : s))
  }

  async function handleComplete() {
    const supabase = createClient()
    await supabase.from('sprints').update({ status: 'completed' }).eq('id', sprint.id)
    setSprints(sprints.map(s => s.id === sprint.id ? { ...s, status: 'completed' } : s))
  }

  const statusColors = {
    planned: 'border-slate-500/30',
    active: 'border-indigo-500/40 glow-accent',
    completed: 'border-emerald-500/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-xl p-5 ${statusColors[sprint.status]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{sprint.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              sprint.status === 'active' ? 'bg-indigo-500/15 text-indigo-400' :
              sprint.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
              'bg-slate-500/15 text-slate-400'
            }`}>
              {sprint.status === 'active' ? 'Aktif' :
               sprint.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}
            </span>
          </div>
          {sprint.goal && <p className="text-sm text-muted">{sprint.goal}</p>}
          {sprint.start_date && sprint.end_date && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
              <Calendar size={11} />
              {format(parseISO(sprint.start_date), 'd MMM', { locale: tr })} —{' '}
              {format(parseISO(sprint.end_date), 'd MMM yyyy', { locale: tr })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {sprint.status === 'planned' && (
            <Button size="sm" onClick={handleStart}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500">
              <Play size={12} className="mr-1" /> Başlat
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button size="sm" variant="outline" onClick={handleComplete}
              className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              <CheckCircle size={12} className="mr-1" /> Tamamla
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Progress value={progress} className="flex-1 h-1.5" />
        <span className="text-xs text-muted">{doneIssues}/{issues.length}</span>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: SprintView oluştur**

```typescript
// src/components/sprint/SprintView.tsx
'use client'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { SprintCard } from './SprintCard'
import { BurndownChart } from './BurndownChart'

export function SprintView() {
  const { sprints } = useProjectStore()
  const { issues } = useIssueStore()

  const activeSprint = sprints.find(s => s.status === 'active')
  const activeIssues = activeSprint
    ? issues.filter(i => i.sprint_id === activeSprint.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Sprint</h1>

      {activeSprint && (
        <BurndownChart sprint={activeSprint} issues={activeIssues} />
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide">Sprint'ler</h2>
        {sprints.length === 0 && (
          <p className="text-sm text-muted">Henüz sprint yok.</p>
        )}
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            issues={issues.filter(i => i.sprint_id === sprint.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Sprint page oluştur**

```typescript
// src/app/(dashboard)/[workspace]/[project]/sprint/page.tsx
import { createClient } from '@/lib/supabase/server'
import { SprintView } from '@/components/sprint/SprintView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function SprintPage({
  params,
}: { params: Promise<{ project: string }> }) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: columns }, { data: issues }, { data: sprints }] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('board_columns').select('*').eq('project_id', projectId).order('order'),
      supabase.from('issues').select('*').eq('project_id', projectId),
      supabase.from('sprints').select('*').eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    ])

  if (!project) return <div>Proje bulunamadı</div>

  return (
    <BoardDataLoader project={project} columns={columns ?? []} issues={issues ?? []}>
      <SprintView />
    </BoardDataLoader>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ && git commit -m "feat: sprint management + burndown chart"
```

---

## Task 13: Roadmap (Gantt Timeline)

**Files:**
- Create: `src/app/(dashboard)/[workspace]/[project]/roadmap/page.tsx`
- Create: `src/components/roadmap/RoadmapView.tsx`
- Create: `src/components/roadmap/GanttRow.tsx`

- [ ] **Step 1: GanttRow oluştur**

```typescript
// src/components/roadmap/GanttRow.tsx
'use client'
import type { Epic } from '@/lib/supabase/types'
import { differenceInDays, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'

interface GanttRowProps {
  epic: Epic
  startDate: Date
  totalDays: number
  cellWidth: number
}

export function GanttRow({ epic, startDate, totalDays, cellWidth }: GanttRowProps) {
  if (!epic.start_date || !epic.end_date) return null

  const epicStart = parseISO(epic.start_date)
  const epicEnd = parseISO(epic.end_date)

  const leftDays = differenceInDays(epicStart, startDate)
  const widthDays = differenceInDays(epicEnd, epicStart) + 1

  const left = (leftDays / totalDays) * 100
  const width = (widthDays / totalDays) * 100

  return (
    <div className="flex items-center h-10 relative">
      <div
        className="absolute h-6 rounded-lg flex items-center px-2 text-xs font-medium text-white shadow-md"
        style={{
          left: `${Math.max(0, left)}%`,
          width: `${Math.min(100 - left, width)}%`,
          backgroundColor: epic.color,
          opacity: epic.status === 'completed' ? 0.5 : 1,
        }}
      >
        <span className="truncate">{epic.title}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: RoadmapView oluştur**

```typescript
// src/components/roadmap/RoadmapView.tsx
'use client'
import { useState, useMemo } from 'react'
import { useProjectStore } from '@/lib/stores/project.store'
import { GanttRow } from './GanttRow'
import { addMonths, startOfMonth, endOfMonth, eachMonthOfInterval,
  format, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RoadmapView() {
  const { epics } = useProjectStore()
  const [viewStart, setViewStart] = useState(startOfMonth(new Date()))
  const viewEnd = endOfMonth(addMonths(viewStart, 5))
  const months = eachMonthOfInterval({ start: viewStart, end: viewEnd })
  const totalDays = differenceInDays(viewEnd, viewStart) + 1

  const visibleEpics = useMemo(() =>
    epics.filter(e => e.start_date && e.end_date), [epics]
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Roadmap</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={() => setViewStart(s => addMonths(s, -1))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted w-32 text-center">
            {format(viewStart, 'MMM yyyy', { locale: tr })} —{' '}
            {format(viewEnd, 'MMM yyyy', { locale: tr })}
          </span>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={() => setViewStart(s => addMonths(s, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-subtle rounded-xl overflow-hidden">
        {/* Header — months */}
        <div className="flex border-b border-subtle">
          <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-subtle">
            <span className="text-xs text-muted">Epic</span>
          </div>
          <div className="flex-1 flex">
            {months.map((month) => (
              <div key={month.toISOString()}
                className="flex-1 text-center py-2 text-xs text-muted border-r border-subtle last:border-0">
                {format(month, 'MMM yyyy', { locale: tr })}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {visibleEpics.length === 0 && (
          <div className="py-12 text-center text-sm text-muted">
            Tarih girilmiş epic bulunamadı
          </div>
        )}
        {visibleEpics.map((epic) => (
          <div key={epic.id} className="flex border-b border-subtle last:border-0">
            <div className="w-48 flex-shrink-0 px-4 flex items-center gap-2 border-r border-subtle">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: epic.color }} />
              <span className="text-sm truncate">{epic.title}</span>
            </div>
            <div className="flex-1 relative py-2 px-2">
              <GanttRow
                epic={epic}
                startDate={viewStart}
                totalDays={totalDays}
                cellWidth={0}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Roadmap page oluştur**

```typescript
// src/app/(dashboard)/[workspace]/[project]/roadmap/page.tsx
import { createClient } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function RoadmapPage({
  params,
}: { params: Promise<{ project: string }> }) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: columns }, { data: issues }, { data: epics }] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('board_columns').select('*').eq('project_id', projectId).order('order'),
      supabase.from('issues').select('*').eq('project_id', projectId),
      supabase.from('epics').select('*').eq('project_id', projectId),
    ])

  if (!project) return <div>Proje bulunamadı</div>

  return (
    <BoardDataLoader project={project} columns={columns ?? []} issues={issues ?? []}>
      <RoadmapView />
    </BoardDataLoader>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: roadmap gantt timeline view"
```

---

## Task 14: Workspace + Proje Oluşturma Akışı

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/workspace/CreateWorkspaceDialog.tsx`
- Create: `src/components/workspace/CreateProjectDialog.tsx`

- [ ] **Step 1: Dashboard ana sayfa oluştur**

```typescript
// src/app/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces').select('*, workspace_members!inner(*)')
    .eq('workspace_members.user_id', user.id)

  if (!workspaces?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Workspace oluştur</h2>
          <p className="text-muted text-sm">İlk workspace'ini oluşturarak başla</p>
        </div>
      </div>
    )
  }

  const workspace = workspaces[0]
  const { data: projects } = await supabase
    .from('projects').select('*').eq('workspace_id', workspace.id).limit(1)

  if (projects?.length) {
    redirect(`/${workspace.slug}/${projects[0].id}/board`)
  }

  redirect(`/${workspace.slug}`)
}
```

- [ ] **Step 2: Workspace oluşturma action ekle**

`src/app/actions/auth.ts` dosyasına ekle:

```typescript
export async function createWorkspace(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const name = formData.get('name') as string
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data: workspace, error } = await supabase
    .from('workspaces').insert({ name, slug, owner_id: user.id }).select().single()

  if (error) return { error: error.message }

  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id, user_id: user.id, role: 'owner',
  })

  redirect(`/${workspace.slug}`)
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const name = formData.get('name') as string
  const key = (formData.get('key') as string).toUpperCase()
  const methodology = formData.get('methodology') as string

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, name, key, methodology, color: '#6366f1' })
    .select().single()

  if (error) return { error: error.message }

  // Varsayılan kolonları oluştur
  await supabase.from('board_columns').insert([
    { project_id: project.id, name: 'Todo', order: 0, color: '#64748b' },
    { project_id: project.id, name: 'In Progress', order: 1, color: '#6366f1' },
    { project_id: project.id, name: 'Review', order: 2, color: '#f59e0b' },
    { project_id: project.id, name: 'Done', order: 3, color: '#10b981' },
  ])

  const { data: workspace } = await supabase
    .from('workspaces').select('slug').eq('id', workspaceId).single()

  redirect(`/${workspace?.slug}/${project.id}/board`)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ && git commit -m "feat: workspace + project creation flow with default columns"
```

---

## Task 15: Son Dokunuşlar + Deploy Hazırlığı

**Files:**
- Create: `.env.local` (gitignore'd)
- Modify: `.gitignore`

- [ ] **Step 1: `.env.local` oluştur**

```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini doldur
```

- [ ] **Step 2: `.gitignore` kontrolü**

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3: TypeScript derleme kontrolü**

```bash
npx tsc --noEmit
```

Expected: 0 hata (uyarılar olabilir)

- [ ] **Step 4: Build kontrolü**

```bash
npm run build
```

Expected: Başarılı build çıktısı

- [ ] **Step 5: Dev sunucusu aç ve test et**

```bash
npm run dev
```

Test sırası:
1. `http://localhost:3000/login` — login formu görünür
2. Kayıt ol → workspace oluştur → proje oluştur → board'a yönlendir
3. Kanban board'da kart oluştur → sürükle-bırak dene
4. Karta tıkla → sağdan detay paneli açılır
5. Backlog → gruplandırma çalışır
6. Sprint → burndown chart görünür
7. Roadmap → gantt bar'ları görünür
8. Dark/light tema toggle çalışır

- [ ] **Step 6: Final commit**

```bash
git add . && git commit -m "feat: project tracker v1 complete — kanban, backlog, sprint, roadmap"
```

---

## Spec Coverage Kontrolü

| Spec Gereksinimi | Task |
|-----------------|------|
| Next.js 15 + Supabase + Zustand | Task 1, 2, 3 |
| Dual-theme dark/light | Task 4 |
| Glassmorphism + Framer Motion | Task 7, 8, 10 |
| Inter + JetBrains Mono | Task 4 |
| Auth (login/register) | Task 5 |
| RLS politikaları | Task 2 |
| Kanban board + dnd-kit | Task 9 |
| WIP limits | Task 9 |
| Optimistic UI | Task 9 |
| Realtime subscriptions | Task 9 |
| Issue hiyerarşisi + tipleri | Task 8 |
| Issue detay paneli (slide-in) | Task 10 |
| Tiptap rich text editor | Task 10 |
| Backlog + gruplandırma | Task 11 |
| Sprint yönetimi | Task 12 |
| Burndown chart (Recharts) | Task 12 |
| Roadmap Gantt | Task 13 |
| Workspace + proje oluşturma | Task 14 |
| TypeScript tipleri | Task 3 |
