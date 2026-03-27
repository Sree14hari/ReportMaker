import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  LevelFormat,
  NumberFormat,
  convertMillimetersToTwip,
  TabStopType,
  TabStopPosition,
} from 'docx';
import { saveAs } from 'file-saver';
import { ReportStore, ReportSection } from './reportTypes';
import { resolvePlaceholders } from '@/components/preview/sections/ChapterPreview';
import { buildTitlePageDocx, buildCertificateDocx, buildTableOfContentsDocx } from './manualDocxComponents';

export async function fetchImageBuffer(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:image')) {
     const b64 = url.split(',')[1];
     const binaryStr = atob(b64);
     const len = binaryStr.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
     }
     return bytes.buffer;
  }
  const response = await fetch(url);
  return response.arrayBuffer();
}

// ── Image helpers ──
// DOMParser does NOT render images, so el.width / el.height are always 0.
// Parse dimensions from the style attribute or HTML attributes instead.
function parseImageDimensions(el: HTMLElement): { w: number; h: number } {
    const styleW = el.style?.width  ? parseInt(el.style.width,  10) : 0;
    const styleH = el.style?.height ? parseInt(el.style.height, 10) : 0;
    const attrW  = parseInt(el.getAttribute('width')  || '0', 10) || 0;
    const attrH  = parseInt(el.getAttribute('height') || '0', 10) || 0;
    const domW   = (el as any).naturalWidth  || (el as any).width  || 0;
    const domH   = (el as any).naturalHeight || (el as any).height || 0;
    let w = styleW || attrW || domW || 400;
    let h = styleH || attrH || domH || 300;
    // Cap to A4 printable width in points (~600pt)
    if (w > 600) { h = Math.round(h * 600 / w); w = 600; }
    if (w < 1) w = 400;
    if (h < 1) h = 300;
    return { w, h };
}

function getImgType(src: string): 'png' | 'jpg' | 'gif' | 'bmp' {
    if (src.startsWith('data:image/png') || src.toLowerCase().includes('.png')) return 'png';
    if (src.startsWith('data:image/gif') || src.toLowerCase().includes('.gif')) return 'gif';
    if (src.startsWith('data:image/bmp') || src.toLowerCase().includes('.bmp')) return 'bmp';
    return 'jpg';
}

// ── Recursive list parser (handles nesting) ──
async function parseList(el: HTMLElement, isBullet: boolean, depth: number): Promise<any[]> {
    const elems: any[] = [];
    const lis = Array.from(el.children).filter(c => c.tagName.toLowerCase() === 'li');
    for (const li of lis) {
        const inlineNodes: ChildNode[] = [];
        const nestedLists: HTMLElement[] = [];
        for (let i = 0; i < li.childNodes.length; i++) {
            const child = li.childNodes[i];
            const t = child.nodeType === Node.ELEMENT_NODE ? (child as HTMLElement).tagName.toLowerCase() : '';
            if (t === 'ul' || t === 'ol') nestedLists.push(child as HTMLElement);
            else inlineNodes.push(child);
        }
        const tempEl = document.createElement('span');
        inlineNodes.forEach(n => tempEl.appendChild(n.cloneNode(true)));
        const runs = await parseInlineContent(tempEl);
        elems.push(new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
            bullet:    isBullet ? { level: Math.min(depth, 8) } : undefined,
            numbering: !isBullet ? { reference: 'ol-num', level: Math.min(depth, 8) } : undefined,
            indent: depth > 0 ? { left: 720 * depth } : undefined,
            spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED,
        }));
        for (const nested of nestedLists) {
            elems.push(...await parseList(nested, nested.tagName.toLowerCase() === 'ul', depth + 1));
        }
    }
    return elems;
}

const INLINE_TAGS_SET = new Set(['span','strong','em','b','i','u','s','strike','code','mark','a','small','label','sup','sub','br','img']);

// ── Main HTML → DOCX block-level parser ──
async function parseHtmlToDocxElements(node: Node, chapterIndex: number | null): Promise<any[]> {
  const elements: any[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    // Bare text at block level → wrap in a Paragraph
    const text = node.textContent?.trim();
    if (text) {
      elements.push(new Paragraph({
          children: [new TextRun({ text, font: 'Times New Roman', size: 24 })],
          spacing: { before: 120, after: 240, line: 360 }
      }));
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const alignStyle = el.style?.textAlign;

    let alignment: any = AlignmentType.JUSTIFIED;
    if (alignStyle === 'center') alignment = AlignmentType.CENTER;
    else if (alignStyle === 'right') alignment = AlignmentType.RIGHT;
    else if (alignStyle === 'left') alignment = AlignmentType.LEFT;

    // ── Headings ──
    if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        const textRuns = await parseInlineContent(el);
        elements.push(new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
            heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 }
        }));
    }
    // ── Paragraph ──
    else if (tag === 'p') {
        const textRuns = await parseInlineContent(el);
        elements.push(new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
            alignment,
            spacing: { before: 120, after: 240, line: 360 }
        }));
    }
    // ── Image (block) ──
    else if (tag === 'img') {
        const src = el.getAttribute('src');
        if (src) {
            try {
                const buffer = await fetchImageBuffer(src);
                const dims = parseImageDimensions(el);
                elements.push(new Paragraph({
                    children: [new ImageRun({ data: buffer, transformation: { width: dims.w, height: dims.h }, type: getImgType(src) })],
                    alignment: AlignmentType.CENTER,
                }));
            } catch(e) { console.error('Image fetch error:', e); }
        }
    }
    // ── Lists ──
    else if (tag === 'ul' || tag === 'ol') {
        elements.push(...await parseList(el, tag === 'ul', 0));
    }
    // ── Tables (with colspan / rowspan) ──
    else if (tag === 'table') {
        const rows: TableRow[] = [];
        const trs = Array.from(el.querySelectorAll(':scope > tr, :scope > tbody > tr, :scope > thead > tr, :scope > tfoot > tr'));
        for (const tr of trs as HTMLTableRowElement[]) {
            const cells: TableCell[] = [];
            const tds = Array.from(tr.querySelectorAll(':scope > td, :scope > th')) as HTMLTableCellElement[];
            for (const td of tds) {
                const colSpan = td.colSpan || 1;
                const rowSpan = td.rowSpan || 1;
                const hasBlock = Array.from(td.children).some(c => /^(p|div|h[1-6]|ul|ol|table|blockquote)$/.test(c.tagName.toLowerCase()));
                let cellChildren: any[];
                if (hasBlock) {
                    cellChildren = await parseHtmlToDocxElements(td, chapterIndex);
                    if (cellChildren.length === 0) cellChildren = [new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })] })];
                } else {
                    const runs = await parseInlineContent(td);
                    cellChildren = [new Paragraph({ children: runs.length > 0 ? runs : [new TextRun({ text: '', font: 'Times New Roman', size: 24 })], alignment: AlignmentType.CENTER })];
                }
                cells.push(new TableCell({
                    children: cellChildren,
                    columnSpan: colSpan > 1 ? colSpan : undefined,
                    rowSpan: rowSpan > 1 ? rowSpan : undefined,
                    margins: { top: 100, bottom: 100, left: 120, right: 120 }
                }));
            }
            if (cells.length > 0) rows.push(new TableRow({ children: cells }));
        }
        if (rows.length > 0) {
            elements.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            elements.push(new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })] }));
        }
    }
    // ── blockquote / figure → recurse ──
    else if (tag === 'blockquote' || tag === 'figure') {
        for (let i = 0; i < el.childNodes.length; i++) elements.push(...await parseHtmlToDocxElements(el.childNodes[i], chapterIndex));
    }
    // ── figcaption → centred paragraph ──
    else if (tag === 'figcaption') {
        const runs = await parseInlineContent(el);
        if (runs.length > 0) elements.push(new Paragraph({ children: runs, alignment: AlignmentType.CENTER, spacing: { before: 60, after: 180 } }));
    }
    // ── hr / br at block level ──
    else if (tag === 'hr' || tag === 'br') {
        elements.push(new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })] }));
    }
    // ── Inline tags found at block level → wrap in Paragraph ──
    else if (INLINE_TAGS_SET.has(tag)) {
        const runs = await parseInlineContent(el);
        if (runs.length > 0) elements.push(new Paragraph({ children: runs, alignment, spacing: { before: 120, after: 240, line: 360 } }));
    }
    // ── Generic container (div, section, article, …) ──
    // Buffer consecutive inline nodes; flush as Paragraph when a block element appears
    else {
        const pending: any[] = [];
        const flush = () => {
            if (pending.length > 0) {
                elements.push(new Paragraph({ children: [...pending], alignment, spacing: { before: 120, after: 240, line: 360 } }));
                pending.length = 0;
            }
        };
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
                const t = child.textContent?.trim();
                if (t) pending.push(new TextRun({ text: t, font: 'Times New Roman', size: 24 }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const ct = (child as HTMLElement).tagName.toLowerCase();
                if (INLINE_TAGS_SET.has(ct)) {
                    pending.push(...await parseInlineContent(child as HTMLElement));
                } else {
                    flush();
                    elements.push(...await parseHtmlToDocxElements(child, chapterIndex));
                }
            }
        }
        flush();
    }
  }
  return elements;
}

// Inline format parser
async function parseInlineContent(
    el: HTMLElement,
    format: { bold?: boolean; italics?: boolean; underline?: boolean; superScript?: boolean; subScript?: boolean } = {}
): Promise<any[]> {
    const runs: any[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text && text.trim() !== '') {
                runs.push(new TextRun({
                    text: text.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '),
                    font: 'Times New Roman',
                    size: format.superScript || format.subScript ? 18 : 24, // 9pt for super/sub, 12pt normal
                    bold: format.bold,
                    italics: format.italics,
                    underline: format.underline ? {} : undefined,
                    superScript: format.superScript,
                    subScript: format.subScript,
                }));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const childEl = node as HTMLElement;
            const tag = childEl.tagName.toLowerCase();

            if (tag === 'img') {
                const src = childEl.getAttribute('src');
                if (src) {
                    try {
                        const buffer = await fetchImageBuffer(src);
                        const dims = parseImageDimensions(childEl);
                        runs.push(new ImageRun({
                            data: buffer,
                            transformation: { width: dims.w, height: dims.h },
                            type: getImgType(src)
                        }));
                    } catch(e) { console.error('Image inline fetch error:', e); }
                }
            } else if (tag === 'br') {
                runs.push(new TextRun({ text: '', break: 1, font: 'Times New Roman', size: 24 }));
            } else {
                const childFormat = { ...format };
                if (tag === 'strong' || tag === 'b') childFormat.bold = true;
                if (tag === 'em' || tag === 'i') childFormat.italics = true;
                if (tag === 'u') childFormat.underline = true;
                if (tag === 'sup') childFormat.superScript = true;
                if (tag === 'sub') childFormat.subScript = true;

                const childRuns = await parseInlineContent(childEl, childFormat);
                runs.push(...childRuns);
            }
        }
    }
    return runs;
}

export async function generateProperDocx(store: ReportStore) {
    const parser = new DOMParser();
    const unNumberedDocs: any[] = [];
    const romanDocs: any[] = [];
    const chapterDocs: any[] = [];
    let currentChapterIndex = 0;

    for (let i = 0; i < store.sections.length; i++) {
        const section = store.sections[i];
        
        let sectionCategory: 'unnumbered' | 'roman' | 'arabic' = 'arabic';
        if (['title-page', 'certificate'].includes(section.type)) {
            sectionCategory = 'unnumbered';
        } else if (['acknowledgement', 'abstract', 'table-of-contents', 'list-of-figures', 'list-of-tables', 'declaration'].includes(section.type)) {
            sectionCategory = 'roman';
        } else {
            sectionCategory = 'arabic';
        }

        // Resolve dynamic placeholders exactly as ChapterPreview does
        const resolvedHtml = resolvePlaceholders(section.content, store.meta as any);
        const docHtml = parser.parseFromString(`<div>${resolvedHtml}</div>`, 'text/html');
        const root = docHtml.body.firstChild as HTMLElement;
        
        const isChapter = section.type === 'chapter';
        if (isChapter) currentChapterIndex++;

        let parsedElements: any[] = [];
        
        if (section.type === 'title-page') {
            parsedElements.push(...(await buildTitlePageDocx(store)));
        } else if (section.type === 'certificate') {
            parsedElements.push(...(await buildCertificateDocx(store, section, parseHtmlToDocxElements)));
        } else if (section.type === 'table-of-contents') {
            parsedElements.push(...(await buildTableOfContentsDocx(store)));
        } else {
            // Inject Section Title
            if (!['title-page', 'certificate', 'table-of-contents'].includes(section.type)) {
                if (isChapter) {
                    parsedElements.push(new Paragraph({
                        text: `CHAPTER ${currentChapterIndex}`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }));
                }
                parsedElements.push(new Paragraph({
                    text: section.title.toUpperCase(),
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }));
            }

            if (root) {
                const elements = await parseHtmlToDocxElements(root, isChapter ? currentChapterIndex : null);
                parsedElements.push(...elements);
            }
        }

        const targetArray = sectionCategory === 'unnumbered' ? unNumberedDocs : (sectionCategory === 'roman' ? romanDocs : chapterDocs);
        targetArray.push(...parsedElements);

        const nextSection = store.sections[i + 1];
        if (nextSection) {
            let nextCategory: 'unnumbered' | 'roman' | 'arabic' = 'arabic';
            if (['title-page', 'certificate'].includes(nextSection.type)) {
                nextCategory = 'unnumbered';
            } else if (['acknowledgement', 'abstract', 'table-of-contents', 'list-of-figures', 'list-of-tables', 'declaration'].includes(nextSection.type)) {
                nextCategory = 'roman';
            } else {
                nextCategory = 'arabic';
            }

            // Only add manual page break if staying in the same physical Section
            if (sectionCategory === nextCategory) {
                targetArray.push(new Paragraph({ children: [new PageBreak()] }));
            }
        }
    }

    const createHeader = () => new Header({
        children: [
            new Paragraph({
                children: [new TextRun({ text: store.meta.headerContent || store.meta.title || 'PROJECT TITLE', font: 'Times New Roman', size: 24 })],
                border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { after: 200 }
            })
        ]
    });

    const createSimpleFooter = () => new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 24 })
                ]
            })
        ]
    });

    const createFooter = () => new Footer({
        children: [
            new Paragraph({
                border: { top: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 100 },
                tabStops: [
                    { type: TabStopType.RIGHT, position: TabStopPosition.MAX }
                ],
                children: [
                    new TextRun({ text: store.meta.footerContent || `DEPARTMENT OF ${store.meta.departmentShort || 'ECE'}`, font: 'Times New Roman', size: 24 }),
                    new TextRun({ text: '\t', font: 'Times New Roman', size: 24 }),
                    new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 24 })
                ]
            })
        ]
    });

    const doc = new Document({
        styles: {
            default: {
                heading1: { run: { color: "000000", font: "Times New Roman", size: 32, bold: true }, paragraph: { spacing: { before: 240, after: 120 } } },
                heading2: { run: { color: "000000", font: "Times New Roman", size: 28, bold: true }, paragraph: { spacing: { before: 240, after: 120 } } },
                heading3: { run: { color: "000000", font: "Times New Roman", size: 24, bold: true }, paragraph: { spacing: { before: 240, after: 120 } } }
            }
        },
        numbering: {
            config: [{
                reference: "ol-num",
                levels: [{
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: '%1.',
                    alignment: AlignmentType.START,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }]
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertMillimetersToTwip(25.4),
                            right: convertMillimetersToTwip(25.4),
                            bottom: convertMillimetersToTwip(25.4),
                            left: convertMillimetersToTwip(30)
                        }
                    }
                },
                // No headers/footers on title/certificate pages
                children: unNumberedDocs.length > 0 ? unNumberedDocs : [new Paragraph({ children: [new TextRun('')] })]
            },
            {
                properties: {
                    page: {
                        pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
                        margin: {
                            top: convertMillimetersToTwip(25.4),
                            right: convertMillimetersToTwip(25.4),
                            bottom: convertMillimetersToTwip(25.4),
                            left: convertMillimetersToTwip(30)
                        }
                    }
                },
                footers: { default: createSimpleFooter() },
                children: romanDocs.length > 0 ? romanDocs : [new Paragraph({ children: [new TextRun('')] })]
            },
            {
                properties: {
                    page: {
                        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
                        margin: {
                            top: convertMillimetersToTwip(25.4),
                            right: convertMillimetersToTwip(25.4),
                            bottom: convertMillimetersToTwip(25.4),
                            left: convertMillimetersToTwip(30)
                        }
                    }
                },
                headers: { default: createHeader() },
                footers: { default: createFooter() },
                children: chapterDocs.length > 0 ? chapterDocs : [new Paragraph({ children: [new TextRun('')] })]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, store.meta.title ? `${store.meta.title.replace(/\s+/g, '_')}_Report.docx` : 'Report.docx');
}
