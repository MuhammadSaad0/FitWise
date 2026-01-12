import React, { useState } from 'react';
import { X, BarChart2, Download, Home, Dumbbell } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'stats' | 'home' | 'coach') => void;
  onExport: (format: 'csv' | 'json') => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-72 h-full bg-stone-950 border-r border-stone-900 shadow-2xl p-6 flex flex-col animate-slideRight">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase italic font-mono">Fit<span className="text-stone-500">Wise</span></h2>
          <button onClick={onClose} className="text-stone-600 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { onNavigate('home'); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded text-stone-400 hover:bg-stone-900 hover:text-white transition-all font-bold uppercase tracking-wide text-sm"
          >
            <Home size={18} className="text-stone-600" />
            Home
          </button>
          <button 
            onClick={() => { onNavigate('stats'); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded text-stone-400 hover:bg-stone-900 hover:text-white transition-all font-bold uppercase tracking-wide text-sm"
          >
            <BarChart2 size={18} className="text-stone-600" />
            Stats
          </button>
          <button 
            onClick={() => { onNavigate('coach'); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded text-stone-400 hover:bg-stone-900 hover:text-white transition-all font-bold uppercase tracking-wide text-sm"
          >
            <Dumbbell size={18} className="text-stone-600" />
            Coach
          </button>
        </nav>

        <div className="pt-8 border-t border-stone-900">
          <p className="text-[10px] font-bold text-stone-700 uppercase tracking-widest mb-4 px-4">Export Data</p>
          <button 
            onClick={() => onExport('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-stone-500 hover:text-stone-300 hover:bg-stone-900 rounded transition-colors uppercase tracking-wider"
          >
            <Download size={14} /> CSV
          </button>
          <button 
            onClick={() => onExport('json')}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-stone-500 hover:text-stone-300 hover:bg-stone-900 rounded transition-colors uppercase tracking-wider"
          >
            <Download size={14} /> JSON
          </button>
        </div>
      </div>
    </div>
  );
};