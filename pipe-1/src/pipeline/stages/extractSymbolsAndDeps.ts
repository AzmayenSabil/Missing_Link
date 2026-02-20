import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import {
  ExportRecord,
  ImportRecord,
  PipelineContext,
} from "../../types/pipeline";
import { writeJson, writeJsonl } from "../../utils/fs";
import { repoRelativePath, toPosix } from "../../utils/paths";

function resolveRelativeImport(
  repoRoot: string,
  importerAbsPath: string,
  moduleSpecifier: string,
): string | undefined {
  const importerDir = path.dirname(importerAbsPath);
  const base = path.resolve(importerDir, moduleSpecifier);

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const rel = repoRelativePath(repoRoot, candidate);
      if (!rel.startsWith("..")) {
        return rel;
      }
    }
  }

  return undefined;
}

function detectTags(
  file: string,
  symbolName: string,
  fileText: string,
): string[] {
  const tags = new Set<string>();

  if (/^use[A-Z0-9_]/.test(symbolName)) {
    tags.add("hook");
  }
  if (/createSlice\s*\(/.test(fileText)) {
    tags.add("slice");
  }
  if (/createAsyncThunk\s*\(/.test(fileText)) {
    tags.add("thunk");
  }
  if (
    file.includes("/services/") ||
    /axios|\.get\(|\.post\(|\.put\(|\.patch\(|\.delete\(/.test(fileText)
  ) {
    tags.add("service");
  }
  if (
    /\.tsx$/.test(file) &&
    (/^[A-Z][A-Za-z0-9_]+$/.test(symbolName) || /<\w+/.test(fileText))
  ) {
    tags.add("component");
  }

  if (tags.size === 0) {
    tags.add("other");
  }

  return Array.from(tags);
}

export async function extractSymbolsAndDeps(
  ctx: PipelineContext,
): Promise<void> {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
    },
  });

  project.addSourceFilesAtPaths(ctx.tsLikeFiles);

  const exportsRows: ExportRecord[] = [];
  const importsRows: ImportRecord[] = [];
  const adjacency = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();

  for (const sourceFile of project.getSourceFiles()) {
    try {
      const absFile = sourceFile.getFilePath();
      const relFile = toPosix(repoRelativePath(ctx.workingRepoPath, absFile));
      const fileText = sourceFile.getFullText();

      if (!adjacency.has(relFile)) {
        adjacency.set(relFile, new Set<string>());
      }

      const exported = sourceFile.getExportedDeclarations();
      for (const [symbolName, declarations] of exported.entries()) {
        for (const declaration of declarations) {
          const record: ExportRecord = {
            symbol: symbolName,
            kind: declaration.getKindName(),
            file: relFile,
            tags: detectTags(relFile, symbolName, fileText),
            startLine: declaration.getStartLineNumber(),
            endLine: declaration.getEndLineNumber(),
          };

          exportsRows.push(record);
          if (record.tags.includes("hook")) {
            ctx.hookExports.push(record);
          }
          ctx.symbolIndex[symbolName] = {
            file: relFile,
            kind: record.kind,
            tags: record.tags,
          };
        }
      }

      for (const importDecl of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const importedSymbols: string[] = [];

        const defaultImport = importDecl.getDefaultImport();
        if (defaultImport) {
          importedSymbols.push(defaultImport.getText());
        }

        for (const named of importDecl.getNamedImports()) {
          importedSymbols.push(named.getName());
        }

        const namespace = importDecl.getNamespaceImport();
        if (namespace) {
          importedSymbols.push(namespace.getText());
        }

        const resolvedFile = moduleSpecifier.startsWith(".")
          ? resolveRelativeImport(ctx.workingRepoPath, absFile, moduleSpecifier)
          : undefined;

        importsRows.push({
          file: relFile,
          moduleSpecifier,
          resolvedFile,
          importedSymbols,
        });

        if (resolvedFile) {
          adjacency.get(relFile)?.add(resolvedFile);
          if (!reverse.has(resolvedFile)) {
            reverse.set(resolvedFile, new Set<string>());
          }
          reverse.get(resolvedFile)?.add(relFile);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.warnings.push(
        `parse warning in ${sourceFile.getFilePath()}: ${message}`,
      );
    }
  }

  const adjacencyObj: Record<string, string[]> = {};
  for (const [from, tos] of adjacency.entries()) {
    adjacencyObj[from] = Array.from(tos).sort();
  }

  const reverseObj: Record<string, string[]> = {};
  for (const [to, froms] of reverse.entries()) {
    reverseObj[to] = Array.from(froms).sort();
  }

  ctx.exports = exportsRows;
  ctx.imports = importsRows;
  ctx.depgraph = {
    adjacency: adjacencyObj,
    reverseAdjacency: reverseObj,
  };

  ctx.metrics.ts_files_parsed = project.getSourceFiles().length;
  ctx.metrics.exports_count = exportsRows.length;
  ctx.metrics.imports_edges_count = importsRows.length;
  ctx.metrics.imports_resolved_count = importsRows.filter(
    (r) => r.resolvedFile !== undefined,
  ).length;

  await Promise.all([
    writeJsonl(path.join(ctx.indexesDir, "exports.jsonl"), exportsRows),
    writeJsonl(path.join(ctx.indexesDir, "imports.jsonl"), importsRows),
    writeJson(path.join(ctx.indexesDir, "depgraph.json"), ctx.depgraph),
    writeJson(path.join(ctx.indexesDir, "symbol_index.json"), ctx.symbolIndex),
  ]);
}
