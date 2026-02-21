import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/common/StatusBadge';
import ErrorBanner from '../components/common/ErrorBanner';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, isLoading, error, loadProjects, onboardProject, pollStatus, setError } =
    useStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [onboarding, setOnboarding] = useState(false);
  const [urlError, setUrlError] = useState('');

  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    loadProjects();
    return () => {
      intervalsRef.current.forEach((iv) => clearInterval(iv));
    };
  }, []);

  useEffect(() => {
    projects.forEach((p) => {
      if (
        (p.status === 'ingesting' || p.status === 'refreshing' || p.status === 'pending') &&
        !intervalsRef.current.has(p.id)
      ) {
        const iv = pollStatus(p.id, (status) => {
          intervalsRef.current.delete(p.id);
          if (status === 'ready') loadProjects();
        });
        intervalsRef.current.set(p.id, iv);
      }
    });
  }, [projects]);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const url = repoUrl.trim();
    if (!url) {
      setUrlError('Please enter a repository URL');
      return;
    }
    if (!isValidUrl(url)) {
      setUrlError('Please enter a valid http/https URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setOnboarding(true);
    try {
      const project = await onboardProject(url, projectName.trim() || undefined);
      setRepoUrl('');
      setProjectName('');

      const iv = pollStatus(project.id, (status) => {
        intervalsRef.current.delete(project.id);
        if (status === 'ready') loadProjects();
      });
      intervalsRef.current.set(project.id, iv);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOnboarding(false);
    }
  };

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Never';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-12 animate-slide-up">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
          style={{
            background: 'linear-gradient(135deg, #00d4ff15, #8b5cf615)',
            border: '1px solid #00d4ff33',
            color: '#00d4ff',
          }}
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Project Understanding
        </div>
        <h1 className="text-4xl font-bold mb-3 gradient-text-cyber">
          Project DNA Engine
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Onboard any GitHub repository, extract its architecture, APIs, and conventions — then
          query it in plain language.
        </p>
      </div>

      {/* Onboard form */}
      <div
        className="rounded-2xl p-6 mb-10 max-w-2xl mx-auto cyber-border animate-slide-up"
        style={{ background: '#0d1830', boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,212,255,0.08)' }}
      >
        <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Github className="w-5 h-5 text-primary-500" />
          Analyze a Repository
        </h2>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleOnboard} className="space-y-3">
          <div>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setUrlError('');
              }}
              placeholder="https://github.com/owner/repository"
              className={`w-full rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                urlError
                  ? 'border border-cyber-red/50 bg-cyber-red/5'
                  : 'border border-cyber-border bg-cyber-bg'
              }`}
            />
            {urlError && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#ff4466' }}>
                <AlertCircle className="w-3 h-3" />
                {urlError}
              </p>
            )}
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name (optional — auto-detected from URL)"
            className="w-full border border-cyber-border bg-cyber-bg rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <button
            type="submit"
            disabled={onboarding}
            className="w-full rounded-xl py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #00d4ff22, #8b5cf622)',
              border: '1px solid #00d4ff44',
              color: '#00d4ff',
              boxShadow: '0 0 16px #00d4ff22',
            }}
          >
            {onboarding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initiating analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Project
              </>
            )}
          </button>
        </form>
      </div>

      {/* Projects grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-200">
            Projects{' '}
            <span className="text-slate-500 font-normal text-base">({projects.length})</span>
          </h2>
        </div>

        {isLoading && projects.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            Loading projects...
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">
              No projects yet. Paste a GitHub URL above to get started.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() =>
                project.status === 'ready' ? navigate(`/projects/${project.id}`) : undefined
              }
              className={`rounded-xl p-5 flex flex-col gap-3 transition-all cyber-border ${
                project.status === 'ready'
                  ? 'hover:shadow-neon-cyan cursor-pointer'
                  : 'opacity-60 cursor-default'
              }`}
              style={{ background: '#0d1830' }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-100 truncate">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>

              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-400 transition-colors truncate"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{project.repoUrl}</span>
              </a>

              {project.description && (
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              {project.status === 'error' && project.errorMessage && (
                <p className="text-xs line-clamp-2" style={{ color: '#ff4466' }}>{project.errorMessage}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 mt-auto" style={{ borderTop: '1px solid #1a3055' }}>
                <span>Added {fmtDate(project.createdAt)}</span>
                {project.scannedAt && <span>Scanned {fmtDate(project.scannedAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
