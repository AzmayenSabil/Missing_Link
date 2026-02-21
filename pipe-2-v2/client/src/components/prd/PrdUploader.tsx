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

  /* ── File confirmed ── */
  if (fileName) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl"
        style={{
          background: "linear-gradient(135deg, #0a1f1a, #0d2a1e)",
          border: "1px solid #00ffa344",
          boxShadow: "0 0 16px #00ffa311",
        }}
      >
        <FileText
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "#00ffa3", filter: "drop-shadow(0 0 4px #00ffa3)" }}
        />
        <span
          className="font-mono text-sm font-medium flex-1 truncate"
          style={{ color: "#00ffa3" }}
        >
          {fileName}
        </span>
        <button
          onClick={() => {
            setFileName(null);
            setPasteText("");
            setPasteMode(false);
          }}
          className="transition-opacity hover:opacity-70"
          style={{ color: "#64748b" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ── Paste mode ── */
  if (pasteMode) {
    return (
      <div className="space-y-3">
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your PRD content here..."
          className="w-full h-48 p-4 rounded-xl resize-none text-sm font-mono focus:outline-none"
          style={{
            background: "#0f1f3a",
            border: "1px solid #1a3055",
            color: "#cbd5e1",
            caretColor: "#00d4ff",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#00d4ff44";
            e.currentTarget.style.boxShadow = "0 0 0 2px #00d4ff11";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#1a3055";
            e.currentTarget.style.boxShadow = "none";
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="px-4 py-2 rounded-lg font-mono text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #8b5cf622)",
              border: "1px solid #00d4ff44",
              color: "#00d4ff",
            }}
          >
            Use this PRD
          </button>
          <button
            onClick={() => setPasteMode(false)}
            className="px-4 py-2 rounded-lg font-mono text-sm transition-opacity hover:opacity-70"
            style={{ color: "#94a3b8" }}
          >
            ← Back to upload
          </button>
        </div>
      </div>
    );
  }

  /* ── Drop zone ── */
  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 relative overflow-hidden"
        style={
          dragging
            ? {
                background: "linear-gradient(135deg, #00d4ff14, #8b5cf614)",
                border: "1px dashed #00d4ff",
                boxShadow: "0 0 20px #00d4ff11",
              }
            : {
                background: "linear-gradient(135deg, #0f1f3a, #111d30)",
                border: "1px dashed #1a3055",
              }
        }
      >
        {dragging && <div className="scan-beam" style={{ opacity: 0.3 }} />}
        <Upload
          className="w-8 h-8 mx-auto mb-3"
          style={{
            color: dragging ? "#00d4ff" : "#64748b",
            filter: dragging ? "drop-shadow(0 0 6px #00d4ff)" : "none",
            transition: "all 0.2s",
          }}
        />
        <p
          className="font-mono text-sm font-medium"
          style={{ color: dragging ? "#00d4ff" : "#94a3b8" }}
        >
          Drop your PRD file here
        </p>
        <p
          className="text-xs font-mono mt-1"
          style={{ color: dragging ? "#94a3b8" : "#64748b" }}
        >
          Supports .md and .txt files
        </p>
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
        className="mt-3 text-xs font-mono tracking-wider uppercase transition-opacity hover:opacity-70"
        style={{ color: "#94a3b8" }}
      >
        Or paste PRD content directly →
      </button>
    </div>
  );
}
