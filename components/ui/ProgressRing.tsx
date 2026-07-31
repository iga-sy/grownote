export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent-soft)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="animate-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={
            {
              transition: "stroke-dashoffset 0.6s ease",
              "--ring-circumference": circumference,
            } as React.CSSProperties
          }
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink"
        style={{ fontSize: size * 0.22 }}
      >
        {clamped}%
      </span>
    </div>
  );
}
