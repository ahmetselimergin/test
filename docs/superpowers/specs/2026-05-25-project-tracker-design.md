# Project Tracker — Design Spec
**Date:** 2026-05-25  
**Status:** Approved

## Overview

React-tabanlı ekip proje/iş takip sistemi. Jira ve YouTrack'e alternatif, modern ve görsel olarak premium bir uygulama. Hem Kanban hem Scrum metodolojilerini destekler.

## Architecture

**Stack:** Next.js 15 (App Router) + Supabase + Zustand  
**Deploy:** Vercel (frontend) + Supabase Cloud (backend)

```
src/
├── app/
│   ├── (auth)/             # Login, register sayfaları
│   └── (dashboard)/
│       └── [workspace]/
│           ├── board/      # Kanban board
│           ├── backlog/    # Scrum backlog
│           ├── sprint/     # Sprint yönetimi
│           └── roadmap/    # Gantt/timeline
├── components/
│   ├── ui/                 # Temel UI bileşenleri
│   ├── board/              # Kanban bileşenleri
│   ├── backlog/            # Scrum bileşenleri
│   └── issues/             # Issue kart ve detay paneli
├── lib/
│   ├── supabase/           # Client, server, realtime
│   └── stores/             # Zustand store'ları
```

**Veri akışı:** Supabase Realtime → Zustand store → React components  
**Optimistic UI:** Drag-drop anında hissedilir, arka planda Supabase sync

## Visual Design System

**Tema:** Dual-theme (dark/light), CSS variables, dark varsayılan

**Renk paleti:**
- Dark: `#0a0a0f` arkaplan, `#1a1a2e` card, `#6366f1` indigo accent, `#8b5cf6` violet
- Light: `#f8faff` arkaplan, `#ffffff` card, aynı accent'ler
- Status: Todo (slate) · In Progress (indigo) · Review (amber) · Done (emerald) · Bug (rose)

**Glassmorphism:** Sidebar, modal, overlay'lerde `backdrop-blur-xl + bg-white/5`. Hover'da subtle indigo glow.

**Animasyonlar (Framer Motion):**
- Kart drag: physics-based spring
- Issue detay paneli: sağdan slide-in
- Sprint başlatma: confetti + progress animasyon
- Route geçişleri: fade + scale

**Tipografi:** Inter (UI) + JetBrains Mono (issue ID, kod)

**Layout:**
- Sol sidebar: 240px, collapsible
- Ana alan: fluid, responsive
- Sağ panel: 400px issue detail (split view)

## Core Features

### Issue Hiyerarşisi
Epic → Feature → Story → Task → Bug → Sub-task

Her issue alanları: başlık, açıklama (Tiptap rich text), atanan kişi, öncelik (critical/high/medium/low), etiketler, tahmini süre, bağlantılı issue'lar, `PRJ-123` formatı ID.

### Kanban Board
- Drag-and-drop (dnd-kit) — kolon içi ve kolonlar arası
- Özelleştirilebilir kolonlar (ekle/sil/yeniden adlandır)
- WIP limit per kolon
- Hızlı filtre: kişi, öncelik, etiket, tip

### Scrum Modülü
- Sprint planlama: backlog → sprint sürükle-bırak
- Sprint başlatma/bitirme workflow'u
- Burndown chart (Recharts)
- Velocity takibi (geçmiş sprint'ler)

### Backlog
- Grup by: Epic, Milestone, Atanan kişi
- Toplu işlem (multi-select)
- Manuel öncelik sıralaması (drag)

### Roadmap
- Gantt-style timeline (epic/milestone bazlı)
- Hafta/ay/çeyrek görünümü

### Realtime
- Çoklu kullanıcı: live cursor + anlık issue güncellemeleri
- Toast bildirimleri

## Data Model (Supabase)

```sql
workspaces         (id, name, slug, logo_url, owner_id, created_at)
workspace_members  (workspace_id, user_id, role: owner|admin|member|viewer)
projects           (id, workspace_id, name, key, methodology: kanban|scrum|both, color, icon)
epics              (id, project_id, title, description, color, start_date, end_date, status)
issues             (id, project_id, epic_id, parent_id, 
                    type: story|task|bug|sub-task,
                    title, description, status, 
                    priority: critical|high|medium|low,
                    assignee_id, reporter_id, labels[], estimate,
                    sprint_id, order, created_at, updated_at)
sprints            (id, project_id, name, goal, start_date, end_date,
                    status: planned|active|completed)
board_columns      (id, project_id, name, order, wip_limit, color)
comments           (id, issue_id, author_id, content, created_at)
attachments        (id, issue_id, file_url, file_name, uploaded_by)
activity_logs      (id, issue_id, actor_id, action, old_value, new_value, created_at)
```

**RLS:** Workspace üyeliği bazlı erişim kontrolü.  
**Realtime subscriptions:** `issues` + `board_columns` tabloları.

## Technology Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animasyon | Framer Motion |
| Drag & Drop | dnd-kit |
| State | Zustand |
| Charts | Recharts |
| Backend | Supabase (Auth + DB + Realtime + Storage) |
| Rich Text | Tiptap |
| Form | React Hook Form + Zod |
| Icons | Lucide React |

## Out of Scope (v1)

- Mobil native uygulama
- GitHub/GitLab entegrasyonu
- Zaman takibi (time tracking)
- Otomasyon kuralları (Jira Automation benzeri)
- Email bildirimleri
