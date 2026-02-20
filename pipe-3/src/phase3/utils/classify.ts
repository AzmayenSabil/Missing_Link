/**
 * classify.ts – Map impact areas to short category slugs used in step IDs.
 */

import type { ImpactArea } from "../../contracts/phase3";

/** Short lowercase slug for use in step identifiers */
export function areaToCategory(area: ImpactArea): string {
  const map: Record<ImpactArea, string> = {
    UI: "ui",
    Hooks: "hooks",
    State: "state",
    "API/Service": "api",
    Auth: "auth",
    Routing: "routing",
    Styling: "styling",
    Types: "types",
    Tests: "tests",
    "Build/Config": "config",
    Unknown: "misc",
  };
  return map[area] ?? "misc";
}

/** Reverse: guess area from a file path */
export function classifyFileByPath(filePath: string): ImpactArea {
  const p = filePath.toLowerCase();
  if (p.includes("types/") || p.endsWith("types.ts") || p.endsWith(".d.ts"))
    return "Types";
  if (p.includes("service") || p.includes("api/") || p.includes("/api.ts"))
    return "API/Service";
  if (
    p.includes("redux") ||
    p.includes("slice") ||
    p.includes("store") ||
    p.includes("context")
  )
    return "State";
  if (p.includes("hook")) return "Hooks";
  if (p.includes("auth") || p.includes("permission") || p.includes("login"))
    return "Auth";
  if (p.includes("route") || p.includes("router") || p.includes("navigate"))
    return "Routing";
  if (
    p.includes("style") ||
    p.includes("css") ||
    p.includes("scss") ||
    p.includes("tailwind")
  )
    return "Styling";
  if (p.includes("test") || p.includes("spec") || p.includes("__tests__"))
    return "Tests";
  if (
    p.includes("config") ||
    p.match(/tsconfig|vite|webpack|babel|jest|eslint|\.env/)
  )
    return "Build/Config";
  if (p.endsWith(".tsx") || p.includes("component") || p.includes("page"))
    return "UI";
  return "Unknown";
}
