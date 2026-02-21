import React from 'react';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'techStack', label: 'Tech Stack' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'modules', label: 'Modules' },
  { key: 'apis', label: 'APIs' },
  { key: 'dataModels', label: 'Data Models' },
  { key: 'conventions', label: 'Conventions' },
  { key: 'constraints', label: 'Constraints' },
];

interface FilterPanelProps {
  activeSection: string;
  onSelect: (section: string) => void;
}

export default function FilterPanel({ activeSection, onSelect }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(s.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === s.key
              ? 'text-primary-400 shadow-neon-cyan'
              : 'text-slate-400 hover:text-primary-400'
          }`}
          style={
            activeSection === s.key
              ? { background: '#00d4ff15', border: '1px solid #00d4ff44' }
              : { background: '#0d1830', border: '1px solid #1a3055' }
          }
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
