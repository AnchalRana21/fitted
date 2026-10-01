# Fitted design system and UI redesign (design)

Date: 2026-10-02
Status: Approved design

## Goal

Replace Fitted's basic UI with a polished, enterprise-grade interface built on its own design system. Reference: Stripe's product UI (structure, spacing, soft shadows, pill buttons, calm surfaces), but with Fitted's own colours. The system must be documented inside the app so it can be shown on a portfolio.

Decisions made with the owner:

- Style reference: Stripe.
- Colours: exactly one primary and one secondary brand colour, no purple, no gradients.
  - Primary: blue `#0B63CE`. Secondary: teal (`#0F8A7E` brand swatch; `#0D7A70` used where white text sits on it, for AA contrast).
  - Everything else is neutral (ink, slate greys). Red and amber appear only for meaning (removed words, errors, "Check this").
- Themes: light and dark. Follows the system setting by default; a header toggle overrides it and is remembered.
- Home layout: soft primary-tinted hero band with the form card overlapping it.
- Tailoring screen: workspace. Summary bar on top; left panel with tabs (Analysis, Rewrite, Cover letter); right panel with a live resume preview that updates as changes are accepted. The separate Export tab goes away; Download PDF and Copy Markdown live in the summary bar.
- Build approach: own tokens and components (no shadcn, no separate package), Radix for behaviour.

## Tokens

All tokens are CSS custom properties, mapped into Tailwind v4 with `@theme inline` so utilities like `bg-surface`, `text-ink-2`, `border-border`, `bg-primary` exist. Dark mode swaps the variables under `[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #F7F8FA | #0B1220 | page background |
| surface | #FFFFFF | #0F1829 | cards |
| surface-muted | #F2F4F7 | #141F33 | inputs, wells |
| band | #E8F1FC | #0F2340 | home hero band |
| ink | #0D1B2A | #E6EBF2 | primary text |
| ink-2 | #475467 | #A3B0C2 | secondary text |
| ink-3 | #5D6B7E | #8B99AD | captions, placeholders |
| border | #E4E7EC | #1F2B40 | dividers, card borders |
| border-strong | #D0D5DD | #2B3A55 | button outlines |
| input | #7D8799 | #62738F | form control borders (≥3:1) |
| primary | #0B63CE | #4C9AFF | actions, links, focus, score |
| primary-hover | #0A56B3 | #6AABFF | |
| on-primary | #FFFFFF | #0B1220 | text on primary |
| primary-subtle | #E8F1FC | #13294A | tints |
| primary-text | #0A56B3 | #8CC2FF | primary-coloured text on surfaces |
| secondary | #0D7A70 | #2CC3B0 | accepted state, success |
| secondary-hover | #0A665E | #4FD3C2 | success button hover (white 6.8:1 / #0B1220 10.2:1) |
| on-secondary | #FFFFFF | #0B1220 | |
| secondary-subtle | #D9F3EF | #0F2F30 | added-word highlight, accepted card bg |
| secondary-text | #08594F | #8CE8DB | |
| danger | #B42318 | #FF8A80 | removed words, errors |
| danger-hover | #912018 | #FFA39B | destructive button hover (white 8.66:1 / #0B1220 9.78:1) |
| on-danger | #FFFFFF | #0B1220 | text on danger (6.57:1 / 8.20:1) |
| danger-subtle | #FEF3F2 | #3A1414 | |
| warning-text | #8A4B00 | #FFC97A | "Check this" |
| warning-subtle | #FFF4E0 | #33270F | |

Also: font Inter (next/font); type scale 12/14/15/18/24/32; spacing on Tailwind's 4px scale; radius `sm 6px`, `md 10px`, `lg 14px`, pill; shadows `sm`, `md` (cards), `lg` (floating form card); motion `fast 150ms`, `base 250ms`, all disabled under `prefers-reduced-motion`. Every text/background pair used meets WCAG 2.1 AA.

## Components (`components/ui`)

Button (primary, secondary, ghost, success, danger; sizes sm/md; supports `aria-pressed`), Card (outline / raised), Field (label, hint, error wiring) with Textarea, Badge (neutral/primary/success/warning/danger; pill "chip" shape for skills), Alert (danger/warning/info/success, role alert or status), Tabs (Radix, supports forceMount + hidden inactive panels), ScoreRing, Stat, Skeleton, ThemeToggle, CopyButton (rebuilt on Button), ConfirmDialog (Radix AlertDialog; danger/primary tone; replaces all browser dialogs, enforced by `no-alert`). Class merging through a `cn()` helper (clsx + tailwind-merge) so overrides never lose to base classes.

## Screens

- **Header:** logo mark (solid primary rounded square) + "Fitted", History, GitHub, ThemeToggle.
- **Home:** band with headline and subline; raised form card overlapping it (resume drop zone + text, job text + counter, actions, two trust notes with teal checks).
- **Tailoring workspace:** summary bar (ScoreRing, "Tailoring for" + title, accepted count, Download PDF, Copy Markdown, save/charset alerts). Grid `lg:grid-cols-2`: left Card with Tabs (Analysis default, Rewrite, Cover letter); right Card "Live preview" containing the resume as white paper in both themes. A line that changes because of an accepted/edited suggestion flashes teal for ~1.2s (no animation under reduced motion). On small screens the preview stacks below.
- **History:** run cards (title, date, score badge, open, delete).
- **/design-system:** documents every token (swatches with name and value, both themes), type scale, spacing, radius, shadows, motion, and live examples of every component and state.

## Unchanged

Lib logic, API routes, streaming, storage, PDF layout (owner's resume format), labels and accessible names used by tests (except the removed Export tab).

## Testing

- Unit: theme resolution helper; `cn()`.
- E2E updated for the workspace (no Export tab; preview region; download from the summary bar).
- New E2E: theme toggle sets `data-theme` and persists after reload; /design-system renders.
- axe WCAG 2.1 AA checks on home, workspace (each tab), history and /design-system in **both** themes.
- Screenshots of home and workspace in light and dark committed under `docs/screenshots/` and shown in the README.
