'use client';
// app/page.tsx
import dynamic from 'next/dynamic';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import TemplateDropdown from '@/components/TemplateDropdown';
import ProjectSyncMenu from '@/components/ProjectSyncMenu';
import SectionDropdown from '@/components/editor/SectionDropdown';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Info, X, ExternalLink, Instagram, Linkedin, DollarSign } from 'lucide-react';

// SSR-disabled components
const SectionList = dynamic(() => import('@/components/editor/SectionList'), { ssr: false });
const SectionEditor = dynamic(() => import('@/components/editor/SectionEditor'), { ssr: false });
const ReportPreview = dynamic(() => import('@/components/preview/ReportPreview'), { ssr: false });

export default function Home() {
  const [previewWidth, setPreviewWidth] = useState(500);
  const [showInfo, setShowInfo] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const isDragging = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide splash screen after 1.8 seconds
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const onMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !bodyRef.current) return;
      const bodyRect = bodyRef.current.getBoundingClientRect();
      const newWidth = bodyRect.right - e.clientX;
      setPreviewWidth(Math.max(320, Math.min(900, newWidth)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  if (showSplash) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-white selection:bg-none overflow-hidden">
        <style>{`
          @keyframes letter-rise {
            0%   { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes line-sweep {
            0%   { transform: scaleX(0); opacity: 0; }
            30%  { opacity: 1; }
            100% { transform: scaleX(1); opacity: 1; }
          }
          @keyframes sub-fade {
            0%   { opacity: 0; letter-spacing: 0.2em; }
            100% { opacity: 1; letter-spacing: 0.45em; }
          }
          @keyframes splash-out {
            0%   { opacity: 1; }
            100% { opacity: 0; }
          }
          .splash-wrap {
            animation: splash-out 0.35s ease-in 1.5s forwards;
          }
          .shr-s { animation: letter-rise 0.5s cubic-bezier(.16,1,.3,1) 0.1s both; }
          .shr-h { animation: letter-rise 0.5s cubic-bezier(.16,1,.3,1) 0.22s both; }
          .shr-r { animation: letter-rise 0.5s cubic-bezier(.16,1,.3,1) 0.34s both; }
          .shr-line { animation: line-sweep 0.6s cubic-bezier(.16,1,.3,1) 0.52s both; transform-origin: left; }
          .shr-sub  { animation: sub-fade  0.6s ease 0.75s both; }
        `}</style>

        <div className="splash-wrap flex flex-col items-center gap-0">
          {/* Main letters */}
          <div
            className="flex items-end gap-1 sm:gap-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {['S','H','R'].map((letter) => (
              <span
                key={letter}
                className={`text-6xl sm:text-8xl font-light text-slate-800 inline-block shr-${letter.toLowerCase()}`}
                style={{ letterSpacing: '0.12em' }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Sweeping underline */}
          <div className="relative w-full mt-1 mb-3 h-px overflow-visible">
            <div
              className="shr-line absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-slate-300 via-slate-500 to-slate-300"
            />
          </div>

          {/* Subtitle */}
          <p className="shr-sub text-[11px] sm:text-sm font-semibold text-slate-400 uppercase"
             style={{ letterSpacing: '0.45em' }}>
            Creations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden animate-in fade-in duration-500">
      {/* ── Header ── */}
      <header id="main-header" className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-50 relative flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">The Reporter</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400">made with love by SHR</p>
              <div className="flex items-center gap-1.5 ml-1 border-l border-gray-200 pl-2">
                <a href="https://www.instagram.com/s_ree.har_i" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors" title="Instagram">
                  <Instagram size={12} strokeWidth={2.5} />
                </a>
                <a href="https://www.linkedin.com/in/sree14hari/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="LinkedIn">
                  <Linkedin size={12} strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSupport(true)}
            title="Support this project"
            className="p-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 flex items-center justify-center"
          >
            <DollarSign size={18} strokeWidth={2.5} />
          </button>
          <ProjectSyncMenu />
          <TemplateDropdown />
          <button
            onClick={() => setShowInfo(true)}
            title="Tips & Info"
            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
          >
            <Info size={18} />
          </button>
          <PDFDownloadButton />
        </div>
      </header>

      {/* ── Support Modal ── */}
      {showSupport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSupport(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 relative max-w-sm w-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Support This Project</h2>
            <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photo_2026-03-22_11-28-49.jpg" alt="Support QR Code" className="w-full h-full object-contain" />
            </div>
            <p className="text-sm font-medium text-slate-600 text-center px-4 leading-relaxed">
              If you found this tool helpful, consider supporting its development! Every contribution helps me keep the servers running. ❤️
            </p>
          </div>
        </div>
      )}

      {/* ── Info Modal ── */}
      {showInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[95vw] p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Info size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Tips for Best Results</h2>
            </div>

            {/* Message */}
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                ⚠️ <strong className="text-slate-800">Minor spacing or formatting issues</strong> may occasionally appear in the exported PDF — this is normal due to browser rendering differences.
              </p>
              <p>
                ✅ For a perfectly polished document, follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Export the PDF using the <strong>Export PDF</strong> button.</li>
                <li>Go to <strong>iLovePDF</strong> and convert it to a Word (.docx) file.</li>
                <li>Open the Word file and make any final tweaks — spacing, fonts, margin fixes.</li>
                <li>Re-export as PDF if needed.</li>
              </ol>
            </div>

            {/* CTA */}
            <a
              href="https://www.ilovepdf.com/pdf_to_word"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <ExternalLink size={15} />
              Open iLovePDF — PDF to Word
            </a>
          </div>
        </div>
      )}

      {/* ── 3-Panel Body ── */}
      <div ref={bodyRef} className="flex flex-1 overflow-hidden">
        {/* LEFT: Section Manager — 260px */}
        <aside id="left-sidebar" className="w-64 flex-shrink-0 flex flex-col bg-slate-50/50 border-r border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sections</h2>
          </div>
          <SectionDropdown />
          <SectionList />
        </aside>

        {/* CENTER: Editor — flex */}
        <main id="center-editor" className="flex-1 flex flex-col bg-white border-r border-gray-200 overflow-hidden min-w-0">
          <div className="px-5 py-3 border-b border-gray-100 bg-white shadow-sm z-10">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Editor</h2>
          </div>
          <SectionEditor />
        </main>

        {/* Resize Handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1.5 flex-shrink-0 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors group relative"
          title="Drag to resize preview"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* RIGHT: Preview — resizable */}
        <aside
          id="right-sidebar"
          className="flex-shrink-0 flex flex-col bg-slate-100/80 overflow-hidden"
          style={{ width: previewWidth }}
        >
          <div className="px-5 py-3 border-b border-gray-200 bg-white shadow-sm flex-shrink-0 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Preview (A4)</h2>
            <span className="text-xs text-gray-400">Times New Roman · 12pt</span>
          </div>
          <ReportPreview />
        </aside>
      </div>
    </div>
  );
}
