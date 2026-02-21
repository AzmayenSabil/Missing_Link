import React from 'react';
import { Link } from 'react-router-dom';
import { Dna } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <Dna className="w-6 h-6" />
          <span className="font-bold text-base">Project DNA Engine</span>
        </Link>
        <span className="text-gray-300 text-lg">|</span>
        <span className="text-xs text-gray-400 font-medium tracking-wide">PIPE-1 · INDEPENDENT SERVICE</span>
      </div>
    </header>
  );
}
