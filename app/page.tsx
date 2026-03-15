'use client';
// app/page.tsx
import dynamic from 'next/dynamic';
import MetadataPanel from '@/components/MetadataPanel';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import SectionDropdown from '@/components/editor/SectionDropdown';
import SectionList from '@/components/editor/SectionList';

// SSR-disabled components
const SectionEditor = dynamic(() => import('@/components/editor/SectionEditor'), { ssr: false });
const ReportPreview = dynamic(() => import('@/components/preview/ReportPreview'), { ssr: false });

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* ── Header ── */}
      {/* ── Header ── */}
      <header id="main-header" className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">KTU Report Formatter</h1>
            <p className="text-xs text-gray-500">APJ Abdul Kalam Technological University</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MetadataPanel />
          <PDFDownloadButton />
        </div>
      </header>

      {/* ── 3-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Section Manager — 260px */}
        <aside id="left-sidebar" className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Sections</h2>
          </div>
          <SectionDropdown />
          <SectionList />
        </aside>

        {/* CENTER: Editor — flex */}
        <main id="center-editor" className="flex-1 flex flex-col bg-white border-r border-gray-200 overflow-hidden min-w-0">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Editor</h2>
          </div>
          <SectionEditor />
        </main>

        {/* RIGHT: Preview — 500px */}
        <aside id="right-sidebar" className="w-[500px] flex-shrink-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Preview (A4)</h2>
            <span className="text-xs text-gray-400">Times New Roman · 12pt</span>
          </div>
          <ReportPreview />
        </aside>
      </div>
    </div>
  );
}
