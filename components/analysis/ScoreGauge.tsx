const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score }: { score?: number }) {
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  const color = value >= 75 ? "#047857" : value >= 50 ? "#b45309" : "#b91c1c";
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-28 shrink-0"
      role="img"
      aria-label={typeof score === "number" ? `Match score ${score} out of 100` : "Match score loading"}
    >
      <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#e5e5e5" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dashoffset] duration-500"
      />
      <text x="50" y="56" textAnchor="middle" className="fill-neutral-900 text-2xl font-semibold">
        {typeof score === "number" ? score : "–"}
      </text>
    </svg>
  );
}
