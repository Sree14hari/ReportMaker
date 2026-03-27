'use client';
// components/PDFDownloadButton.tsx
import { useState } from 'react';
import { FileDown, Loader2, KeyRound, X, FileText } from 'lucide-react';
import { downloadAsPDF } from '@/lib/pdfUtils';
import { generateProperDocx } from '@/lib/docxBuilder';
import { useReportStore } from '@/lib/store';

export default function PDFDownloadButton() {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const meta = useReportStore((s) => s.meta);
  const isActivated = useReportStore((s) => s.isActivated);
  const setActivated = useReportStore((s) => s.setActivated);

  async function handleDownloadPdf() {
    if (!isActivated) {
      setShowActivationModal(true);
      return;
    }

    setLoadingPdf(true);
    try {
      const filename = meta.title
        ? `${meta.title.replace(/\s+/g, '_')}_Report.pdf`
        : 'Report.pdf';
      await downloadAsPDF('report-preview', filename);
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleDownloadDocx() {
    if (!isActivated) {
      setShowActivationModal(true);
      return;
    }

    setLoadingDocx(true);
    try {
      const storeState = useReportStore.getState();
      await generateProperDocx(storeState);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocx(false);
    }
  }

  function handleActivate() {
    const code = activationCode.trim();
    if (code === 'BUBUMOL' || code === 'SHR14') {
      setActivated(true);
      setShowActivationModal(false);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid activation code. Please try again.');
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {!isActivated && (
          <button
            onClick={() => setShowActivationModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <KeyRound size={15} />
            Activate
          </button>
        )}

        <button
          onClick={handleDownloadDocx}
          disabled={loadingDocx}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          {loadingDocx ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileText size={15} />
          )}
          {isActivated ? 'Export DOCX' : 'Export...'}
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={loadingPdf}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          {loadingPdf ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileDown size={15} />
          )}
          {isActivated ? 'Export PDF' : 'Export...'}
        </button>
      </div>

      {showActivationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Activate Product</h3>
              <button onClick={() => setShowActivationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>
            
            <p className="text-center text-sm text-gray-600 mb-6">
              Enter your product key to unlock PDF exports.
            </p>
            
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleActivate();
              }}
              placeholder="Enter activation code"
              className="w-full text-center border border-gray-300 rounded-lg px-4 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
            />
            
            {errorMsg && (
              <p className="text-red-500 text-sm mb-4 font-medium text-center w-full">
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleActivate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
            >
              Activate Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
