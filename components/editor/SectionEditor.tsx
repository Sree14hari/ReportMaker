'use client';
// components/editor/SectionEditor.tsx
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import ImageResize from 'tiptap-extension-resize-image';
import { useReportStore } from '@/lib/store';
import EditorToolbar from './EditorToolbar';
import TitlePageEditor from './TitlePageEditor';
import AutoCitationModal from './AutoCitationModal';
import { BookMarked } from 'lucide-react';

export default function SectionEditor() {
  const sections = useReportStore((s) => s.sections);
  const activeSectionId = useReportStore((s) => s.activeSectionId);
  const updateSection = useReportStore((s) => s.updateSection);

  const activeSection = sections.find((s) => s.id === activeSectionId);

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showCitationModal, setShowCitationModal] = useState(false);

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
      Placeholder.configure({ placeholder: 'Start writing your section content here...' }),
    ],
    content: activeSection?.content ?? '',
    onUpdate: ({ editor }) => {
      if (activeSectionId) {
        updateSection(activeSectionId, { content: editor.getHTML() });
      }
    },
    editorProps: {
      attributes: {
        class: 'prose mx-auto prose-sm max-w-none focus:outline-none min-h-[800px] p-8 sm:p-12 text-gray-800',
      },
    },
  });

  // Sync editor content when active section changes
  useEffect(() => {
    if (editor && activeSection) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== activeSection.content) {
        editor.commands.setContent(activeSection.content || '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionId]);

  function insertTable() {
    if (editor) {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
      setShowTableDialog(false);
    }
  }

  if (!activeSection) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a section from the left panel to start editing.
      </div>
    );
  }

  if (activeSection.type === 'title-page') {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <div className="px-5 py-4 bg-white z-10 shadow-sm relative border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Title Page Settings</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Auto-generated</span>
        </div>
        <TitlePageEditor />
      </div>
    );
  }

  // Non-editable sections (they are auto-generated from metadata)
  if (activeSection.type === 'table-of-contents') {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 italic">
            This section is auto-generated based on the generated headings in your chapters.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Auto Citation Modal */}
      {showCitationModal && (
        <AutoCitationModal onClose={() => setShowCitationModal(false)} />
      )}

      {/* Section title input */}
      <div className="px-5 py-4 bg-white z-10 shadow-sm relative flex items-center gap-3">
        <input
          type="text"
          value={activeSection.title}
          onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
          className="flex-1 text-2xl font-bold text-slate-800 border-none outline-none bg-transparent placeholder-slate-300 transition-colors focus:placeholder-slate-200"
          placeholder="Section Title"
        />
        {activeSection.type === 'references' && (
          <button
            onClick={() => setShowCitationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
            title="Auto-insert citations into chapters based on your references"
          >
            <BookMarked size={13} />
            Add Citations
          </button>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar 
        editor={editor} 
        onInsertTable={() => setShowTableDialog(true)} 
        alwaysEnableTableControls={['list-of-figures', 'list-of-tables'].includes(activeSection.type)}
      />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200/60 rounded-sm min-h-[800px] hover:shadow-md transition-shadow duration-300">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTableDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-72" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-4">Insert Table</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex-1">
                <span className="text-xs text-gray-600 block mb-1">Rows</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex-1">
                <span className="text-xs text-gray-600 block mb-1">Columns</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTableDialog(false)} className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={insertTable} className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
