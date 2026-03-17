'use client';
// components/TemplateDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useReportStore } from '@/lib/store';
import { ChevronDown, Check } from 'lucide-react';

const DEPARTMENTS = [
  {
    id: 'ece',
    label: 'ECE',
    department: 'Electronics and Communication Engineering',
    departmentShort: 'ECE',
    branch: 'Electronics and Communication Engineering',
  },
  {
    id: 'cse',
    label: 'CSE',
    department: 'Computer Science and Engineering',
    departmentShort: 'CSE',
    branch: 'Computer Science and Engineering',
  },
  {
    id: 'aiml',
    label: 'AI & ML',
    department: 'Artificial Intelligence and Machine Learning',
    departmentShort: 'AI & ML',
    branch: 'Artificial Intelligence and Machine Learning',
  }
];

export default function TemplateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const meta = useReportStore((s) => s.meta);
  const setMeta = useReportStore((s) => s.setMeta);

  // Find the currently active template based on departmentShort
  const currentTemplate = DEPARTMENTS.find(d => d.departmentShort === meta.departmentShort) || DEPARTMENTS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectTemplate = (template: typeof DEPARTMENTS[0]) => {
    setMeta({
      department: template.department,
      departmentShort: template.departmentShort,
      branch: template.branch
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        <span className="text-slate-500 font-normal">Template:</span> {currentTemplate.label}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 mb-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Department</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => selectTemplate(dept)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
              >
                <span>{dept.label}</span>
                {currentTemplate.id === dept.id && <Check size={14} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
