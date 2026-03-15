'use client';
// components/editor/EditorToolbar.tsx
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  TableIcon,
  ImageIcon,
} from 'lucide-react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1.5 flex items-center justify-center rounded-lg text-sm transition-all duration-150 active:scale-95 ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}
import { useRef } from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertTable: () => void;
  alwaysEnableTableControls?: boolean;
}

export default function EditorToolbar({ editor, onInsertTable, alwaysEnableTableControls }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const figureLabel = window.prompt("Enter Figure Label (e.g., Fig 3.2: Circuit Diagram):");
          if (figureLabel) {
            // @ts-ignore
            editor.chain().focus().setImage({ src: result }).insertContent(`<p style="text-align: center;">${figureLabel}</p>`).run();
          } else {
            // @ts-ignore
            editor.chain().focus().setImage({ src: result }).run();
          }
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full overflow-x-auto shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {/* Text style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
        <Underline size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={14} />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph">
        <Pilcrow size={14} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
        <ListOrdered size={14} />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={14} />
      </ToolbarButton>

      <Divider />

      {/* Insert */}
      <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image">
        <ImageIcon size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onInsertTable} title="Insert Table">
        <TableIcon size={14} />
      </ToolbarButton>

      {/* Table Controls (always visible, disabled if not in table, unless overridden) */}
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().addColumnBefore()} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().addColumnBefore()) ? 'text-gray-400' : ''}`}>Col +L</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().addColumnAfter()} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().addColumnAfter()) ? 'text-gray-400' : ''}`}>Col +R</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().deleteColumn()} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().deleteColumn()) ? 'text-gray-400' : 'text-red-500'}`}>Col -</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().addRowBefore()} onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().addRowBefore()) ? 'text-gray-400' : ''}`}>Row +U</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().addRowAfter()} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().addRowAfter()) ? 'text-gray-400' : ''}`}>Row +D</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().deleteRow()} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().deleteRow()) ? 'text-gray-400' : 'text-red-500'}`}>Row -</span>
      </ToolbarButton>
      <ToolbarButton disabled={!alwaysEnableTableControls && !editor.can().deleteTable()} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
        <span className={`text-[10px] font-bold ${(!alwaysEnableTableControls && !editor.can().deleteTable()) ? 'text-gray-400' : 'text-red-700'}`}>Del Table</span>
      </ToolbarButton>

      <Divider />

      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 size={14} />
      </ToolbarButton>
    </div>
  );
}
