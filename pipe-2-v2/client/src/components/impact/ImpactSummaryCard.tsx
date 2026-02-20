import { FileCode, Files, Layers } from "lucide-react";
import type { ImpactAnalysis } from "../../types";

export default function ImpactSummaryCard({ impact }: { impact: ImpactAnalysis }) {
  const { primaryCount, secondaryCount } = impact.summary;
  const totalFiles = impact.files.length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
        <FileCode className="w-5 h-5 text-red-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-red-700">{primaryCount}</p>
        <p className="text-xs text-red-500">Primary</p>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
        <Files className="w-5 h-5 text-amber-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-amber-700">{secondaryCount}</p>
        <p className="text-xs text-amber-500">Secondary</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
        <Layers className="w-5 h-5 text-blue-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-blue-700">{totalFiles}</p>
        <p className="text-xs text-blue-500">Total</p>
      </div>
    </div>
  );
}
