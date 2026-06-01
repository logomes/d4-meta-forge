import { CLASSES } from "../../data/taxonomy.js";

export default function Glyph({ cls, size = 44 }) {
  const meta = CLASSES[cls] || { color: "#9c8a76", rune: "?" };
  const r = size * 0.16;
  return (
    <div
      className="relative grid flex-[0_0_auto] place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: `radial-gradient(120% 120% at 50% 0%, ${meta.color}33, #0c0907 78%)`,
        border: `1px solid ${meta.color}66`,
        boxShadow: `inset 0 1px 0 ${meta.color}55, 0 2px 10px #0008`,
      }}
    >
      <span
        className="font-display font-semibold leading-none"
        style={{ fontSize: size * 0.46, color: meta.color, textShadow: `0 0 12px ${meta.color}aa` }}
      >
        {meta.rune}
      </span>
      <span
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -1,
          width: size * 0.5,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }}
      />
    </div>
  );
}
