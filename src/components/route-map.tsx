import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { INDIAN_CITIES, cityFromLocation, project } from "@/lib/india";

/**
 * Lightweight stylised map of India showing active trip routes.
 * Not a geographical map — just a proportional lon/lat scatter with
 * animated dashed lines linking source → destination.
 */
export function RouteMap() {
  const trips = useStore((s) => s.trips);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const W = 320, H = 340;
  const byName = useMemo(
    () => Object.fromEntries(INDIAN_CITIES.map((c) => [c.name.toLowerCase(), c])),
    [],
  );

  const active = trips
    .filter((t) => t.status === "Dispatched")
    .map((t) => {
      const s = byName[(cityFromLocation(t.source) || "").toLowerCase()];
      const d = byName[(cityFromLocation(t.destination) || "").toLowerCase()];
      if (!s || !d) return null;
      const p1 = project(s.lon, s.lat, W, H);
      const p2 = project(d.lon, d.lat, W, H);
      return { code: t.code, s, d, p1, p2 };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const activeCities = new Set(active.flatMap((r) => [r.s.name, r.d.name]));

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <span className="micro-label">Live Route Map — India</span>
        <span className="text-mono text-[11px] text-primary">● {active.length} in transit</span>
      </div>
      <div className="mt-3 relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <radialGradient id="rm-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </radialGradient>
            <pattern id="rm-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--color-border)" strokeWidth="0.4" opacity="0.5" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="url(#rm-grid)" />

          {/* Stylised India silhouette (rough polygon, decorative) */}
          <path
            d="M 92 40 L 150 30 L 200 45 L 245 60 L 275 90 L 285 130 L 275 170 L 250 200 L 235 235 L 215 275 L 190 305 L 168 320 L 155 305 L 145 275 L 130 245 L 110 215 L 95 180 L 82 145 L 78 105 L 82 70 Z"
            fill="color-mix(in oklab, var(--color-primary) 5%, transparent)"
            stroke="color-mix(in oklab, var(--color-primary) 35%, transparent)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* All known cities as faint markers */}
          {INDIAN_CITIES.map((c) => {
            const { x, y } = project(c.lon, c.lat, W, H);
            const on = activeCities.has(c.name);
            return (
              <g key={c.name}>
                <circle cx={x} cy={y} r={on ? 3.5 : 1.6} fill={on ? "var(--color-primary)" : "var(--color-muted-foreground)"} opacity={on ? 1 : 0.5} />
                {on && (
                  <text x={x + 6} y={y + 3} fontSize="8" fill="var(--color-foreground)" className="font-mono">
                    {c.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Active routes */}
          {active.map((r, i) => (
            <g key={r.code}>
              <line
                x1={r.p1.x} y1={r.p1.y} x2={r.p2.x} y2={r.p2.y}
                stroke="var(--color-primary)" strokeWidth="1.4"
                strokeDasharray="4 4" opacity="0.85"
              >
                {!reducedMotion && (
                  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.4s" repeatCount="indefinite" />
                )}
              </line>
              <circle cx={r.p1.x} cy={r.p1.y} r="10" fill="url(#rm-glow)" />
              <circle cx={r.p2.x} cy={r.p2.y} r="10" fill="url(#rm-glow)" />
              <text x={(r.p1.x + r.p2.x) / 2} y={(r.p1.y + r.p2.y) / 2 - 4} fontSize="7" fill="var(--color-accent)" textAnchor="middle" className="font-mono">
                {r.code}
              </text>
              {i === 0 && (
                <title>{r.s.name} ↔ {r.d.name}</title>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {active.slice(0, 6).map((r) => (
          <span key={r.code} className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {r.s.name} ↔ {r.d.name}
          </span>
        ))}
        {active.length === 0 && (
          <span className="text-[11px] text-muted-foreground">No dispatched trips right now.</span>
        )}
      </div>
    </div>
  );
}
