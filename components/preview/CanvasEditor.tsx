'use client';
// components/preview/CanvasEditor.tsx
// Inline canvas editor: renders a full-size TipTap editor overlay over an A4 page.

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import ImageResize from 'tiptap-extension-resize-image';
import { useReportStore } from '@/lib/store';
import { ReportSection } from '@/lib/reportTypes';
import { X, Check } from 'lucide-react';

interface CanvasEditorProps {
  section: ReportSection;
  chapterIndex: number | null;
  onClose: () => void;
}

const NON_EDITABLE_TYPES = ['title-page', 'certificate', 'table-of-contents'];

export default function CanvasEditor({ section, chapterIndex, onClose }: CanvasEditorProps) {
  const updateSection = useReportStore((s) => s.updateSection);
  const setActiveSection = useReportStore((s) => s.setActiveSection);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isEditable = !NON_EDITABLE_TYPES.includes(section.type);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // @ts-ignore
      ImageResize.configure({ allowBase64: true, inline: true }),
    ],
    content: section.content ?? '',
    editable: isEditable,
    onUpdate: ({ editor }) => {
      updateSection(section.id, { content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none w-full h-full report-content text-[12pt] leading-relaxed text-justify',
        style: 'font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000;',
        spellcheck: 'true',
      },
    },
  });

  // Focus the editor on mount
  useEffect(() => {
    if (editor && isEditable) {
      setTimeout(() => editor.commands.focus('end'), 50);
    }
  }, [editor, isEditable]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRedirectToEditor = () => {
    setActiveSection(section.id);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 flex flex-col"
      style={{
        backgroundColor: '#fff',
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#000',
      }}
    >
      {/* Floating toolbar */}
      <div
        className="absolute top-2 right-2 z-30 flex items-center gap-1.5"
        style={{ pointerEvents: 'auto' }}
      >
        {!isEditable && (
          <button
            onClick={handleRedirectToEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors"
            title="Go to editor for this section"
          >
            Open in Editor
          </button>
        )}
        {isEditable && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-lg transition-colors"
            title="Done editing (Esc)"
          >
            <Check size={12} />
            Done
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg shadow border border-gray-200 transition-colors"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Non-editable notice */}
      {!isEditable && (
        <div className="absolute top-2 left-2 z-30 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-medium px-2 py-1 rounded-md shadow">
          Auto-generated · click "Open in Editor" to configure
        </div>
      )}

      {/* Editable overlay — matches the exact page content area */}
      {isEditable && (
        <div
          className="flex flex-col h-full ring-2 ring-blue-400 ring-inset"
          style={{ borderRadius: '0' }}
        >
          {/* Title row */}
          <div
            className="flex-shrink-0 text-center font-bold uppercase tracking-wide mb-6"
            style={{ fontSize: '14pt', padding: '0 96px 0 113px', marginTop: 0 }}
          >
            {chapterIndex ? (
              <>
                <div className="mb-1">CHAPTER {chapterIndex}</div>
                <div>{section.title}</div>
              </>
            ) : (
              <div>{section.title}</div>
            )}
          </div>

          {/* TipTap editor */}
          <div
            className="flex-1 overflow-y-auto canvas-editor-scroll"
            style={{ padding: '0 96px 0 113px' }}
          >
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
