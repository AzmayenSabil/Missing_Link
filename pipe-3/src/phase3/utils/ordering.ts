/**
 * ordering.ts – Topological-ish ordering for plan steps.
 *
 * Uses a simple dependency-aware sort:
 * 1. Build a map of stepId -> index in the input list.
 * 2. Walk through steps; if a step depends on another that comes later,
 *    bump it after its dependencies (iterative passes).
 * 3. Handles cycles gracefully (leaves order as-is on cycle detection).
 */

import type { PlanStep } from "../../contracts/phase3";

/**
 * Return a stable topologically-ordered copy of the steps array.
 * Steps with no dependsOnStepIds remain in their original relative order.
 */
export function applyTopologicalOrder(steps: PlanStep[]): PlanStep[] {
  if (steps.length === 0) return [];

  // Build id -> step map
  const byId = new Map<string, PlanStep>(steps.map((s) => [s.id, s]));

  // Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adjOutgoing = new Map<string, string[]>(); // id -> dependents

  for (const s of steps) {
    if (!inDegree.has(s.id)) inDegree.set(s.id, 0);
    if (!adjOutgoing.has(s.id)) adjOutgoing.set(s.id, []);
    for (const dep of s.dependsOnStepIds) {
      // dep must come before s
      if (!byId.has(dep)) continue; // unknown dep – ignore
      const outgoing = adjOutgoing.get(dep) ?? [];
      outgoing.push(s.id);
      adjOutgoing.set(dep, outgoing);
      inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
    }
  }

  // Initialise queue with all steps that have in-degree 0, preserving input order
  const queue: string[] = steps
    .map((s) => s.id)
    .filter((id) => (inDegree.get(id) ?? 0) === 0);

  const ordered: PlanStep[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const step = byId.get(id);
    if (step) ordered.push(step);

    // Reduce in-degree for dependents
    for (const dependent of adjOutgoing.get(id) ?? []) {
      const newDeg = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDeg);
      if (newDeg === 0) {
        queue.push(dependent);
      }
    }
  }

  // If there are unvisited steps (cycle or missed), append them at the end
  for (const s of steps) {
    if (!visited.has(s.id)) {
      ordered.push(s);
    }
  }

  return ordered;
}
