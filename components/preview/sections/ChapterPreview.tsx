'use client';
// components/preview/sections/ChapterPreview.tsx
import { ReportSection } from '@/lib/reportTypes';
import { useReportStore } from '@/lib/store';

interface ChapterPreviewProps {
  section: ReportSection;
  chapterIndex?: number | null;
  contentHtml?: string;
  hideTitle?: boolean;
}

// Resolve template placeholders in content using metadata
export function resolvePlaceholders(content: string, meta: Record<string, string | { name: string; rollNo: string }[]>) {
  const simpleFields: Record<string, string> = {
    title: (meta.title as string) || '',
    subtitle: (meta.subtitle as string) || '',
    universityName: (meta.universityName as string) || '',
    degree: (meta.degree as string) || '',
    branch: (meta.branch as string) || '',
    collegeName: (meta.collegeName as string) || '',
    department: (meta.department as string) || '',
    month: (meta.month as string) || '',
    year: (meta.year as string) || '',
    guideName: (meta.guideName as string) || '',
    guideDesignation: (meta.guideDesignation as string) || '',
    hodName: (meta.hodName as string) || '',
    hodDesignation: (meta.hodDesignation as string) || '',
    principalName: (meta.principalName as string) || '',
  };

  let result = content;
  for (const [key, value] of Object.entries(simpleFields)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Specially resolve {{studentListRightAligned}}
  if (result.includes('{{studentListRightAligned}}') && Array.isArray(meta.studentNames)) {
    const studentsArr = meta.studentNames.filter((s: { name: string }) => s.name);
    let studentsString = '';
    if (studentsArr.length > 0) {
      studentsString = '<div class="text-right pt-10 pb-5" style="line-height: 2;">' + 
      studentsArr.map((s: { name: string; rollNo: string }) => {
        let txt = s.name.toUpperCase();
        if (s.rollNo) txt += ` (${s.rollNo.toUpperCase()})`;
        return `<strong>${txt}</strong>`;
      }).join('<br />') + '</div>';
    }
    result = result.replace(/{{studentListRightAligned}}/g, studentsString);
  }

  return result;
}

export default function ChapterPreview({ section, chapterIndex, contentHtml, hideTitle }: ChapterPreviewProps) {
  const meta = useReportStore((s) => s.meta);

  const resolved = contentHtml !== undefined 
    ? contentHtml 
    : resolvePlaceholders(section.content, meta as unknown as Record<string, string | { name: string; rollNo: string }[]>);

  return (
    <div className="flex flex-col h-full">
      {!hideTitle && (
        chapterIndex ? (
          <div className="text-center font-bold uppercase text-[14pt] tracking-wide mb-6">
            <div className="mb-4">CHAPTER {chapterIndex}</div>
            <div>{section.title}</div>
          </div>
        ) : (
          <h1 className="text-center font-bold uppercase text-[14pt] tracking-wide mb-6">
            {section.title}
          </h1>
        )
      )}
      <div
        className={`report-content text-[12pt] leading-relaxed text-justify ${chapterIndex ? 'numbered-chapter' : ''}`}
        style={chapterIndex ? { '--chapter-index': `"${chapterIndex}"` } as React.CSSProperties : undefined}
        dangerouslySetInnerHTML={{ __html: resolved }}
      />
    </div>
  );
}
