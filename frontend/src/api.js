const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`${options?.method || "GET"} ${path} -> ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const listBuilds = (className) =>
  request(`/api/builds${className ? `?class_name=${encodeURIComponent(className)}` : ""}`);

export const getBuild = (id) => request(`/api/builds/${id}`);

export const saveBuild = (build) =>
  build.id && !build.id.startsWith("new")
    ? request(`/api/builds/${build.id}`, jsonBody("PUT", build))
    : request(`/api/builds`, jsonBody("POST", build));

export const deleteBuild = (id) => request(`/api/builds/${id}`, { method: "DELETE" });

export const calcDamage = (profile) =>
  request(`/api/calc/damage`, jsonBody("POST", profile));

export const getCatalog = () => request(`/api/calc/catalog`);

export const latestPatch = () => request(`/api/meta/patch/latest`);

function jsonBody(method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}
