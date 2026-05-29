import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Exibe o ícone de uma skill via hot-link (reference-only). Sem `url`, ou se a
// imagem falhar ao carregar, cai num placeholder neutro. Não busca dados.
export default function SkillIcon({ url, size = 28, alt = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]); // reset ao trocar de skill

  const box = {
    width: size, height: size, borderRadius: 6, flex: "0 0 auto",
    border: "1px solid #3a2c22", background: "#120d0a",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  };

  if (url && !failed) {
    return (
      <img src={url} alt={alt} width={size} height={size}
        onError={() => setFailed(true)}
        style={{ ...box, objectFit: "cover" }} />
    );
  }
  return (
    <span style={box} role="img" aria-label={alt || "skill"}>
      <Sparkles size={Math.round(size * 0.55)} color="#9c8a76" />
    </span>
  );
}
