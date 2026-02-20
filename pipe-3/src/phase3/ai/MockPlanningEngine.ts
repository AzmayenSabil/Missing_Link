/**
 * MockPlanningEngine.ts – Deterministic, heuristics-based planning engine.
 *
 * Algorithm
 * ─────────
 * 1. Identify impacted areas from phase-2 area summaries (sorted by confidence).
 * 2. For each area, emit canonical plan steps using area-specific templates.
 * 3. Augment steps with grounded file references from the impact analysis.
 * 4. Add "create" steps for any newFilesSuggested from phase-2.
 * 5. Topologically order all steps (types → services → state → ui → tests → docs).
 * 6. Derive acceptance criteria from PRD headings / bullets.
 * 7. Compute risks from blast radius and area criticality.
 * 8. Build verification suite (typecheck, lint, test, manual).
 * 9. Generate one AgentPrompt per step.
 */

import {
  PlanningEngine,
  PlanningInput,
  PlanningOutput,
  ImpactArea,
  PlanStep,
  StepKind,
  Roadmap,
  AgentPromptPack,
  AgentPrompt,
  FeatureDependency,
  VerificationItem,
  RiskItem,
  QuestionRef,
  Phase1Summary,
  Phase2Summary,
} from "../../contracts/phase3";
import { areaToCategory } from "../utils/classify";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyTopologicalOrder(steps: PlanStep[]): PlanStep[] {
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    outgoing.set(step.id, []);
  }

  for (const step of steps) {
    for (const dep of step.dependsOnStepIds) {
      if (!stepById.has(dep)) continue;
      inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
      outgoing.get(dep)!.push(step.id);
    }
  }

  const queue: string[] = steps
    .filter((s) => (inDegree.get(s.id) ?? 0) === 0)
    .map((s) => s.id);

  const ordered: PlanStep[] = [];
  const queued = new Set(queue);

  while (queue.length > 0) {
    const id = queue.shift()!;
    queued.delete(id);
    const step = stepById.get(id);
    if (!step) continue;

    ordered.push(step);

    for (const nextId of outgoing.get(id) ?? []) {
      const nextDegree = (inDegree.get(nextId) ?? 0) - 1;
      inDegree.set(nextId, nextDegree);
      if (nextDegree === 0 && !queued.has(nextId)) {
        queue.push(nextId);
        queued.add(nextId);
      }
    }
  }

  if (ordered.length !== steps.length) {
    const orderedIds = new Set(ordered.map((s) => s.id));
    for (const step of steps) {
      if (!orderedIds.has(step.id)) ordered.push(step);
    }
  }

  return ordered;
}

let _stepCounter = 0;
function nextId(prefix: string): string {
  _stepCounter++;
  return `${prefix}-${String(_stepCounter).padStart(3, "0")}`;
}

function resetCounter(): void {
  _stepCounter = 0;
}

function pick<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

function normalizePrdText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractAcceptanceCriteria(prdText: string): string[] {
  const normalized = normalizePrdText(prdText);
  if (!normalized) return [];

  const lines = normalized.split("\n").map((l) => l.trim());
  const bulletLike = lines
    .filter(
      (l) =>
        /^[-*•]\s+/.test(l) ||
        /^\d+[\.\)]\s+/.test(l) ||
        /^acceptance criteria[:\s]/i.test(l),
    )
    .map((l) =>
      l
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+[\.\)]\s+/, "")
        .trim(),
    )
    .filter((l) => l.length > 3);

  const sentenceLike = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => /\b(must|should|shall|required|needs to)\b/i.test(s))
    .filter((s) => s.length > 10)
    .slice(0, 10);

  return [...new Set([...bulletLike, ...sentenceLike])].slice(0, 12);
}

// PRD summary: first ~400 chars of the normalised PRD text
function prdSummary(prdText: string): string {
  const clean = prdText.replace(/\s+/g, " ").trim();
  return clean.length > 400 ? clean.slice(0, 397) + "…" : clean;
}

// ---------------------------------------------------------------------------
// Area-specific step templates
// ---------------------------------------------------------------------------

interface StepTemplate {
  area: ImpactArea;
  kind: StepKind;
  titleFn: (files: string[]) => string;
  descFn: (files: string[]) => string;
  checklistFn: (files: string[]) => string[];
  doneWhenFn: (files: string[]) => string[];
  rationale: string[];
  dependOrder: number; // lower = must run earlier
}

const TEMPLATES: StepTemplate[] = [
  // ── Types ──────────────────────────────────────────────────────────────
  {
    area: "Types",
    kind: "modify",
    titleFn: () => "Update shared TypeScript contracts",
    descFn: (f) =>
      `Add or extend TypeScript interfaces and types required by the feature. Affected files: ${f.slice(0, 3).join(", ") || "types/*.ts"}.`,
    checklistFn: (f) => [
      `Open ${f[0] ?? "src/types/*.ts"} and locate relevant interfaces`,
      "Add new fields or types as required by the PRD",
      "Ensure all new types are exported and re-exported from index barrel if applicable",
      "Add JSDoc comments to new public interfaces",
      "Verify no existing consumers of changed types break (check TypeScript errors)",
    ],
    doneWhenFn: () => [
      "tsc reports 0 errors for all type files",
      "All new types have JSDoc",
      "Barrel re-exports are updated",
    ],
    rationale: [
      "Type contracts must be established before any services or UI can use them",
      "Changing types without updating consumers causes cascading type errors",
    ],
    dependOrder: 0,
  },
  // ── API/Service ────────────────────────────────────────────────────────
  {
    area: "API/Service",
    kind: "modify",
    titleFn: () => "Implement service / API layer changes",
    descFn: (f) =>
      `Add or modify service functions and API request/response contracts. Key files: ${f.slice(0, 3).join(", ") || "src/services/*.ts"}.`,
    checklistFn: (f) => [
      `Locate or create service file (${f[0] ?? "src/services/featureService.ts"})`,
      "Define the request and response TypeScript types (or import from types step)",
      "Implement the API call using the existing HTTP client / fetch wrapper in the repo",
      "Add proper error handling: network errors, 4xx/5xx responses",
      "Export the new function(s) from the service barrel",
    ],
    doneWhenFn: () => [
      "Service function compiles with no TypeScript errors",
      "Happy-path and error-path unit tests pass",
      "Function is exported and importable",
    ],
    rationale: [
      "Service layer changes feed state management and UI components",
      "Centralising API logic prevents duplicated fetch calls across components",
    ],
    dependOrder: 1,
  },
  // ── Auth ───────────────────────────────────────────────────────────────
  {
    area: "Auth",
    kind: "modify",
    titleFn: () => "Add / update authentication and authorisation rules",
    descFn: (f) =>
      `Extend permission checks, route guards, and auth state for the feature. Files: ${f.slice(0, 3).join(", ") || "src/auth/*.ts"}.`,
    checklistFn: (f) => [
      `Review ${f[0] ?? "src/pages/Login.tsx"} and related auth slice`,
      "Add any new role or permission constants to src/types/auth.ts",
      "Update route guards / HOCs to enforce the new permissions",
      "Handle unauthorised state gracefully in UI (redirect or 403 screen)",
      "Document the new permission requirements in the file header",
    ],
    doneWhenFn: () => [
      "Unauthorised users cannot access the protected route/resource",
      "Auth unit tests cover the new permission path",
      "No regressions in existing auth flows",
    ],
    rationale: [
      "Auth changes must precede UI integration to avoid exposing unguarded routes",
      "Role/permission models drive what UI elements are rendered",
    ],
    dependOrder: 1,
  },
  // ── State ──────────────────────────────────────────────────────────────
  {
    area: "State",
    kind: "modify",
    titleFn: () => "Extend state management (slice / actions / selectors)",
    descFn: (f) =>
      `Add or modify Redux slices, actions, selectors, or context providers. Files: ${f.slice(0, 3).join(", ") || "src/redux/slices/*.ts"}.`,
    checklistFn: (f) => [
      `Open the relevant slice (${f[0] ?? "src/redux/slices/featureSlice.ts"})`,
      "Define new state shape fields with proper TypeScript interfaces",
      "Create actions / reducers for the feature lifecycle (pending/fulfilled/rejected)",
      "Add selectors that memoize derived data using createSelector where applicable",
      "Register the slice in the root store if it is new",
      "Wire async thunks to the matching service functions from the API step",
    ],
    doneWhenFn: () => [
      "Redux DevTools shows the new state slice in the store",
      "Selectors return correct values in unit tests",
      "No circular imports between slice and service layer",
    ],
    rationale: [
      "State must be available before UI components can subscribe to it",
      "Centralised state prevents prop-drilling and stale data issues",
    ],
    dependOrder: 2,
  },
  // ── Hooks ──────────────────────────────────────────────────────────────
  {
    area: "Hooks",
    kind: "modify",
    titleFn: () => "Create or update React hooks",
    descFn: (f) =>
      `Implement custom hooks that encapsulate feature logic. Files: ${f.slice(0, 3).join(", ") || "src/hooks/*.ts"}.`,
    checklistFn: (f) => [
      `Create or locate hook file (${f[0] ?? "src/hooks/useFeature.ts"})`,
      "Define the hook return type explicitly (do not rely on inference at boundaries)",
      "Connect to state selectors and dispatch actions from the state step",
      "Handle loading, error, and empty states",
      "Write a minimal test using renderHook from @testing-library/react",
    ],
    doneWhenFn: () => [
      "Hook is importable and returns typed data",
      "renderHook test passes for happy path",
      "No console errors in hook lifecycle",
    ],
    rationale: [
      "Custom hooks abstract complexity from UI components",
      "Testing hooks in isolation reduces surface area of component tests",
    ],
    dependOrder: 3,
  },
  // ── UI ─────────────────────────────────────────────────────────────────
  {
    area: "UI",
    kind: "modify",
    titleFn: () => "Integrate feature into UI components / pages",
    descFn: (f) =>
      `Update pages and components to surface the new feature. Files: ${f.slice(0, 3).join(", ") || "src/components/*.tsx, src/pages/*.tsx"}.`,
    checklistFn: (f) => [
      `Open target page/component (${f[0] ?? "src/pages/FeaturePage.tsx"})`,
      "Import and call the hook from the hooks step",
      "Render loading skeleton while data is fetching",
      "Render error state with retry action if the request fails",
      "Render empty state when data collection is empty",
      "Add data-testid attributes to key interactive elements",
      "Ensure all text strings are internationalisation-ready (i18n keys or constants)",
    ],
    doneWhenFn: () => [
      "Feature renders correctly in the browser for all states (loading/data/error/empty)",
      "No TypeScript errors in component files",
      "Accessibility: interactive elements have aria-labels",
    ],
    rationale: [
      "UI is the last layer to integrate; all lower layers must be stable first",
      "Handling loading/error/empty prevents blank screens in production",
    ],
    dependOrder: 4,
  },
  // ── Routing ────────────────────────────────────────────────────────────
  {
    area: "Routing",
    kind: "modify",
    titleFn: () => "Update routing configuration",
    descFn: (f) =>
      `Add new routes or update navigation for the feature. Files: ${f.slice(0, 3).join(", ") || "src/routes/*.ts"}.`,
    checklistFn: (f) => [
      `Open router configuration (${f[0] ?? "src/routes/index.tsx"})`,
      "Add the new route definition with path, component, and auth guard",
      "Update navigation menus or breadcrumbs to include the new route",
      "Ensure deep-linking works (refresh on new URL renders correct page)",
      "Add route constants to avoid magic strings across the codebase",
    ],
    doneWhenFn: () => [
      "Navigating to the new URL renders the correct page",
      "Unauthenticated users are redirected",
      "Back button / browser history behaves correctly",
    ],
    rationale: [
      "Routing changes need to reference UI components that exist",
      "Auth guards must be in place before the route is navigable",
    ],
    dependOrder: 4,
  },
  // ── Styling ────────────────────────────────────────────────────────────
  {
    area: "Styling",
    kind: "modify",
    titleFn: () => "Apply design tokens and styling",
    descFn: (f) =>
      `Ensure Tailwind utility classes, CSS variables, and design tokens are applied consistently. Files: ${f.slice(0, 3).join(", ") || "src/styles/*.css, tailwind.config.*"}.`,
    checklistFn: () => [
      "Use only design-system tokens (CSS variables / Tailwind theme values) – no hard-coded hex colours",
      "Check that Tailwind purge/content config covers all new file paths",
      "Verify dark-mode variants work if the app supports dark mode",
      "Run the visual components in Storybook (or equivalent) to spot regressions",
      "Remove any inline style overrides; replace with utility classes",
    ],
    doneWhenFn: () => [
      "No hard-coded colours or spacing values outside the design token system",
      "Tailwind build completes without warnings about unknown utilities",
      "Visual appearance matches design specification",
    ],
    rationale: [
      "Styling must conform to the design system to maintain visual consistency",
      "Hard-coded values break dark-mode / themability",
    ],
    dependOrder: 5,
  },
  // ── Tests ──────────────────────────────────────────────────────────────
  {
    area: "Tests",
    kind: "test",
    titleFn: () => "Write unit and integration tests",
    descFn: (f) =>
      `Add test coverage for all new and modified code. Key files: ${f.slice(0, 3).join(", ") || "src/**/__tests__/*.test.ts"}.`,
    checklistFn: (f) => [
      `Create test file(s) alongside changed code (${f[0] ?? "src/__tests__/feature.test.ts"})`,
      "Cover the happy path for every public function or component",
      "Cover at least one error/edge-case scenario per function",
      "Mock external services and API calls to keep tests deterministic",
      "Assert on meaningful output, not implementation details",
      "Ensure test suite runs in CI without network access",
    ],
    doneWhenFn: () => [
      "All new tests pass: `npm test`",
      "Code coverage for new files >= 80%",
      "No test uses real network calls (all mocked)",
    ],
    rationale: [
      "Tests prevent regressions as the codebase evolves",
      "Tests serve as living documentation of expected behaviour",
    ],
    dependOrder: 6,
  },
  // ── Build/Config ───────────────────────────────────────────────────────
  {
    area: "Build/Config",
    kind: "config",
    titleFn: () => "Update build configuration",
    descFn: (f) =>
      `Modify build or toolchain config files as required. Files: ${f.slice(0, 3).join(", ") || "tsconfig.json, vite.config.ts, .env"}.`,
    checklistFn: (f) => [
      `Open config file (${f[0] ?? "tsconfig.json"})`,
      "Add new path aliases, environment variables, or plugin settings",
      "Ensure the build still completes without warnings after changes",
      "Update .env.example with any new required env vars",
      "Document the purpose of every new config key in a comment",
    ],
    doneWhenFn: () => [
      "Build completes successfully: `npm run build`",
      "No new TypeScript strict-mode errors introduced",
      ".env.example is up to date",
    ],
    rationale: [
      "Config changes must happen before compilation checks can pass",
      "Missing env vars cause silent runtime failures",
    ],
    dependOrder: 0,
  },
];

// ---------------------------------------------------------------------------
// MockPlanningEngine
// ---------------------------------------------------------------------------

export class MockPlanningEngine implements PlanningEngine {
  readonly name = "MockPlanningEngine";

  async plan(input: PlanningInput): Promise<PlanningOutput> {
    resetCounter();
    const { phase1, phase2, prdText = "" } = input;

    // Determine which areas are actually impacted (confidence > 0)
    // Always include at least one area
    const impactedAreas: ImpactArea[] =
      phase2.areaSummaries.length > 0
        ? (phase2.areaSummaries
            .filter((a) => a.confidence > 0)
            .map((a) => a.area) as ImpactArea[])
        : ["UI", "Types"];

    // Primary impacted files
    const primaryFiles = phase2.impactedFiles
      .filter((f) => f.role === "primary")
      .map((f) => f.path);

    const allImpactedFilePaths = phase2.impactedFiles.map((f) => f.path);

    // ── Build plan steps ──────────────────────────────────────────────────

    const steps: PlanStep[] = [];

    // 1. Always add a Types step if any type-bearing area is impacted
    const typeRelevantAreas: ImpactArea[] = [
      "Types",
      "API/Service",
      "State",
      "Auth",
    ];
    const needsTypesStep =
      impactedAreas.some((a) => typeRelevantAreas.includes(a)) ||
      primaryFiles.some((p) => p.includes("types/") || p.includes("types.ts"));

    if (needsTypesStep) {
      const typeFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("types/") ||
            f.path.includes("types.ts") ||
            f.path.includes(".d.ts"),
        )
        .map((f) => f.path);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Types")!,
          typeFiles,
          phase2,
          [],
        ),
      );
    }

    // 2. Build/Config step first if impacted
    if (impactedAreas.includes("Build/Config")) {
      const configFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("config") ||
            f.path.match(/tsconfig|vite|webpack|babel|jest|eslint|\.env/),
        )
        .map((f) => f.path);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Build/Config")!,
          configFiles,
          phase2,
          [],
        ),
      );
    }

    // 3. Auth step early
    if (impactedAreas.includes("Auth")) {
      const authFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("auth") ||
            f.path.includes("Auth") ||
            f.path.includes("Login") ||
            f.path.includes("Permission"),
        )
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Auth")!,
          authFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 4. API/Service step
    if (impactedAreas.includes("API/Service")) {
      const serviceFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("service") ||
            f.path.includes("Service") ||
            f.path.includes("api/") ||
            f.path.includes("Api"),
        )
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "API/Service")!,
          serviceFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 5. State step
    if (impactedAreas.includes("State")) {
      const stateFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("redux") ||
            f.path.includes("slice") ||
            f.path.includes("store") ||
            f.path.includes("context") ||
            f.path.includes("zustand"),
        )
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "State")!,
          stateFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 6. Hooks step
    if (impactedAreas.includes("Hooks")) {
      const hookFiles = phase2.impactedFiles
        .filter((f) => f.path.includes("hook") || f.path.includes("Hook"))
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Hooks")!,
          hookFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 7. Routing step
    if (impactedAreas.includes("Routing")) {
      const routeFiles = phase2.impactedFiles
        .filter((f) => f.path.includes("route") || f.path.includes("Route"))
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Routing")!,
          routeFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 8. UI step
    if (impactedAreas.includes("UI") || impactedAreas.includes("Unknown")) {
      const uiFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("component") ||
            f.path.includes("Component") ||
            f.path.includes("pages/") ||
            f.path.includes("Page") ||
            f.path.endsWith(".tsx"),
        )
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "UI")!,
          uiFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 9. Styling step
    if (impactedAreas.includes("Styling")) {
      const styleFiles = phase2.impactedFiles
        .filter(
          (f) =>
            f.path.includes("style") ||
            f.path.includes("css") ||
            f.path.includes("scss") ||
            f.path.includes("tailwind"),
        )
        .map((f) => f.path);
      const priorIds = steps.map((s) => s.id);
      steps.push(
        buildStep(
          TEMPLATES.find((t) => t.area === "Styling")!,
          styleFiles,
          phase2,
          priorIds,
        ),
      );
    }

    // 10. Add "create" steps for newFilesSuggested
    for (const newFile of phase2.newFilesSuggested) {
      const area = guessAreaFromPath(newFile);
      const priorIds = steps.map((s) => s.id);
      const createId = nextId("step-create");
      steps.push({
        id: createId,
        title: `Create new file: ${newFile}`,
        description: `Create the file ${newFile} as suggested by the impact analysis for area: ${area}.`,
        area,
        kind: "create",
        files: { modify: [], create: [newFile], touch: [] },
        dependsOnStepIds: priorIds,
        rationale: [
          `The impact analysis identified that ${newFile} needs to be created`,
          `Area: ${area} – this file did not exist in the repo DNA`,
        ],
        implementationChecklist: [
          `Create the directory structure if it does not exist`,
          `Add the file with appropriate boilerplate for its area (${area})`,
          `Export the main symbol from the file`,
          `Update barrel index.ts if applicable`,
        ],
        doneWhen: [
          `File exists at ${newFile}`,
          `File compiles without TypeScript errors`,
          `File is importable from its expected consumer`,
        ],
      });
    }

    // 11. Tests step (always last before docs)
    const priorToTests = steps.map((s) => s.id);
    const testFiles = phase2.impactedFiles
      .filter(
        (f) =>
          f.path.includes("test") ||
          f.path.includes("spec") ||
          f.path.includes("__tests__"),
      )
      .map((f) => f.path);
    steps.push(
      buildStep(
        TEMPLATES.find((t) => t.area === "Tests")!,
        testFiles,
        phase2,
        priorToTests,
      ),
    );

    // ── Topological ordering ─────────────────────────────────────────────
    const ordered: PlanStep[] = applyTopologicalOrder(steps);

    // ── Acceptance criteria ──────────────────────────────────────────────
    const acceptanceCriteria = extractAcceptanceCriteria(prdText);
    if (acceptanceCriteria.length === 0) {
      // Synthesise from impacted areas
      acceptanceCriteria.push(
        ...synthesiseAcceptanceCriteria(impactedAreas, phase2),
      );
    }

    // ── Risks ────────────────────────────────────────────────────────────
    const risks = deriveRisks(phase2, impactedAreas);

    // ── Verification ─────────────────────────────────────────────────────
    const verification = buildVerification(impactedAreas);

    // ── Open questions ───────────────────────────────────────────────────
    const openQuestions: QuestionRef[] = phase2.questions
      .filter((q) => q.required)
      .map((q) => ({
        id: q.id,
        question: q.questionText,
        blocking: q.required,
        whyThisMatters: [
          q.rationale ?? "Required for correct implementation",
          "This question was marked required in the phase-2 clarification bridge",
        ],
      }));

    // ── Feature dependencies ─────────────────────────────────────────────
    const dependencies = deriveDependencies(phase1, phase2);

    // ── Files lists ───────────────────────────────────────────────────────
    const filesToModify = [...new Set(ordered.flatMap((s) => s.files.modify))];
    const filesToCreate = [
      ...new Set([
        ...ordered.flatMap((s) => s.files.create),
        ...phase2.newFilesSuggested,
      ]),
    ];
    const filesAffected = [
      ...new Set([
        ...allImpactedFilePaths,
        ...ordered.flatMap((s) => s.files.touch),
      ]),
    ];

    // ── Build Roadmap ─────────────────────────────────────────────────────
    const roadmap: Roadmap = {
      prd: { hash: phase2.prdHash, source: phase2.prdSource },
      generatedAt: new Date().toISOString(),
      plan: ordered,
      artifacts: {
        filesToModify,
        filesAffected,
        filesToCreate,
        dependencies,
      },
      acceptanceCriteria,
      verification,
      risks,
      openQuestions,
      notes: [
        `Generated by ${this.name} (deterministic mock – no LLM used)`,
        `Phase-2 identified ${phase2.impactedFiles.length} impacted files across ${phase2.areaSummaries.length} area(s)`,
        `Plan contains ${ordered.length} ordered steps`,
        ...phase2.notes,
      ],
    };

    // ── Build AgentPromptPack ─────────────────────────────────────────────
    const prompts: AgentPrompt[] = ordered.map((step) =>
      buildAgentPrompt(step, phase1, phase2, prdText),
    );

    const promptPack: AgentPromptPack = {
      generatedAt: new Date().toISOString(),
      prompts,
    };

    return {
      roadmap,
      promptPack,
      engineNotes: [
        `MockPlanningEngine: generated ${ordered.length} steps for ${impactedAreas.length} area(s)`,
        `Areas: ${impactedAreas.join(", ")}`,
        `Acceptance criteria: ${acceptanceCriteria.length}`,
        `Risks: ${risks.length}`,
        `Open questions (blocking): ${openQuestions.filter((q) => q.blocking).length}`,
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// Builder helpers
// ---------------------------------------------------------------------------

function buildStep(
  template: StepTemplate,
  areaFiles: string[],
  phase2: Phase2Summary,
  dependsOnStepIds: string[],
): PlanStep {
  const id = nextId(`step-${areaToCategory(template.area)}`);
  const blastFiles = phase2.impactedFiles
    .filter((f) => f.role === "secondary" || f.role === "dependent")
    .map((f) => f.path)
    .slice(0, 10);

  return {
    id,
    title: template.titleFn(areaFiles),
    description: template.descFn(areaFiles),
    area: template.area,
    kind: template.kind,
    files: {
      modify: pick(areaFiles, 6),
      create: [],
      touch: blastFiles,
    },
    dependsOnStepIds,
    rationale: template.rationale,
    implementationChecklist: template.checklistFn(areaFiles),
    doneWhen: template.doneWhenFn(areaFiles),
  };
}

function guessAreaFromPath(filePath: string): ImpactArea {
  const p = filePath.toLowerCase();
  if (p.includes("types/") || p.includes(".d.ts") || p.endsWith("types.ts"))
    return "Types";
  if (p.includes("service") || p.includes("api/")) return "API/Service";
  if (p.includes("redux") || p.includes("slice") || p.includes("store"))
    return "State";
  if (p.includes("hook")) return "Hooks";
  if (p.includes("auth") || p.includes("permission")) return "Auth";
  if (p.includes("route")) return "Routing";
  if (p.includes("style") || p.includes("css") || p.includes("tailwind"))
    return "Styling";
  if (p.includes("test") || p.includes("spec")) return "Tests";
  if (p.includes("config") || p.match(/tsconfig|vite|webpack/))
    return "Build/Config";
  if (p.endsWith(".tsx") || p.includes("component") || p.includes("page"))
    return "UI";
  return "Unknown";
}

function synthesiseAcceptanceCriteria(
  areas: ImpactArea[],
  phase2: Phase2Summary,
): string[] {
  const criteria: string[] = [
    "All TypeScript compilation errors are resolved (tsc exits 0)",
    "All existing unit tests continue to pass after changes",
    "No new ESLint warnings are introduced",
    "The feature works end-to-end in the development environment",
    "Loading, error, and empty states are visually handled",
  ];

  if (areas.includes("Auth"))
    criteria.push("Unauthorised users cannot access the new feature/route");
  if (areas.includes("API/Service"))
    criteria.push(
      "API calls succeed with valid data and return appropriate error messages on failure",
    );
  if (areas.includes("State"))
    criteria.push(
      "State updates are reflected in the UI without manual page refresh",
    );
  if (areas.includes("UI"))
    criteria.push(
      "The feature UI matches the design specifications and is responsive",
    );
  if (areas.includes("Tests"))
    criteria.push("Code coverage for new/modified files is >= 80%");
  if (phase2.questions.filter((q) => q.required).length > 0)
    criteria.push(
      `All ${phase2.questions.filter((q) => q.required).length} blocking clarifying question(s) are resolved before starting implementation`,
    );

  return criteria;
}

function deriveRisks(phase2: Phase2Summary, areas: ImpactArea[]): RiskItem[] {
  const risks: RiskItem[] = [];
  const blastSize = phase2.impactedFiles.filter(
    (f) => f.role === "secondary" || f.role === "dependent",
  ).length;

  if (blastSize > 20) {
    risks.push({
      severity: "high",
      risk: `Large blast radius: ${blastSize} secondary/dependent files may be affected by changes`,
      mitigation: [
        "Run the full test suite after each step, not just at the end",
        "Use TypeScript's '--noEmit' flag frequently to catch cascading type errors early",
        "Consider introducing the change behind a feature flag for gradual rollout",
      ],
    });
  } else if (blastSize > 5) {
    risks.push({
      severity: "medium",
      risk: `Moderate blast radius: ${blastSize} files may be indirectly impacted`,
      mitigation: [
        "Run impacted test files after each logical chunk of changes",
        "Review diff carefully before committing",
      ],
    });
  }

  if (areas.includes("Auth")) {
    risks.push({
      severity: "high",
      risk: "Auth changes can break access control for all users if misconfigured",
      mitigation: [
        "Test with multiple user roles explicitly",
        "Ensure logout + token refresh still works correctly",
        "Do not merge without a security review",
      ],
    });
  }

  if (areas.includes("State")) {
    risks.push({
      severity: "medium",
      risk: "State shape changes can cause stale Redux cache or selector mismatches",
      mitigation: [
        "Version or migrate persisted state if redux-persist is used",
        "Check all selectors that read from modified slices",
      ],
    });
  }

  if (areas.includes("API/Service")) {
    risks.push({
      severity: "medium",
      risk: "API contract changes may break consumers if not backward-compatible",
      mitigation: [
        "Version the API endpoint if the contract is changing",
        "Add integration tests to verify the client–server contract",
      ],
    });
  }

  if (risks.length === 0) {
    risks.push({
      severity: "low",
      risk: "Localised change with small blast radius – regression risk is low",
      mitigation: [
        "Run unit tests for modified files",
        "Perform a smoke test in the dev environment",
      ],
    });
  }

  return risks;
}

function buildVerification(areas: ImpactArea[]): VerificationItem[] {
  const items: VerificationItem[] = [
    {
      type: "typecheck",
      instructions: [
        "Run: npx tsc --noEmit",
        "Expected: 0 errors",
        "If there are errors, resolve them before proceeding to lint",
      ],
    },
    {
      type: "lint",
      instructions: [
        "Run: npx eslint src --ext .ts,.tsx --max-warnings 0",
        "Expected: 0 warnings, 0 errors",
        "Auto-fix safe issues with: npx eslint src --fix",
      ],
    },
    {
      type: "unit_test",
      instructions: [
        "Run: npm test (or npx vitest / npx jest depending on the project setup)",
        "Expected: all existing and new tests pass",
        "Check coverage report for new files: target >= 80%",
      ],
    },
  ];

  if (areas.includes("Auth") || areas.includes("API/Service")) {
    items.push({
      type: "integration_test",
      instructions: [
        "Start the dev API server / use MSW (Mock Service Worker) fixtures",
        "Exercise the feature end-to-end: create, read, update, delete flows",
        "Verify auth flows: login, logout, token refresh, unauthorised access",
      ],
    });
  }

  items.push({
    type: "manual",
    instructions: [
      "Open the app in a browser (npm run dev)",
      "Log in with a user that has the appropriate permissions",
      "Navigate to the feature and exercise all user stories from the PRD",
      "Verify loading state appears during data fetch",
      "Verify error state appears when the API returns an error (use network throttling)",
      "Verify empty state renders correctly when there is no data",
      areas.includes("Auth")
        ? "Log in as a user WITHOUT permission; confirm they cannot access the feature"
        : "Check that the feature is accessible to all relevant user roles",
      "Check browser console: 0 errors, 0 unhandled promise rejections",
    ],
  });

  return items;
}

function deriveDependencies(
  phase1: Phase1Summary,
  phase2: Phase2Summary,
): FeatureDependency[] {
  const deps: FeatureDependency[] = [];

  // Check if any suggested new files are in known locations
  for (const newFile of phase2.newFilesSuggested) {
    const dir = newFile.split("/").slice(0, -1).join("/");
    const exists = phase1.allFiles.some((f) => f.startsWith(dir));
    deps.push({
      kind: "file",
      target: newFile,
      name: newFile.split("/").pop(),
      status: exists ? "unknown" : "missing",
      why: ["File is listed in newFilesSuggested from phase-2 impact analysis"],
    });
  }

  // If any area has auth, check for auth library
  if (
    phase2.areaSummaries.some((a) => a.area === "Auth") &&
    !phase1.allFiles.some((f) => f.includes("auth"))
  ) {
    deps.push({
      kind: "npm_package",
      name: "auth library",
      status: "unknown",
      why: [
        "Auth area is impacted but no auth-related files were found in the repo",
        "Verify your auth solution (e.g. next-auth, firebase-auth, custom JWT)",
      ],
    });
  }

  return deps;
}

function buildAgentPrompt(
  step: PlanStep,
  phase1: Phase1Summary,
  phase2: Phase2Summary,
  prdText: string,
): AgentPrompt {
  // Pull relevant conventions
  const conventionLines = extractConventionLines(phase1);

  // Pull token constraints
  const tokenLines = extractTokenLines(phase1);

  // Evidence bullets: reasons from impacted files relevant to this step
  const evidenceBullets = phase2.impactedFiles
    .filter(
      (f) =>
        step.files.modify.includes(f.path) ||
        step.files.create.includes(f.path),
    )
    .flatMap((f) => f.reasons.slice(0, 2))
    .slice(0, 6);

  const guardrails = buildGuardrails(step.area, phase1, phase2);

  const deliverables = buildDeliverables(step);

  return {
    stepId: step.id,
    title: step.title,
    system: buildSystemPrompt(step.area),
    context: {
      prdSummary: prdSummary(prdText),
      impactedFiles: [...step.files.modify, ...step.files.create].slice(0, 10),
      relevantRepoConventions: conventionLines.slice(0, 8),
      tokensOrConstraints: tokenLines.slice(0, 8),
      evidence: evidenceBullets,
    },
    instructions: step.implementationChecklist,
    guardrails,
    deliverables,
  };
}

function buildSystemPrompt(area: ImpactArea): string {
  return [
    "You are a senior software engineer working on a TypeScript + React codebase.",
    "You follow repo conventions strictly and make minimal, focused changes.",
    "You do NOT refactor code that is out of scope for the current task.",
    "You always handle loading, error, and empty states in UI components.",
    "You add TypeScript types to every new function, parameter, and return value.",
    `Your current focus area is: ${area}.`,
    "Output only the code changes required. Explain each change in a concise comment.",
  ].join(" ");
}

function buildGuardrails(
  area: ImpactArea,
  phase1: Phase1Summary,
  _phase2: Phase2Summary,
): string[] {
  const common = [
    "DO NOT modify files outside the scope of this step",
    "DO NOT remove existing exported symbols without verifying there are no other consumers",
    "DO NOT introduce new npm dependencies without explicit approval",
    "ALWAYS keep changes minimal – prefer additive changes over rewrites",
    "ALWAYS follow the existing code style (indentation, naming, barrel exports)",
  ];

  const areaSpecific: string[] = [];

  if (area === "Styling") {
    areaSpecific.push(
      "DO NOT use hard-coded colours, spacing, or font sizes",
      "USE only design tokens from the Tailwind theme or CSS custom properties",
      ...(hasTokens(phase1)
        ? [
            "REFER to the token constraints provided in context.tokensOrConstraints",
          ]
        : []),
    );
  }

  if (area === "Auth") {
    areaSpecific.push(
      "DO NOT weaken existing access checks",
      "ALWAYS validate permissions server-side (do not rely on client-only guards)",
      "DO NOT log sensitive user data to the console",
    );
  }

  if (area === "State") {
    areaSpecific.push(
      "DO NOT mutate state directly – use actions/thunks or immutable update patterns",
      "DO NOT re-select the same data in multiple components – create selectors",
    );
  }

  if (area === "API/Service") {
    areaSpecific.push(
      "DO NOT expose raw Axios/fetch responses – map to typed DTOs",
      "ALWAYS handle 401/403 responses and trigger auth refresh or redirect",
    );
  }

  return [...common, ...areaSpecific];
}

function buildDeliverables(step: PlanStep): string[] {
  const deliverables: string[] = [];

  if (step.files.modify.length > 0) {
    deliverables.push(
      `Modified file(s): ${step.files.modify.slice(0, 4).join(", ")}`,
    );
  }
  if (step.files.create.length > 0) {
    deliverables.push(
      `New file(s): ${step.files.create.slice(0, 4).join(", ")}`,
    );
  }

  deliverables.push(
    "A unified diff or complete file contents of all changes",
    "A brief explanation of each change and why it was made",
  );

  if (step.area === "Tests" || step.kind === "test") {
    deliverables.push(
      "Test file(s) with passing unit tests covering happy path and at least one error path",
    );
  }

  return deliverables;
}

function extractConventionLines(phase1: Phase1Summary): string[] {
  const conv = phase1.conventions;
  if (Object.keys(conv).length === 0) return defaultConventions();

  const lines: string[] = [];
  for (const [key, value] of Object.entries(conv)) {
    if (typeof value === "string") {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}: ${(value as unknown[]).slice(0, 3).join(", ")}`);
    }
  }
  return lines.length > 0 ? lines : defaultConventions();
}

function extractTokenLines(phase1: Phase1Summary): string[] {
  const tokens = phase1.tokens;
  if (Object.keys(tokens).length === 0) return [];

  const lines: string[] = [];
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === "string") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "object" && value !== null) {
      lines.push(`${key}: ${JSON.stringify(value).slice(0, 80)}`);
    }
  }
  return lines.slice(0, 10);
}

function defaultConventions(): string[] {
  return [
    "Use named exports over default exports for non-page components",
    "Co-locate test files next to their implementation (__tests__/ or *.test.ts)",
    "Use TypeScript strict mode – no implicit any",
    "Prefer async/await over raw Promise chains",
    "Use relative imports within the same feature folder; use path aliases for cross-feature imports",
  ];
}

function hasTokens(phase1: Phase1Summary): boolean {
  return Object.keys(phase1.tokens).length > 0;
}

function normText(s: string): string {
  return normalizePrdText(s);
}

// suppress unused warning
void normText;
