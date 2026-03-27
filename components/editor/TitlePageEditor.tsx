'use client';
// components/editor/TitlePageEditor.tsx
import { useRef } from 'react';
import { useReportStore } from '@/lib/store';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function TitlePageEditor() {
  const meta = useReportStore((s) => s.meta);
  const setMeta = useReportStore((s) => s.setMeta);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateStudent(index: number, field: 'name' | 'rollNo', value: string) {
    const updated = meta.studentNames.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setMeta({ studentNames: updated });
  }

  function addStudent() {
    setMeta({ studentNames: [...meta.studentNames, { name: '', rollNo: '' }] });
  }

  function removeStudent(index: number) {
    if (meta.studentNames.length <= 1) return;
    setMeta({ studentNames: meta.studentNames.filter((_, i) => i !== index) });
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMeta({ logoUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200/60 rounded-sm p-8 sm:p-12 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Information</h2>
        <p className="text-sm text-gray-500 mb-8 pb-4 border-b border-gray-100">
          This information will be used to automatically generate the Title Page, Certificate, Acknowledgement, and headers throughout your report.
        </p>
        
        <div className="space-y-10">
          {/* Project Info */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">Project Info</h3>
            <div className="space-y-4 px-2">
              <Field label="Project Title">
                <input type="text" value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} placeholder="e.g. EEG STRESS MONITORING SYSTEM" className={inputCls} />
              </Field>
              <Field label="Header Content (Optional)">
                <input type="text" value={meta.headerContent || ''} onChange={(e) => setMeta({ headerContent: e.target.value })} placeholder="Custom text to show on paginated headers" className={inputCls} />
              </Field>
              <Field label="Footer Content (Optional)">
                <input
                  type="text"
                  value={meta.footerContent || ''}
                  onChange={(e) => setMeta({ footerContent: e.target.value })}
                  placeholder={`DEPARTMENT OF ${meta.departmentShort || 'ECE'} (auto)`}
                  className={inputCls}
                />
                <p className="text-[10px] text-slate-400 mt-1">Left-side text shown in the chapter footer. Leave blank to auto-generate from department short name.</p>
              </Field>
              <Field label="Subtitle">
                <input type="text" value={meta.subtitle} onChange={(e) => setMeta({ subtitle: e.target.value })} placeholder="e.g. Mini Project Report" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Title Page Spacing — AI & ML only */}
          {meta.departmentShort === 'AI & ML' && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                Title Page Layout
              </h3>
              <div className="px-2 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Section Spacing</label>
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {meta.titlePageGap ?? 24}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={2}
                  value={meta.titlePageGap ?? 24}
                  onChange={(e) => setMeta({ titlePageGap: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Compact</span>
                  <span>Spacious</span>
                </div>
              </div>
            </section>
          )}

          {/* Students */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">Students</h3>
            <div className="space-y-3 px-2">
              {meta.studentNames.map((student, i) => (
                <div key={i} className="flex gap-3 items-start p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Field label="Student Name">
                      <input type="text" value={student.name} onChange={(e) => updateStudent(i, 'name', e.target.value)} placeholder="Student Name" className={inputCls + ' text-sm'} />
                    </Field>
                    <Field label="Roll No.">
                      <input type="text" value={student.rollNo} onChange={(e) => updateStudent(i, 'rollNo', e.target.value)} placeholder="Roll No." className={inputCls + ' text-sm'} />
                    </Field>
                  </div>
                  {meta.studentNames.length > 1 && (
                    <button onClick={() => removeStudent(i)} className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 bg-white">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addStudent} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={16} /> Add Student
              </button>
            </div>
          </section>

          {/* University */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">University</h3>
            <div className="space-y-4 px-2">
              <Field label="University Name">
                <input type="text" value={meta.universityName} onChange={(e) => setMeta({ universityName: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Degree">
                  <input type="text" value={meta.degree} onChange={(e) => setMeta({ degree: e.target.value })} placeholder="e.g. Bachelor of Technology" className={inputCls} />
                </Field>
                <Field label="Branch">
                  <input type="text" value={meta.branch} onChange={(e) => setMeta({ branch: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>
          </section>

          {/* College */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">College Details</h3>
            <div className="space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <Field label="College Name">
                  <input type="text" value={meta.collegeName} onChange={(e) => setMeta({ collegeName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="College Short Name">
                  <input type="text" value={meta.collegeShort || ''} onChange={(e) => setMeta({ collegeShort: e.target.value })} placeholder="e.g. SBCE, Pattor" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Department">
                  <input type="text" value={meta.department} onChange={(e) => setMeta({ department: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Department Short Name">
                  <input type="text" value={meta.departmentShort || ''} onChange={(e) => setMeta({ departmentShort: e.target.value })} placeholder="e.g. ECE" className={inputCls} />
                </Field>
              </div>
              <div className="flex gap-4">
                <Field label="Month" className="flex-1">
                  <input type="text" value={meta.month} onChange={(e) => setMeta({ month: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Year" className="flex-1">
                  <input type="text" value={meta.year} onChange={(e) => setMeta({ year: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>
          </section>

          {/* Guide & HOD */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">Personnel</h3>
            <div className="space-y-4 px-2">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Internal Supervisor / Guide Name">
                  <input type="text" value={meta.guideName} onChange={(e) => setMeta({ guideName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Guide Designation">
                  <input type="text" value={meta.guideDesignation} onChange={(e) => setMeta({ guideDesignation: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Project Coordinator Name">
                  <input type="text" value={meta.projectCoordinatorName || ''} onChange={(e) => setMeta({ projectCoordinatorName: e.target.value })} placeholder="e.g. Mrs. Geethumol P V" className={inputCls} />
                </Field>
                <Field label="Project Coordinator Designation">
                  <input type="text" value={meta.projectCoordinatorDesignation || ''} onChange={(e) => setMeta({ projectCoordinatorDesignation: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="HOD Name">
                  <input type="text" value={meta.hodName} onChange={(e) => setMeta({ hodName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="HOD Designation">
                  <input type="text" value={meta.hodDesignation} onChange={(e) => setMeta({ hodDesignation: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Principal Name">
                <input type="text" value={meta.principalName || ''} onChange={(e) => setMeta({ principalName: e.target.value })} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Logo */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-50 p-2 rounded">College Logo</h3>
            <div className="flex items-center gap-6 px-2">
              {meta.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.logoUrl} alt="Logo" className="h-24 w-24 object-contain rounded-xl border-2 border-slate-200 shadow-sm" />
              ) : (
                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
                  <Upload size={24} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors font-medium border border-blue-100 w-fit">
                  Upload Logo
                </button>
                {meta.logoUrl && (
                  <button onClick={() => setMeta({ logoUrl: '' })} className="text-sm px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 w-fit">
                    Remove Logo
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <p className="px-2 mt-3 text-xs text-slate-500">Upload a square logo, preferably with a transparent background (PNG).</p>
          </section>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
