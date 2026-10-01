import { isRoleLine } from "@/lib/resume";
import { headerParts, sectionKind, splitDates, splitLabel, splitLead } from "@/lib/resume-layout";
import type { Bullet, Resume, Section } from "@/lib/schemas";

type Parts = { lead: string; sep: string; rest: string } | null;

function Paragraph({ text, parts }: { text: string; parts: Parts }) {
  if (!parts) return <p>{text}</p>;
  return (
    <p>
      <strong>{parts.lead}</strong>
      {parts.sep}
      {parts.rest}
    </p>
  );
}

/** Groups experience lines into role rows and runs of bullets. */
function experienceGroups(bullets: Bullet[]): ({ role: Bullet } | { items: Bullet[] })[] {
  const groups: ({ role: Bullet } | { items: Bullet[] })[] = [];
  for (const b of bullets) {
    const last = groups.at(-1);
    if (isRoleLine(b.text)) groups.push({ role: b });
    else if (last && "items" in last) last.items.push(b);
    else groups.push({ items: [b] });
  }
  return groups;
}

function SectionBody({ section, changedIds }: { section: Section; changedIds?: Set<string> }) {
  const kind = sectionKind(section.title);
  if (kind === "summary") return <p>{section.bullets.map((b) => b.text).join(" ")}</p>;
  if (kind === "skills" || kind === "other") {
    const split = kind === "skills" ? splitLabel : splitLead;
    return section.bullets.map((b) => <Paragraph key={b.id} text={b.text} parts={split(b.text)} />);
  }
  return experienceGroups(section.bullets).map((group) => {
    if ("role" in group) {
      const parts = splitDates(group.role.text);
      return (
        <div key={group.role.id} className="flex justify-between gap-4 pt-1 font-semibold">
          <span>{parts ? parts.main : group.role.text}</span>
          {parts && <span className="shrink-0 text-right">{parts.dates}</span>}
        </div>
      );
    }
    return (
      <ul key={group.items[0].id} className="list-disc space-y-0.5 pl-5">
        {group.items.map((b) =>
          changedIds?.has(b.id) ? (
            // Keyed on the text so the flash replays whenever an accepted line changes.
            <li key={`${b.id}-${b.text}`} className="animate-flash rounded-sm">
              {b.text}
            </li>
          ) : (
            <li key={b.id}>{b.text}</li>
          ),
        )}
      </ul>
    );
  });
}

/**
 * Mirrors the PDF layout. Colours are fixed "paper" colours, not theme tokens: the preview looks
 * like the printed page in both themes. The paper background comes from the container (LivePreview).
 */
export function ResumePreview({ resume, changedIds }: { resume: Resume; changedIds?: Set<string> }) {
  return (
    <div className="space-y-3 text-sm leading-snug text-[#0d1b2a]">
      {resume.sections.map((section) => {
        if (section.title === "Header") {
          const header = headerParts(section.bullets.map((b) => b.text));
          return (
            <div key={section.id} className="text-center">
              {header.name && <p className="text-2xl font-bold uppercase">{header.name}</p>}
              {header.headline && <p className="mt-0.5">{header.headline}</p>}
              {header.contacts.map((line, i) => (
                <p key={i} className="text-[#475467]">
                  {line}
                </p>
              ))}
            </div>
          );
        }
        return (
          <section key={section.id}>
            <h3 className="border-b border-[#0d1b2a] pb-0.5 text-sm font-bold uppercase tracking-wide">
              {section.title}
            </h3>
            <div className="mt-1.5 space-y-1">
              <SectionBody section={section} changedIds={changedIds} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
