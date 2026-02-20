/**
 * PlanningEngine.ts – Re-exports the PlanningEngine interface.
 *
 * The interface itself lives in contracts/phase3.ts so that downstream
 * consumers (CLI, tests) only need one import point. This file exists as a
 * convenient named re-export matching the project convention of placing the
 * interface alongside concrete implementations under the ai/ folder.
 */

export type { PlanningEngine, PlanningInput, PlanningOutput } from "../../contracts/phase3";
