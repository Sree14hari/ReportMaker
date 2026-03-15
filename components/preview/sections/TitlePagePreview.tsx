'use client';
// components/preview/sections/TitlePagePreview.tsx
import { useReportStore } from '@/lib/store';

export default function TitlePagePreview() {
  const meta = useReportStore((s) => s.meta);

  return (
    <div
      className="flex flex-col items-center justify-between flex-1 h-full text-center"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* 1. Project Title */}
      <div className="pt-4">
        <p className="font-bold uppercase text-[13pt] leading-snug">
          {meta.title || 'PROJECT TITLE'}
        </p>
      </div>

      {/* 2. Subtitle & Students */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-[12pt]">{meta.subtitle || 'Mini Project Report'}</p>
        <p className="text-[12pt]">Submitted by</p>
        <div className="space-y-2">
          {meta.studentNames.filter((s) => s.name).length > 0 ? (
            meta.studentNames
              .filter((s) => s.name)
              .map((s, i) => (
                <p key={i} className="font-bold uppercase text-[12pt] leading-tight">
                  {s.name.toUpperCase()}{s.rollNo ? ` (${s.rollNo.toUpperCase()})` : ''}
                </p>
              ))
          ) : (
            <p className="font-bold uppercase text-[12pt]">STUDENT NAME (ROLL NO)</p>
          )}
        </div>
      </div>

      {/* 3. University & Degree */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[12pt]">To</p>
        <p className="italic text-[12pt] leading-snug">
          {meta.universityName || 'The APJ Abdul Kalam Technological University'}
        </p>
        <p className="italic text-[12pt] leading-snug">
          in partial fulfilment of the requirements for the award of the Degree
        </p>
        <p className="text-[12pt]">Of</p>
        <p className="italic text-[12pt]">
          {meta.degree || 'Bachelor of Technology'}
        </p>
        <p className="text-[12pt]">In</p>
        <p className="font-bold uppercase text-[12pt]">
          {meta.branch || 'ELECTRONICS AND COMMUNICATION ENGINEERING'}
        </p>
      </div>

      {/* 4. College Logo */}
      <div>
        {meta.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meta.logoUrl}
            alt="College Logo"
            className="mx-auto object-contain"
            style={{ height: '110px', width: 'auto' }}
          />
        ) : (
          <div
            className="mx-auto rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-400 text-xs"
            style={{ height: '110px', width: '110px' }}
          >
            Logo
          </div>
        )}
      </div>

      {/* 5. Department, College & Date */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <p
          className="text-[11pt] font-medium"
          style={{ color: '#1a3a6b' }}
        >
          {meta.department
            ? `DEPARTMENT OF ${meta.department.toUpperCase()}`
            : 'DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING'}
        </p>
        <p className="font-bold uppercase text-[12pt] leading-snug">
          {meta.collegeName || 'COLLEGE NAME'}
        </p>
        <p className="font-bold text-[12pt]">
          {meta.month?.toUpperCase() || 'MONTH'} {meta.year || new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
