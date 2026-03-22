'use client';

import { useState, useRef } from 'react';
import { useReportStore } from '@/lib/store';
import { Download, Upload, MoreVertical, FileJson } from 'lucide-react';

export default function ProjectSyncMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const store = useReportStore();

  const handleExport = () => {
    const dataToExport = {
      meta: store.meta,
      sections: store.sections,
    };
    
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.meta.title.replace(/\\s+/g, '_') || 'Project'}_Export.reporter`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed && typeof parsed === 'object' && 'meta' in parsed && 'sections' in parsed) {
          store.loadProject({
            meta: parsed.meta,
            sections: parsed.sections,
          });
        } else {
          alert('Invalid project file format.');
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
        alert('Failed to read project file. It might be corrupted.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors border border-slate-200 hover:border-slate-300"
        title="Project Sync Options"
      >
        <FileJson size={15} />
        <span className="hidden sm:inline">Project Data</span>
        <MoreVertical size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-sm">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <Download size={16} className="text-blue-500" />
              <div>
                <div className="font-semibold text-slate-800">Export Project</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Save as .reporter file</div>
              </div>
            </button>
            <div className="w-full h-px bg-slate-100" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <Upload size={16} className="text-emerald-500" />
              <div>
                <div className="font-semibold text-slate-800">Import Project</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Load from .reporter file</div>
              </div>
            </button>
          </div>
        </>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".reporter,.json"
        className="hidden"
      />
    </div>
  );
}
