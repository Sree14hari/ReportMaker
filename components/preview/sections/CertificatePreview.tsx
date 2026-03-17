'use client';
// components/preview/sections/CertificatePreview.tsx
import { useReportStore } from '@/lib/store';
import { ReportSection } from '@/lib/reportTypes';
import DOMPurify from 'dompurify';

interface CertificatePreviewProps {
  section: ReportSection;
}

// Resolve template placeholders in content using metadata
function resolvePlaceholders(content: string, meta: Record<string, string | { name: string; rollNo: string }[]>) {
  const simpleFields: Record<string, string> = {
    title: (meta.title as string) || '',
    subtitle: (meta.subtitle as string) || 'mini project report',
    universityName: (meta.universityName as string) || 'APJ Abdul Kalam Technological University',
    degree: (meta.degree as string) || 'Bachelor of Technology',
    branch: (meta.branch as string) || 'Electronics and Communication Engineering',
    collegeName: (meta.collegeName as string) || '',
    department: (meta.department as string) || '',
    month: (meta.month as string) || '',
    year: (meta.year as string) || '',
    guideName: (meta.guideName as string) || '',
    guideDesignation: (meta.guideDesignation as string) || '',
    hodName: (meta.hodName as string) || '',
    hodDesignation: (meta.hodDesignation as string) || '',
  };

  let result = content || '';
  for (const [key, value] of Object.entries(simpleFields)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Specially resolve {{studentNames}}
  if (result.includes('{{studentNames}}') && Array.isArray(meta.studentNames)) {
    const studentsArr = meta.studentNames.filter((s: { name: string }) => s.name);
    let studentsString = '';
    if (studentsArr.length > 0) {
      studentsString = studentsArr.map((s: { name: string; rollNo: string }, i: number, arr: any[]) => {
        let txt = s.name.toUpperCase();
        if (s.rollNo) txt += ` (${s.rollNo.toUpperCase()})`;
        if (i < arr.length - 2) txt += ', ';
        else if (i === arr.length - 2) txt += ' and ';
        return txt;
      }).join('');
    } else {
      studentsString = 'STUDENT NAME (ROLL NO)';
    }
    result = result.replace(/{{studentNames}}/g, studentsString);
  }

  return result;
}

export default function CertificatePreview({ section }: CertificatePreviewProps) {
  const meta = useReportStore((s) => s.meta);

  const resolved = resolvePlaceholders(
    section.content,
    meta as unknown as Record<string, string | { name: string; rollNo: string }[]>
  );
  const sanitized = typeof window !== 'undefined' ? DOMPurify.sanitize(resolved) : resolved;

  // ── AI & ML specific layout ──────────────────────────────────────────────
  if (meta.departmentShort === 'AI & ML') {
    // Build inline student list e.g. "Mr. ADARSH S KUMAR (SBC22CS016), Ms. AISHWARYA AMMAL S ..."
    const studentList = meta.studentNames
      .filter((s) => s.name)
      .map((s, i, arr) => {
        const prefix = i % 2 === 0 ? 'Mr.' : 'Ms.';
        const name = s.name.toUpperCase();
        const roll = s.rollNo ? ` (${s.rollNo.toUpperCase()})` : '';
        const sep = i < arr.length - 1 ? ', ' : '';
        return `<strong>${prefix} ${name}${roll}</strong>${sep}`;
      })
      .join('');

    const certText = `This is to certify that the seminar/project preliminary/project report entitled <strong>"${meta.title || 'PROJECT TITLE'}"</strong> Submitted by ${studentList || '<strong>STUDENT NAMES</strong>'} the ${meta.universityName || 'APJ Abdul Kalam Technological University'} in partial fulfillment of the requirements for the award of the Degree of ${meta.degree || 'Bachelor of Technology'} in ${meta.branch || 'computer science & Engineering'} is a bonafide record of the seminar/project work carried out by them under our guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.`;

    const sanitizedCert = typeof window !== 'undefined' ? DOMPurify.sanitize(certText) : certText;

    return (
      <div
        className="flex flex-col h-full"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Header block */}
        <div className="text-center mt-6 mb-6 space-y-1">
          <p className="font-bold uppercase text-[13pt]">
            {meta.department
              ? `Department of ${meta.department}`
              : 'Department of Computer Science & Engineering'}
          </p>
          <p className="font-bold uppercase text-[12pt] leading-snug">
            {meta.collegeName || 'SREE BUDDHA COLLEGE OF ENGINEERING'} (AUTONOMOUS)
          </p>
          <p className="font-bold uppercase text-[12pt]">PATTOOR</p>
          <p className="font-bold uppercase text-[12pt]">ALAPPUZHA</p>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          {meta.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.logoUrl} alt="College Logo" className="object-contain" style={{ height: '110px', width: 'auto' }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/sbce_logo.png" alt="Default Logo" className="object-contain" style={{ height: '110px', width: 'auto' }} />
          )}
        </div>

        {/* Certificate heading */}
        <h2 className="text-center font-bold uppercase text-[14pt] tracking-widest mb-6">CERTIFICATE</h2>

        {/* Certificate text */}
        <div
          className="report-content prose max-w-none text-justify text-[12pt] leading-relaxed mb-8"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
          dangerouslySetInnerHTML={{ __html: sanitizedCert }}
        />

        {/* 3-column signatures */}
        <div className="w-full grid grid-cols-3 gap-4 text-[12pt] mt-12">
          <div className="space-y-1">
            <p className="font-bold">{meta.guideName || 'Internal Supervisor'}</p>
            <p className="font-bold">Internal Supervisor</p>
            <p>({meta.guideDesignation || 'Assistant Professor'})</p>
            <p>Dept.of {meta.departmentShort || 'CSE'}</p>
          </div>
          <div className="space-y-1 text-center">
            <p className="font-bold">{meta.projectCoordinatorName || 'Project Coordinator'}</p>
            <p className="font-bold">Project Coordinator</p>
            <p>({meta.projectCoordinatorDesignation || 'Assistant Professor'})</p>
            <p>Dept. of {meta.departmentShort || 'CSE'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="font-bold">{meta.hodName || 'Head of Department'}</p>
            <p className="font-bold">Head Of Department</p>
            <p>({meta.hodDesignation || 'Head Of Department'})</p>
            <p>Dept. of {meta.departmentShort || 'CSE'}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT layout (ECE / CSE) ───────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div className="flex flex-col items-center flex-1">
        {/* College Name */}
        <p className="font-bold uppercase text-[14pt] leading-snug mt-8 mb-2 text-center">
          {meta.collegeName || 'COLLEGE NAME'}
        </p>

        {/* Department */}
        <p className="font-bold uppercase text-[12pt] leading-snug mb-6 text-center">
          {meta.department
            ? `DEPARTMENT OF ${meta.department.toUpperCase()}`
            : 'DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING'}
        </p>

        {/* Logo */}
        <div className="mb-8">
          {meta.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.logoUrl}
              alt="College Logo"
              className="mx-auto object-contain"
              style={{ height: '140px', width: 'auto' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/sbce_logo.png"
              alt="Default College Logo"
              className="mx-auto object-contain"
              style={{ height: '140px', width: 'auto' }}
            />
          )}
        </div>

        {/* Certificate Title */}
        <h2 className="text-center font-bold uppercase text-[14pt] tracking-widest mb-8">
          CERTIFICATE
        </h2>

        {/* Paragraph rendered dynamically */}
        <div
          className="report-content prose max-w-none text-justify text-[12pt] mb-16 leading-relaxed"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        {/* Signatures */}
        <div className="w-full flex justify-between text-[12pt] font-bold">
          <div className="text-left space-y-4">
            <p>{meta.guideName || 'Guide Name'}</p>
            <p>{meta.guideDesignation || 'Mini Project Guide'}</p>
            <p>Department of {meta.departmentShort || 'ECE'}</p>
            <p>{meta.collegeShort || 'SBCE, Pattor'}</p>
          </div>
          <div className="text-left space-y-4">
            <p>{meta.hodName || 'HOD Name'}</p>
            <p>{meta.hodDesignation || 'Mini Project Coordinator & HOD'}</p>
            <p>Department of {meta.departmentShort || 'ECE'},</p>
            <p>{meta.collegeShort || 'SBCE, Pattor'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
