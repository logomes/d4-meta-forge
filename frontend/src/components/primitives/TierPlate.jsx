import { TIERS } from "../../data/taxonomy.js";

export default function TierPlate({ tier, size = 56 }) {
  const meta = TIERS[tier] || { color: "#9c8a76" };
  return (
    <div
      className="relative grid flex-[0_0_auto] place-items-center overflow-hidden rounded-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${meta.color}2e, #0c0907 70%)`,
        border: `1px solid ${meta.color}`,
        boxShadow: `0 0 18px ${meta.color}40, inset 0 1px 0 ${meta.color}66`,
      }}
    >
      <span
        className="font-display font-bold leading-none"
        style={{ fontSize: size * 0.52, color: meta.color, textShadow: `0 0 16px ${meta.color}cc` }}
      >
        {tier}
      </span>
    </div>
  );
}
