# SwappFit Design System

> **CRITICAL RULE**: Never introduce new color values, new UI libraries, new spacing scales, or restyle existing components. Every new page must use only the tokens, patterns, and conventions documented here. This file is the single source of truth.

---

## 1. Color Tokens

All colors are CSS custom properties defined in `app/globals.css`. Use **only** Tailwind semantic classes that map to these tokens — never hardcode hex values.

### Light Mode (`:root`)
| Token | Value | Tailwind class |
|---|---|---|
| `--background` | `#F7F5F2` | `bg-background` / `text-background` |
| `--foreground` | `#1E1030` | `text-foreground` |
| `--card` | `#FFFFFF` | `bg-card` / `text-card-foreground` |
| `--primary` | `#BC2F54` | `bg-primary` / `text-primary` |
| `--primary-foreground` | `#FFFFFF` | `text-primary-foreground` |
| `--secondary` | `#ECE8E2` | `bg-secondary` |
| `--muted` | `#EDE9E3` | `bg-muted` / `text-muted-foreground` |
| `--muted-foreground` | `#8C8579` | `text-muted-foreground` |
| `--accent` | `#ECE8E2` | `bg-accent` |
| `--accent-foreground` | `#1E1030` | `text-accent-foreground` |
| `--border` | `#E5E0D8` | `border-border` |
| `--destructive` | `#d4183d` | `text-destructive` |
| `--ring` | `#BC2F54` | `ring-ring` |

### Dark Mode (`.dark`)
| Token | Value |
|---|---|
| `--background` | `#0B1120` |
| `--card` | `#111827` |
| `--primary` | `#D14872` |
| `--muted` | `#1F2937` |
| `--muted-foreground` | `#7A5C6A` |
| `--accent` | `#2E1525` |
| `--border` | `#2E1525` |

### Brand Gradient
The signature SwappFit gradient (deep wine → bright raspberry):
```css
/* Use the utility class, never recreate inline */
.bg-brand-gradient {
  background-image: linear-gradient(160deg, var(--g-start), var(--g-end));
}
```
- Light: `#4E1126` → `#C53F64`
- Dark: `#5A1530` → `#D14872`

**Usage**: The brand gradient is used on the center nav button, active category pills, the primary CTA button, chat bubbles (sent messages), notification icon badges, and the exchange status badge.

---

## 2. Typography

| Element | Classes |
|---|---|
| Page title (h1, top bar) | `text-2xl font-bold tracking-tight text-foreground` |
| Section sub-label | `text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground` |
| Card title | `text-sm font-bold text-foreground` (truncate) |
| Card subtitle | `text-xs text-muted-foreground` (truncate) |
| Price | `text-sm font-bold text-primary` |
| Body copy | `text-sm leading-relaxed text-foreground` |
| Small meta | `text-[10px]` or `text-[11px]` |
| Input / textarea | `text-sm text-foreground`, placeholder: `placeholder:text-muted-foreground` |
| Page header h1 | `text-lg font-bold text-foreground` |
| Section header h2 (large) | `text-xl font-bold text-foreground` |

Font families: `var(--font-geist-sans)` → `Inter` → `system-ui`. Set on `<html>` in `layout.tsx` via next/font Geist.

Font weights: `500` (medium, all headings/buttons/labels) and `400` (normal, inputs).

---

## 3. Spacing & Layout

| Pattern | Value |
|---|---|
| Page max-width | `max-w-[390px]` (mobile-first) |
| Page horizontal padding | `px-5` |
| Page top padding | `pt-5` (feed pages) or `pt-2` (detail pages with PageHeader) |
| Page bottom padding | `pb-28` (leaves room for bottom nav / sticky bar) |
| Card gap | `gap-4` (grids) or `gap-2` (lists) |
| Section spacing (mt-) | `mt-5` (first), `mt-6` (between sections) |
| Inner card padding | `p-3` (compact cards), `p-4` (hero cards), `p-6` (profile card) |

---

## 4. Border Radius Scale

| Name | Value | Usage |
|---|---|---|
| `rounded-full` | `9999px` | Buttons, pills, avatars, chips |
| `rounded-2xl` | `1rem` | Cards, chat rows, notification rows |
| `rounded-xl` | `~14px` | Inputs, small chips |
| `rounded-3xl` | `1.5rem` | Logo container on auth page |

---

## 5. Shadows

> All shadows use `rgba(192,57,91,…)` — the brand primary color tinted shadow. Never use default Tailwind `shadow-md` etc.

| Use case | Shadow value |
|---|---|
| Standard card | `shadow-[0_4px_20px_rgba(192,57,91,0.08)]` |
| Hero card | `shadow-[0_8px_32px_rgba(192,57,91,0.10)]` |
| Profile card | `shadow-[0_8px_32px_rgba(192,57,91,0.10)]` |
| Primary CTA button | `shadow-[0_12px_24px_rgba(192,57,91,0.32)]` |
| Active pill | `shadow-[0_8px_18px_rgba(192,57,91,0.22)]` |
| Bottom nav | `shadow-[0_-8px_30px_rgba(15,23,42,0.08)]` |
| Profile icon buttons | `shadow-[0_4px_16px_rgba(192,57,91,0.08)]` |
| Auth card | `shadow-[0_8px_32px_rgba(192,57,91,0.10)]` |

---

## 6. Component Patterns

### Card (standard list row)
```tsx
<div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_20px_rgba(192,57,91,0.08)] transition-transform active:scale-95">
```

### Card (hero / featured)
```tsx
<div className="block overflow-hidden rounded-2xl bg-card shadow-[0_8px_32px_rgba(192,57,91,0.10)] transition-transform active:scale-95">
```

### Primary CTA Button (gradient)
```tsx
<button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50">
```

### Secondary Button (muted)
```tsx
<button className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95">
```

### Category / Condition Pill (active)
```tsx
<button className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]">
```

### Category / Condition Pill (inactive)
```tsx
<button className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 border border-secondary bg-transparent text-foreground">
```

### Input Field
```tsx
<input className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
```

### Textarea
```tsx
<textarea className="w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
```

### Auth Input Wrapper
```tsx
<div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3.5 focus-within:ring-2 focus-within:ring-ring">
  <span className="shrink-0 text-muted-foreground">{icon}</span>
  {children}
</div>
```

### Sticky Footer Action Bar
```tsx
<div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
```

### Sticky Header
```tsx
<header className="sticky top-0 z-40 -mx-5 mb-4 flex items-center gap-3 border-b border-border bg-card/85 px-5 py-3.5 backdrop-blur-xl">
```

---

## 7. Icon Usage

- **Library**: `lucide-react` only. No other icon sets.
- **Standard icon size**: `h-5 w-5` (nav, headers) · `h-4 w-4` (buttons, inline) · `h-3.5 w-3.5` (meta chips, small badges)
- **Color**: `text-primary` (branded icons), `text-foreground` (navigation/back), `text-muted-foreground` (decorative/secondary)
- **Fill**: use `fill="var(--primary)"` for active star/heart/nav icons — never use `fill-primary` utility
- **Active nav icon**: `fill={active ? "var(--primary)" : "none"} color={active ? "var(--primary)" : "var(--muted-foreground)"}`

---

## 8. Animation & Interaction

| Pattern | Class |
|---|---|
| Tap feedback (most interactive elements) | `transition-transform active:scale-95` |
| Tap feedback (small round buttons) | `transition-transform active:scale-90` |
| Fade-in animation (staggered lists) | `animate-fade-in-up stagger-1` … `stagger-4` |
| Page-level smooth scroll | set via `html { scroll-behavior: smooth }` |

Do **not** add any external animation libraries.

---

## 9. Shared Components

| Component | File | Description |
|---|---|---|
| `BottomNav` | `components/bottom-nav.tsx` | Fixed 5-tab nav: Home, Search, Post (+), Chats, Profile |
| `PageHeader` | `components/page-header.tsx` | Sticky header with optional back button, title, subtitle, action slot |
| `ItemCard` | `components/item-card.tsx` | Compact 2-column grid card |
| `ItemCardHero` | `components/item-card.tsx` | Wide featured card (3:2 aspect ratio) |
| `ThemeProvider` | `components/theme-provider.tsx` | `next-themes` wrapper, `defaultTheme="light"`, no system |
| `ThemeToggle` | `components/theme-toggle.tsx` | Standalone dark/light toggle |

---

## 10. Page Structure Template

All feed/list pages:
```tsx
<main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5">
  {/* content */}
  <BottomNav />
</main>
```

All detail/action pages (with PageHeader):
```tsx
<main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
  <PageHeader title="…" subtitle="…" />
  {/* content */}
  {/* Sticky footer bar if needed */}
</main>
```

---

## 11. Scroll Utilities

Horizontal scrollable rows (e.g., category pills):
```tsx
<div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
```
(`-mx-5` + `px-5` creates a full-bleed scroll that respects the page padding visually)

---

## 12. Section Label Convention

Every section starts with a label in this exact style:
```tsx
<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
  Section Title
</p>
```

---

## 13. Avatar & Image Patterns

| Pattern | Classes |
|---|---|
| Avatar (large, profile) | `h-20 w-20 rounded-full object-cover` |
| Avatar (medium, chat row) | `h-12 w-12 rounded-full object-cover` |
| Avatar (small, header) | `h-9 w-9 rounded-full object-cover` |
| Item thumbnail (square card) | `aspect-square w-full object-cover` |
| Item thumbnail (hero card) | `aspect-[3/2] w-full object-cover` |
| Item mini (inline) | `h-11 w-11 rounded-xl object-cover` |
| Fallback | `|| "/placeholder.svg"` |

---

## 14. Unread / Badge Patterns

```tsx
{/* Unread dot */}
<span className="h-2 w-2 shrink-0 rounded-full bg-primary" />

{/* Unread count badge */}
<span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
  {count}
</span>

{/* Notification bell dot */}
<span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
```

---

## 15. Toggle Switch (settings)

```tsx
<button
  role="switch"
  aria-checked={on}
  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-switch-background"}`}
>
  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
</button>
```

---

## 16. Empty State

```tsx
<p className="mt-6 text-center text-sm text-muted-foreground">No items in this category yet.</p>
```

---

## 17. Condition Badge (on item images)

```tsx
<span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
  {condition}
</span>
```

---

## 18. Settings Row Patterns

```tsx
{/* Clickable row */}
<button className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors last:border-b-0 active:bg-muted">
  {icon}
  <span className="flex-1 truncate text-sm font-medium text-foreground">{label}</span>
  {value && <span className="shrink-0 text-xs text-muted-foreground">{value}</span>}
  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
</button>

{/* Section group wrapper */}
<div className="overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
  {children}
</div>
```
