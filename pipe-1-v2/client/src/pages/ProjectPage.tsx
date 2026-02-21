import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  GitMerge,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import FilterPanel from '../components/dna/FilterPanel';
import DNAViewer from '../components/dna/DNAViewer';
import QueryPanel from '../components/query/QueryPanel';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    selectedProject,
    queryHistory,
    activeSection,
    isLoading,
    isQuerying,
    isEvolving,
    error,
    selectProject,
    refreshProject,
    deleteProject,
    pollStatus,
    queryProject,
    evolveProject,
    setActiveSection,
    setError,
  } = useStore();

  const [showEvolve, setShowEvolve] = useState(false);
  const [prSummary, setPrSummary] = useState('');
  const [changedFiles, setChangedFiles] = useState('');
  const [evolveChangelog, setEvolveChangelog] = useState<string[] | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    selectProject(id);
  }, [id]);

  useEffect(() => {
    if (!id || !selectedProject) return;
    const { status } = selectedProject;

    if (status === 'ingesting' || status === 'refreshing') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = pollStatus(id, (finalStatus) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (finalStatus === 'ready') selectProject(id);
      });
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedProject?.status]);

  const handleRefresh = async () => {
    if (!id) return;
    await refreshProject(id);
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = pollStatus(id, (finalStatus) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (finalStatus === 'ready') selectProject(id);
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(`Delete "${selectedProject?.name}"? This cannot be undone.`)) return;
    await deleteProject(id);
    navigate('/');
  };

  const handleQuery = useCallback(
    async (question: string) => {
      if (!id) return;
      await queryProject(id, question);
    },
    [id, queryProject],
  );

  const handleEvolve = async () => {
    if (!id || !prSummary.trim()) return;
    setEvolveChangelog(null);
    try {
      const files = changedFiles
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
      const { changelog } = await evolveProject(id, prSummary.trim(), files);
      setEvolveChangelog(changelog);
      setPrSummary('');
      setChangedFiles('');
    } catch {
      // error shown by store
    }
  };

  if (isLoading && !selectedProject) {
    return <LoadingSpinner message="Loading project DNA..." />;
  }

  if (!selectedProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ErrorBanner message="Project not found." onDismiss={() => navigate('/')} />
      </div>
    );
  }

  const isAnalyzing =
    selectedProject.status === 'ingesting' || selectedProject.status === 'refreshing';
  const hasDNA = selectedProject.dna && selectedProject.status === 'ready';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ── Page header ────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-bold text-slate-100 truncate">{selectedProject.name}</h1>
          <StatusBadge status={selectedProject.status} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 rounded-lg cyber-border hover:text-primary-400 disabled:opacity-40 transition-colors"
            style={{ background: '#0d1830' }}
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors"
            style={{ background: '#1a0a10', border: '1px solid #ff446633', color: '#ff4466' }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────── */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Ingesting state ────────────────────────────── */}
      {isAnalyzing && (
        <div
          className="rounded-xl p-8 text-center cyber-border-glow"
          style={{ background: 'linear-gradient(135deg, #060d1f, #0d1830)' }}
        >
          <LoadingSpinner message="Cloning repository and analyzing DNA..." />
          <p className="text-xs text-slate-500 mt-2">{selectedProject.repoUrl}</p>
          <p className="text-xs text-slate-500 mt-1">This typically takes 1-3 minutes.</p>
        </div>
      )}

      {/* ── Error state ────────────────────────────────── */}
      {selectedProject.status === 'error' && (
        <div className="rounded-xl p-5" style={{ background: '#1a0a10', border: '1px solid #ff446633' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#ff4466' }}>Analysis failed</p>
          <p className="text-sm text-slate-400">{selectedProject.errorMessage}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm underline transition-colors"
            style={{ color: '#ff4466' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* ── DNA content ────────────────────────────────── */}
      {hasDNA && selectedProject.dna && (
        <>
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <a
              href={selectedProject.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {selectedProject.repoUrl}
            </a>
            {selectedProject.scannedAt && (
              <span>
                Last scanned {new Date(selectedProject.scannedAt).toLocaleString()}
              </span>
            )}
            {selectedProject.gitHead && (
              <span>HEAD: {selectedProject.gitHead.slice(0, 8)}</span>
            )}
          </div>

          {/* Section filter tabs */}
          <FilterPanel activeSection={activeSection} onSelect={setActiveSection} />

          {/* DNA section viewer */}
          <div className="min-h-48">
            <DNAViewer section={activeSection} data={selectedProject.dna.sections} />
          </div>

          {/* ── Evolve DNA panel ───────────────────────── */}
          <div className="rounded-xl overflow-hidden cyber-border" style={{ background: '#0d1830' }}>
            <button
              onClick={() => {
                setShowEvolve((v) => !v);
                setEvolveChangelog(null);
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-cyber-card transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 neon-text-purple" />
                <span className="font-semibold text-slate-200">Evolve DNA after PR merge</span>
              </div>
              {showEvolve ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {showEvolve && (
              <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: '1px solid #1a3055' }}>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste a PR summary and optionally list changed files. The DNA Engine will
                  analyze the impact and update the relevant sections.
                </p>

                {evolveChangelog && (
                  <div className="rounded-xl p-4" style={{ background: '#0a1f1a', border: '1px solid #00ffa333' }}>
                    <p className="text-sm font-semibold mb-2 neon-text-green">
                      DNA evolved! Changes applied:
                    </p>
                    <ul className="space-y-1">
                      {evolveChangelog.map((change, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-1.5">
                          <span style={{ color: '#00ffa3' }} className="flex-shrink-0">›</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <textarea
                  value={prSummary}
                  onChange={(e) => setPrSummary(e.target.value)}
                  placeholder="Describe what this PR changes..."
                  rows={4}
                  className="w-full border border-cyber-border bg-cyber-bg rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-purple/50 resize-none"
                />
                <textarea
                  value={changedFiles}
                  onChange={(e) => setChangedFiles(e.target.value)}
                  placeholder="Changed files (one per line, optional)&#10;src/routes/auth.ts&#10;src/models/User.ts"
                  rows={3}
                  className="w-full border border-cyber-border bg-cyber-bg rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-purple/50 font-mono resize-none"
                />
                <button
                  onClick={handleEvolve}
                  disabled={!prSummary.trim() || isEvolving}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf622, #00d4ff11)',
                    border: '1px solid #8b5cf644',
                    color: '#8b5cf6',
                    boxShadow: '0 0 12px #8b5cf622',
                  }}
                >
                  {isEvolving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Evolving DNA...
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-4 h-4" />
                      Evolve DNA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Query panel ────────────────────────────── */}
          <QueryPanel
            projectId={selectedProject.id}
            history={queryHistory}
            isQuerying={isQuerying}
            onQuery={handleQuery}
          />
        </>
      )}
    </div>
  );
}
