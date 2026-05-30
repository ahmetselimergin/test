# shadcn/ui Tam Yeniden Tasarım — Design Spec

**Tarih:** 2026-05-29  
**Proje:** FlowTrack (Next.js 16, Tailwind v4, Supabase)  
**Kapsam:** Tüm UI'ın shadcn/ui bileşenleriyle ve shadcn CSS token sistemiyle yeniden yazılması

---

## 1. Hedef

Mevcut custom CSS variable sistemi (`--bg-subtle`, `--accent`, vb.) shadcn'in standart token setine taşınır. Her sayfadaki özel HTML/div yapıları shadcn bileşenleriyle değiştirilir. Sonuç: light/dark tema ikisi de çalışan, workspace rengiyle dinamik boyanan, animasyonları koruyan tutarlı bir UI.

---

## 2. CSS Token Sistemi

### Mevcut → shadcn eşleştirme

| Mevcut değişken | shadcn karşılığı |
|---|---|
| `--bg-subtle` | `--muted` |
| `--bg-muted` | `--accent` |
| `--accent` (workspace rengi) | `--primary` |
| `--foreground` | `--foreground` |
| `--muted` (metin) | `--muted-foreground` |
| border `--subtle` / `--strong` | `--border` |

### Workspace rengi entegrasyonu

`WorkspaceColorProvider` bileşeni `--primary` CSS değişkenini runtime'da override eder:

```tsx
// style prop olarak root div'e
style={{ '--primary': workspaceColor, '--primary-foreground': '#ffffff' } as React.CSSProperties}
```

Böylece `Button`, `Badge`, `Progress` gibi tüm shadcn bileşenleri workspace rengini otomatik kullanır.

### globals.css

Tailwind v4 `@theme` bloku shadcn token'larıyla yeniden yazılır. `base-nova` stilinin üzerine workspace color override sistemi kurulur.

---

## 3. Sidebar + Layout

### Sidebar

- Çerçeve: `bg-sidebar` / `border-sidebar-border` shadcn token'ları
- Workspace logosu: `Avatar` + `AvatarFallback` (baş harfler), workspace rengi `--primary`'den gelir
- Nav linkleri: `Button variant="ghost"` — aktif durum `bg-accent text-accent-foreground`
- Aktif proje alt görünümleri: `Collapsible` bileşeni (framer-motion animasyonuyla açılır)
- Alt alan: `Separator` + `Button variant="ghost"` (Profile, Sign Out)

### App Header

- `Breadcrumb` bileşeni: workspace → proje → view hiyerarşisi
- Sağ taraf: `ThemeToggle` + kullanıcı `Avatar` + `DropdownMenu`

### Dashboard Layout

- `PageHeader` bileşeni: `h1` + `p` + shadcn `Button` (action alanı)
- İç sayfa padding: `p-6` tutarlı

---

## 4. Board (Kanban)

### BoardToolbar

- `Button` + filtre sayacı için `Badge variant="secondary"`
- `Separator` bölümler arası

### FilterBar

- `Popover` + `Command` kombinasyonu: assignee/priority/type/label filtreleri
- Her seçim `Badge` ile gösterilir, `Button variant="ghost"` ile temizlenir

### KanbanBoard Sütunları

- Sütun başlığı: metin + `Badge variant="secondary"` (issue sayısı) + `Button variant="ghost"` (sütun menüsü)
- Sütun arkaplanı: `bg-muted/40`
- Scroll: `ScrollArea` bileşeni

### IssueCard

- `Card` + `CardContent`
- Priority: `Badge` (renkli, küçük)
- Type: `TypeIcon` (korunur, lucide ikonu)
- Assignee: `Avatar` size-5
- Drag handle: `Button variant="ghost"` size-icon (hover'da görünür)

### IssueDetailPanel

- `Sheet` (side="right") — zaten var, shadcn token'larına taşınır
- `Tabs` + `Separator`
- `ScrollArea` panel içeriği için

### CreateIssueDialog / EditIssueDialog

- `Dialog` + `DialogContent` + `DialogHeader`
- `Form` (react-hook-form) + `Input`, `Select`, `Textarea`, `Label`
- `Button variant="default"` (kaydet) + `Button variant="outline"` (iptal)

### AddColumnButton

- `Button variant="outline"` dashed görünüm için `border-dashed`

---

## 5. Projects Sayfası

- **Kart**: `Card` + `CardHeader` (renkli, pattern overlay korunur) + `CardContent` + `CardFooter`
- **Logo**: `Avatar` + `AvatarFallback` (baş harfler veya logo resmi)
- **İlerleme**: `Progress` bileşeni (proje renginde, `style={{ '--primary': project.color }}`)
- **Metodoloji etiketi**: `Badge variant="outline"`
- **Kart menüsü**: `DropdownMenu` (üç nokta, hover'da görünür) — edit + delete aksiyonları
- **Boş durum**: `Card` dashed border + `Button` (yeni proje oluştur)
- **Yeni proje placeholder**: grid'de aynı `Card` boyutunda, `Plus` ikonu + `Button variant="ghost"`

---

## 6. Diğer Sayfalar

### Dashboard

- ActivityFeed ve DashboardHero: `Card` grid
- Proje özet kartları: `Progress` + `Badge`
- Kullanıcı listesi: üst üste bindirilen `Avatar`'lar (shadcn'de AvatarGroup yok, elle yazılır)

### Backlog

- `Table` bileşeni — satır başına `Badge` (priority/status) + `Avatar` (assignee)
- Grup başlıkları: `Collapsible` ile aç/kapa

### Sprint

- `Card` sprint kartları
- `Progress` burndown özeti
- `Badge` sprint durumu (active/completed/planned)

### Roadmap (Gantt)

- Custom çizim korunur (shadcn'de gantt yok)
- Çerçeve: `Card` + `ScrollArea`

### Settings

- `Tabs` (Workspace / Danger Zone sekmeleri)
- Her bölüm `Card` içinde
- `Form` + `Input` + `Button`
- `Separator` bölümler arası
- Danger Zone: `Button variant="destructive"`

### Team

- `Table` veya `Card` grid (üye sayısına göre)
- `Avatar` + `Badge` (rol etiketi)

### Profile

- `Card` ortalanmış
- `Avatar` büyük (profil fotoğrafı)
- `Form` + `Input` + `Button`

### Auth (Login / Register)

- `Card` sayfa ortasında
- `Form` + `Input` + `Button variant="default"`
- Minimal layout, logo + başlık

---

## 7. Animasyon Politikası

Framer Motion **korunur**. Kullanım yerleri:
- Sidebar Collapsible açılma/kapanma
- Kanban kart sürükleme
- IssueDetailPanel (Sheet) açılma
- FilterBar yükseklik animasyonu
- Toast (Sonner zaten animasyonlu)

shadcn'in kendi `data-[state=open]` CSS animasyonları Framer Motion ile **çakışmaz** — ikisi birlikte kullanılabilir.

---

## 8. Uygulama Sırası

1. `globals.css` — token sistemi ve WorkspaceColorProvider
2. Sidebar + Layout (AppHeader, PageHeader)
3. Board (Toolbar → FilterBar → KanbanBoard → IssueCard → IssueDetailPanel → Dialogs)
4. Projects sayfası
5. Dashboard
6. Backlog
7. Sprint
8. Roadmap
9. Settings
10. Team
11. Profile
12. Auth

---

## 9. Kapsam Dışı

- Supabase veri katmanı değişmez
- Zustand store'lar değişmez
- DnD Kit entegrasyonu değişmez
- TipTap editor değişmez
- Routing ve sayfa yapısı değişmez
