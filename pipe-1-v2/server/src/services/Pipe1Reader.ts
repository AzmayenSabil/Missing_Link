/**
 * Pipe1Reader — reads pipe-1's exact output files and maps them to the
 * DNASections shape expected by the pipe-1-v2 UI.
 *
 * pipe-1 output layout for a project with id <id>:
 *   out/pipe-1/<id>/
 *     project-dna/
 *       manifest.json              ← stack, configs, fingerprint (gitHead)
 *       conventions.json           ← prettier, eslint, commitlint presence
 *       structure.json             ← relPaths, extensionCounts, folderRoles
 *       api-contract.json          ← axiosInstances, endpointLiterals, serviceModules
 *       state-contract.json        ← Redux/Zustand state shape
 *       hooks-contract.json        ← React custom hooks
 *       style-contract.json        ← TS strict, JSX, path aliases
 *       naming-conventions.json    ← fileStyle, componentStyle, hookPrefix
 *       architecture-boundaries.json ← roles, roleEdges, violationsSample
 *       tokens.json                ← design tokens
 *       rules.json                 ← rule map
 *       pattern-cards.json         ← mined code patterns
 *       qa_report.json             ← coverage / QA metrics
 *       copilot-instructions.md    ← LLM-generated (if OpenAI key present)
 *       system-prompts.json        ← LLM-generated system prompts
 *     indexes/
 *       exports.jsonl, imports.jsonl, depgraph.json, symbol_index.json, ...
 */

import fs from 'fs';
import path from 'path';
import { DNASections, ProjectDNA } from '../types';

// ─── Raw pipe-1 JSON shapes ───────────────────────────────────────────────────

interface Manifest {
  projectId: string;
  repoPath: string;
  stack: {
    next: boolean;
    react: boolean;
    typescript: boolean;
    antd: boolean;
    emotion: boolean;
    reduxToolkit: boolean;
    swr: boolean;
    axios: boolean;
  };
  configs: {
    tsconfigPresent: boolean;
    eslintPresent: boolean;
    prettierPresent: boolean;
    commitlintPresent: boolean;
  };
  fingerprint: {
    scannedAt: string;
    totalFiles: number;
    tsLikeFiles: number;
    gitHead?: string;
  };
}

interface ConventionsFile {
  prettier: { present: boolean; file?: string; parsed?: Record<string, unknown>; rawSnippet?: string };
  eslint: { present: boolean; file?: string; parsed?: Record<string, unknown>; rawSnippet?: string };
  commitlint: { present: boolean; file?: string };
}

interface StructureFile {
  relPaths?: string[];
  extensionCounts?: Record<string, number>;
  topLevelEntries?: Record<string, number>;
  folderRoles?: Record<string, string>;
  directoryTree?: string;
}

interface ApiContractFile {
  axiosInstances?: Array<{
    file: string;
    variableName: string;
    baseURL?: string;
    requestInterceptor: boolean;
    responseInterceptor: boolean;
  }>;
  endpointLiterals?: Array<{ file: string; method: string; path: string; line: number }>;
  serviceModules?: Array<{ file: string; reason: string }>;
}

interface StateContractFile {
  slices?: Array<{ name: string; file: string; initialStateKeys?: string[] }>;
  selectors?: Array<{ name: string; file: string }>;
  storeFile?: string;
  zustandStores?: Array<{ name: string; file: string; stateKeys?: string[] }>;
}

interface HooksContractFile {
  hooks?: Array<{ name: string; file: string; returnType?: string; params?: string[] }>;
}

interface NamingConventionsFile {
  fileStyle: string;
  componentStyle: string;
  hookPrefix: string;
  barrelUsageRatio?: number;
  testFilePattern?: string | null;
}

interface ArchitectureBoundariesFile {
  roles?: string[];
  roleEdges?: Record<string, string[]>;
  violationsSample?: Array<{ from: string; to: string; file: string }>;
}

interface StyleContractFile {
  typescript?: {
    strict?: boolean;
    jsx?: string | null;
    baseUrl?: string;
    pathAliases?: Record<string, string[]>;
    moduleResolution?: string;
    target?: string;
  };
  eslint?: { present: boolean; importantRules?: Record<string, unknown> };
  prettier?: { present: boolean; semi?: boolean; singleQuote?: boolean; trailingComma?: string; printWidth?: number };
}

interface QaReportFile {
  score?: number;
  coverage?: Record<string, unknown>;
  warnings?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function readText(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export function readPipe1Output(projectId: string, dnaDir: string, repoUrl: string): ProjectDNA {
  const p = (filename: string) => path.join(dnaDir, filename);

  const manifest = readJson<Manifest>(p('manifest.json'));
  const conventions = readJson<ConventionsFile>(p('conventions.json'));
  const structure = readJson<StructureFile>(p('structure.json'));
  const apiContract = readJson<ApiContractFile>(p('api-contract.json'));
  const stateContract = readJson<StateContractFile>(p('state-contract.json'));
  const hooksContract = readJson<HooksContractFile>(p('hooks-contract.json'));
  const namingConventions = readJson<NamingConventionsFile>(p('naming-conventions.json'));
  const archBoundaries = readJson<ArchitectureBoundariesFile>(p('architecture-boundaries.json'));
  const styleContract = readJson<StyleContractFile>(p('style-contract.json'));
  const qaReport = readJson<QaReportFile>(p('qa_report.json'));
  const copilotInstructions = readText(p('copilot-instructions.md'));

  // ── overview ──────────────────────────────────────────────────────────────
  const repoName = repoUrl.replace(/\/$/, '').replace(/\.git$/, '').split('/').pop() ?? 'Unknown Project';
  const mainFeatures: string[] = [];
  if (manifest?.stack.react) mainFeatures.push('React UI');
  if (manifest?.stack.next) mainFeatures.push('Next.js SSR/SSG');
  if (manifest?.stack.reduxToolkit) mainFeatures.push('Redux Toolkit state management');
  if (manifest?.stack.swr) mainFeatures.push('SWR data fetching');
  if (manifest?.stack.axios) mainFeatures.push('Axios HTTP client');
  if (manifest?.stack.antd) mainFeatures.push('Ant Design component library');
  if (manifest?.stack.emotion) mainFeatures.push('Emotion CSS-in-JS styling');
  if (apiContract?.serviceModules?.length) mainFeatures.push('REST API service layer');

  const overview: DNASections['overview'] = {
    name: repoName,
    description: copilotInstructions
      ? `Project analyzed by pipe-1. See copilot-instructions for full summary.`
      : `${repoName} — analyzed from ${repoUrl}`,
    purpose: `Codebase at ${repoUrl}`,
    mainFeatures,
    targetUsers: ['developers'],
    deploymentType: manifest?.stack.next ? 'SSR/SSG (Next.js)' : manifest?.stack.react ? 'SPA' : 'Unknown',
  };

  // ── techStack ─────────────────────────────────────────────────────────────
  const languages: string[] = [];
  if (manifest?.stack.typescript) languages.push('TypeScript');
  else languages.push('JavaScript');

  const frameworks: string[] = [];
  if (manifest?.stack.next) frameworks.push('Next.js');
  if (manifest?.stack.react) frameworks.push('React');
  if (manifest?.stack.reduxToolkit) frameworks.push('Redux Toolkit');

  const libraries: string[] = [];
  if (manifest?.stack.axios) libraries.push('Axios');
  if (manifest?.stack.swr) libraries.push('SWR');
  if (manifest?.stack.antd) libraries.push('Ant Design');
  if (manifest?.stack.emotion) libraries.push('Emotion');

  const buildTools: string[] = [];
  if (manifest?.configs.tsconfigPresent) buildTools.push('TypeScript compiler');
  if (manifest?.configs.prettierPresent) buildTools.push('Prettier');
  if (manifest?.configs.eslintPresent) buildTools.push('ESLint');
  if (manifest?.configs.commitlintPresent) buildTools.push('Commitlint');

  const techStack: DNASections['techStack'] = {
    languages,
    frameworks,
    libraries,
    buildTools,
    testingTools: [],
    databases: [],
    devOps: [],
  };

  // ── architecture ─────────────────────────────────────────────────────────
  const folderRoles = structure?.folderRoles ?? {};
  const roleToFolders: Record<string, string[]> = {};
  for (const [folder, role] of Object.entries(folderRoles)) {
    if (!roleToFolders[role]) roleToFolders[role] = [];
    roleToFolders[role].push(folder);
  }

  const layers = Object.entries(roleToFolders).map(([role, dirs]) => ({
    name: role,
    description: `${role} layer`,
    directories: dirs,
  }));

  const keyDecisions: string[] = [];
  if (styleContract?.typescript?.strict) keyDecisions.push('TypeScript strict mode enabled');
  if (styleContract?.typescript?.pathAliases && Object.keys(styleContract.typescript.pathAliases).length > 0) {
    keyDecisions.push(`Path aliases configured: ${Object.keys(styleContract.typescript.pathAliases).join(', ')}`);
  }
  if (archBoundaries?.violationsSample?.length) {
    keyDecisions.push(`${archBoundaries.violationsSample.length} cross-layer dependency violations detected`);
  }

  const architecture: DNASections['architecture'] = {
    pattern: manifest?.stack.next
      ? 'Next.js pages/app router'
      : manifest?.stack.react
      ? 'React SPA with layered folders'
      : 'Unknown',
    layers,
    keyDecisions,
    diagramDescription:
      archBoundaries?.roles?.length
        ? `Layers: ${archBoundaries.roles.join(' → ')}. Role edges: ${JSON.stringify(archBoundaries.roleEdges ?? {})}`
        : 'Architecture boundaries not detected.',
  };

  // ── modules ───────────────────────────────────────────────────────────────
  const modules: DNASections['modules'] = Object.entries(roleToFolders).map(([role, dirs]) => ({
    name: role,
    path: dirs[0] ?? role,
    description: `${role} layer (${dirs.length} folder${dirs.length > 1 ? 's' : ''})`,
    responsibilities: [`Contains ${role} logic`],
    exposedAPIs: [],
    dependencies: [],
  }));

  // ── apis ─────────────────────────────────────────────────────────────────
  const baseUrl = apiContract?.axiosInstances?.[0]?.baseURL ?? undefined;
  const endpoints = (apiContract?.endpointLiterals ?? []).map((ep) => ({
    method: ep.method.toUpperCase(),
    path: ep.path,
    description: `Defined in ${ep.file}:${ep.line}`,
  }));

  const apiPatterns: string[] = [];
  if (apiContract?.axiosInstances?.some((ax) => ax.requestInterceptor)) {
    apiPatterns.push('Request interceptors');
  }
  if (apiContract?.axiosInstances?.some((ax) => ax.responseInterceptor)) {
    apiPatterns.push('Response interceptors');
  }

  const apis: DNASections['apis'] = {
    baseUrl,
    endpoints,
    authMethod: undefined,
    patterns: apiPatterns,
  };

  // ── dataModels ────────────────────────────────────────────────────────────
  const models: DNASections['dataModels']['models'] = [];

  // Redux slices as data models
  for (const slice of stateContract?.slices ?? []) {
    models.push({
      name: `${slice.name} (Redux slice)`,
      description: `Redux slice defined in ${slice.file}`,
      fields: (slice.initialStateKeys ?? []).map((k) => ({ name: k, type: 'unknown', required: false })),
    });
  }

  // Zustand stores
  for (const store of stateContract?.zustandStores ?? []) {
    models.push({
      name: `${store.name} (Zustand store)`,
      description: `Zustand store defined in ${store.file}`,
      fields: (store.stateKeys ?? []).map((k) => ({ name: k, type: 'unknown', required: false })),
    });
  }

  // Custom hooks as data models (shape-providing)
  for (const hook of hooksContract?.hooks ?? []) {
    models.push({
      name: `${hook.name} (hook)`,
      description: `Custom hook defined in ${hook.file}`,
      fields: [],
    });
  }

  const ormOrDbLibrary =
    stateContract?.slices?.length
      ? 'Redux Toolkit'
      : stateContract?.zustandStores?.length
      ? 'Zustand'
      : undefined;

  const dataModels: DNASections['dataModels'] = {
    models,
    ormOrDbLibrary,
    patterns: [],
  };

  // ── conventions ───────────────────────────────────────────────────────────
  const codeStyle: string[] = [];
  if (conventions?.prettier.present) codeStyle.push(`Prettier (${conventions.prettier.file ?? '.prettierrc'})`);
  if (conventions?.eslint.present) codeStyle.push(`ESLint (${conventions.eslint.file ?? '.eslintrc'})`);

  const conventionsSections: DNASections['conventions'] = {
    fileNaming: namingConventions?.fileStyle ?? 'unknown',
    componentNaming: namingConventions?.componentStyle ?? 'unknown',
    variableNaming: 'camelCase (inferred)',
    functionNaming: namingConventions?.hookPrefix === 'use' ? 'camelCase; hooks prefixed with "use"' : 'camelCase',
    directoryStructure: Object.keys(roleToFolders).join(', ') || 'Not detected',
    codeStyle,
    commitStyle: conventions?.commitlint.present ? 'Commitlint enforced' : undefined,
  };

  // ── constraints ───────────────────────────────────────────────────────────
  const constraints: DNASections['constraints'] = {
    nodeVersion: undefined,
    packageManager: undefined,
    browserSupport: [],
    performance: [],
    security: [],
    dependencies: manifest ? Object.keys(manifest.stack).filter((k) => manifest.stack[k as keyof typeof manifest.stack]) : [],
    devDependencies: manifest
      ? [
          manifest.configs.tsconfigPresent ? 'typescript' : '',
          manifest.configs.eslintPresent ? 'eslint' : '',
          manifest.configs.prettierPresent ? 'prettier' : '',
          manifest.configs.commitlintPresent ? 'commitlint' : '',
        ].filter(Boolean)
      : [],
  };

  // ── rawContext ────────────────────────────────────────────────────────────
  const directoryTree = structure?.directoryTree ?? Object.keys(folderRoles).slice(0, 20).join('\n');
  const keyFileSummaries: ProjectDNA['rawContext']['keyFileSummaries'] = [];
  if (manifest) {
    keyFileSummaries.push({ path: 'project-dna/manifest.json', summary: `Stack: ${JSON.stringify(manifest.stack)}` });
  }
  if (namingConventions) {
    keyFileSummaries.push({
      path: 'project-dna/naming-conventions.json',
      summary: `fileStyle=${namingConventions.fileStyle}, componentStyle=${namingConventions.componentStyle}`,
    });
  }
  if (copilotInstructions) {
    keyFileSummaries.push({
      path: 'project-dna/copilot-instructions.md',
      summary: copilotInstructions.slice(0, 500),
    });
  }

  const sections: DNASections = {
    overview,
    techStack,
    architecture,
    modules,
    apis,
    dataModels,
    conventions: conventionsSections,
    constraints,
  };

  const dna: ProjectDNA = {
    projectId,
    sections,
    generatedAt: manifest?.fingerprint.scannedAt ?? new Date().toISOString(),
    rawContext: {
      directoryTree: directoryTree ?? '',
      keyFileSummaries,
    },
  };

  return dna;
}

/** Extract gitHead from manifest.json (written by discoverStack stage) */
export function readGitHead(dnaDir: string): string | undefined {
  const manifest = readJson<Manifest>(path.join(dnaDir, 'manifest.json'));
  return manifest?.fingerprint?.gitHead;
}
