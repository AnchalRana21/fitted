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
