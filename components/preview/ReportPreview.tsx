'use client';
// components/preview/ReportPreview.tsx
import { useReportStore } from '@/lib/store';
import TitlePagePreview from './sections/TitlePagePreview';
import CertificatePreview from './sections/CertificatePreview';
import DeclarationPreview from './sections/DeclarationPreview';
import TableOfContentsPreview from './sections/TableOfContentsPreview';
import ChapterPreview, { resolvePlaceholders } from './sections/ChapterPreview';
import { ReportSection } from '@/lib/reportTypes';
import { useRef, useEffect, useState, useCallback } from 'react';
import { paginateHtml } from '@/lib/pagination';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

type PageData = {
  id: string;
  section: ReportSection;
  htmlChunk: string | null;
  chapterIndex: number | null;
  showArabicPageNumber: boolean;
  showRomanPageNumber: boolean;
  arabicPageNumber: number | null;
  romanPageNumber: number | null;
  hideTitle?: boolean;
};

function SectionRenderer({ section, chapterIndex, contentHtml, hideTitle }: { section: ReportSection; chapterIndex?: number | null; contentHtml?: string; hideTitle?: boolean }) {
  switch (section.type) {
    case 'title-page':
      return <TitlePagePreview />;
    case 'certificate':
      return <CertificatePreview section={section} />;
    case 'declaration':
      return <DeclarationPreview section={section} contentHtml={contentHtml} />;
    case 'table-of-contents':
      return <TableOfContentsPreview />;
    default:
      return <ChapterPreview section={section} chapterIndex={chapterIndex} contentHtml={contentHtml} hideTitle={hideTitle} />;
  }
}

// A4 dimensions in px at 96dpi
const A4_WIDTH_PX = 794; // 210mm

const toRoman = (num: number) => {
  const roman = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"];
  return roman[num] || num.toString();
};

export default function ReportPreview() {
  const sections = useReportStore((s) => s.sections);
  const meta = useReportStore((s) => s.meta);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [pages, setPages] = useState<PageData[]>([]);

  const scale = fitScale * userZoom;

  const zoomIn  = useCallback(() => setUserZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(1)))), []);
  const zoomOut = useCallback(() => setUserZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(1)))), []);
  const zoomFit = useCallback(() => setUserZoom(1), []);

  // Dynamically compute fitScale so A4 page fits the container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth - 32; // 16px padding each side
      setFitScale(Math.min(1, available / A4_WIDTH_PX));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let arabicCounter = 1;
    let romanCounter = 1;
    let currentChapterIndex = 0;

    const preChapterTypes = [
      'title-page', 'certificate', 'declaration', 'acknowledgement',
      'abstract', 'table-of-contents', 'list-of-figures', 'list-of-tables'
    ];

    const newPages: PageData[] = [];

    sections.forEach((section) => {
      const isPreChapter = preChapterTypes.includes(section.type);
      const isActualChapterText = section.type === 'chapter';
      if (isActualChapterText) {
        currentChapterIndex += 1;
      }

      const showArabic = !isPreChapter;
      const showRoman = isPreChapter && !['title-page', 'certificate', 'declaration', 'table-of-contents'].includes(section.type);

      const chapterIndex = showArabic && section.type !== 'references' && isActualChapterText ? currentChapterIndex : null;

      const isPaginatable = !['title-page', 'certificate', 'table-of-contents'].includes(section.type);

      if (isPaginatable && section.content) {
        const resolved = resolvePlaceholders(section.content, meta as any);
        const chunks = paginateHtml(resolved, 850, section.type === 'chapter' ? 700 : 850);

        chunks.forEach((chunk, idx) => {
          // If first chunk, it gets the chapter index (to show title)
          // If not first chunk, chapter index is null to hide title repetition
          newPages.push({
            id: `${section.id}-${idx}`,
            section,
            htmlChunk: chunk,
            chapterIndex: idx === 0 ? chapterIndex : null,
            showArabicPageNumber: showArabic,
            showRomanPageNumber: showRoman,
            arabicPageNumber: showArabic ? arabicCounter++ : null,
            romanPageNumber: showRoman ? romanCounter++ : null,
            hideTitle: idx > 0,
          });
        });
      } else {
        newPages.push({
          id: `${section.id}-0`,
          section,
          htmlChunk: null,
          chapterIndex: chapterIndex,
          showArabicPageNumber: showArabic,
          showRomanPageNumber: showRoman,
          arabicPageNumber: showArabic ? arabicCounter++ : null,
          romanPageNumber: showRoman ? romanCounter++ : null,
        });
      }
    });

    setPages(newPages);
  }, [sections, meta]);


  if (sections.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-100 p-8">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-300">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        <p className="text-sm font-medium">No sections added yet</p>
        <p className="text-xs mt-1">Add sections from the left panel to see the preview</p>
      </div>
    );
  }

  // Calculate the total scaled height using correct page count
  const totalPages = pages.length;
  // gap: 32px between pages.
  const scaledHeight = (1123 * totalPages + 32 * (totalPages > 0 ? totalPages - 1 : 0)) * scale;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Zoom toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-slate-300 font-mono w-14 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <div className="w-px h-4 bg-slate-600 mx-1" />
        <button
          onClick={zoomFit}
          title="Fit to Width"
          className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-300 p-4"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) zoomIn();
            else zoomOut();
          }
        }}
      >
      <div
        style={{
          width: A4_WIDTH_PX * scale,
          height: scaledHeight,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: A4_WIDTH_PX,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <div
            id="report-preview"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              backgroundColor: 'transparent',
            }}
          >
            {pages.map((page, index) => {
              const { section, chapterIndex, showArabicPageNumber, showRomanPageNumber, arabicPageNumber, romanPageNumber, htmlChunk } = page;

              return (
                <div
                  key={page.id}
                   className="bg-white shadow-xl page-break-wrapper"
                  style={{
                    width: A4_WIDTH_PX,
                    height: '1123px', // strictly 297mm at 96dpi
                    overflow: 'hidden', // enforce strict A4 size
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '16px', // ≈12pt
                    lineHeight: '1.5',
                    color: '#000',
                    boxSizing: 'border-box',
                    pageBreakAfter: 'always',
                  }}
                >
                  <table className="w-full h-full flex-1" style={{ borderCollapse: 'collapse', borderSpacing: 0, margin: 0 }}>
                    <thead style={{ display: 'table-header-group' }}>
                      <tr>
                        <td style={{ padding: '0 96px 0 113px' }}>
                          <div style={{ height: '48px' }}></div>
                          {showArabicPageNumber ? (
                            <>
                              <div className="flex justify-between items-end pb-1 border-b-[1.5px] border-black text-[12pt]">
                                <span>{meta.headerContent || meta.title || 'PROJECT TITLE'}</span>
                              </div>
                              <div style={{ height: '24px' }}></div>
                            </>
                          ) : (
                            <div style={{ height: '48px' }}></div>
                          )}
                        </td>
                      </tr>
                    </thead>
                    <tbody style={{ display: 'table-row-group' }}>
                      <tr style={{ height: '100%' }}>
                        <td style={{ padding: '0 96px 0 113px', verticalAlign: 'top' }}>
                          <SectionRenderer section={section} chapterIndex={chapterIndex} contentHtml={htmlChunk || undefined} hideTitle={page.hideTitle} />
                        </td>
                      </tr>
                    </tbody>
                    <tfoot style={{ display: 'table-footer-group' }}>
                      <tr>
                        <td style={{ padding: '0 96px 0 113px' }}>
                          {showArabicPageNumber ? (
                            <>
                              <div style={{ height: '24px' }}></div>
                              <div className="flex justify-between items-start pt-1 border-t-[1.5px] border-black text-[12pt]">
                                <span>DEPARTMENT OF {meta.departmentShort || 'ECE'}</span>
                                <span>{arabicPageNumber}</span>
                              </div>
                            </>
                          ) : showRomanPageNumber ? (
                            <>
                              <div style={{ height: '24px' }}></div>
                              <div className="flex justify-end text-[12pt]">
                                {romanPageNumber ? toRoman(romanPageNumber) : ''}
                              </div>
                            </>
                          ) : (
                            <div style={{ height: '48px' }}></div>
                          )}
                          <div style={{ height: '48px' }}></div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
