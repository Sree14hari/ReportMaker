# The Reporter - Application Architecture & Mechanics

This document provides a comprehensive overview of how **The Reporter** application functions under the hood. It explains the mechanics of how raw rich-text content is transformed into strict A4 academic layouts, how complex pagination is achieved, and how the export functionalities are executed natively inside the modern browser without a backend.

---

## 1. Core Architecture & State Management
The application is built using **Next.js** (App Router) combined with **React** and **TypeScript**. 

It uses a completely client-side architecture meaning there is no reliance on a cloud database or backend API for generating the reports. This guarantees complete privacy, lightning-fast rendering, and offline capabilities.
* **State Management**: Uses **Zustand** combined with `idb-keyval` (IndexedDB) to persistently store all metadata, user settings, and rich-text configurations in the browser. Using IndexedDB bypasses the standard 5MB storage limit of standard `localStorage`, allowing users to include hundreds of high-resolution base64 images in their reports without crashing.

## 2. Editor Mechanics
The writing environment is powered by **Tiptap**, a headless wrapper around ProseMirror.
* Users write content using customized toolbars that inject semantic HTML (`<h2>`, `<p>`, `<img>`, `<table>`).
* Complex configurations like the `ImageResize` extension are modified to natively support Base64 string injection.
* All content is sanitized and dynamically mapped into a JSON-serializable array of `Section` objects (e.g., `chapter`, `abstract`, `certificate`).

## 3. The Pagination Engine (`lib/pagination.ts`)
The most complex part of the application is turning raw continuous HTML into strict physical A4-sized pages on the DOM.
1. The engine reads the raw HTML of a chapter.
2. It injects a hidden, absolute-positioned `div` identical in width (content-width, minus margins) to an A4 page into the DOM.
3. **Async Measurement**: It traverses every single raw HTML node. If it hits an `<img>`, it uses `Promise` wrappers to *wait* for the browser to decode and fully paint the image in memory so its height resolves natively.
4. If `currentHeight + elementHeight` exceeds the available target height of the A4 layout bounds (e.g. `850px`), the engine dynamically slices the DOM and pushes the overflowing elements to a new "chunk" array string.
5. Empty strings, excessive `<br>`s, and stray `p` tags inserted via spacing errors are scrubbed out algorithmically to prevent invisible trailing pages.

## 4. The Render Layout (`ReportPreview.tsx`)
Once chunks are calculated, they are passed to the `ReportPreview` component which dynamically loops through the chunks and mounts a `.page-break-wrapper`:
* Each wrapper enforces an absolute, strict vertical bloclets try k height of exactly `1123px` (which resolves visually to 297mm at a standard 96 PPI calculation).
* **Strict Overflow**: `overflow: hidden` is enforced on pages so rogue CSS can never inadvertently trigger a trailing white blank page in a generic PDF viewer.
* **Native Table Structure**: Each page renders its contents natively inside an HTML `<table>` containing a `<thead>` and a `<tfoot>`. Because of the nature of browser rendering, this native `display: table-header-group` architecture loops vertically matching the constraints of physical academia reports, placing titles, chapter numbers, and Roman numerals gracefully at the bottom and top bounds of exactly the right pages.

### Table of Contents (TOC) Emulation
Because Table of Contents dynamic referencing is incredibly difficult without a two-pass parser, the `TableOfContentsPreview` hooks directly into the pagination state map. It reads the array lengths of the generated chunks to map exactly which physical integer a section starts at, building the string labels (`1.1`, `iv`, etc.). It natively counts `<h2>` injection tags to calculate subtitles. If the TOC line items exceed 20 lines (which mathematically overflows standard layout capabilities), it splits itself iteratively matching the chunk logic.

## 5. Viewport Rendering
To allow users to view their A4 pages effectively on different laptop screens:
* A ResizeObserver scans the width of the right-hand panel.
* It calculates `(panel width - margins) / 794px` and injects an inline CSS `transform: scale()` matrix to miniaturize and fit the A4 page dynamically while preserving visual clarity.

## 6. Export Pipelines

### PDF Export (`lib/pdfUtils.ts`)
The application bypasses complex libraries like `jsPDF` or `html2pdf`. Instead, it uses a high-quality zero-dependency native iframe rendering trick:
1. It creates an isolated, invisible `<iframe>` element dynamically.
2. It completely clones the parsed `ReportPreview` layout bounds.
3. It loads in a strict CSS string masking out everything (`#main-header`, sidebars, dark modes) and forces `@page { margin: 0; size: A4 portrait; }`.
4. It calls `contentWindow.print()`. The browser's native C++ print engine interprets the injected HTML natively, perfectly rasterizing vector text and base64 imagery.

### JSON Import/Export (`ProjectSyncMenu.tsx`)
Because users requested collaboration elements across devices:
* The store packages the entire IndexedDB serialized JSON object.
* It converts it to a proprietary `.reporter` file using HTML5 `Blob` APIs and triggers an automated download.
* On import, it parses the JSON blob, validates its schema (resolving corrupted or out-of-date schemas missing parameters), checks Tiptap extensions for Base64 compatibilities, and forces a Zustand hydration, visually snapping the loaded project context instantly into the UI.
