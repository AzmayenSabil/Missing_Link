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

function Chip({ text, color = 'indigo' }: { text: string; color?: string }) {
  const palette: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${palette[color] ?? palette.gray}`}
    >
      {text}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Chips({ items, color }: { items?: string[] | null; color?: string }) {
  if (!items?.length) return <p className="text-sm text-gray-400 italic">None identified</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Chip key={i} text={item} color={color} />
      ))}
    </div>
  );
}

function Bullets({ items }: { items?: string[] | null }) {
  if (!items?.length) return <p className="text-sm text-gray-400 italic">None identified</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="text-indigo-400 mt-0.5 flex-shrink-0">›</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return <p className="text-gray-400 italic text-sm py-4">No data available for this section.</p>;
}

// ─── Section viewers ─────────────────────────────────────────────────────────

function OverviewViewer({ data }: { data?: OverviewSection }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <Card title="About">
        <p className="text-gray-800 text-sm leading-relaxed mb-3">
          {data.description || data.purpose || '—'}
        </p>
        <div className="flex flex-wrap gap-2">
          {data.deploymentType && <Chip text={data.deploymentType} color="blue" />}
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
          <p className="text-sm text-gray-700 leading-relaxed">{data.purpose}</p>
        </Card>
      )}
    </div>
  );
}

function TechStackViewer({ data }: { data?: TechStackSection }) {
  if (!data) return <Empty />;
  const categories = [
    { label: 'Languages', items: data.languages, color: 'indigo' },
    { label: 'Frameworks', items: data.frameworks, color: 'blue' },
    { label: 'Libraries', items: data.libraries, color: 'purple' },
    { label: 'Build Tools', items: data.buildTools, color: 'orange' },
    { label: 'Testing', items: data.testingTools, color: 'green' },
    { label: 'Databases', items: data.databases, color: 'amber' },
    { label: 'DevOps / CI', items: data.devOps, color: 'gray' },
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
          <Chip text={data.pattern || 'Unknown'} color="indigo" />
          {data.diagramDescription && (
            <p className="text-sm text-gray-700 leading-relaxed mt-3">{data.diagramDescription}</p>
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
              <div key={i} className="border-l-2 border-indigo-200 pl-4">
                <p className="font-semibold text-sm text-gray-900">{layer.name}</p>
                <p className="text-sm text-gray-600 mb-1">{layer.description}</p>
                {layer.directories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {layer.directories.map((d, j) => (
                      <code
                        key={j}
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono"
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
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{mod.name}</h3>
            {mod.path && (
              <code className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                {mod.path}
              </code>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-3">{mod.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Responsibilities</p>
              <Bullets items={mod.responsibilities} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Exposed APIs</p>
              <Bullets items={mod.exposedAPIs} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Dependencies</p>
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

  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 font-bold',
    POST: 'bg-blue-100 text-blue-700 font-bold',
    PUT: 'bg-yellow-100 text-yellow-700 font-bold',
    PATCH: 'bg-orange-100 text-orange-700 font-bold',
    DELETE: 'bg-red-100 text-red-700 font-bold',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.baseUrl && (
          <Card title="Base URL">
            <code className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg block font-mono">
              {data.baseUrl}
            </code>
            {data.authMethod && (
              <p className="text-sm text-gray-500 mt-2">
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
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Endpoints ({data.endpoints?.length ?? 0})
        </p>
        {data.endpoints?.length ? (
          <div className="space-y-2">
            {data.endpoints.map((ep, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${methodColors[ep.method] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                </div>
                <p className="text-sm text-gray-500 ml-14">{ep.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No endpoints identified</p>
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
            <Chip text={data.ormOrDbLibrary} color="blue" />
          </Card>
        )}
        {data.patterns?.length > 0 && (
          <Card title="Patterns">
            <Chips items={data.patterns} color="purple" />
          </Card>
        )}
      </div>
      {data.models?.map((model, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{model.description}</p>
          {model.fields?.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Field', 'Type', 'Required', 'Description'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs text-gray-500 font-semibold px-3 py-2"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.fields.map((field, j) => (
                    <tr key={j} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-indigo-600">{field.name}</td>
                      <td className="px-3 py-2 text-gray-600">{field.type}</td>
                      <td className="px-3 py-2 text-center">
                        {field.required ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{field.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(model.relations?.length ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Relations</p>
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
              <span className="text-xs text-gray-500 w-44 flex-shrink-0 mt-0.5">{rule.label}</span>
              <Chip text={rule.value!} color="indigo" />
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
            <Chip text={data.packageManager} color="blue" />
          </Card>
        )}
      </div>
      {data.browserSupport?.length ? (
        <Card title="Browser Support">
          <Chips items={data.browserSupport} color="gray" />
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
            <Chips items={data.devDependencies} color="gray" />
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
      return <p className="text-gray-400 italic">Unknown section: {section}</p>;
  }
}
