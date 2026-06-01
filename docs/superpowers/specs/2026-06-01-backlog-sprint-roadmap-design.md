# Backlog / Sprint / Roadmap — Tam İşlevsellik Tasarımı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backlog, Sprint ve Roadmap görünümlerini read-only durumdan tam işlevsel hale getirmek.

**Architecture:** Paylaşılan bir `IssueRow` satır bileşeni üzerine kurulu. Backlog ve Sprint issue listeleri bu bileşeni kullanır. Context menu'ye "Sprint'e Ekle" eklenir. Sprint ve Epic oluşturma Server Actions ile yapılır.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Zustand, Radix UI (shadcn), date-fns, dnd-kit (mevcut)

---

## Kapsam

### Paylaşılan: IssueRow Bileşeni
`src/components/issues/IssueRow.tsx` — kompakt tek satır issue gösterimi:
- Sol: tip ikonu, issue key (monospace), başlık (truncate)
- Sağ: label badge'leri (max 2), öncelik noktası, atanan avatar, estimate badge
- Tıklama: `setSelectedIssue(issue)` → detail panel açılır
- Sağ tık: mevcut `IssueCardContextMenu` ile wrap edilir

### Backlog
- `BacklogGroup` içindeki `IssueCard` → `IssueRow` ile değiştirilir
- Her grubun altına **"+ Issue Ekle"** inline butonu: `CreateIssueDialog` açar; `CreateIssueDialog`'a opsiyonel `defaultEpicId?: string` prop eklenerek ilgili epic pre-fill yapılır
- Context menu'ye yeni **"Sprint'e Ekle"** submenüsü: planned/active sprint'leri listeler, seçince `sprint_id` atanır, issue store'dan backlog listesinden çıkar
- Gruplandırma (epic / öncelik / yok) aynen korunur

### Sprint
- Sayfanın sağ üstüne **"Sprint Oluştur"** butonu
- `CreateSprintDialog`: isim (zorunlu), hedef (opsiyonel), başlangıç tarihi, bitiş tarihi
- `createSprint` Server Action: supabase insert, store'a ekle
- `SprintCard` altında collapsible **issue listesi** (`IssueRow` kullanır)
- Issue yoksa: "Issue yok — backlog'dan sağ tıkla ekle" mesajı
- Burndown chart: fake data yerine gerçek hesap
  - Ideal: `totalPoints / sprintDays` oranında düşen çizgi
  - Actual: sprint başından bugüne kadar geçen günlerde tamamlanan issue estimate'lerini toplam'dan çıkartarak hesaplanır (done issue'ların estimate'i story point, null ise 1 sayılır)

### Context Menu: Sprint'e Ekle
- `IssueCardContextMenu.tsx`'e yeni submenü eklenir: **"Sprint'e Ekle"**
- `useProjectStore` sprints listesinden `planned` ve `active` sprint'leri gösterir
- Seçilince: optimistic `updateIssue(id, { sprint_id })`, ardından supabase update
- Sprint yoksa: "Sprint yok" mesajı

### Roadmap
- Sağ üste **"Epic Oluştur"** butonu
- `CreateEpicDialog`: başlık (zorunlu), renk seçici (preset renkler), başlangıç tarihi, bitiş tarihi, durum (active/completed/cancelled)
- `createEpic` Server Action: supabase insert, `setEpics([...epics, newEpic])`
- Gantt barına tıklayınca **Popover**: başlangıç ve bitiş tarih input'ları (`<input type="date">`), Kaydet butonu
- `updateEpicDates` Server Action: supabase update, optimistic store update

---

## Server Actions

| Aksiyon | Dosya | Açıklama |
|---|---|---|
| `createSprint` | `src/app/actions/sprint.ts` (yeni) | Sprint oluştur |
| `createEpic` | `src/app/actions/roadmap.ts` (yeni) | Epic oluştur |
| `updateEpicDates` | `src/app/actions/roadmap.ts` | Epic tarihlerini güncelle |
| `assignIssueToSprint` | `src/app/actions/sprint.ts` | Issue'ya sprint_id ata |

Not: Sprint başlatma/tamamlama (`SprintCard`) şu an client-side supabase kullanıyor — bu özelliğin kapsamı dışında bırakılır (mevcut RLS okuma için çalışıyor).

## Store Güncellemeleri

`project.store.ts`'e eklenecekler:
- `addSprint(sprint: Sprint)` — yeni sprint oluşturulunca
- `addEpic(epic: Epic)` — yeni epic oluşturulunca  
- `updateEpic(id, updates)` — epic tarihleri değişince

`issue.store.ts` — mevcut `updateIssue` sprint_id için yeterli.

## Dosya Değişiklikleri

**Yeni dosyalar:**
- `src/components/issues/IssueRow.tsx`
- `src/components/sprint/CreateSprintDialog.tsx`
- `src/components/roadmap/CreateEpicDialog.tsx`
- `src/components/roadmap/EpicDatePopover.tsx`
- `src/app/actions/sprint.ts`
- `src/app/actions/roadmap.ts`

**Değiştirilen dosyalar:**
- `src/components/backlog/BacklogGroup.tsx` — IssueCard → IssueRow, "+ Issue Ekle" butonu
- `src/components/backlog/BacklogView.tsx` — grup header'ına create butonu
- `src/components/sprint/SprintView.tsx` — "Sprint Oluştur" butonu
- `src/components/sprint/SprintCard.tsx` — collapsible issue listesi
- `src/components/sprint/BurndownChart.tsx` — gerçek burndown hesabı
- `src/components/roadmap/RoadmapView.tsx` — "Epic Oluştur" butonu, GanttRow tıklama
- `src/components/roadmap/GanttRow.tsx` — `onEdit?: (epic: Epic) => void` prop eklenir; bar'a tıklayınca çağırır
- `src/components/board/CreateIssueDialog.tsx` — `defaultEpicId?: string` prop eklenir
- `src/components/issues/IssueCardContextMenu.tsx` — "Sprint'e Ekle" submenüsü
- `src/lib/stores/project.store.ts` — addSprint, addEpic, updateEpic
