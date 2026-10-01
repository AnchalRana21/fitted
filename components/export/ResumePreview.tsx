import { isRoleLine } from "@/lib/resume";
import type { Resume } from "@/lib/schemas";

export function ResumePreview({ resume }: { resume: Resume }) {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-8 text-sm leading-relaxed shadow-sm">
      {resume.sections.map((section) =>
        section.title === "Header" ? (
          <div key={section.id}>
            {section.bullets.map((b, i) =>
              i === 0 ? (
                <p key={b.id} className="text-2xl font-semibold">
                  {b.text}
                </p>
              ) : (
                <p key={b.id} className="text-neutral-700">
                  {b.text}
                </p>
              ),
            )}
          </div>
        ) : (
          <section key={section.id}>
            <h3 className="border-b border-neutral-300 pb-1 text-xs font-bold uppercase tracking-wide">
              {section.title}
            </h3>
            <ul className="mt-2 space-y-1">
              {section.bullets.map((b) =>
                isRoleLine(b.text) ? (
                  <li key={b.id} className="pt-1 font-semibold">
                    {b.text}
                  </li>
                ) : (
                  <li key={b.id} className="ml-4 list-disc">
                    {b.text}
                  </li>
                ),
              )}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
