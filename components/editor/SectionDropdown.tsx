'use client';
// components/editor/SectionDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useReportStore } from '@/lib/store';
import { SectionType } from '@/lib/reportTypes';
import { Plus, ChevronDown, Check } from 'lucide-react';

const SECTION_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'title-page', label: 'Title Page' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'acknowledgement', label: 'Acknowledgement' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'table-of-contents', label: 'Table of Contents' },
  { value: 'list-of-figures', label: 'List of Figures' },
  { value: 'list-of-tables', label: 'List of Tables' },
  { value: 'chapter', label: 'Chapter' },
  { value: 'results', label: 'Results and Discussion' },
  { value: 'references', label: 'References' },
];

export default function SectionDropdown() {
  const [selected, setSelected] = useState<SectionType>('chapter');
  const [isOpen, setIsOpen] = useState(false);
  const addSection = useReportStore((s) => s.addSection);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = SECTION_OPTIONS.find((o) => o.value === selected)?.label;

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-20 relative">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 hover:border-gray-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          <span className="truncate pr-2">{selectedLabel}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="max-h-60 overflow-y-auto py-1">
              {SECTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelected(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    selected === opt.value
                      ? 'bg-slate-50 text-slate-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected === opt.value && <Check size={14} className="text-slate-700 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => addSection(selected)}
        className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98]"
      >
        <Plus size={16} />
        Add Section
      </button>
    </div>
  );
}
