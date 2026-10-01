import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Showcase } from "@/components/design-system/Showcase";
import { TokenSwatch } from "@/components/design-system/TokenSwatch";
import { TOKENS } from "@/lib/design-tokens";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";

export const metadata: Metadata = { title: "Design system · Fitted" };

const TOKEN_COUNT = TOKENS.reduce((n, g) => n + g.tokens.length, 0);

const TYPE_SCALE = [
  { name: "Display", spec: "48 / 700 / -2.5%", className: "text-5xl font-bold tracking-[-0.025em]", sample: "Tailor your resume" },
  { name: "H1", spec: "24 / 600 / -2.5%", className: "text-2xl font-semibold tracking-tight", sample: "Your match score" },
  { name: "H2", spec: "16 / 600", className: "text-base font-semibold", sample: "Missing keywords" },
  { name: "Body", spec: "15 / 400 / 1.6", className: "text-[15px] leading-relaxed", sample: "Fitted suggests honest changes line by line and never adds experience you don't have." },
  { name: "Small", spec: "14 / 400", className: "text-sm text-ink-2", sample: "Paste the full posting for the best match." },
  { name: "Caption", spec: "12 / 400 · ink-3", className: "text-xs text-ink-3", sample: "Saved on this device · 2 minutes ago" },
];

const SPACING = [
  { px: 4, cls: "1" },
  { px: 8, cls: "2" },
  { px: 12, cls: "3" },
  { px: 16, cls: "4" },
  { px: 24, cls: "6" },
  { px: 32, cls: "8" },
  { px: 48, cls: "12" },
  { px: 64, cls: "16" },
];

const RADII = [
  { name: "sm", value: "6px", className: "rounded-sm", use: "Badges, inline marks" },
  { name: "md", value: "10px", className: "rounded-md", use: "Inputs, alerts" },
  { name: "lg", value: "14px", className: "rounded-lg", use: "Cards, panels" },
  { name: "pill", value: "9999px", className: "rounded-full", use: "Buttons, chips" },
];

const SHADOWS = [
  { name: "sm", className: "shadow-sm", use: "Resting cards, buttons" },
  { name: "md", className: "shadow-md", use: "Hover, popovers" },
  { name: "lg", className: "shadow-lg", use: "Raised panels" },
];

const SECTIONS = [
  { id: "tokens", label: "How tokens work" },
  { id: "colour", label: "Colour" },
  { id: "typography", label: "Typography" },
  { id: "space", label: "Spacing, radius, shadow" },
  { id: "components", label: "Components" },
  { id: "principles", label: "Principles" },
];

const PRINCIPLES = [
  { title: "One primary action per view", body: "Every screen has a single blue button. Everything else is secondary or ghost." },
  { title: "Colour carries meaning, not decoration", body: "Blue means act, teal means accepted, red means wrong, amber means check this." },
  { title: "Every state is designed", body: "Loading, empty, partial and error states get the same care as the happy path." },
  { title: "Accessible by default", body: "AA contrast in both themes, visible focus rings, full keyboard support and reduced motion." },
];

const TOKEN_SNIPPET = `/* 1. app/globals.css: a raw value per theme */
:root               { --c-primary: #0b63ce; }
[data-theme="dark"] { --c-primary: #4c9aff; }

/* 2. Expose it to Tailwind v4 */
@theme inline {
  --color-primary: var(--c-primary);
}

/* 3. Components use the utility, never the hex */
<button className="bg-primary text-on-primary hover:bg-primary-hover">`;

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-primary-text">Fitted · v1</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.025em] text-ink sm:text-5xl">Fitted design system</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">
          A small, token-based system with a Stripe-inspired structure: one primary and one secondary colour, calm
          neutrals, light and dark themes, and WCAG AA contrast throughout. Every screen in Fitted is built from the
          tokens and components on this page.
        </p>
        <p className="mt-3 text-sm text-ink-3">Use the theme toggle in the header to see dark mode.</p>
        <div className="mt-8 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: TOKEN_COUNT, label: "Colour tokens" },
            { value: 2, label: "Themes" },
            { value: 12, label: "Components" },
            { value: "AA", label: "Contrast" },
          ].map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} className="border-l-2 border-primary pl-3" />
          ))}
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="On this page" className="mb-10 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-3">On this page</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5 lg:border-l lg:border-border">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:bg-transparent lg:py-1.5 lg:pl-4 lg:hover:border-border-strong"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-16">
          <Section
            id="tokens"
            title="How tokens work"
            intro="Colours are CSS custom properties. Dark mode swaps the values under one attribute, so components never branch on theme and a single utility class works in both."
          >
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="font-mono text-xs text-ink-2">CSS variable → Tailwind utility</p>
              </div>
              <pre
                tabIndex={0}
                aria-label="Token mapping example"
                className="overflow-x-auto bg-surface-muted px-5 py-4 font-mono text-[13px] leading-relaxed text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <code>{TOKEN_SNIPPET}</code>
              </pre>
            </Card>
          </Section>

          <Section
            id="colour"
            title="Colour"
            intro="Each swatch shows the variable, the Tailwind utility it powers and its light and dark values. Swatches render the live variable, so they follow the current theme."
          >
            <div className="space-y-10">
              {TOKENS.map((g) => (
                <div key={g.group}>
                  <h3 className="text-base font-semibold text-ink">{g.group}</h3>
                  <p className="mt-1 text-sm text-ink-2">{g.description}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {g.tokens.map((t) => (
                      <TokenSwatch key={t.name} token={t} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="typography" title="Typography" intro="Inter throughout. Size / weight / letter-spacing; tight tracking on large sizes only.">
            <Card as="ul" className="divide-y divide-border">
              {TYPE_SCALE.map((t) => (
                <li key={t.name} className="grid gap-2 px-5 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-6">
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="font-mono text-xs text-ink-3">{t.spec}</p>
                  </div>
                  <p className={`min-w-0 text-ink ${t.className}`}>{t.sample}</p>
                </li>
              ))}
            </Card>
          </Section>

          <Section id="space" title="Spacing, radius, shadow" intro="A 4px base grid, three radii plus pill, and three soft shadows tinted by the theme.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-5 lg:row-span-2">
                <h3 className="text-base font-semibold text-ink">Spacing</h3>
                <ul className="mt-5 space-y-4">
                  {SPACING.map((s) => (
                    <li key={s.px} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                      <span className="font-mono text-xs text-ink-2">
                        {s.px}px
                        <span className="sr-only">, Tailwind step {s.cls}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="h-3 rounded-sm bg-primary" style={{ width: s.px * 3 }} />
                        <span className="font-mono text-xs text-ink-3" aria-hidden="true">
                          {s.cls}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-ink-3">Bars drawn at 3× scale. Labels show the Tailwind step (p-4 = 16px).</p>
              </Card>

              <Card className="p-5">
                <h3 className="text-base font-semibold text-ink">Radius</h3>
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {RADII.map((r) => (
                    <li key={r.name}>
                      <div aria-hidden="true" className={`h-14 border-2 border-primary bg-primary-subtle ${r.className}`} />
                      <p className="mt-2 font-mono text-xs font-semibold text-ink">{r.name}</p>
                      <p className="font-mono text-xs text-ink-2">{r.value}</p>
                      <p className="text-xs text-ink-3">{r.use}</p>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <h3 className="text-base font-semibold text-ink">Shadow</h3>
                <ul className="mt-4 grid grid-cols-3 gap-4 rounded-md bg-canvas p-4">
                  {SHADOWS.map((s) => (
                    <li key={s.name}>
                      <div aria-hidden="true" className={`h-14 rounded-md border border-border bg-surface ${s.className}`} />
                      <p className="mt-3 font-mono text-xs font-semibold text-ink">shadow-{s.name}</p>
                      <p className="text-xs text-ink-3">{s.use}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Section>

          <Section
            id="components"
            title="Components"
            intro="Small primitives in components/ui hold every styling decision; screens only compose them. Overrides go through cn(), which merges Tailwind classes safely."
          >
            <Showcase />
          </Section>

          <Section id="principles" title="Principles">
            <ul className="grid gap-4 sm:grid-cols-2">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title}>
                  <Card className="h-full p-5">
                    <p aria-hidden="true" className="font-mono text-xs font-semibold text-primary-text">
                      0{i + 1}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1 text-sm text-ink-2">{p.body}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </main>
  );
}
