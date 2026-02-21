import React from 'react';
import { Link } from 'react-router-dom';
import { Dna } from 'lucide-react';

export default function Header() {
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: 'linear-gradient(90deg, #060d1f 0%, #0d1830 50%, #060d1f 100%)',
        borderBottom: '1px solid #1a3055',
        boxShadow: '0 1px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.04)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00d4ff22, #8b5cf622)',
              border: '1px solid #00d4ff44',
              boxShadow: '0 0 12px #00d4ff22',
            }}
          >
            <Dna className="w-4.5 h-4.5 text-primary-500" />
          </div>
          <span className="font-bold text-base text-slate-100 group-hover:text-primary-400 transition-colors">
            Project DNA Engine
          </span>
        </Link>
        <div
          className="w-px h-5"
          style={{ background: 'linear-gradient(180deg, transparent, #1a3055, transparent)' }}
        />
        <span className="text-xs text-slate-500 font-medium tracking-widest uppercase">
          Pipe-1
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#00ffa3', boxShadow: '0 0 6px #00ffa3' }}
          />
          <span className="text-xs text-slate-500">Online</span>
        </div>
      </div>
    </header>
  );
}
