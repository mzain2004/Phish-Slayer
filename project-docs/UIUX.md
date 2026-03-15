# UIUX.md — Design System
# Phish-Slayer V3

---

## 1. Design Philosophy

The UI follows a **GitHub/Vercel dark slate** aesthetic — dense, data-rich, and professional. It is NOT a generic "hacker green on black" cyberpunk UI. It is a clean, modern SaaS dashboard that happens to be dark-themed. Every design decision prioritizes information density and scannability over decoration.

---

## 2. Color Tokens

These are the EXACT values. Never deviate from these.

```css
/* Backgrounds */
--bg-base:     #0d1117   /* Page background */
--bg-card:     #161b22   /* Card/panel background */
--bg-elevated: #1c2128   /* Elevated elements, dropdowns, modals */

/* Borders */
--border:      #30363d   /* Default border color */
--border-muted:#21262d   /* Subtle borders */

/* Text */
--text-primary:   #e6edf3  /* Main text */
--text-secondary: #8b949e  /* Muted/secondary text */
--text-muted:     #6e7681  /* Placeholder, disabled text */

/* Accent Colors */
--accent-teal:   #2dd4bf  /* Primary accent — CTAs, active states, highlights */
--accent-purple: #a78bfa  /* Secondary accent — badges, charts */
--accent-red:    #f85149  /* Danger/malicious — alerts, error states */
--accent-amber:  #e3b341  /* Warning/suspicious — medium risk */
--accent-green:  #3fb950  /* Success/clean — safe verdicts */
--accent-blue:   #58a6ff  /* Info — links, info badges */
```

**Verdict Color Mapping:**
- `malicious` → `--accent-red` (#f85149)
- `suspicious` → `--accent-amber` (#e3b341)
- `clean` → `--accent-green` (#3fb950)
- `unknown` → `--text-secondary` (#8b949e)

---

## 3. Typography

- **Font:** Inter (loaded via Next.js `next/font`)
- **Scale:** Use Tailwind's default type scale
- **Headings:** `font-semibold` or `font-bold`, `text-[--text-primary]`
- **Body:** `font-normal`, `text-[--text-primary]`
- **Muted text:** `text-[--text-secondary]`
- **Code/monospace:** `font-mono`, used for IPs, hashes, API keys

---

## 4. Spacing and Layout

- **Dashboard layout:** Fixed sidebar (240px) + top nav (56px) + main content area
- **Card padding:** `p-4` or `p-6`
- **Section gaps:** `gap-4` or `gap-6`
- **Border radius:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for buttons/inputs, `rounded-full` for badges
- **Grid:** 12-column grid system, cards typically span 3, 4, or 6 columns

---

## 5. Component Patterns

### Cards
```
bg-[--bg-card] border border-[--border] rounded-lg p-6
```
Never use white backgrounds. Never use drop shadows — use borders instead.

### Buttons
- **Primary:** `bg-[--accent-teal] text-black font-semibold rounded-md px-4 py-2`
- **Secondary:** `bg-[--bg-elevated] border border-[--border] text-[--text-primary] rounded-md px-4 py-2`
- **Danger:** `bg-[--accent-red]/10 border border-[--accent-red]/30 text-[--accent-red] rounded-md px-4 py-2`
- **Ghost:** `text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-elevated]`

### Badges / Status Pills
```
inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
```
Color by severity: red for critical/malicious, amber for warning/suspicious, green for clean/safe, blue for info.

### Tables
- Header: `bg-[--bg-elevated] text-[--text-secondary] text-xs uppercase tracking-wider`
- Row: `border-b border-[--border] hover:bg-[--bg-elevated]/50`
- Never use zebra striping

### Input Fields
```
bg-[--bg-elevated] border border-[--border] rounded-md px-3 py-2 text-[--text-primary]
focus:border-[--accent-teal] focus:ring-1 focus:ring-[--accent-teal]
```

### Sidebar Navigation
- Active item: `bg-[--accent-teal]/10 text-[--accent-teal] border-l-2 border-[--accent-teal]`
- Inactive item: `text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-elevated]`

---

## 6. Animation Rules

- **Maximum blur:** `backdrop-blur-sm` ONLY. Never `backdrop-blur-md` or higher — causes performance issues on the Azure VM.
- **Transitions:** `transition-colors duration-150` for hover states
- **Framer Motion:** Use only for page transitions and skeleton loaders. Never animate data tables.
- **Loading states:** Use skeleton loaders (`animate-pulse bg-[--bg-elevated]`), never spinners on data

---

## 7. Icons

- **Library:** Lucide React exclusively (`lucide-react`)
- **Size:** `w-4 h-4` inline, `w-5 h-5` buttons, `w-6 h-6` nav items, `w-8 h-8` KPI cards
- **Color:** Inherit from parent text color. Use explicit color only for status icons.

**Icon Semantic Mapping:**
- `Shield` — security/protection
- `AlertTriangle` — warning/suspicious
- `XCircle` — malicious/danger
- `CheckCircle` — clean/safe
- `Activity` — live/monitoring
- `Terminal` — agent/EDR
- `Globe` — network/IP
- `Lock` — auth/security
- `Zap` — fast/instant

---

## 8. Data Visualization

- **Library:** Recharts
- **Chart colors:** Use `--accent-teal` as primary, `--accent-purple` as secondary, `--accent-red` for danger data
- **Chart backgrounds:** Transparent — never white
- **Grid lines:** `stroke="#30363d"` (matches `--border`)
- **Tooltips:** Dark background (`#1c2128`) with `#30363d` border

---

## 9. Responsive Behavior

- **Desktop-first** design (SOC analysts work on large monitors)
- **Minimum supported width:** 1280px
- **Mobile:** Responsive but not the primary target. Sidebar collapses to hamburger below 768px.

---

## 10. Do Not Do

- ❌ Never use white or light backgrounds anywhere in the dashboard
- ❌ Never use `backdrop-blur-md` or higher
- ❌ Never use drop shadows — use borders
- ❌ Never use green-on-black "hacker" aesthetics
- ❌ Never use emoji in dashboard UI (only in notification messages)
- ❌ Never use Comic Sans or any non-Inter font
- ❌ Never hardcode hex colors — always use CSS variables or Tailwind custom values
- ❌ Never use `<table>` without the established table pattern above
