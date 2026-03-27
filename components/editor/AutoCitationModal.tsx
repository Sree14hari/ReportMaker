'use client';
// components/editor/AutoCitationModal.tsx

import { useState, useCallback } from 'react';
import { useReportStore } from '@/lib/store';
import { parseReferences, runCitationMatching, CitationMatch, CitationRef } from '@/lib/citationEngine';
import { X, BookMarked, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Zap, BookOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
}

type Step = 'idle' | 'preview' | 'done';

export default function AutoCitationModal({ onClose }: Props) {
  const sections = useReportStore((s) => s.sections);
  const updateSection = useReportStore((s) => s.updateSection);

  const [step, setStep] = useState<Step>('idle');
  const [refs, setRefs] = useState<CitationRef[]>([]);
  const [matches, setMatches] = useState<CitationMatch[]>([]);
  const [updatedSections, setUpdatedSections] = useState<{ id: string; newContent: string }[]>([]);
  const [expandedRef, setExpandedRef] = useState<number | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);

  const referenceSection = sections.find((s) => s.type === 'references');
  const chapters = sections.filter((s) => s.type === 'chapter' || s.type === 'results');

  const handleAnalyze = useCallback(() => {
    if (!referenceSection?.content) return;

    const parsedRefs = parseReferences(referenceSection.content);
    const chapterData = chapters.map((c) => ({
      id: c.id,
      title: c.title,
      content: c.content,
    }));

    const result = runCitationMatching(parsedRefs, chapterData);
    setRefs(parsedRefs);
    setMatches(result.matches);
    setUpdatedSections(result.updatedSections);
    setStep('preview');
  }, [referenceSection, chapters]);

  const handleApply = useCallback(() => {
    let count = 0;
    for (const upd of updatedSections) {
      updateSection(upd.id, { content: upd.newContent });
      count++;
    }
    setAppliedCount(count);
    setStep('done');
  }, [updatedSections, updateSection]);

  // Group matches by reference index
  const matchesByRef = refs.reduce<Record<number, CitationMatch[]>>((acc, ref) => {
    acc[ref.index] = matches.filter((m) => m.citationIndex === ref.index);
    return acc;
  }, {});

  const totalMatches = matches.length;
  const affectedChapters = new Set(matches.map((m) => m.chapterId)).size;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[640px] max-w-[95vw] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookMarked size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Auto Citation</h2>
              <p className="text-xs text-slate-500">Automatically insert reference citations in chapters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP: IDLE ── */}
          {step === 'idle' && (
            <div className="p-6 flex flex-col gap-5">
              {/* Status */}
              <div className="grid grid-cols-2 gap-3">
                <StatusCard
                  icon={<BookOpen size={16} className="text-indigo-500" />}
                  label="References Section"
                  value={referenceSection ? 'Found' : 'Not found'}
                  ok={!!referenceSection}
                />
                <StatusCard
                  icon={<BookMarked size={16} className="text-purple-500" />}
                  label="Chapters to scan"
                  value={`${chapters.length} section${chapters.length !== 1 ? 's' : ''}`}
                  ok={chapters.length > 0}
                />
              </div>

              {/* Explanation */}
              <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700 space-y-2 border border-indigo-100">
                <p className="font-semibold text-indigo-800 flex items-center gap-1.5">
                  <Zap size={14} className="text-indigo-500" />
                  How it works
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed text-indigo-600">
                  <li>Parses each entry in your <strong>References</strong> section.</li>
                  <li>Extracts key topic words from each reference (author, title keywords).</li>
                  <li>Scans all <strong>chapters &amp; results</strong> for best-matching paragraphs.</li>
                  <li>Inserts <code className="bg-indigo-100 px-1 rounded">[N]</code> superscript citation at the end of matching sentences.</li>
                  <li>Shows you a preview — you approve before anything is changed.</li>
                </ol>
              </div>

              {!referenceSection && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                  Add a <strong>References</strong> section with your citations before running auto-citation.
                </div>
              )}

              {chapters.length === 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                  No chapters or results sections found to add citations to.
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!referenceSection || chapters.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Zap size={15} />
                Analyze &amp; Find Citations
              </button>
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <div className="p-6 flex flex-col gap-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard value={refs.length} label="References" color="indigo" />
                <SummaryCard value={totalMatches} label="Matches found" color="purple" />
                <SummaryCard value={affectedChapters} label="Chapters affected" color="blue" />
              </div>

              {totalMatches === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                  <span>
                    No strong keyword matches found. Try adding more descriptive content to your chapters, or make sure your references contain topic-specific terms.
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The following citation placements were found. Review each match below, then click <strong>Apply Citations</strong> to insert them.
                  </p>

                  {/* Reference match list */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {refs.map((ref) => {
                      const refMatches = matchesByRef[ref.index] || [];
                      const isExpanded = expandedRef === ref.index;
                      return (
                        <div key={ref.index} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            onClick={() => setExpandedRef(isExpanded ? null : ref.index)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex-shrink-0 text-xs font-bold text-white bg-indigo-500 rounded-md px-1.5 py-0.5">
                                [{ref.index}]
                              </span>
                              <span className="text-xs text-slate-600 truncate">{ref.raw.slice(0, 80)}…</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${refMatches.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {refMatches.length} match{refMatches.length !== 1 ? 'es' : ''}
                              </span>
                              {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Keywords used:</p>
                              <div className="flex flex-wrap gap-1">
                                {ref.keywords.map((kw) => (
                                  <span key={kw} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-md font-mono">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                              {refMatches.length > 0 ? (
                                <div className="space-y-2 mt-2">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Will be inserted in:</p>
                                  {refMatches.map((m, i) => (
                                    <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-2.5">
                                      <p className="text-[10px] font-bold text-green-700 mb-1">{m.chapterTitle} — matched: <em>{m.keyword}</em></p>
                                      <p className="text-xs text-slate-500 italic leading-relaxed">…{m.contextSnippet}… <sup className="text-indigo-600 font-bold not-italic">[{m.citationIndex}]</sup></p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic mt-1">No matching paragraph found for this reference.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep('idle')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={totalMatches === 0}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  Apply {totalMatches} Citation{totalMatches !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Citations Applied!</h3>
                <p className="text-sm text-slate-500">
                  Successfully added <strong>{matches.length}</strong> citation{matches.length !== 1 ? 's' : ''} across{' '}
                  <strong>{appliedCount}</strong> section{appliedCount !== 1 ? 's' : ''}.
                </p>
              </div>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Citations appear as superscript <sup>[N]</sup> markers in your chapter text, linking to the corresponding reference entries.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-xl border p-3 flex items-start gap-2.5 ${ok ? 'border-indigo-100 bg-indigo-50/60' : 'border-amber-100 bg-amber-50/60'}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-bold mt-0.5 ${ok ? 'text-slate-800' : 'text-amber-600'}`}>{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({ value, label, color }: { value: number; label: string; color: 'indigo' | 'purple' | 'blue' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
