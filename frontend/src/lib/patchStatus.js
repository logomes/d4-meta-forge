// Deriva o status de validade de uma build comparando seu patch ao patch atual.
// Retorna "current" | "outdated" | "unknown".
const RE = /(\d+)\.(\d+)/;

function parse(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(RE);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

export function patchStatus(buildPatch, currentPatch) {
  const b = parse(buildPatch);
  const c = parse(currentPatch);
  if (!b || !c) return "unknown";
  if (b[0] < c[0] || (b[0] === c[0] && b[1] < c[1])) return "outdated";
  return "current";
}
