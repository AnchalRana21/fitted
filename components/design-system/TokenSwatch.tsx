export type ColorToken = {
  /** Name without the `--c-` prefix, e.g. "primary-subtle". */
  name: string;
  light: string;
  dark: string;
  usage: string;
  /** Tailwind prefix used in the docs, e.g. "text" for ink tokens. Defaults to "bg". */
  utility?: "bg" | "text" | "border";
};

/** Colour chip plus labels below it, so no text ever sits on the swatch itself. */
export function TokenSwatch({ token }: { token: ColorToken }) {
  const utility = `${token.utility ?? "bg"}-${token.name}`;
  return (
    <li className="min-w-0">
      <div
        aria-hidden="true"
        className="h-16 rounded-md border border-border shadow-sm"
        style={{ background: `var(--c-${token.name})` }}
      />
      <div className="mt-2.5 space-y-0.5">
        <p className="truncate font-mono text-xs font-semibold text-ink">--c-{token.name}</p>
        <p className="truncate font-mono text-xs text-primary-text">{utility}</p>
        <p className="text-xs text-ink-2">{token.usage}</p>
        <p className="font-mono text-[11px] text-ink-3">
          <span className="sr-only">Light value </span>
          <span aria-hidden="true">L </span>
          {token.light}
          <span aria-hidden="true"> · D </span>
          <span className="sr-only">, dark value </span>
          {token.dark}
        </p>
      </div>
    </li>
  );
}
