/* Damage Lab — live bucket calculator with a "forge chain" multiplication visualizer.
   Teaches the engine rule: same-bucket modifiers ADD; buckets MULTIPLY. */
const { useState: useStateLab, useMemo: useMemoLab, useEffect: useEffectLab, useRef: useRefLab } = React;

function useCountUp(target, ms = 650) {
  const [val, setVal] = useStateLab(target);
  const fromRef = useRefLab(target);
  const rafRef = useRefLab(0);
  useEffectLab(() => {
    const from = fromRef.current, to = target, start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (to - from) * e);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return val;
}

function LabSlider({ label, value, min, max, step, onChange, fmtVal, hint }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--f-ui)", fontSize: 12, color: "var(--muted)" }}>{label}</span>
        <span style={{ fontFamily: "var(--f-num)", fontSize: 13, color: "var(--accent)" }}>{fmtVal ? fmtVal(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: 5, borderRadius: 999, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
          background: `linear-gradient(90deg, var(--accent) ${p}%, var(--input) ${p}%)`, outline: "none",
        }} />
      {hint && <div style={{ fontSize: 10.5, color: "var(--faint)", fontFamily: "var(--f-ui)", marginTop: 3 }}>{hint}</div>}
    </label>
  );
}

// horizontal stone in the multiplication chain; width scales with log contribution
function ChainStone({ label, sub, mult, color, isBase, baseVal }) {
  const w = isBase ? 132 : Math.max(72, 72 + Math.log(Math.max(mult, 1.01)) * 120);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: w, minHeight: 78, padding: "12px 14px", borderRadius: 11, position: "relative", overflow: "hidden",
        background: `linear-gradient(150deg, ${color}22, var(--panel) 75%)`,
        border: `1px solid ${color}66`, boxShadow: `inset 0 1px 0 ${color}33, 0 4px 14px #0007`,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "var(--f-ui)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{label}</span>
        <span style={{ fontFamily: "var(--f-num)", fontSize: isBase ? 19 : 22, fontWeight: 700, color }}>
          {isBase ? fmt(baseVal) : `×${mult.toFixed(2)}`}
        </span>
        {sub && <span style={{ fontFamily: "var(--f-ui)", fontSize: 10, color: "var(--faint)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// stacked additive bar inside one bucket
function BucketBar({ bucket, mods, additive_sum, multiplier }) {
  const bm = window.D4.buckets[bucket] || { label: bucket, color: "var(--accent)" };
  const total = Math.max(additive_sum, 0.0001);
  return (
    <div style={{ padding: "12px 14px", borderRadius: 11, background: "var(--input)", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
        <span style={{ fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: bm.color }} />{bm.label}
        </span>
        <span style={{ fontFamily: "var(--f-num)", fontSize: 14, color: bm.color, whiteSpace: "nowrap" }}>
          +{Math.round(additive_sum * 100)}% → ×{multiplier.toFixed(2)}
        </span>
      </div>
      <div style={{ display: "flex", height: 16, borderRadius: 5, overflow: "hidden", background: "#0c0907", gap: 1 }}>
        {mods.map((m, i) => (
          <div key={i} title={`${m.name}: +${Math.round(m.value * 100)}%`} style={{
            width: `${(Math.max(m.value, 0) / total) * 100}%`, minWidth: 2, height: "100%",
            background: `${bm.color}${["ff", "cc", "99", "77"][i % 4]}`,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {mods.map((m, i) => (
          <span key={i} style={{ fontFamily: "var(--f-ui)", fontSize: 11, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: `${bm.color}${["ff", "cc", "99", "77"][i % 4]}` }} />
            {m.name || "modifier"} <span style={{ color: "var(--faint)" }}>+{Math.round(m.value * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DamageLab({ initialBuild, onOpen }) {
  const D4 = window.D4;
  const [buildId, setBuildId] = useStateLab(initialBuild?.id || D4.builds[0].id);
  const baseBuild = D4.builds.find((b) => b.id === buildId) || D4.builds[0];
  const [combat, setCombat] = useStateLab(() => structuredClone(baseBuild.combat));

  useEffectLab(() => { setCombat(structuredClone(baseBuild.combat)); }, [buildId]);
  useEffectLab(() => { if (initialBuild) setBuildId(initialBuild.id); }, [initialBuild]);

  const set = (patch) => setCombat((c) => ({ ...c, ...patch }));
  const setMod = (i, key, v) => setCombat((c) => {
    const m = c.modifiers.slice(); m[i] = { ...m[i], [key]: key === "value" ? parseFloat(v) || 0 : v }; return { ...c, modifiers: m };
  });
  const addMod = () => setCombat((c) => ({ ...c, modifiers: [...c.modifiers, { name: "Novo modifier", bucket: "additive", value: 0.3 }] }));
  const rmMod = (i) => setCombat((c) => ({ ...c, modifiers: c.modifiers.filter((_, j) => j !== i) }));

  const dmg = useMemoLab(() => calcDamage(combat), [combat]);
  const dps = useCountUp(dmg.expected_dps);
  const cm = D4.classes[baseBuild.class];
  const bucketKeys = Object.keys(D4.buckets);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: "var(--f-ui)", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
            Engine de buckets · ao vivo
          </div>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 700, color: "var(--text)", margin: 0 }}>Damage Lab</h1>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--f-ui)", fontSize: 12, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".1em" }}>Carregar build</span>
          <select value={buildId} onChange={(e) => setBuildId(e.target.value)} style={selectLab}>
            {D4.builds.map((b) => <option key={b.id} value={b.id}>[{b.tier}] {b.name}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 18, alignItems: "start" }} className="lab-grid">
        {/* controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title="Hit base">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LabSlider label="Base hit" value={combat.base_hit} min={1000} max={40000} step={500}
                onChange={(v) => set({ base_hit: v })} fmtVal={fmt} />
              <LabSlider label="Hits / segundo" value={combat.hits_per_second} min={0.5} max={8} step={0.1}
                onChange={(v) => set({ hits_per_second: v })} fmtVal={(v) => v.toFixed(1)} />
            </div>
          </Panel>

          <Panel title="Multiplicadores condicionais">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LabSlider label="Crit chance" value={combat.crit_chance} min={0} max={1} step={0.01}
                onChange={(v) => set({ crit_chance: v })} fmtVal={pct} />
              <LabSlider label="Crit dmg bônus" value={combat.crit_damage_bonus} min={0} max={4} step={0.05}
                onChange={(v) => set({ crit_damage_bonus: v })} fmtVal={(v) => "+" + pct(v)} />
              <LabSlider label="Vulnerable uptime" value={combat.vulnerable_uptime} min={0} max={1} step={0.01}
                onChange={(v) => set({ vulnerable_uptime: v })} fmtVal={pct} />
              <LabSlider label="Vulnerable bônus" value={combat.vulnerable_bonus} min={0} max={1} step={0.01}
                onChange={(v) => set({ vulnerable_bonus: v })} fmtVal={(v) => "+" + pct(v)} />
            </div>
          </Panel>

          <Panel title="Modifiers (buckets)" right={
            <button onClick={addMod} style={addBtnLab}>+ Add</button>
          }>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {combat.modifiers.map((m, i) => {
                const bc = (D4.buckets[m.bucket] || {}).color || "var(--accent)";
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7, padding: 10, borderRadius: 9,
                    background: "var(--input)", border: "1px solid var(--line)", borderLeft: `3px solid ${bc}` }}>
                    <div style={{ display: "flex", gap: 7 }}>
                      <input value={m.name} onChange={(e) => setMod(i, "name", e.target.value)} style={{ ...inputLab, flex: 1 }} />
                      <button onClick={() => rmMod(i)} title="Remover" style={rmBtnLab}>✕</button>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <select value={m.bucket} onChange={(e) => setMod(i, "bucket", e.target.value)} style={{ ...selectLab, flex: 1, fontSize: 12 }}>
                        {bucketKeys.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, width: 124 }}>
                        <input type="range" min="0" max="2" step="0.05" value={m.value}
                          onChange={(e) => setMod(i, "value", e.target.value)} style={{ flex: 1, accentColor: bc }} />
                        <span style={{ fontFamily: "var(--f-num)", fontSize: 12, color: bc, width: 38, textAlign: "right" }}>+{Math.round(m.value * 100)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* visualizer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel pad={22}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={statLabelDet}>DPS esperado</div>
                <div style={{ fontFamily: "var(--f-num)", fontSize: 58, fontWeight: 700, color: "var(--accent)", lineHeight: 1,
                  textShadow: "0 0 26px var(--accent-glow)" }}>{fmt(dps)}</div>
              </div>
              <div style={{ display: "flex", gap: 26 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={statLabelDet}>Hit esperado</div>
                  <div style={{ fontFamily: "var(--f-num)", fontSize: 26, fontWeight: 600, color: "var(--text)" }}>{fmt(dmg.expected_hit)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={statLabelDet}>Multiplicador total</div>
                  <div style={{ fontFamily: "var(--f-num)", fontSize: 26, fontWeight: 600, color: "var(--ember)" }}>
                    ×{(dmg.critMult * dmg.vulnMult * dmg.bucketMult).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Cadeia de multiplicação · buckets se multiplicam entre si">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <ChainStone label="Base hit" isBase baseVal={combat.base_hit} color="var(--text-dim)" />
              <ChainGlyph />
              <ChainStone label="Crit" mult={dmg.critMult} color="#e8c860" />
              <ChainGlyph />
              <ChainStone label="Vulnerable" mult={dmg.vulnMult} color="#5ab4e8" />
              {dmg.buckets.map((b) => {
                const bm = D4.buckets[b.bucket] || { label: b.bucket, color: "var(--accent)" };
                return (
                  <React.Fragment key={b.bucket}>
                    <ChainGlyph />
                    <ChainStone label={bm.label} mult={b.multiplier} color={bm.color} sub={`+${Math.round(b.additive_sum * 100)}%`} />
                  </React.Fragment>
                );
              })}
            </div>
          </Panel>

          <Panel title="Dentro de cada bucket · modifiers se somam">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dmg.buckets.length === 0
                ? <p style={{ color: "var(--faint)", fontFamily: "var(--f-ui)", fontSize: 13, margin: 0 }}>Adicione modifiers para ver os buckets.</p>
                : dmg.buckets.map((b) => <BucketBar key={b.bucket} {...b} />)}
            </div>
          </Panel>

          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderRadius: 11,
            background: "var(--accent-wash)", border: "1px solid var(--accent-dim)" }}>
            <Glyph cls={baseBuild.class} size={34} />
            <span style={{ fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--muted)" }}>
              Editando o perfil de <b style={{ color: cm.color }}>{baseBuild.name}</b>.
            </span>
            <button onClick={() => onOpen(baseBuild)} style={{ ...ghostBtnDet, marginLeft: "auto" }}>Ver a build →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChainGlyph() {
  return <span style={{ fontFamily: "var(--f-num)", fontSize: 20, color: "var(--faint)", fontWeight: 400 }}>×</span>;
}

const selectLab = {
  fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--text)", background: "var(--input)",
  border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", outline: "none",
};
const inputLab = {
  fontFamily: "var(--f-ui)", fontSize: 12.5, color: "var(--text)", background: "#0c0907",
  border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", outline: "none",
};
const addBtnLab = {
  fontFamily: "var(--f-ui)", fontSize: 12, cursor: "pointer", padding: "5px 10px", borderRadius: 7,
  border: "1px solid var(--accent-dim)", color: "var(--accent)", background: "var(--accent-wash)",
};
const rmBtnLab = {
  fontFamily: "var(--f-ui)", fontSize: 12, cursor: "pointer", padding: "0 9px", borderRadius: 7,
  border: "1px solid var(--line)", color: "var(--muted)", background: "transparent",
};

Object.assign(window, { DamageLab });
