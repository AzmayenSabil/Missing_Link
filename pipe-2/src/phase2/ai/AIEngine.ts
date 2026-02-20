/**
 * AIEngine.ts – Re-exports the AIEngine interface and related types so
 * consumers can import from a single location within the ai/ sub-tree.
 *
 * The actual interface lives in contracts/phase2.ts to keep contracts
 * framework-agnostic and importable without pulling in any engine code.
 */

export type {
  AIEngine,
  AnalyzeInput,
  AnalyzeOutput,
} from "../../contracts/phase2";
