import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
