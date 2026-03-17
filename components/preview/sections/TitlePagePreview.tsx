'use client';
// components/preview/sections/TitlePagePreview.tsx
import { useReportStore } from '@/lib/store';

export default function TitlePagePreview() {
  const meta = useReportStore((s) => s.meta);

  if (meta.departmentShort === 'AI & ML') {
    return (
      <div
        className="flex flex-col items-center justify-between flex-1 h-full text-center"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="pt-8 w-full">
          <p className="font-bold uppercase text-[16pt] leading-snug tracking-wide">
            {meta.title || 'PROJECT TITLE'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 w-full mt-4">
          <p className="text-[14pt] uppercase">{meta.subtitle || 'MINI PROJECT REPORT'}</p>
          <p className="font-bold text-[12pt]">Submitted by</p>
          <div className="flex flex-col gap-2 w-auto min-w-[300px]">
            {meta.studentNames.filter((s) => s.name).length > 0 ? (
              meta.studentNames
                .filter((s) => s.name)
                .map((s, i) => (
                  <div key={i} className="flex justify-between w-full uppercase text-[12pt]">
                    <span className="text-left">{s.name}</span>
                    <span className="text-right">{s.rollNo}</span>
                  </div>
                ))
            ) : (
              <div className="flex justify-between w-full uppercase text-[12pt]">
                <span className="text-left">STUDENT NAME</span>
                <span className="text-right">ROLL NO</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 mt-6">
          <p className="text-[12pt]">TO</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ktulogo.png"
            alt="KTU Logo"
            className="mx-auto object-contain my-3"
            style={{ height: '90px', width: 'auto' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <p className="font-bold text-[12pt] leading-snug w-[85%] mx-auto mt-2">
            The {meta.universityName || 'APJ Abdul Kalam Technological University'} In Partial fulfillment of the requirements for the award of the Degree Of
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-[12pt]">{meta.degree || 'Bachelor of Technology'}</p>
          <p className="text-[12pt]">In</p>
          <p className="text-[12pt]">{meta.branch || 'Computer Science & Engineering'}</p>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4 pb-4">
          <div>
            {meta.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meta.logoUrl}
                alt="College Logo"
                className="mx-auto object-contain"
                style={{ height: '100px', width: 'auto' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/sbce_logo.png"
                alt="Default College Logo"
                className="mx-auto object-contain"
                style={{ height: '100px', width: 'auto' }}
              />
            )}
          </div>
          <p className="font-bold text-[12pt]">
            {meta.department
              ? `Department of ${meta.department}`
              : 'Department of Computer Science & Engineering'}
          </p>
          <p className="uppercase text-[12pt]">
            {meta.collegeName || 'SREE BUDDHA COLLEGE OF ENGINEERING, PATTOOR'}
          </p>
          <p className="uppercase text-[11pt] tracking-widest mt-2">
            ALAPPUZHA - 690529
          </p>
          <p className="uppercase text-[12pt] mt-4 font-bold">
            {meta.month || 'MONTH'} {meta.year || new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // DEFAULT Render for ECE and CSE
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/sbce_logo.png"
            alt="Default College Logo"
            className="mx-auto object-contain"
            style={{ height: '110px', width: 'auto' }}
          />
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
