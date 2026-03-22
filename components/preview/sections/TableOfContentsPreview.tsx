'use client';
// components/preview/sections/TableOfContentsPreview.tsx
import { useReportStore } from '@/lib/store';
import { paginateHtml } from '@/lib/pagination';
import { resolvePlaceholders } from '@/components/preview/sections/ChapterPreview';
import { useState, useEffect } from 'react';

const toRoman = (num: number) => {
  const roman = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii"];
  return roman[num] || num.toString();
};

// Types that get NO page number
const NO_NUMBER_TYPES = new Set(['title-page', 'certificate', 'declaration', 'table-of-contents']);
// Types that are "pre-chapter" (before chapter content starts)
const PRE_CHAPTER_TYPES = new Set([
  'title-page', 'certificate', 'declaration', 'acknowledgement',
  'abstract', 'table-of-contents', 'list-of-figures', 'list-of-tables'
]);
// Types that get arabic page numbers
const CHAPTER_TYPES = new Set(['chapter', 'results', 'references']);

export default function TableOfContentsPreview({ tocProps }: { tocProps?: { startIndex: number; endIndex: number } }) {
  const sections = useReportStore((s) => s.sections);

  const meta = useReportStore((s) => s.meta);
  const [pageMap, setPageMap] = useState<Map<string, string>>(new Map());

  // ── Step 1: Walk all sections, assign page numbers exactly like ReportPreview ──
  useEffect(() => {
    const buildTocPages = async () => {
      let arabicCounter = 1;
      let romanCounter = 1;
      const newMap = new Map<string, string>(); // sectionId → page label string

      for (const section of sections) {
        const isPreChapter = PRE_CHAPTER_TYPES.has(section.type);
        const showArabic = !isPreChapter;
        const showRoman  = isPreChapter && !NO_NUMBER_TYPES.has(section.type);
        
        // We must record the STARTING page number for this section in the TOC
        if (showArabic) {
          newMap.set(section.id, arabicCounter.toString());
        } else if (showRoman) {
          newMap.set(section.id, toRoman(romanCounter));
        } else {
          newMap.set(section.id, '');
        }

        // Now calculate how many pages (chunks) this section actually takes
        const isPaginatable = !['title-page', 'certificate', 'table-of-contents'].includes(section.type);
        let chunks = 1;
        if (isPaginatable && section.content && typeof window !== 'undefined') {
          const resolved = resolvePlaceholders(section.content, meta as any);
          const computedChunks = await paginateHtml(resolved, 850, section.type === 'chapter' ? 700 : 850);
          chunks = computedChunks.length;
        }

        // Increment counters by the number of actual pages
        if (showArabic) {
          arabicCounter += chunks;
        } else if (showRoman) {
          romanCounter += chunks;
        }
      }
      setPageMap(newMap);
    };

    buildTocPages();
  }, [sections, meta]);

  // ── Step 2: Only show entries that aren't in NO_NUMBER_TYPES ──
  const tocEntries = sections.filter((s) => !NO_NUMBER_TYPES.has(s.type));

  const getSubsections = (html: string): string[] => {
    if (typeof window === 'undefined') {
      const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/gi);
      if (!h2Match) return [];
      return h2Match.map(match => match.replace(/<[^>]+>/g, '').trim());
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('h2'))
      .map(el => el.textContent?.trim() || '')
      .filter(Boolean);
  };

  let chapterCount = 0;
  const flatLines: React.ReactNode[] = [];

  tocEntries.forEach((section) => {
    const isChapterSection = section.type === 'chapter';
    let title = section.title.toUpperCase();

    if (isChapterSection) {
      chapterCount++;
      if (!title.startsWith('CHAPTER')) {
        title = `CHAPTER ${chapterCount} - ${title}`;
      }
    }

    const subsections = isChapterSection ? getSubsections(section.content) : [];
    const pageNoLabel = pageMap.get(section.id) ?? '';

    flatLines.push(
      <div key={`${section.id}-title`} className="flex justify-between mb-1 mt-3">
        <span>{title}</span>
        <span>{subsections.length > 0 ? '' : pageNoLabel}</span>
      </div>
    );

    subsections.forEach((sub, idx) => {
      let subText = sub;
      if (!/^\d+\.\d+/.test(subText)) {
        subText = `${chapterCount}.${idx + 1} ${subText}`;
      }
      const subPageNo = idx === 0 ? pageNoLabel : '';
      flatLines.push(
        <div key={`${section.id}-sub-${idx}`} className="flex justify-between ml-12 mb-1.5 mt-1.5">
          <span>{subText}</span>
          <span>{subPageNo}</span>
        </div>
      );
    });
  });

  const displayLines = tocProps ? flatLines.slice(tocProps.startIndex, tocProps.endIndex) : flatLines;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {(!tocProps || tocProps.startIndex === 0) && (
        <>
          <h2 className="text-center font-bold text-[16pt] mb-12">CONTENTS</h2>
          <div className="flex justify-between font-bold text-[13pt] mb-6">
            <span>Contents</span>
            <span>Page No.</span>
          </div>
        </>
      )}

      {tocProps && tocProps.startIndex > 0 && (
         <div className="h-[48px] w-full mb-12"></div>
      )}

      <div className="flex flex-col text-[12pt]">
        {displayLines}

        {tocEntries.length === 0 && (
          <div className="text-center text-gray-400 italic mt-8">
            Add sections to populate the table of contents
          </div>
        )}
      </div>
    </div>
  );
}
