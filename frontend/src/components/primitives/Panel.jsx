export default function Panel({ title, right, children, pad = 18 }) {
  return (
    <section
      className="rounded-[14px] border border-border bg-panel"
      style={{ padding: pad }}
    >
      {title && (
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 font-ui text-[11px] font-bold uppercase tracking-[.16em] text-accent">
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
