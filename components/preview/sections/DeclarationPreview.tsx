'use client';
// components/preview/sections/DeclarationPreview.tsx
import { useReportStore } from '@/lib/store';
import { ReportSection } from '@/lib/reportTypes';
import DOMPurify from 'dompurify';
import { resolvePlaceholders } from './ChapterPreview';

interface DeclarationPreviewProps {
  contentHtml?: string;
  section: ReportSection;
}

export default function DeclarationPreview({ contentHtml, section }: DeclarationPreviewProps) {
  const meta = useReportStore((s) => s.meta);

  const resolved = resolvePlaceholders(
    contentHtml ?? section.content,
    meta as unknown as Record<string, string | { name: string; rollNo: string }[]>
  );
  const sanitized = typeof window !== 'undefined' ? DOMPurify.sanitize(resolved) : resolved;

  const date = `${String(new Date().getDate()).padStart(2, '0')}.${String(new Date().getMonth() + 1).padStart(2, '0')}.${meta.year || new Date().getFullYear()}`;

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <h2 className="text-center font-bold uppercase text-[14pt] tracking-widest mt-8 mb-12">
        DECLARATION
      </h2>

      <div
        className="report-content prose max-w-none text-justify text-[12pt] leading-relaxed mb-16"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />

      {/* Signatures */}
      <div className="w-full flex justify-between mt-12 text-[12pt]">
        <div className="space-y-3">
          <p>Place: {meta.collegeShort?.split(',')[1]?.trim() || 'Pattoor'}</p>
          <p>Date : {date}</p>
        </div>
        <div className="text-left space-y-4 font-bold uppercase">
          {meta.studentNames.filter((s) => s.name).length > 0 ? (
            meta.studentNames
              .filter((s) => s.name)
              .map((s, i) => (
                <p key={i}>{s.name.toUpperCase()}</p>
              ))
          ) : (
            <p>STUDENT NAME</p>
          )}
        </div>
      </div>
    </div>
  );
}
