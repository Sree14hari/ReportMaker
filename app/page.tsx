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
          {/* Pulsating Pro Tip */}
          <div className="relative group flex items-center justify-center">
            <button className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-100 relative">
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </button>
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left leading-relaxed">
              <span className="font-semibold text-amber-300 block mb-1">Pro Tip: Best Results</span>
              After everything is done, export as Word, add your final touches there, and from there export as PDF for the best results!
              <div className="absolute -top-1 right-3 w-3 h-3 bg-slate-800 rotate-45"></div>
            </div>
          </div>
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
