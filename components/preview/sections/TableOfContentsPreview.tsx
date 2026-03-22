'use client';
// components/preview/sections/TableOfContentsPreview.tsx
import { useReportStore } from '@/lib/store';
import { paginateHtml } from '@/lib/pagination';
import { resolvePlaceholders } from '@/components/preview/sections/ChapterPreview';

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

export default function TableOfContentsPreview() {
  const sections = useReportStore((s) => s.sections);

  const meta = useReportStore((s) => s.meta);

  // ── Step 1: Walk all sections, assign page numbers exactly like ReportPreview ──
  let arabicCounter = 1;
  let romanCounter = 1;
  const pageMap = new Map<string, string>(); // sectionId → page label string

  sections.forEach((section) => {
    const isPreChapter = PRE_CHAPTER_TYPES.has(section.type);
    const showArabic = !isPreChapter;
    const showRoman  = isPreChapter && !NO_NUMBER_TYPES.has(section.type);
    
    // We must record the STARTING page number for this section in the TOC
    if (showArabic) {
      pageMap.set(section.id, arabicCounter.toString());
    } else if (showRoman) {
      pageMap.set(section.id, toRoman(romanCounter));
    } else {
      pageMap.set(section.id, '');
    }

    // Now calculate how many pages (chunks) this section actually takes
    const isPaginatable = !['title-page', 'certificate', 'table-of-contents'].includes(section.type);
    let chunks = 1;
    if (isPaginatable && section.content && typeof window !== 'undefined') {
      const resolved = resolvePlaceholders(section.content, meta as any);
      chunks = paginateHtml(resolved, 850, section.type === 'chapter' ? 700 : 850).length;
    }

    // Increment counters by the number of actual pages
    if (showArabic) {
      arabicCounter += chunks;
    } else if (showRoman) {
      romanCounter += chunks;
    }
  });

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

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <h2 className="text-center font-bold text-[16pt] mb-12">CONTENTS</h2>

      <div className="flex justify-between font-bold text-[13pt] mb-6">
        <span>Contents</span>
        <span>Page No.</span>
      </div>

      <div className="flex flex-col space-y-4 text-[12pt]">
        {tocEntries.map((section) => {
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

          return (
            <div key={section.id} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span>{title}</span>
                <span>{subsections.length > 0 ? '' : pageNoLabel}</span>
              </div>

              {subsections.length > 0 && (
                <div className="flex flex-col space-y-3 mt-2 mb-2">
                  {subsections.map((sub, idx) => {
                    let subText = sub;
                    if (!/^\d+\.\d+/.test(subText)) {
                      subText = `${chapterCount}.${idx + 1} ${subText}`;
                    }
                    // Only show the chapter's page number on the first subsection
                    const subPageNo = idx === 0 ? pageNoLabel : '';
                    return (
                      <div key={idx} className="flex justify-between ml-12">
                        <span>{subText}</span>
                        <span>{subPageNo}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {tocEntries.length === 0 && (
          <div className="text-center text-gray-400 italic mt-8">
            Add sections to populate the table of contents
          </div>
        )}
      </div>
    </div>
  );
}
