import { Acacia, Bush, GrassTuft } from "./savanna-scene";

/**
 * Redesign Gaming G4b — serpentine trail shared by the world map and the
 * subject maps. Stops alternate left/right down the screen; the connector is
 * one SVG path (sand base + dashed center line) drawn behind the nodes.
 *
 * Coordinates: x in percent of container width, y in px from the top —
 * the SVG uses a 100-unit-wide viewBox with preserveAspectRatio="none" and
 * non-scaling strokes so the path hugs the nodes at every screen width.
 */

export type TrailStop = { x: number; y: number };

export function trailStops(
  count: number,
  { rowHeight, xEven = 28, xOdd = 72, yOffset = 0 }: {
    rowHeight: number;
    xEven?: number;
    xOdd?: number;
    yOffset?: number;
  },
): TrailStop[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? xEven : xOdd,
    y: yOffset + i * rowHeight + rowHeight / 2,
  }));
}

export function trailHeight(count: number, rowHeight: number, pad = 24) {
  return count * rowHeight + pad;
}

function pathFrom(stops: TrailStop[]): string {
  if (stops.length === 0) return "";
  const [first, ...rest] = stops;
  let d = `M ${first.x} ${first.y}`;
  let prev = first;
  for (const stop of rest) {
    const bend = (stop.y - prev.y) * 0.55;
    d += ` C ${prev.x} ${prev.y + bend}, ${stop.x} ${stop.y - bend}, ${stop.x} ${stop.y}`;
    prev = stop;
  }
  return d;
}

export function TrailConnector({
  stops,
  height,
}: {
  stops: TrailStop[];
  height: number;
}) {
  const d = pathFrom(stops);
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      fill="none"
    >
      {/* sand base */}
      <path
        d={d}
        stroke="#fde68a"
        strokeWidth="16"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.9"
      />
      {/* dashed walking line */}
      <path
        d={d}
        stroke="#d97706"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="0.5 12"
        vectorEffect="non-scaling-stroke"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * Light scenery sprinkled on the empty side of every other stop — enough to
 * make the trail feel like terrain, cheap enough to be free.
 */
export function TrailScenery({
  stops,
  height,
}: {
  stops: TrailStop[];
  height: number;
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 400 ${height}`}
      preserveAspectRatio="none"
      fill="none"
    >
      {stops.map((stop, i) => {
        // opposite side of the node, alternating decor
        const x = stop.x < 50 ? 300 : 80;
        const kind = i % 3;
        return (
          <g key={i} transform={`translate(${x} ${stop.y + 8})`}>
            {kind === 0 && <Bush x={0} y={0} s={0.7} />}
            {kind === 1 && <Acacia x={0} y={-46} s={0.55} />}
            {kind === 2 && (
              <>
                <GrassTuft x={-10} y={4} />
                <ellipse cx="26" cy="4" rx="18" ry="10" fill="#d6d3d1" />
                <ellipse cx="20" cy="0" rx="9" ry="5" fill="#e7e5e4" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
