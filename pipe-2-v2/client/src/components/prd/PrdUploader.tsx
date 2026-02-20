import { useState, useRef, type DragEvent } from "react";
import { Upload, FileText, X } from "lucide-react";

interface PrdUploaderProps {
  onPrdReady: (text: string, fileName: string) => void;
}

export default function PrdUploader({ onPrdReady }: PrdUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(md|txt|markdown)$/i)) {
      alert("Please upload a .md or .txt file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileName(file.name);
      onPrdReady(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePasteSubmit = () => {
    if (pasteText.trim()) {
      setFileName("pasted-prd.md");
      onPrdReady(pasteText, "pasted-prd.md");
    }
  };

  if (fileName) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <FileText className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium flex-1">{fileName}</span>
        <button
          onClick={() => {
            setFileName(null);
            setPasteText("");
            setPasteMode(false);
          }}
          className="text-green-500 hover:text-green-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (pasteMode) {
    return (
      <div className="space-y-3">
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your PRD content here..."
          className="w-full h-48 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Use this PRD
          </button>
          <button
            onClick={() => setPasteMode(false)}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
          >
            Back to upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-primary-400 bg-primary-50"
            : "border-slate-300 hover:border-slate-400 bg-white"
        }`}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Drop your PRD file here</p>
        <p className="text-slate-400 text-sm mt-1">Supports .md and .txt files</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.markdown"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </div>
      <button
        onClick={() => setPasteMode(true)}
        className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium"
      >
        Or paste PRD content directly
      </button>
    </div>
  );
}
