'use client';
// components/editor/SectionDropdown.tsx
import { useState } from 'react';
import { useReportStore } from '@/lib/store';
import { SectionType } from '@/lib/reportTypes';
import { Plus } from 'lucide-react';

const SECTION_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'title-page', label: 'Title Page' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'declaration', label: 'Declaration' },
  { value: 'acknowledgement', label: 'Acknowledgement' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'table-of-contents', label: 'Table of Contents' },
  { value: 'list-of-figures', label: 'List of Figures' },
  { value: 'list-of-tables', label: 'List of Tables' },
  { value: 'chapter', label: 'Chapter' },
  { value: 'results', label: 'Results and Discussion' },
  { value: 'advantages-disadvantages', label: 'Advantages and Disadvantages' },
  { value: 'conclusion', label: 'Conclusion and Future Scope' },
  { value: 'references', label: 'References' },
];

export default function SectionDropdown() {
  const [selected, setSelected] = useState<SectionType>('chapter');
  const addSection = useReportStore((s) => s.addSection);

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-gray-200 bg-white">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as SectionType)}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {SECTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => addSection(selected)}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={15} />
        Add Section
      </button>
    </div>
  );
}
