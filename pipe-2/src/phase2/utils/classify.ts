/**
 * classify.ts – Classify repository files into ImpactArea buckets using
 * path-based heuristics.
 *
 * All functions are pure and side-effect-free.
 */

import { ImpactArea } from "../../contracts/phase2";

// ---------------------------------------------------------------------------
// Area rules: each rule is a list of path fragment patterns (lowercase).
// The FIRST matching rule wins.
// ---------------------------------------------------------------------------

interface AreaRule {
  area: ImpactArea;
  patterns: string[];
}

const AREA_RULES: AreaRule[] = [
  {
    area: "Tests",
    patterns: [
      "/test/",
      "/tests/",
      "/spec/",
      "/__tests__/",
      ".test.",
      ".spec.",
    ],
  },
  {
    area: "Build/Config",
    patterns: [
      "tsconfig",
      "vite.config",
      "webpack.config",
      ".eslintrc",
      "eslint.config",
      ".prettierrc",
      "prettier.config",
      "babel.config",
      "jest.config",
      "rollup.config",
      ".env",
      "dockerfile",
      "docker-compose",
      ".github/",
      "ci/",
    ],
  },
  {
    area: "Auth",
    patterns: [
      "/auth/",
      "/login/",
      "/logout/",
      "/session/",
      "/token/",
      "auth.",
      "login.",
      "session.",
      "token.",
    ],
  },
  {
    area: "Routing",
    patterns: [
      "/routes/",
      "/router/",
      "/navigation/",
      "routes.",
      "router.",
      "navigation.",
      "routing.",
    ],
  },
  {
    area: "State",
    patterns: [
      "/redux/",
      "/store/",
      "/slice/",
      "/slices/",
      "store.",
      "slice.",
      "reducer.",
      ".store.",
      ".slice.",
    ],
  },
  {
    area: "Hooks",
    patterns: ["/hooks/", "hook.", "usehook", "/usehooks/"],
  },
  {
    area: "API/Service",
    patterns: [
      "/services/",
      "/service/",
      "/api/",
      "/client/",
      "/clients/",
      "service.",
      "api.",
      "client.",
    ],
  },
  {
    area: "Styling",
    patterns: [
      "/styles/",
      "/style/",
      "/tailwind/",
      "/tokens/",
      "/theme/",
      ".css",
      ".scss",
      ".less",
      "tailwind.config",
      "theme.",
      "tokens.",
    ],
  },
  {
    area: "Types",
    patterns: [
      "/types/",
      "/interfaces/",
      "/schema/",
      "/schemas/",
      "types.",
      "interface.",
      ".d.ts",
    ],
  },
  {
    area: "UI",
    patterns: [
      "/components/",
      "/component/",
      "/pages/",
      "/page/",
      "/screens/",
      "/screen/",
      "/ui/",
      "/views/",
      "/view/",
    ],
  },
];

/**
 * Classify a single file path into an ImpactArea.
 * Returns "Unknown" when no rule matches.
 */
export function classifyFile(filePath: string): ImpactArea {
  const lower = filePath.toLowerCase().replace(/\\/g, "/");

  for (const rule of AREA_RULES) {
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern)) {
        return rule.area;
      }
    }
  }

  // Fallback heuristics based on file name alone
  const basename = lower.split("/").pop() ?? "";
  if (basename.startsWith("use")) return "Hooks";
  if (basename.endsWith(".config.ts") || basename.endsWith(".config.js"))
    return "Build/Config";

  return "Unknown";
}

/**
 * Given a list of (path, score) pairs, aggregate scores per ImpactArea and
 * compute a normalised confidence in [0, 1] for each area.
 *
 * Returns areas sorted by confidence descending.
 */
export function computeAreaConfidences(
  files: Array<{ path: string; score: number }>,
): Array<{ area: ImpactArea; confidence: number; rationale: string[] }> {
  const areaTotals = new Map<ImpactArea, { total: number; files: string[] }>();

  let grandTotal = 0;
  for (const f of files) {
    const area = classifyFile(f.path);
    const entry = areaTotals.get(area) ?? { total: 0, files: [] };
    entry.total += f.score;
    entry.files.push(f.path);
    areaTotals.set(area, entry);
    grandTotal += f.score;
  }

  if (grandTotal === 0) return [];

  const results: Array<{
    area: ImpactArea;
    confidence: number;
    rationale: string[];
  }> = [];

  for (const [area, entry] of areaTotals) {
    const confidence = Math.min(1, entry.total / grandTotal);
    const topFiles = entry.files.slice(0, 3);
    const rationale = [
      `${entry.files.length} file(s) matched in this area`,
      ...topFiles.map((f) => `e.g. ${f}`),
    ];
    results.push({ area, confidence, rationale });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
