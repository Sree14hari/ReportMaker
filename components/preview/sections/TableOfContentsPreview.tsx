'use client';
// components/preview/sections/TableOfContentsPreview.tsx
import { useReportStore } from '@/lib/store';

const toRoman = (num: number) => {
  const roman = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii"];
  return roman[num] || num.toString();
};

export default function TableOfContentsPreview() {
  const sections = useReportStore((s) => s.sections);

  // Exclude non-TOC items
  const tocEntries = sections.filter(
    (s) => !['title-page', 'certificate', 'table-of-contents'].includes(s.type)
  );

  const getSubsections = (html: string) => {
    if (typeof window === 'undefined') {
      const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/gi);
      if (!h2Match) return [];
      return h2Match.map(match => {
        return match.replace(/<[^>]+>/g, '').trim();
      });
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim() || '').filter(Boolean);
  };

  const chapterTypes = ['chapter', 'results', 'advantages-disadvantages', 'conclusion'];
  let chapterCount = 0;
  let romanPageCounter = 2; // Starts from ii or iii for first abstract/ack
  let arabicPageCounter = 1;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <h2 className="text-center font-bold text-[16pt] mb-12">
        CONTENTS
      </h2>
      
      <div className="flex justify-between font-bold text-[13pt] mb-6">
        <span>Contents</span>
        <span>Page No.</span>
      </div>

      <div className="flex flex-col space-y-4 text-[12pt]">
        {tocEntries.map((section, index) => {
          const isChapter = chapterTypes.includes(section.type);
          let title = section.title.toUpperCase();
          
          if (isChapter) {
            chapterCount++;
            if (!title.startsWith('CHAPTER')) {
              title = `CHAPTER ${chapterCount} - ${title}`;
            }
          }

          const subsections = isChapter ? getSubsections(section.content) : [];
          
          // Dummy page numbers for visual representation in preview
          let pageNoLabel = '';
          if (isChapter) {
            if (subsections.length > 0) {
              // Hide page no for main chapter if it has subsections (like the image)
              pageNoLabel = '';
            } else {
              pageNoLabel = (arabicPageCounter).toString();
              arabicPageCounter += 2; // Jump by some pages
            }
          } else {
            romanPageCounter++;
            pageNoLabel = toRoman(romanPageCounter);
          }

          return (
            <div key={section.id} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span>{title}</span>
                <span>{pageNoLabel}</span>
              </div>
              
              {subsections.length > 0 && (
                <div className="flex flex-col space-y-3 mt-2 mb-2">
                  {subsections.map((sub, idx) => {
                    // Start numbering from 1.1, 1.2, 1.3... if not already numbered
                    let subText = sub;
                    if (!/^\d+\.\d+/.test(subText)) {
                      subText = `${chapterCount}.${idx + 1} ${subText}`;
                    }
                    const subPageNo = arabicPageCounter.toString();
                    arabicPageCounter += Math.floor(Math.random() * 2) + 1; // Fake increment
                    
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
