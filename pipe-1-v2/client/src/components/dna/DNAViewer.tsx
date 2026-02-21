import React from 'react';
import type {
  DNASections,
  OverviewSection,
  TechStackSection,
  ArchitectureSection,
  APISection,
  DataModelSection,
  ConventionSection,
  ConstraintSection,
} from '../../types';

// ─── Primitive UI pieces ────────────────────────────────────────────────────

function Chip({ text, color = 'cyan' }: { text: string; color?: string }) {
  const palette: Record<string, string> = {
    cyan: 'bg-primary-500/10 text-primary-400 border border-primary-500/30',
    blue: 'bg-primary-500/10 text-primary-400 border border-primary-500/30',
    indigo: 'bg-primary-500/10 text-primary-400 border border-primary-500/30',
    green: 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30',
    purple: 'bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30',
    orange: 'bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/30',
    amber: 'bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/30',
    slate: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
    gray: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${palette[color] ?? palette.slate}`}
    >
      {text}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 cyber-border" style={{ background: '#0d1830' }}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Chips({ items, color }: { items?: string[] | null; color?: string }) {
  if (!items?.length) return <p className="text-sm text-slate-500 italic">None identified</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Chip key={i} text={item} color={color} />
      ))}
    </div>
  );
}

function Bullets({ items }: { items?: string[] | null }) {
  if (!items?.length) return <p className="text-sm text-slate-500 italic">None identified</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
          <span className="text-primary-500 mt-0.5 flex-shrink-0">›</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return <p className="text-slate-500 italic text-sm py-4">No data available for this section.</p>;
}

// ─── Section viewers ─────────────────────────────────────────────────────────

function OverviewViewer({ data }: { data?: OverviewSection }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <Card title="About">
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          {data.description || data.purpose || '—'}
        </p>
        <div className="flex flex-wrap gap-2">
          {data.deploymentType && <Chip text={data.deploymentType} color="cyan" />}
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Main Features">
          <Bullets items={data.mainFeatures} />
        </Card>
        <Card title="Target Users">
          <Bullets items={data.targetUsers} />
        </Card>
      </div>
      {data.purpose && data.purpose !== data.description && (
        <Card title="Purpose">
          <p className="text-sm text-slate-300 leading-relaxed">{data.purpose}</p>
        </Card>
      )}
    </div>
  );
}

function TechStackViewer({ data }: { data?: TechStackSection }) {
  if (!data) return <Empty />;
  const categories = [
    { label: 'Languages', items: data.languages, color: 'cyan' },
    { label: 'Frameworks', items: data.frameworks, color: 'purple' },
    { label: 'Libraries', items: data.libraries, color: 'green' },
    { label: 'Build Tools', items: data.buildTools, color: 'orange' },
    { label: 'Testing', items: data.testingTools, color: 'amber' },
    { label: 'Databases', items: data.databases, color: 'cyan' },
    { label: 'DevOps / CI', items: data.devOps, color: 'slate' },
  ].filter((c) => c.items?.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <Card key={cat.label} title={cat.label}>
          <Chips items={cat.items} color={cat.color} />
        </Card>
      ))}
    </div>
  );
}

function ArchitectureViewer({ data }: { data?: ArchitectureSection }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Pattern">
          <Chip text={data.pattern || 'Unknown'} color="cyan" />
          {data.diagramDescription && (
            <p className="text-sm text-slate-300 leading-relaxed mt-3">{data.diagramDescription}</p>
          )}
        </Card>
        <Card title="Key Decisions">
          <Bullets items={data.keyDecisions} />
        </Card>
      </div>
      {data.layers?.length > 0 && (
        <Card title="Layers">
          <div className="space-y-3">
            {data.layers.map((layer, i) => (
              <div key={i} className="pl-4" style={{ borderLeft: '2px solid #00d4ff44' }}>
                <p className="font-semibold text-sm text-slate-200">{layer.name}</p>
                <p className="text-sm text-slate-400 mb-1">{layer.description}</p>
                {layer.directories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {layer.directories.map((d, j) => (
                      <code
                        key={j}
                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{ background: '#0f1f3a', color: '#00d4ff', border: '1px solid #1a3055' }}
                      >
                        {d}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ModulesViewer({ data }: { data?: DNASections['modules'] }) {
  if (!data?.length) return <Empty />;
  return (
    <div className="space-y-4">
      {data.map((mod, i) => (
        <div key={i} className="rounded-xl p-5 cyber-border" style={{ background: '#0d1830' }}>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-slate-200">{mod.name}</h3>
            {mod.path && (
              <code
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: '#0f1f3a', color: '#00d4ff', border: '1px solid #1a3055' }}
              >
                {mod.path}
              </code>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-3">{mod.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2" style={{ borderTop: '1px solid #1a3055' }}>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Responsibilities</p>
              <Bullets items={mod.responsibilities} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Exposed APIs</p>
              <Bullets items={mod.exposedAPIs} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Dependencies</p>
              <Bullets items={mod.dependencies} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function APIsViewer({ data }: { data?: APISection }) {
  if (!data) return <Empty />;

  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: '#00ffa315', text: '#00ffa3' },
    POST: { bg: '#00d4ff15', text: '#00d4ff' },
    PUT: { bg: '#ffd60015', text: '#ffd600' },
    PATCH: { bg: '#ff7a0015', text: '#ff7a00' },
    DELETE: { bg: '#ff446615', text: '#ff4466' },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.baseUrl && (
          <Card title="Base URL">
            <code
              className="text-sm px-3 py-1.5 rounded-lg block font-mono"
              style={{ background: '#0f1f3a', color: '#00d4ff', border: '1px solid #1a3055' }}
            >
              {data.baseUrl}
            </code>
            {data.authMethod && (
              <p className="text-sm text-slate-400 mt-2">
                Auth: <Chip text={data.authMethod} color="purple" />
              </p>
            )}
          </Card>
        )}
        <Card title="Patterns">
          <Chips items={data.patterns} color="purple" />
        </Card>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Endpoints ({data.endpoints?.length ?? 0})
        </p>
        {data.endpoints?.length ? (
          <div className="space-y-2">
            {data.endpoints.map((ep, i) => {
              const mc = methodColors[ep.method] ?? { bg: '#1a3055', text: '#94a3b8' };
              return (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex flex-col gap-1 cyber-border"
                  style={{ background: '#0d1830' }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: mc.bg, color: mc.text }}
                    >
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-slate-200">{ep.path}</code>
                  </div>
                  <p className="text-sm text-slate-400 ml-14">{ep.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No endpoints identified</p>
        )}
      </div>
    </div>
  );
}

function DataModelsViewer({ data }: { data?: DataModelSection }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.ormOrDbLibrary && (
          <Card title="ORM / DB Library">
            <Chip text={data.ormOrDbLibrary} color="cyan" />
          </Card>
        )}
        {data.patterns?.length > 0 && (
          <Card title="Patterns">
            <Chips items={data.patterns} color="purple" />
          </Card>
        )}
      </div>
      {data.models?.map((model, i) => (
        <div key={i} className="rounded-xl p-5 cyber-border" style={{ background: '#0d1830' }}>
          <h3 className="font-semibold text-slate-200 mb-1">{model.name}</h3>
          <p className="text-sm text-slate-400 mb-3">{model.description}</p>
          {model.fields?.length > 0 && (
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #1a3055' }}>
              <table className="min-w-full text-sm">
                <thead style={{ background: '#0f1f3a' }}>
                  <tr>
                    {['Field', 'Type', 'Required', 'Description'].map((h) => (
                      <th key={h} className="text-left text-xs text-slate-400 font-semibold px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.fields.map((field, j) => (
                    <tr key={j} style={{ borderTop: '1px solid #1a3055' }}>
                      <td className="px-3 py-2 font-mono text-primary-400">{field.name}</td>
                      <td className="px-3 py-2 text-slate-400">{field.type}</td>
                      <td className="px-3 py-2 text-center">
                        {field.required ? (
                          <span style={{ color: '#00ffa3' }}>✓</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{field.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(model.relations?.length ?? 0) > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1a3055' }}>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Relations</p>
              <Bullets items={model.relations} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConventionsViewer({ data }: { data?: ConventionSection }) {
  if (!data) return <Empty />;
  const rules = [
    { label: 'File Naming', value: data.fileNaming },
    { label: 'Component Naming', value: data.componentNaming },
    { label: 'Variable Naming', value: data.variableNaming },
    { label: 'Function Naming', value: data.functionNaming },
    { label: 'Directory Structure', value: data.directoryStructure },
    { label: 'Commit Style', value: data.commitStyle },
  ].filter((r) => r.value);

  return (
    <div className="space-y-4">
      <Card title="Naming & Structure Rules">
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.label} className="flex items-start gap-3">
              <span className="text-xs text-slate-500 w-44 flex-shrink-0 mt-0.5">{rule.label}</span>
              <Chip text={rule.value!} color="cyan" />
            </div>
          ))}
        </div>
      </Card>
      {data.codeStyle?.length > 0 && (
        <Card title="Code Style Guidelines">
          <Bullets items={data.codeStyle} />
        </Card>
      )}
    </div>
  );
}

function ConstraintsViewer({ data }: { data?: ConstraintSection }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.nodeVersion && (
          <Card title="Node Version">
            <Chip text={data.nodeVersion} color="green" />
          </Card>
        )}
        {data.packageManager && (
          <Card title="Package Manager">
            <Chip text={data.packageManager} color="cyan" />
          </Card>
        )}
      </div>
      {data.browserSupport?.length ? (
        <Card title="Browser Support">
          <Chips items={data.browserSupport} color="slate" />
        </Card>
      ) : null}
      {data.performance?.length ? (
        <Card title="Performance Requirements">
          <Bullets items={data.performance} />
        </Card>
      ) : null}
      {data.security?.length ? (
        <Card title="Security Requirements">
          <Bullets items={data.security} />
        </Card>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.dependencies?.length ? (
          <Card title="Runtime Dependencies">
            <Chips items={data.dependencies} color="purple" />
          </Card>
        ) : null}
        {data.devDependencies?.length ? (
          <Card title="Dev Dependencies">
            <Chips items={data.devDependencies} color="slate" />
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DNAViewerProps {
  section: string;
  data: DNASections;
}

export default function DNAViewer({ section, data }: DNAViewerProps) {
  switch (section) {
    case 'overview':
      return <OverviewViewer data={data.overview} />;
    case 'techStack':
      return <TechStackViewer data={data.techStack} />;
    case 'architecture':
      return <ArchitectureViewer data={data.architecture} />;
    case 'modules':
      return <ModulesViewer data={data.modules} />;
    case 'apis':
      return <APIsViewer data={data.apis} />;
    case 'dataModels':
      return <DataModelsViewer data={data.dataModels} />;
    case 'conventions':
      return <ConventionsViewer data={data.conventions} />;
    case 'constraints':
      return <ConstraintsViewer data={data.constraints} />;
    default:
      return <p className="text-slate-500 italic">Unknown section: {section}</p>;
  }
}
