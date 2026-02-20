import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
      <Link to="/" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
        <Zap className="w-5 h-5" />
        <span className="font-semibold text-lg">Missing Link</span>
      </Link>
      <span className="text-slate-400 text-sm ml-2">PRD Validation Pipeline</span>
    </header>
  );
}
