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

  // Load project on mount
  useEffect(() => {
    if (!id) return;
    selectProject(id);
  }, [id]);

  // Auto-poll when project is in an active state
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

  // Loading state (initial load)
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
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{selectedProject.name}</h1>
          <StatusBadge status={selectedProject.status} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <LoadingSpinner message="Cloning repository and analyzing DNA..." />
          <p className="text-xs text-blue-400 mt-2">{selectedProject.repoUrl}</p>
          <p className="text-xs text-blue-400 mt-1">This typically takes 1–3 minutes.</p>
        </div>
      )}

      {/* ── Error state ────────────────────────────────── */}
      {selectedProject.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-800 mb-1">Analysis failed</p>
          <p className="text-sm text-red-700">{selectedProject.errorMessage}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── DNA content ────────────────────────────────── */}
      {hasDNA && selectedProject.dna && (
        <>
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <a
              href={selectedProject.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => {
                setShowEvolve((v) => !v);
                setEvolveChangelog(null);
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-violet-500" />
                <span className="font-semibold text-gray-900">Evolve DNA after PR merge</span>
              </div>
              {showEvolve ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showEvolve && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Paste a PR summary and optionally list changed files. The DNA Engine will
                  analyze the impact and update the relevant sections.
                </p>

                {evolveChangelog && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                      DNA evolved! Changes applied:
                    </p>
                    <ul className="space-y-1">
                      {evolveChangelog.map((change, i) => (
                        <li key={i} className="text-sm text-green-700 flex gap-1.5">
                          <span className="text-green-500 flex-shrink-0">›</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <textarea
                  value={prSummary}
                  onChange={(e) => setPrSummary(e.target.value)}
                  placeholder="Describe what this PR changes (e.g., 'Added JWT authentication. New /auth/login and /auth/refresh endpoints. Updated User model with tokenHash field...')"
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                <textarea
                  value={changedFiles}
                  onChange={(e) => setChangedFiles(e.target.value)}
                  placeholder="Changed files (one per line, optional)&#10;src/routes/auth.ts&#10;src/models/User.ts"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono resize-none"
                />
                <button
                  onClick={handleEvolve}
                  disabled={!prSummary.trim() || isEvolving}
                  className="bg-violet-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
