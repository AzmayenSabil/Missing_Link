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
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
