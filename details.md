# College Report Formatter – Project Specification

## Overview

A web application that allows students to compose and format academic project reports (APJ Abdul Kalam Technological University style) using a structured section-based editor. Users select report sections from a dropdown, fill in content in a live editor, preview the formatted output in real-time on the right panel, and download the final report as a PDF.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Rich Text Editor | TipTap (headless editor for React) |
| PDF Generation | `react-to-print` + `@react-pdf/renderer` OR `html2pdf.js` via dynamic import |
| State Management | Zustand |
| Component Library | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout with fonts (Times New Roman via next/font/google)
│   ├── page.tsx                # Main editor page
│   └── globals.css             # Tailwind base styles
│
├── components/
│   ├── editor/
│   │   ├── SectionDropdown.tsx     # Dropdown to add report sections
│   │   ├── SectionList.tsx         # Left panel: list of added sections (draggable)
│   │   ├── SectionEditor.tsx       # TipTap rich text editor for active section
│   │   └── EditorToolbar.tsx       # Bold, Italic, Underline, Heading, List, Table controls
│   │
│   ├── preview/
│   │   ├── ReportPreview.tsx        # Right panel: live A4-formatted preview
│   │   ├── sections/
│   │   │   ├── TitlePagePreview.tsx
│   │   │   ├── CertificatePreview.tsx
│   │   │   ├── AcknowledgementPreview.tsx
│   │   │   ├── AbstractPreview.tsx
│   │   │   ├── TableOfContentsPreview.tsx
│   │   │   ├── ChapterPreview.tsx       # Generic chapter renderer
│   │   │   ├── ResultsPreview.tsx
│   │   │   ├── ConclusionPreview.tsx
│   │   │   └── ReferencesPreview.tsx
│   │
│   ├── ui/                         # shadcn/ui components (Button, Select, Dialog, etc.)
│   └── PDFDownloadButton.tsx        # Triggers PDF generation and download
│
├── lib/
│   ├── store.ts                    # Zustand store: sections[], activeSection, reportMeta
│   ├── sectionTemplates.ts         # Default content templates for each section type
│   ├── reportTypes.ts              # TypeScript types for report sections and metadata
│   └── pdfUtils.ts                 # PDF generation helpers (print stylesheet, html2pdf config)
│
├── hooks/
│   ├── useReportStore.ts           # Zustand hook wrapper
│   └── usePDFExport.ts             # Hook that handles PDF generation flow
│
└── public/
    └── college-logo.png            # Placeholder college logo (user can upload their own)
```

---

## Core Features

### 1. Section Management (Left Panel)

**SectionDropdown** renders a `<Select>` (shadcn/ui) with all available section types:

```
- Title Page
- Certificate
- Declaration
- Acknowledgement
- Abstract
- Table of Contents
- List of Figures
- List of Tables
- Chapter (auto-numbered: Chapter 1, Chapter 2, ...)
- Results and Discussion
- Advantages and Disadvantages
- Conclusion and Future Scope
- References
```

On selecting a section and clicking **"+ Add Section"**:
- A new section object is pushed to Zustand store with a unique `id`, `type`, `title`, and `content` (pre-filled from `sectionTemplates.ts`).
- The section appears in the **SectionList** below.

**SectionList** shows all added sections as a vertical list. Features:
- Click to activate (highlights active section, loads it in editor).
- Drag-to-reorder using `@dnd-kit/core`.
- Delete button (trash icon) on hover.

---

### 2. Editor (Center/Left Panel)

Uses **TipTap** with extensions:
- `StarterKit` (bold, italic, headings H1–H3, bullet list, ordered list, blockquote, code)
- `Underline`
- `Table` + `TableRow` + `TableCell` + `TableHeader`
- `TextAlign` (left, center, right, justify)
- `Placeholder` (shows section-specific placeholder text)

**EditorToolbar** buttons:
- Bold, Italic, Underline, Strikethrough
- H1, H2, H3, Paragraph
- Bullet List, Ordered List
- Table insert (opens a simple row×col picker dialog)
- Text align buttons
- Undo / Redo

The editor is fully controlled – every keystroke updates `content` in the Zustand store for the active section.

---

### 3. Report Metadata Form

A collapsible settings panel (accessible via a gear icon) lets users fill in:

```typescript
interface ReportMeta {
  title: string;           // e.g. "EEG STRESS MONITORING SYSTEM"
  subtitle: string;        // e.g. "Mini Project Report"
  studentNames: { name: string; rollNo: string }[];
  universityName: string;  // e.g. "APJ Abdul Kalam Technological University"
  degree: string;          // e.g. "Bachelor of Technology"
  branch: string;          // e.g. "Electronics and Communication Engineering"
  collegeName: string;     // e.g. "SREE BUDDHA COLLEGE OF ENGINEERING, PATTOOR"
  department: string;
  month: string;
  year: string;
  guideName: string;
  guideDesignation: string;
  hodName: string;
  hodDesignation: string;
  logoUrl: string;         // college logo (upload or default)
}
```

The metadata feeds into all auto-generated sections (Title Page, Certificate, etc.).

---

### 4. Live Preview (Right Panel)

**ReportPreview** renders all sections in order inside a scrollable container styled as an A4 page:

```tsx
// A4 page simulation
<div className="bg-white shadow-lg mx-auto"
     style={{ width: '210mm', minHeight: '297mm', padding: '25mm 25mm 25mm 30mm', fontFamily: 'Times New Roman' }}>
  {sections.map(section => <SectionRenderer key={section.id} section={section} />)}
</div>
```

**Section Renderers** apply APJ KTU-standard formatting rules:
- Font: Times New Roman, 12pt (body), 14pt (headings)
- Line spacing: 1.5
- Margins: Left 30mm, Right/Top/Bottom 25mm
- Chapter titles: Centered, UPPERCASE, Bold, 14pt
- Page numbers: Bottom center (auto via CSS counter or manual tracking)
- Heading hierarchy: H1 = Chapter title, H2 = Section heading, H3 = Subsection

Each section type has a dedicated preview component:

**TitlePagePreview**: Renders college logo (center), title (bold uppercase center), author names, university details, department, month+year — all pulled from `reportMeta`.

**CertificatePreview**: Auto-fills guide name, HOD name, student names from metadata. Shows signature blocks.

**ChapterPreview**: Renders the TipTap HTML content via `dangerouslySetInnerHTML` (sanitized with DOMPurify) inside the A4 styling.

**TableOfContentsPreview**: Auto-generates TOC by reading `title` from each section in store, with leader dots and page placeholders.

---

### 5. PDF Download

**PDFDownloadButton** uses `html2pdf.js` (dynamically imported to avoid SSR issues):

```typescript
// lib/pdfUtils.ts
export async function downloadAsPDF(elementId: string, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  const opt = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  html2pdf().set(opt).from(element).save();
}
```

A `page-break-before: always` CSS class is applied to each section's preview wrapper to ensure proper page breaks in the PDF.

---

## TypeScript Types

```typescript
// lib/reportTypes.ts

export type SectionType =
  | 'title-page'
  | 'certificate'
  | 'declaration'
  | 'acknowledgement'
  | 'abstract'
  | 'table-of-contents'
  | 'list-of-figures'
  | 'list-of-tables'
  | 'chapter'
  | 'results'
  | 'advantages-disadvantages'
  | 'conclusion'
  | 'references';

export interface ReportSection {
  id: string;               // nanoid()
  type: SectionType;
  title: string;            // Display title, editable (e.g. "Chapter 1 - Introduction")
  content: string;          // TipTap HTML string
  chapterNumber?: number;   // Only for 'chapter' type, auto-assigned
}

export interface ReportMeta {
  title: string;
  subtitle: string;
  studentNames: { name: string; rollNo: string }[];
  universityName: string;
  degree: string;
  branch: string;
  collegeName: string;
  department: string;
  month: string;
  year: string;
  guideName: string;
  guideDesignation: string;
  hodName: string;
  hodDesignation: string;
  logoUrl: string;
}

export interface ReportStore {
  meta: ReportMeta;
  sections: ReportSection[];
  activeSectionId: string | null;
  setMeta: (meta: Partial<ReportMeta>) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<ReportSection>) => void;
  reorderSections: (from: number, to: number) => void;
  setActiveSection: (id: string) => void;
}
```

---

## Zustand Store

```typescript
// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ReportStore, SectionType } from './reportTypes';
import { sectionTemplates } from './sectionTemplates';

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      meta: { /* default empty meta */ },
      sections: [],
      activeSectionId: null,
      setMeta: (updates) => set(state => ({ meta: { ...state.meta, ...updates } })),
      addSection: (type) => {
        const chapterCount = get().sections.filter(s => s.type === 'chapter').length;
        const newSection = {
          id: nanoid(),
          type,
          title: type === 'chapter' ? `Chapter ${chapterCount + 1}` : sectionTemplates[type].defaultTitle,
          content: sectionTemplates[type].defaultContent,
          chapterNumber: type === 'chapter' ? chapterCount + 1 : undefined,
        };
        set(state => ({ sections: [...state.sections, newSection], activeSectionId: newSection.id }));
      },
      removeSection: (id) => set(state => ({ sections: state.sections.filter(s => s.id !== id) })),
      updateSection: (id, updates) => set(state => ({
        sections: state.sections.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      reorderSections: (from, to) => set(state => {
        const sections = [...state.sections];
        const [moved] = sections.splice(from, 1);
        sections.splice(to, 0, moved);
        return { sections };
      }),
      setActiveSection: (id) => set({ activeSectionId: id }),
    }),
    { name: 'report-store' }  // persists to localStorage
  )
);
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Report Formatter"    [⚙ Settings]  [↓ Download PDF]  │
├──────────────┬──────────────────────┬───────────────────────────┤
│  LEFT PANEL  │    CENTER (EDITOR)   │    RIGHT (PREVIEW)        │
│  250px       │    flex-1            │    ~500px scrollable      │
│              │                      │                           │
│  [+ Add      │  [Section Title      │  ┌──────────────────────┐ │
│   Section ▼] │   editable input]    │  │                      │ │
│              │                      │  │   A4 PAGE PREVIEW    │ │
│  ─────────── │  [EditorToolbar]     │  │                      │ │
│              │                      │  │   (live render)      │ │
│  • Title Pg  │  ┌────────────────┐  │  │                      │ │
│  • Cert      │  │                │  │  └──────────────────────┘ │
│  • Ack  [x]  │  │  TipTap        │  │                           │
│  • Abstract  │  │  Editor        │  │                           │
│  ▶ Chapter 1 │  │                │  │                           │
│  • Chapter 2 │  └────────────────┘  │                           │
│              │                      │                           │
└──────────────┴──────────────────────┴───────────────────────────┘
```

---

## Key Implementation Notes

### Avoiding SSR Issues
- `html2pdf.js` must be imported with `dynamic(() => import('html2pdf.js'), { ssr: false })` or inside a `useEffect`
- TipTap editor should be wrapped in a `dynamic` import with `ssr: false`

### Print / PDF Stylesheet
Add a `@media print` stylesheet in `globals.css`:
```css
@media print {
  body * { visibility: hidden; }
  #report-preview, #report-preview * { visibility: visible; }
  #report-preview { position: absolute; left: 0; top: 0; }
  .page-break { page-break-before: always; }
}
```

### Section Templates (`lib/sectionTemplates.ts`)
Each section type provides:
- `defaultTitle: string` – shown in section list
- `defaultContent: string` – pre-filled HTML in editor (e.g., Certificate template pre-fills boilerplate text with `{{guideName}}` placeholders replaced from meta at render time)

### Auto Table of Contents
The `TableOfContentsPreview` component reads `useReportStore(s => s.sections)` and generates entries for every chapter-type section. Page numbers can either be displayed as "—" (to be filled manually) or estimated using a character-count heuristic.

### College Logo Upload
A simple `<input type="file" accept="image/*">` reads the file as a base64 data URL and stores it in `meta.logoUrl`. This keeps everything client-side with no backend needed.

---

## Dependencies to Install

```bash
npx create-next-app@latest report-formatter --typescript --tailwind --app
cd report-formatter

# UI
npx shadcn@latest init
npx shadcn@latest add button select dialog input label separator sheet

# Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-underline \
  @tiptap/extension-text-align @tiptap/extension-table \
  @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header @tiptap/extension-placeholder

# State
npm install zustand nanoid

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# PDF
npm install html2pdf.js
npm install --save-dev @types/html2pdf.js

# Sanitization
npm install dompurify
npm install --save-dev @types/dompurify
```

---

## Optional Enhancements (Phase 2)

- **Import existing report** – parse a `.docx` using `mammoth.js` and auto-detect/split sections
- **Section templates library** – save custom templates for reuse across projects
- **Multi-user / cloud save** – integrate Supabase for storing reports by user
- **Version history** – track changes to each section over time (Zustand + localStorage snapshots)
- **Export to DOCX** – use `docx` npm package to generate a `.docx` file matching the preview
- **Theme selector** – switch between different university report styles (KTU, Anna University, etc.)
- **Spell check** – TipTap `@tiptap/extension-typography` + browser spellcheck attribute