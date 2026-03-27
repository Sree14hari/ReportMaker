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

// Convert DOM Node to docx elements
async function parseHtmlToDocxElements(node: Node, chapterIndex: number | null): Promise<any[]> {
  const elements: any[] = [];
  
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      elements.push(new TextRun({ text: text + ' ', font: 'Times New Roman', size: 24 }));
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const alignStyle = el.style.textAlign;
    
    let alignment = AlignmentType.JUSTIFIED as any;
    if (alignStyle === 'center') alignment = AlignmentType.CENTER;
    else if (alignStyle === 'right') alignment = AlignmentType.RIGHT;
    else if (alignStyle === 'left') alignment = AlignmentType.LEFT;

    // Headings
    if (/^h[1-6]$/.test(tag)) {
        const textRuns = await parseInlineContent(el);
        elements.push(new Paragraph({
            children: textRuns,
            heading: tag === 'h1' ? HeadingLevel.HEADING_1 : tag === 'h2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 }
        }));
    }
    // Paragraph
    else if (tag === 'p') {
        const textRuns = await parseInlineContent(el);
        // Always push a paragraph (use empty text run if no children to avoid corrupt XML)
        elements.push(new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
            alignment,
            spacing: { before: 120, after: 240, line: 360 }
        }));
    }
    // Direct Image
    else if (tag === 'img') {
        const src = el.getAttribute('src');
        if (src) {
            try {
                const buffer = await fetchImageBuffer(src);
                const w = (el as HTMLImageElement).width || 400;
                const h = (el as HTMLImageElement).height || 300;
                const imgType = src.startsWith('data:image/png') || src.toLowerCase().includes('.png') ? 'png'
                              : src.startsWith('data:image/gif') || src.toLowerCase().includes('.gif') ? 'gif'
                              : src.startsWith('data:image/bmp') || src.toLowerCase().includes('.bmp') ? 'bmp'
                              : 'jpg';
                elements.push(new Paragraph({
                    children: [
                        new ImageRun({
                            data: buffer,
                            transformation: { width: w, height: h },
                            type: imgType
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                }));
            } catch(e) { console.error('Image fetch error:', e); }
        }
    }
    // Lists
    else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(el.children);
        for (const li of items) {
           const textRuns = await parseInlineContent(li as HTMLElement);
           elements.push(new Paragraph({
               children: textRuns,
               bullet: tag === 'ul' ? { level: 0 } : undefined,
               numbering: tag === 'ol' ? { reference: 'ol-num', level: 0 } : undefined,
               spacing: { after: 120 },
               alignment: AlignmentType.JUSTIFIED
           }));
        }
    }
    // Tables
    else if (tag === 'table') {
        const rows: TableRow[] = [];
        const trs = Array.from(el.querySelectorAll('tr'));
        for (const tr of trs) {
            const cells: TableCell[] = [];
            const tds = Array.from(tr.querySelectorAll('td, th'));
            for (const td of tds) {
                const textRuns = await parseInlineContent(td as HTMLElement);
                cells.push(new TableCell({
                    children: [new Paragraph({ children: textRuns, alignment: AlignmentType.CENTER })],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                }));
            }
            if (cells.length > 0) rows.push(new TableRow({ children: cells }));
        }
        if (rows.length > 0) {
            elements.push(new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE }
            }));
            elements.push(new Paragraph({ text: '' })); // Spacing below table
        }
    }
    // General traversal for unknown wrappers
    else {
      for (let i=0; i < el.childNodes.length; i++) {
        const childRes = await parseHtmlToDocxElements(el.childNodes[i], chapterIndex);
        elements.push(...childRes);
      }
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
                        const w = (childEl as HTMLImageElement).width || 400;
                        const h = (childEl as HTMLImageElement).height || 300;
                        const imgType = src.startsWith('data:image/png') || src.toLowerCase().includes('.png') ? 'png'
                                       : src.startsWith('data:image/gif') || src.toLowerCase().includes('.gif') ? 'gif'
                                       : src.startsWith('data:image/bmp') || src.toLowerCase().includes('.bmp') ? 'bmp'
                                       : 'jpg';
                        runs.push(new ImageRun({
                            data: buffer,
                            transformation: { width: w, height: h },
                            type: imgType
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
                    new TextRun({ text: `DEPARTMENT OF ${store.meta.departmentShort || 'ECE'}`, font: 'Times New Roman', size: 24 }),
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
