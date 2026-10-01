"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SuggestionCard } from "@/components/diff-editor/SuggestionCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field, Textarea, controlClasses } from "@/components/ui/Field";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";
import type { Decision, DecisionStatus } from "@/lib/apply";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "success", "danger"];
const SIZES: ButtonSize[] = ["md", "sm"];

function Demo({ title, usage, description, children }: { title: string; usage: string; description: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-2">{description}</p>
        <p className="mt-2 font-mono text-xs break-words text-primary-text">{usage}</p>
      </div>
      <div className="flex-1 px-5 py-6">{children}</div>
    </Card>
  );
}

const LABEL = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3";

function DemoSuggestion({ initial, original, newText, reason, verify = false }: { initial: DecisionStatus; original: string; newText: string; reason: string; verify?: boolean }) {
  const [decision, setDecision] = useState<Decision>({ status: initial, text: newText });
  return (
    <div>
      <p className={LABEL}>{initial}</p>
      <SuggestionCard original={original} newText={newText} reason={reason} verify={verify} decision={decision} onChange={setDecision} />
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function DemoConfirm() {
  const [open, setOpen] = useState<"danger" | "primary" | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" onClick={() => setOpen("danger")}>
        Delete run…
      </Button>
      <Button variant="secondary" onClick={() => setOpen("primary")}>
        Replace letter…
      </Button>
      <ConfirmDialog
        open={open === "danger"}
        onOpenChange={(next) => setOpen(next ? "danger" : null)}
        title="Delete this run?"
        description="“Senior Frontend Engineer at Acme” will be removed from this browser. This can't be undone."
        confirmLabel="Delete run"
        tone="danger"
        onConfirm={() => wait(600)}
      />
      <ConfirmDialog
        open={open === "primary"}
        onOpenChange={(next) => setOpen(next ? "primary" : null)}
        title="Replace your cover letter?"
        description="Writing a new version replaces the current letter, including any edits you made."
        confirmLabel="Write new version"
        onConfirm={() => wait(600)}
      />
    </div>
  );
}

export function Showcase() {
  return (
    <div className="grid gap-6">
      <Demo
        title="Button"
        usage={'<Button variant="primary" size="md">  ·  buttonClasses("secondary") for links'}
        description="Pill-shaped. One primary action per view; secondary for alternatives, ghost for low-emphasis, success to confirm an accepted state, danger for destructive confirmations."
      >
        <div className="space-y-5">
          {SIZES.map((size) => (
            <div key={size}>
              <p className={LABEL}>Size {size}</p>
              <div className="flex flex-wrap items-center gap-3">
                {VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} size={size}>
                    {variant[0].toUpperCase() + variant.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className={LABEL}>States</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Link href="/" className={buttonClasses("secondary")}>
                Link styled as button
              </Link>
            </div>
          </div>
        </div>
      </Demo>

      <div className="grid gap-6 xl:grid-cols-2">
        <Demo title="Badge" usage={'<Badge tone="success" pill>'} description="Short status labels. Tone carries meaning; pill for keyword chips.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="primary">Primary</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Danger</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge pill tone="success">TypeScript</Badge>
              <Badge pill tone="success">React</Badge>
              <Badge pill tone="danger">Kubernetes</Badge>
              <Badge pill>GraphQL</Badge>
            </div>
          </div>
        </Demo>

        <Demo title="Field and Textarea" usage={'<Field id label hint hintId><Textarea aria-describedby /></Field>'} description="Label above, hint below, 4px focus ring in primary.">
          <div className="space-y-4">
            <Field id="ds-role" label="Job title">
              <input id="ds-role" className={controlClasses} defaultValue="Frontend engineer" />
            </Field>
            <Field id="ds-notes" label="Job description" hint="Paste the full posting for the best match." hintId="ds-notes-hint">
              <Textarea id="ds-notes" aria-describedby="ds-notes-hint" placeholder="We're hiring a frontend engineer…" className="min-h-24" />
            </Field>
          </div>
        </Demo>
      </div>

      <Demo title="Alert" usage={'<Alert tone="warning" title actions>'} description="Inline messages on a subtle tinted background. role=&quot;alert&quot; for errors, &quot;status&quot; for notes.">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="danger" role="status" title="Couldn't read that file" actions={<Button variant="secondary" size="sm">Try again</Button>}>
            The PDF looks scanned. Paste the text instead.
          </Alert>
          <Alert tone="warning" role="status" title="Check two suggestions">
            They add details we couldn&apos;t find in your resume.
          </Alert>
          <Alert tone="info" role="status" title="Sample data">
            You&apos;re viewing a demo run with a sample resume.
          </Alert>
          <Alert tone="success" role="status" title="Saved to history" actions={<Button variant="ghost" size="sm">View history</Button>}>
            This run is stored on this device only.
          </Alert>
        </div>
      </Demo>

      <div className="grid gap-6 xl:grid-cols-2">
        <Demo title="Tabs" usage="<Tabs><TabList><Tab /></TabList><TabPanel /></Tabs>" description="Radix Tabs: arrow-key navigation, panels stay mounted.">
          <Tabs defaultValue="analysis">
            <TabList aria-label="Example tabs">
              <Tab value="analysis">Analysis</Tab>
              <Tab value="rewrite">Rewrite</Tab>
              <Tab value="letter">Cover letter</Tab>
            </TabList>
            <TabPanel value="analysis" className="text-sm text-ink-2">
              Match score, matched and missing keywords, strengths and gaps.
            </TabPanel>
            <TabPanel value="rewrite" className="text-sm text-ink-2">
              Line-by-line suggestions you accept, reject or edit.
            </TabPanel>
            <TabPanel value="letter" className="text-sm text-ink-2">
              A short cover letter drafted from your real experience.
            </TabPanel>
          </Tabs>
        </Demo>

        <Demo title="ScoreRing and Stat" usage={'<ScoreRing score={72} size="md" />  ·  <Stat value label />'} description="The match score at a glance, with supporting numbers.">
          <div className="flex flex-wrap items-center gap-6">
            <ScoreRing score={35} size="sm" />
            <ScoreRing score={72} size="md" />
            <ScoreRing score={94} size="lg" />
            <div className="flex gap-6">
              <Stat value={12} label="Keywords matched" />
              <Stat value={4} label="Missing" />
              <Stat value="9 / 11" label="Accepted" />
            </div>
          </div>
        </Demo>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Demo title="Skeleton" usage={'<Skeleton className="h-4 w-2/3" />'} description="Loading placeholders shaped like the content they replace; pulse stops with reduced motion.">
          <div className="flex items-start gap-4" aria-hidden="true">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </Demo>

        <Demo title="CopyButton" usage={'<CopyButton text label="Copy letter" />'} description="Copies to the clipboard and announces the result to screen readers.">
          <CopyButton text="Fitted design system" label="Copy text" />
        </Demo>
      </div>

      <Demo
        title="ConfirmDialog"
        usage={'<ConfirmDialog open onOpenChange title description confirmLabel tone="danger" onConfirm />'}
        description="Replaces browser confirm boxes (lint bans alert, confirm and prompt). Focus starts on Cancel; Escape cancels, the backdrop doesn't. An async onConfirm shows Working… until it settles."
      >
        <DemoConfirm />
      </Demo>

      <Demo
        title="SuggestionCard"
        usage="<SuggestionCard original newText reason verify decision onChange />"
        description="The core review unit: a word-level diff with accept, reject and edit. Try the buttons; these examples are live."
      >
        <div className="grid gap-5">
          <DemoSuggestion
            initial="pending"
            original="Built dashboards for the sales team."
            newText="Built React dashboards that cut weekly sales reporting time by 40%."
            reason="Names the stack the posting asks for and shows the impact."
            verify
          />
          <DemoSuggestion
            initial="accepted"
            original="Worked on the design system."
            newText="Led a token-based design system used across four product teams."
            reason="Leadership and scope are in your resume; this makes them visible."
          />
          <DemoSuggestion
            initial="rejected"
            original="Helped with testing."
            newText="Introduced Playwright end-to-end tests covering checkout."
            reason="The posting emphasises automated testing."
          />
        </div>
      </Demo>
    </div>
  );
}
