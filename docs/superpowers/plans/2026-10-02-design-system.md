# Fitted Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Fitted's basic UI with a Stripe-style, token-based design system (blue primary, teal secondary, light + dark) and rebuild every screen on it, including a workspace layout with a live resume preview and a `/design-system` documentation page.

**Architecture:** Tokens are CSS custom properties in `app/globals.css`, exposed to Tailwind v4 via `@theme inline`; dark mode swaps the variables under `[data-theme="dark"]` (set before paint by an inline script, from localStorage or the system setting). Small components in `components/ui` (Radix for behaviour) are the only place raw styling decisions live; screens compose them. Class overrides go through `cn()` (clsx + tailwind-merge). No lib, API or PDF logic changes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Radix Tabs, clsx, tailwind-merge, Inter (next/font), Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-02-design-system-design.md` (token table is the source of truth for colour values).

**Repo:** `~/Desktop/fitted`, branch `build/v1`. Existing tests: 141 unit, 9 E2E — all must keep passing unless a task says to change one.

**Rules for every task:** keep accessible names/labels used by tests (listed per task); keep `"use client"` boundaries; no raw colour utilities like `bg-white`, `text-neutral-*`, `emerald-*` in screens after Task 4 — use token utilities (`bg-surface`, `text-ink-2`, …); ESLint incl. React Compiler rules must pass; no Prettier.

---

### Task 1: Tokens, theme and header

**Files:**
- Modify: `package.json` (deps), `app/globals.css`, `app/layout.tsx`
- Create: `lib/cn.ts`, `lib/theme.ts`, `components/ui/ThemeToggle.tsx`, `components/layout/SiteHeader.tsx`
- Test: `tests/unit/theme.test.ts`, `tests/unit/cn.test.ts`

- [ ] **Step 1: Install**

```bash
npm i clsx@^2 tailwind-merge@^3
```

- [ ] **Step 2: Failing tests**

`tests/unit/cn.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins and drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("lets later utilities win over earlier conflicting ones", () => {
    expect(cn("px-4 bg-surface", "bg-primary")).toBe("px-4 bg-primary");
  });
});
```

`tests/unit/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveTheme, THEME_SCRIPT } from "@/lib/theme";

describe("resolveTheme", () => {
  it("prefers a stored choice", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("falls back to the system setting", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("bogus", false)).toBe("light");
  });
  it("ships an inline script that sets data-theme", () => {
    expect(THEME_SCRIPT).toContain("data-theme");
    expect(THEME_SCRIPT).toContain("fitted-theme");
  });
});
```

Run `npx vitest run tests/unit/cn.test.ts tests/unit/theme.test.ts` → FAIL (modules missing).

- [ ] **Step 3: `lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our token utilities so `bg-surface` and `bg-primary` count as the same group.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas", "surface", "surface-muted", "band", "ink", "ink-2", "ink-3", "border", "border-strong", "input",
        "primary", "primary-hover", "on-primary", "primary-subtle", "primary-text",
        "secondary", "on-secondary", "secondary-subtle", "secondary-text",
        "danger", "danger-subtle", "warning-text", "warning-subtle",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: `lib/theme.ts`**

```ts
export type Theme = "light" | "dark";
export const THEME_KEY = "fitted-theme";

export function resolveTheme(stored: string | null, systemDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemDark ? "dark" : "light";
}

/** Runs before paint (inlined in <head>) so there is no light flash in dark mode. */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="light"||s==="dark"?s:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
```

- [ ] **Step 5: Replace `app/globals.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  color-scheme: light;
  --c-canvas: #f7f8fa;
  --c-surface: #ffffff;
  --c-surface-muted: #f2f4f7;
  --c-band: #e8f1fc;
  --c-ink: #0d1b2a;
  --c-ink-2: #475467;
  --c-ink-3: #5d6b7e;
  --c-border: #e4e7ec;
  --c-border-strong: #d0d5dd;
  --c-input: #7d8799;
  --c-primary: #0b63ce;
  --c-primary-hover: #0a56b3;
  --c-on-primary: #ffffff;
  --c-primary-subtle: #e8f1fc;
  --c-primary-text: #0a56b3;
  --c-secondary: #0d7a70;
  --c-on-secondary: #ffffff;
  --c-secondary-subtle: #d9f3ef;
  --c-secondary-text: #08594f;
  --c-danger: #b42318;
  --c-danger-subtle: #fef3f2;
  --c-warning-text: #8a4b00;
  --c-warning-subtle: #fff4e0;
  --shadow-color: 16 24 40;
}

[data-theme="dark"] {
  color-scheme: dark;
  --c-canvas: #0b1220;
  --c-surface: #0f1829;
  --c-surface-muted: #141f33;
  --c-band: #0f2340;
  --c-ink: #e6ebf2;
  --c-ink-2: #a3b0c2;
  --c-ink-3: #8b99ad;
  --c-border: #1f2b40;
  --c-border-strong: #2b3a55;
  --c-input: #62738f;
  --c-primary: #4c9aff;
  --c-primary-hover: #6aabff;
  --c-on-primary: #0b1220;
  --c-primary-subtle: #13294a;
  --c-primary-text: #8cc2ff;
  --c-secondary: #2cc3b0;
  --c-on-secondary: #0b1220;
  --c-secondary-subtle: #0f2f30;
  --c-secondary-text: #8ce8db;
  --c-danger: #ff8a80;
  --c-danger-subtle: #3a1414;
  --c-warning-text: #ffc97a;
  --c-warning-subtle: #33270f;
  --shadow-color: 0 0 0;
}

@theme inline {
  --font-sans: var(--font-inter);
  --color-canvas: var(--c-canvas);
  --color-surface: var(--c-surface);
  --color-surface-muted: var(--c-surface-muted);
  --color-band: var(--c-band);
  --color-ink: var(--c-ink);
  --color-ink-2: var(--c-ink-2);
  --color-ink-3: var(--c-ink-3);
  --color-border: var(--c-border);
  --color-border-strong: var(--c-border-strong);
  --color-input: var(--c-input);
  --color-primary: var(--c-primary);
  --color-primary-hover: var(--c-primary-hover);
  --color-on-primary: var(--c-on-primary);
  --color-primary-subtle: var(--c-primary-subtle);
  --color-primary-text: var(--c-primary-text);
  --color-secondary: var(--c-secondary);
  --color-on-secondary: var(--c-on-secondary);
  --color-secondary-subtle: var(--c-secondary-subtle);
  --color-secondary-text: var(--c-secondary-text);
  --color-danger: var(--c-danger);
  --color-danger-subtle: var(--c-danger-subtle);
  --color-warning-text: var(--c-warning-text);
  --color-warning-subtle: var(--c-warning-subtle);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgb(var(--shadow-color) / 0.06), 0 1px 3px rgb(var(--shadow-color) / 0.08);
  --shadow-md: 0 6px 20px rgb(var(--shadow-color) / 0.10), 0 2px 6px rgb(var(--shadow-color) / 0.05);
  --shadow-lg: 0 14px 36px rgb(var(--shadow-color) / 0.14), 0 4px 10px rgb(var(--shadow-color) / 0.06);
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --animate-flash: flash 1.2s var(--ease-out);
  @keyframes flash {
    0% { background-color: var(--c-secondary-subtle); }
    100% { background-color: transparent; }
  }
}

body {
  background: var(--c-canvas);
  color: var(--c-ink);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 6: `components/ui/ThemeToggle.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/cn";

function current(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(current());
  }, []);

  function toggle() {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {theme === "dark" ? (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
```

If `react-hooks/set-state-in-effect` flags `setTheme(current())`, replace the state with `useSyncExternalStore` subscribing to a `MutationObserver` on `<html data-theme>` — report the change.

- [ ] **Step 7: `components/layout/SiteHeader.tsx`**

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const linkClass =
  "rounded-full px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-primary text-xs font-bold text-on-primary">F</span>
          Fitted
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/history" className={linkClass}>History</Link>
          <Link href="/design-system" className={linkClass}>Design system</Link>
          <a href="https://github.com/AnchalRana21/fitted" rel="noopener noreferrer" className={linkClass}>GitHub</a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 8: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Fitted: tailor your resume to any job",
  description: "Compare your resume with a job description, get honest AI suggestions, and export a tailored PDF.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
```

Pages now own their `<main>` (Tasks 3–6 add `<main>` wrappers). In this task, wrap `app/page.tsx`, `app/history/page.tsx` and `app/tailor/[id]/page.tsx` content in `<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">` so nothing breaks before the redesign.

- [ ] **Step 9: Verify and commit**

`npx vitest run tests/unit/cn.test.ts tests/unit/theme.test.ts` PASS; `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e` all pass (existing screens still use old colour classes — fine for now).

```bash
git add -A && git commit -m "feat: design tokens, theme switching and site header"
```

---

### Task 2: UI primitives

**Files:**
- Modify: `components/ui/Button.tsx`, `components/ui/CopyButton.tsx`, `components/ui/ErrorNotice.tsx`
- Create: `components/ui/Card.tsx`, `Badge.tsx`, `Alert.tsx`, `Field.tsx`, `Tabs.tsx`, `ScoreRing.tsx`, `Stat.tsx`, `Skeleton.tsx`

No unit tests (rendering is covered by E2E and the /design-system page); verify with typecheck/lint/build and the existing E2E.

- [ ] **Step 1: `components/ui/Button.tsx`** (same props as before plus `size`; default `type="button"`)

```tsx
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "success";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary shadow-sm hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-ink shadow-sm hover:bg-surface-muted",
  ghost: "text-ink-2 hover:bg-surface-muted hover:text-ink",
  success: "bg-secondary text-on-secondary shadow-sm hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" className={buttonClasses(variant, size, className)} {...props} />;
}
```

`buttonClasses` lets links look like buttons (`<Link className={buttonClasses("secondary")}>`).

- [ ] **Step 2: `components/ui/Card.tsx`**

```tsx
import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = { as?: T; raised?: boolean; className?: string } & Omit<ComponentProps<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({ as, raised = false, className, ...props }: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn("rounded-lg border border-border bg-surface", raised ? "shadow-lg" : "shadow-sm", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 3: `components/ui/Badge.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-2 border-border",
  primary: "bg-primary-subtle text-primary-text border-transparent",
  success: "bg-secondary-subtle text-secondary-text border-transparent",
  warning: "bg-warning-subtle text-warning-text border-transparent",
  danger: "bg-danger-subtle text-danger border-transparent",
};

export function Badge({ tone = "neutral", pill = false, className, children }: { tone?: Tone; pill?: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border font-medium",
        pill ? "rounded-full px-3 py-1 text-[13px]" : "rounded-sm px-2 py-0.5 text-xs",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: `components/ui/Alert.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "danger" | "warning" | "info" | "success";

const TONES: Record<AlertTone, string> = {
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-subtle text-warning-text",
  info: "bg-primary-subtle text-primary-text",
  success: "bg-secondary-subtle text-secondary-text",
};

/** role "alert" interrupts screen readers; use "status" for non-urgent notes. */
export function Alert({
  tone = "danger",
  role = "alert",
  title,
  children,
  actions,
  className,
}: {
  tone?: AlertTone;
  role?: "alert" | "status";
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div role={role} className={cn("rounded-md px-4 py-3 text-sm", TONES[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 5: `components/ui/Field.tsx`**

```tsx
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClasses =
  "w-full rounded-md border border-input bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-3 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60 md:text-sm";

export function Field({
  id,
  label,
  hint,
  hintId,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  hintId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClasses, "min-h-40 resize-y leading-relaxed", className)} {...props} />;
}
```

- [ ] **Step 6: `components/ui/Tabs.tsx`** (Radix wrapper; panels stay mounted and hide when inactive)

```tsx
"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn("flex gap-1 overflow-x-auto border-b border-border", className)} {...props} />;
}

export function Tab({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[state=active]:border-primary data-[state=active]:text-primary-text",
        className,
      )}
      {...props}
    />
  );
}

/** Always mounted so in-progress streams and edits survive tab switches. */
export function TabPanel({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content forceMount className={cn("pt-5 data-[state=inactive]:hidden", className)} {...props} />;
}
```

- [ ] **Step 7: `components/ui/ScoreRing.tsx`** (replaces `components/analysis/ScoreGauge.tsx`, keep the same aria-label text)

```tsx
import { cn } from "@/lib/cn";

const SIZES = { sm: 48, md: 72, lg: 112 } as const;

export function ScoreRing({ score, size = "md", className }: { score?: number; size?: keyof typeof SIZES; className?: string }) {
  const px = SIZES[size];
  const stroke = size === "sm" ? 6 : 8;
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      role="img"
      aria-label={typeof score === "number" ? `Match score ${score} out of 100` : "Match score loading"}
      className={cn("shrink-0", className)}
    >
      <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-primary-subtle" />
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${px / 2} ${px / 2})`}
        className="stroke-primary transition-[stroke-dashoffset] duration-500"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-ink font-bold"
        style={{ fontSize: px * 0.3 }}
      >
        {typeof score === "number" ? score : "–"}
      </text>
    </svg>
  );
}
```

- [ ] **Step 8: `components/ui/Stat.tsx`, `components/ui/Skeleton.tsx`**

```tsx
// Stat.tsx
import { cn } from "@/lib/cn";

export function Stat({ value, label, className }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-lg font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-xs text-ink-3">{label}</p>
    </div>
  );
}
```

```tsx
// Skeleton.tsx
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-muted", className)} />;
}
```

- [ ] **Step 9: Rebuild `CopyButton` and `ErrorNotice` on the primitives** — same props, same visible texts and roles:
  - `CopyButton({ text, label, variant?, size? })`: uses `Button` (default `variant="secondary"`); keeps the sr-only `role="status"` and the visible "Copied"/"Copy failed" note, styled `text-xs text-ink-3` / `text-danger`.
  - `ErrorNotice({ error, onRetry })`: renders `<Alert tone="danger">` with the same message, "Try again" `Button variant="secondary" size="sm"` and the "Try the sample from the home page" link (styled `font-semibold underline underline-offset-2`). Keep `role="alert"`.

- [ ] **Step 10: Verify and commit** — `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.

```bash
git add -A && git commit -m "feat: design system primitives"
```

---

### Task 3: Home screen

**Files:** Modify `app/page.tsx`, `components/input/InputForm.tsx`, `components/input/FileDrop.tsx`.

Keep these exact texts/labels (E2E + a11y): heading "Tailor your resume to the job in front of you", labels "Resume text" and "Job description", buttons "Tailor my resume" / "Try sample" (and "Starting…"), file input id `resume-file`, textarea id `resume-text`, status text "Loaded <name>…", the submit hint, counter id `job-count`, all alerts.

- [ ] **Step 1: `app/page.tsx`** structure:

```tsx
<main>
  <section className="bg-band">
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
      <p className="text-sm font-semibold text-primary-text">AI resume tailor</p>
      <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-[-0.025em] text-ink sm:text-5xl">Tailor your resume to the job in front of you</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-2">Fitted scores the match, suggests honest changes line by line, and never adds experience you don't have. You approve every change.</p>
    </div>
  </section>
  <div className="mx-auto -mt-16 max-w-6xl px-4 pb-16 sm:px-6">
    <InputForm />
  </div>
</main>
```

- [ ] **Step 2: `InputForm`** — wrap the form in `<Card raised className="p-5 sm:p-8">`. Two columns (`grid gap-8 md:grid-cols-2`); each column header `h2 text-base font-semibold text-ink` with a one-line `text-sm text-ink-3` description ("Upload a PDF or Word file, or paste the text." / "Paste the full job description."). Use `Field` + `Textarea` for both textareas (keep ids, `aria-describedby`, counter, hint, sr-only over-limit alert). Error `<p role="alert">` → `<Alert tone="danger">`. Footer row `mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6`: `Button` primary "Tailor my resume" (submit), `Button` secondary "Try sample", hint; right side (`sm:ml-auto`) two trust notes, each a teal check icon (`text-secondary`, svg, aria-hidden) + `text-sm text-ink-2`: "Never invents experience" and "Saved only in your browser".

- [ ] **Step 3: `FileDrop`** — drop zone `rounded-md border-2 border-dashed border-input bg-surface-muted px-4 py-6 text-center transition-colors`, dragging → `border-primary bg-primary-subtle`; keep the `has-[:focus-visible]` outline but use `outline-primary`. Upload icon (svg, aria-hidden, `text-ink-3`) above "Drop a PDF or DOCX here, or <span className="font-semibold text-primary-text underline underline-offset-2">browse</span>", a second line `text-xs text-ink-3` "Up to 4 MB". Status line: reading → `text-ink-2`, done → `text-secondary-text` with a check icon, error → `text-danger`.

- [ ] **Step 4: Verify and commit** — lint/typecheck/test/build/e2e.

```bash
git add -A && git commit -m "feat: redesign home screen"
```

---

### Task 4: Tailoring workspace

**Files:**
- Modify: `components/tailor/TailorView.tsx`, `components/analysis/AnalysisPanel.tsx`, `components/diff-editor/DiffEditor.tsx`, `components/diff-editor/SuggestionCard.tsx`, `components/cover-letter/CoverLetterPanel.tsx`, `components/export/ResumePreview.tsx`
- Create: `components/tailor/SummaryBar.tsx`, `components/export/ExportActions.tsx`, `components/export/LivePreview.tsx`
- Delete: `components/export/ExportPanel.tsx`, `components/analysis/ScoreGauge.tsx`

Keep (E2E): ScoreRing aria-label "Match score N out of 100" — rendered **once** on the page (in the summary bar; AnalysisPanel no longer renders a ring); tab names "Analysis", "Rewrite", "Cover letter"; every DiffEditor/SuggestionCard name and text from the previous tasks; "Download PDF" / "Preparing PDF…"; "Copy as Markdown"; page h1 = run title; cover letter labels.

- [ ] **Step 1: `ExportActions`** — move the PDF download + charset guard + failure alert + Copy Markdown out of `ExportPanel` unchanged in behaviour: props `{ resume: Resume }`; renders `Button` primary size sm "Download PDF" (disabled when unsupported chars) and `CopyButton` "Copy as Markdown" size sm; the charset `Alert tone="warning"` and failure `Alert tone="danger"` render below via a `children`-free layout (`flex flex-wrap items-center gap-2`, alerts full width `basis-full`).

- [ ] **Step 2: `SummaryBar`** — props `{ run: Run; finalResume: Resume; accepted: number; total: number; saveFailed: boolean }`. `Card` with `p-4 sm:p-5`, `flex flex-wrap items-center gap-x-6 gap-y-4`: `ScoreRing size="md" score={run.analysis?.score}`; title block (`p` "Tailoring for" `text-xs font-semibold uppercase tracking-wide text-primary-text`, `h1 text-xl font-semibold tracking-tight text-ink` = `run.title`); `Stat`s "Changes accepted" `${accepted} of ${total}` (only when rewrite exists) and "Skills matched" (count of analysis.matchedSkills, when analysis exists); `ExportActions` pushed right (`sm:ml-auto`). Save-failed note as `Alert tone="warning" role="status"` full width.

- [ ] **Step 3: `LivePreview`** — `<Card as="section" aria-labelledby="preview-heading" className="p-4 sm:p-5 lg:sticky lg:top-20">` with header row: `h2 id="preview-heading"` "Live preview" (`text-sm font-semibold text-ink`) + `Badge tone="success"` "Updates as you accept" ; body: `ResumePreview` inside a scroll container `max-h-[calc(100vh-12rem)] overflow-auto rounded-md border border-border bg-[#ffffff] p-6 text-[#0d1b2a] sm:p-8` (white "paper" in both themes — use literal paper colours here only, with a comment).

- [ ] **Step 4: `ResumePreview` flash** — add a `changedIds?: Set<string>` prop; bullets whose id is in the set get `animate-flash rounded-sm` and a `key` of `${id}-${text}` so the animation replays on each change. TailorView computes `changedIds` = ids whose decision is `accepted` (cheap; the key change on text makes only edited/newly accepted lines replay). Keep the owner-format layout and colours as they are (paper colours, not tokens — it mirrors the PDF).

- [ ] **Step 5: `TailorView` layout**

```tsx
<main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
  <SummaryBar … />
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <Card className="p-4 sm:p-5">
      <Tabs defaultValue="analysis">
        <TabList aria-label="Tailoring steps">
          <Tab value="analysis">Analysis</Tab>
          <Tab value="rewrite">Rewrite</Tab>
          <Tab value="cover-letter">Cover letter</Tab>
        </TabList>
        <TabPanel value="analysis">…AnalysisPanel</TabPanel>
        <TabPanel value="rewrite">…DiffEditor</TabPanel>
        <TabPanel value="cover-letter">…CoverLetterPanel</TabPanel>
      </Tabs>
    </Card>
    <LivePreview resume={finalResume} changedIds={changedIds} />
  </div>
</main>
```

Loading / not found / load-failed states: centered `Card` with heading + text + `Link` styled `buttonClasses("secondary")`. Remove the old h1 block (title now lives in SummaryBar). Keep all stream/auto-start/save logic untouched.

- [ ] **Step 6: Restyle panels with tokens and primitives** (behaviour unchanged):
  - `AnalysisPanel`: no ring. Top: seniority `Badge tone="primary"` + summary paragraph `text-[15px] leading-relaxed text-ink`. Skill groups: h2 `text-sm font-semibold text-ink`, chips `Badge pill` tones success (matched), warning (missing), neutral (keywords). Skeleton → `Skeleton` blocks. Errors → ErrorNotice.
  - `DiffEditor`: counter line `text-sm font-medium text-ink`, note `text-xs text-ink-3`; section header h2 `text-base font-semibold text-ink`; "Accept all safe" `Button variant="secondary" size="sm"`, "Reset" `Button variant="ghost" size="sm"`.
  - `SuggestionCard`: `rounded-md border p-4 transition-colors`; pending `border-border bg-surface`; accepted `border-secondary bg-secondary-subtle/40`; rejected `border-dashed border-border bg-surface-muted`. "ORIGINAL"/"SUGGESTED" labels `text-[11px] font-semibold uppercase tracking-wide text-ink-3`. `<del>` → `text-danger decoration-danger/60`; `<ins>` → `rounded-sm bg-secondary-subtle px-0.5 text-secondary-text no-underline underline decoration-secondary/50 underline-offset-2`. Badge "Check this…" → `Badge tone="warning"`; "Rejected" → `Badge tone="neutral"`. Buttons: Accept → `variant={accepted ? "success" : "secondary"} size="sm"` (keep `aria-pressed`, keep text "Accept"); Reject → `variant="secondary" size="sm"`, pressed adds `className="bg-surface-muted"` via `cn` (tailwind-merge now resolves the conflict); Edit → ghost sm. Edit textarea → `Textarea`.
  - `CoverLetterPanel`: tone radios as segmented pills (visually hidden native radio + label styled `rounded-full border px-3 py-1.5 text-sm`, checked `border-primary bg-primary-subtle text-primary-text`, focus-visible ring on the label via `has-[:focus-visible]`); buttons via `Button`/`CopyButton`; textarea via `Textarea` (keep label "Cover letter", legend "Tone").

- [ ] **Step 7: Verify** — lint/typecheck/test/build. E2E will fail where it uses the Export tab; that is fixed in Task 7 — run `npx playwright test tests/e2e/a11y.spec.ts` only if it doesn't reference Export (it does — skip E2E here and say so). Commit:

```bash
git add -A && git commit -m "feat: tailoring workspace with live preview"
```

---

### Task 5: History screen

**Files:** Modify `app/history/page.tsx`, `components/history/HistoryList.tsx`.

Keep: h1 "History", "Saved in this browser only.", "Match N/100" text, aria-label "Delete <title>", "No tailored resumes yet", alerts, confirm.

- [ ] Page: `<main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">`, header row with h1 `text-2xl font-semibold tracking-tight text-ink` + subtitle `text-sm text-ink-3`, and a primary `Link` styled `buttonClasses("primary","sm")` "New run" → `/`.
- [ ] List: `ul className="grid gap-3"`; each `li` is a `Card` `flex items-center gap-4 p-4 transition-shadow hover:shadow-md`: score `Badge tone="primary"` (`Match 72/100`) or `Badge` "No score yet"; title `Link` `font-semibold text-ink hover:text-primary-text` (whole-card click not needed); date `text-xs text-ink-3`; Delete `Button variant="ghost" size="sm"` (keep aria-label). Empty state: `Card` centered with text and a primary link "Start one".
- [ ] Verify (lint/typecheck/test/build) and commit `"feat: redesign history"`.

---

### Task 6: /design-system page

**Files:** Create `app/design-system/page.tsx`, `components/design-system/TokenSwatch.tsx`, `components/design-system/Showcase.tsx` (client, for interactive examples).

- [ ] Page (server component, `export const metadata = { title: "Design system · Fitted" }`), `<main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">`:
  1. Intro: h1 "Fitted design system", short paragraph: Stripe-inspired structure, one primary + one secondary colour, light and dark themes, WCAG AA contrast; note "Use the theme toggle in the header to see dark mode."
  2. **Colour**: two groups — "Brand" (primary, primary-hover, primary-subtle, primary-text, secondary, secondary-subtle, secondary-text), "Neutrals" (canvas, surface, surface-muted, band, ink, ink-2, ink-3, border, border-strong, input), "Meaning" (danger, danger-subtle, warning-text, warning-subtle). Each `TokenSwatch` shows a colour chip (`style={{ background: "var(--c-<name>)" }}`), the token name (`font-mono text-xs`), the Tailwind utility (`bg-<name>`), and the light/dark hex values from a constant `TOKENS` array in the page (copy the values from `app/globals.css`).
  3. **Typography**: rows for Display (text-5xl bold), H1 (text-2xl semibold), H2 (text-base semibold), Body (15px), Small (text-sm), Caption (text-xs ink-3), each with its spec ("48 / 700 / -2.5%").
  4. **Spacing, radius, shadow**: spacing bars 4–64px; radius boxes sm/md/lg/pill; shadow cards sm/md/lg.
  5. **Components** (`Showcase`, client): Buttons (all variants × sizes, disabled, as link), Badges (all tones, pill), Alerts (all tones, with title and actions), Field + Textarea (with hint), Tabs (3 tabs with short content), ScoreRing (sm/md/lg at 35, 72, 94), Stat, Skeleton, a sample SuggestionCard in pending/accepted/rejected states (static props, no handlers needed — pass `decision` and a no-op `onChange` for the interactive ones), CopyButton.
  6. **Principles**: 4 short bullets — one primary action per view; colour carries meaning, not decoration; every state designed (loading, empty, partial, error); accessible by default (AA contrast, focus rings, keyboard, reduced motion).
  Use h2 for section titles, h3 for sub-groups.
- [ ] Verify (lint/typecheck/build; open nothing) and commit `"feat: design system documentation page"`.

---

### Task 7: Tests for the new UI

**Files:** Modify `tests/e2e/fitted.spec.ts`, `tests/e2e/a11y.spec.ts`; Create `tests/e2e/theme.spec.ts`.

- [ ] `fitted.spec.ts` "sample run" test: replace the Export tab steps with: preview region `page.getByRole("region", { name: "Live preview" })` contains the accepted text (`toBeVisible`); click "Download PDF" (in the summary bar) and keep the filename + `%PDF-` byte assertions.
- [ ] `a11y.spec.ts`: run every existing check in both themes — `for (const theme of ["light", "dark"] as const)` set `await page.addInitScript((t) => localStorage.setItem("fitted-theme", t), theme)` before `goto`; tailor tabs are now Analysis, Rewrite, Cover letter; add `/design-system`. No axe rule may be disabled; fix violations in components (contrast, names, landmarks).
- [ ] `theme.spec.ts`: (1) system dark → `page.emulateMedia({ colorScheme: "dark" })`, goto `/`, expect `html` `data-theme="dark"`; (2) click "Switch to dark theme" in light → `data-theme="dark"`, reload → still dark, button now named "Switch to light theme"; (3) `/design-system` shows h1 "Fitted design system" and the "Colour" heading.
- [ ] Run `npm run test:e2e` (port 3100 free) until green; commit `"test: workspace, theme and design-system E2E"`.

---

### Task 8: Screenshots and README

**Files:** Create `scripts/screenshots.mjs`, `docs/screenshots/*.png`; Modify `README.md`, `package.json` (script).

- [ ] `scripts/screenshots.mjs`: uses `@playwright/test`'s `chromium` against `http://localhost:3100` (expects `MOCK_AI=1 npm run start -- --port 3100` running): for `light` and `dark` (via `addInitScript` localStorage), capture `home-<theme>.png` (viewport 1280×860) and `workspace-<theme>.png` (Try sample → Rewrite tab → accept first suggestion → wait 1.5 s for the flash to finish, viewport 1440×900, full page), plus `design-system-light.png` (1280×860, top of page). Save to `docs/screenshots/`. Add `"screenshots": "node scripts/screenshots.mjs"`.
- [ ] Run it, check the images look right, commit them (they contain only sample data).
- [ ] README: under the title add a light/dark workspace screenshot pair; add a "Design system" section: tokens as CSS variables mapped into Tailwind v4, light + dark, one primary (blue) + one secondary (teal), components in `components/ui` on Radix, `cn()` merge, documented live at `/design-system`, AA contrast. Update the Features list ("Workspace with live resume preview", "Light and dark themes").
- [ ] Final full check: `npm run lint && npm run typecheck && npm test && npm run test:e2e`. Commit `"docs: screenshots and design system section"`.
