'use client';
// components/MetadataPanel.tsx
import { useState, useRef } from 'react';
import { useReportStore } from '@/lib/store';
import { Settings, X, Plus, Trash2, Upload } from 'lucide-react';

export default function MetadataPanel() {
  const [open, setOpen] = useState(false);
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <Settings size={15} />
        Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h2 className="font-bold text-gray-800">Report Settings</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-5 space-y-5">
              {/* Project Info */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Project Info</h3>
                <div className="space-y-3">
                  <Field label="Project Title">
                    <input type="text" value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} placeholder="e.g. EEG STRESS MONITORING SYSTEM" className={inputCls} />
                  </Field>
                  <Field label="Header Content (Optional)">
                    <input type="text" value={meta.headerContent || ''} onChange={(e) => setMeta({ headerContent: e.target.value })} placeholder="Custom text to show on paginated headers" className={inputCls} />
                  </Field>
                  <Field label="Subtitle">
                    <input type="text" value={meta.subtitle} onChange={(e) => setMeta({ subtitle: e.target.value })} placeholder="e.g. Mini Project Report" className={inputCls} />
                  </Field>
                </div>
              </section>

              {/* Students */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Students</h3>
                <div className="space-y-2">
                  {meta.studentNames.map((student, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <input type="text" value={student.name} onChange={(e) => updateStudent(i, 'name', e.target.value)} placeholder="Student Name" className={inputCls + ' text-sm'} />
                        <input type="text" value={student.rollNo} onChange={(e) => updateStudent(i, 'rollNo', e.target.value)} placeholder="Roll No." className={inputCls + ' text-sm'} />
                      </div>
                      {meta.studentNames.length > 1 && (
                        <button onClick={() => removeStudent(i)} className="mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addStudent} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                    <Plus size={13} /> Add Student
                  </button>
                </div>
              </section>

              {/* University */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">University</h3>
                <div className="space-y-3">
                  <Field label="University Name">
                    <input type="text" value={meta.universityName} onChange={(e) => setMeta({ universityName: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Degree">
                    <input type="text" value={meta.degree} onChange={(e) => setMeta({ degree: e.target.value })} placeholder="e.g. Bachelor of Technology" className={inputCls} />
                  </Field>
                  <Field label="Branch">
                    <input type="text" value={meta.branch} onChange={(e) => setMeta({ branch: e.target.value })} className={inputCls} />
                  </Field>
                </div>
              </section>

              {/* College */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">College</h3>
                <div className="space-y-3">
                  <Field label="College Name">
                    <input type="text" value={meta.collegeName} onChange={(e) => setMeta({ collegeName: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="College Short Name">
                    <input type="text" value={meta.collegeShort || ''} onChange={(e) => setMeta({ collegeShort: e.target.value })} placeholder="e.g. SBCE, Pattor" className={inputCls} />
                  </Field>
                  <Field label="Department">
                    <input type="text" value={meta.department} onChange={(e) => setMeta({ department: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Department Short Name">
                    <input type="text" value={meta.departmentShort || ''} onChange={(e) => setMeta({ departmentShort: e.target.value })} placeholder="e.g. ECE" className={inputCls} />
                  </Field>
                  <div className="flex gap-3">
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Guide & HOD</h3>
                <div className="space-y-3">
                  <Field label="Guide Name">
                    <input type="text" value={meta.guideName} onChange={(e) => setMeta({ guideName: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Guide Designation">
                    <input type="text" value={meta.guideDesignation} onChange={(e) => setMeta({ guideDesignation: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="HOD Name">
                    <input type="text" value={meta.hodName} onChange={(e) => setMeta({ hodName: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="HOD Designation">
                    <input type="text" value={meta.hodDesignation} onChange={(e) => setMeta({ hodDesignation: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Principal Name">
                    <input type="text" value={meta.principalName || ''} onChange={(e) => setMeta({ principalName: e.target.value })} className={inputCls} />
                  </Field>
                </div>
              </section>

              {/* Logo */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">College Logo</h3>
                <div className="flex items-center gap-4">
                  {meta.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-gray-200" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <Upload size={20} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium">
                      Upload Logo
                    </button>
                    {meta.logoUrl && (
                      <button onClick={() => setMeta({ logoUrl: '' })} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </section>
            </div>

            <div className="p-5 border-t border-gray-200">
              <button onClick={() => setOpen(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
