export default function Radar({ data, color = "var(--accent)", size = 220, max = 10 }) {
  const cx = size / 2,
    cy = size / 2,
    R = size * 0.38;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, rad) => [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = (rad) => data.map((_, i) => point(i, rad).join(",")).join(" ");
  const shape = data
    .map((d, i) => point(i, R * (Math.max(0, Math.min(max, d.value)) / max)).join(","))
    .join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {rings.map((r, k) => (
        <polygon key={k} points={poly(R * r)} fill="none" stroke="var(--line)" strokeWidth="1" opacity={0.7} />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity={0.5} />;
      })}
      <polygon
        points={shape}
        fill={color}
        fillOpacity="0.28"
        stroke={color}
        strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, R * (Math.max(0, Math.min(max, d.value)) / max));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, R + 18);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--f-ui)", fontSize: 10, fill: "var(--muted)" }}
          >
            {d.attribute}
          </text>
        );
      })}
    </svg>
  );
}
