import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { ProjectDNA, QueryResult } from '../types';
import { getDNADir, getQueriesPath } from './ProjectRegistry';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Keyword-to-section routing for relevance
const SECTION_KEYWORDS: Record<string, string[]> = {
  overview: ['purpose', 'what is', 'describe', 'overview', 'about', 'goal', 'feature', 'user', 'target'],
  techStack: ['tech', 'stack', 'framework', 'library', 'language', 'tool', 'dependency', 'package', 'runtime'],
  architecture: ['architecture', 'pattern', 'layer', 'structure', 'design', 'decision', 'monorepo', 'microservice', 'folder', 'directory'],
  modules: ['module', 'component', 'service', 'package', 'app', 'boundary', 'responsibility', 'domain'],
  apis: ['api', 'endpoint', 'route', 'rest', 'http', 'request', 'response', 'method', 'controller', 'handler', 'url'],
  dataModels: ['model', 'schema', 'data', 'entity', 'database', 'field', 'type', 'interface', 'orm', 'relation', 'store', 'slice', 'hook'],
  conventions: ['naming', 'convention', 'style', 'format', 'pattern', 'standard', 'rule', 'guideline', 'commit', 'lint'],
  constraints: ['constraint', 'requirement', 'version', 'node', 'browser', 'security', 'performance', 'package manager', 'npm', 'yarn'],
};

function selectRelevantSections(
  question: string,
  dna: ProjectDNA,
): { sectionNames: string[]; context: string } {
  const q = question.toLowerCase();
  const relevant = new Set<string>(['overview']); // always include overview

  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) {
      relevant.add(section);
    }
  }

  // If no specific match beyond overview, include all sections
  if (relevant.size <= 1) {
    Object.keys(SECTION_KEYWORDS).forEach((s) => relevant.add(s));
  }

  const sectionNames = Array.from(relevant);
  const selectedSections: Record<string, unknown> = {};
  for (const s of sectionNames) {
    selectedSections[s] = (dna.sections as unknown as Record<string, unknown>)[s];
  }

  return {
    sectionNames,
    context: JSON.stringify(selectedSections, null, 2),
  };
}

/**
 * Build Q&A context.
 *
 * Priority:
 *   1. copilot-instructions.md (rich LLM-generated narrative — if present)
 *   2. Selected DNA sections as JSON (always available after ingestion)
 */
function buildQAContext(
  projectId: string,
  question: string,
  dna: ProjectDNA,
): { context: string; sectionNames: string[]; usingCopilotInstructions: boolean } {
  const dnaDir = getDNADir(projectId);
  const copilotPath = path.join(dnaDir, 'copilot-instructions.md');

  if (fs.existsSync(copilotPath)) {
    try {
      const copilotMd = fs.readFileSync(copilotPath, 'utf-8');
      // Trim to ~12k chars to stay well within token budget
      const trimmed = copilotMd.length > 12000 ? copilotMd.slice(0, 12000) + '\n...(truncated)' : copilotMd;
      return {
        context: trimmed,
        sectionNames: ['copilot-instructions'],
        usingCopilotInstructions: true,
      };
    } catch {
      // fall through to DNA sections
    }
  }

  const { sectionNames, context } = selectRelevantSections(question, dna);
  return { context, sectionNames, usingCopilotInstructions: false };
}

export async function queryDNA(
  projectId: string,
  question: string,
  dna: ProjectDNA,
): Promise<QueryResult> {
  const { context, sectionNames, usingCopilotInstructions } = buildQAContext(projectId, question, dna);

  const systemContent = usingCopilotInstructions
    ? `You are a Project DNA assistant. Answer questions STRICTLY from the copilot-instructions document provided.

Rules:
- Be precise and concise. Reference specific sections of the document.
- If information is NOT in the document, say so explicitly.
- Do not hallucinate or invent details not present in the provided document.
- Confidence levels: "high" = clearly stated, "medium" = inferred, "low" = partially covered, "not_found" = absent.

Return JSON:
{
  "answer": "string — your answer in plain language",
  "confidence": "high" | "medium" | "low" | "not_found",
  "referencedSections": ["string — which sections/headings you used"]
}`
    : `You are a Project DNA assistant. Answer questions STRICTLY from the Project DNA provided.

Rules:
- Be precise and concise. Reference specific DNA sections.
- If information is NOT in the DNA, say so explicitly and suggest what data/scan would be needed to answer it.
- Do not hallucinate or invent details not present in the DNA.
- Confidence levels: "high" = clearly stated in DNA, "medium" = inferred from DNA, "low" = partially in DNA, "not_found" = absent.

Return JSON:
{
  "answer": "string — your answer in plain language",
  "confidence": "high" | "medium" | "low" | "not_found",
  "referencedSections": ["string — which DNA sections you used"]
}`;

  const userContent = usingCopilotInstructions
    ? `Copilot Instructions:\n${context}\n\nQuestion: ${question}`
    : `Project DNA (relevant sections):\n${context}\n\nQuestion: ${question}`;

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ],
  });

  const raw = response.choices[0].message.content ?? '{}';

  let parsed: { answer: string; confidence: QueryResult['confidence']; referencedSections: string[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { answer: raw, confidence: 'low', referencedSections: [] };
  }

  const result: QueryResult = {
    question,
    answer: parsed.answer || 'No answer generated.',
    referencedSections: parsed.referencedSections?.length ? parsed.referencedSections : sectionNames,
    confidence: parsed.confidence || 'low',
    timestamp: new Date().toISOString(),
  };

  // Persist query history to out/pipe-1/<id>/queries.json
  const queriesPath = getQueriesPath(projectId);
  let history: QueryResult[] = [];
  if (fs.existsSync(queriesPath)) {
    try {
      history = JSON.parse(fs.readFileSync(queriesPath, 'utf-8')) as QueryResult[];
    } catch {
      history = [];
    }
  }
  history.push(result);
  fs.writeFileSync(queriesPath, JSON.stringify(history, null, 2));

  return result;
}

export function getQueryHistory(projectId: string): QueryResult[] {
  const queriesPath = getQueriesPath(projectId);
  if (!fs.existsSync(queriesPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(queriesPath, 'utf-8')) as QueryResult[];
  } catch {
    return [];
  }
}
