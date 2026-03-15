'use client';
// components/PDFDownloadButton.tsx
import { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { downloadAsPDF, downloadAsDOCX } from '@/lib/pdfUtils';
import { useReportStore } from '@/lib/store';

export default function PDFDownloadButton() {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const meta = useReportStore((s) => s.meta);

  async function handleDownloadPdf() {
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
    setLoadingDocx(true);
    try {
      const filename = meta.title
        ? `${meta.title.replace(/\s+/g, '_')}_Report`
        : 'Report';
      await downloadAsDOCX('report-preview', filename);
    } finally {
      setLoadingDocx(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownloadDocx}
        disabled={loadingDocx || loadingPdf}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
      >
        {loadingDocx ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <FileText size={15} />
        )}
        Export Word
      </button>

      <button
        onClick={handleDownloadPdf}
        disabled={loadingPdf || loadingDocx}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
      >
        {loadingPdf ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <FileDown size={15} />
        )}
        Export PDF
      </button>
    </div>
  );
}
