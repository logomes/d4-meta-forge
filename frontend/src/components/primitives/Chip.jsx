// Chip discreto; `accent` pinta com a cor de destaque.
export default function Chip({ accent = false, children }) {
  return (
    <span
      className={
        "whitespace-nowrap rounded-full border px-2.5 py-[3px] font-ui text-[11px] " +
        (accent
          ? "border-accent-dim bg-accent-wash text-accent"
          : "border-line text-muted")
      }
    >
      {children}
    </span>
  );
}
