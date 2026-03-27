import { Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from 'docx';
import { ReportStore, ReportSection } from './reportTypes';
import { fetchImageBuffer } from './docxBuilder';

function getAbsoluteUrl(url: string) {
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return typeof window !== 'undefined' ? window.location.origin + url : url;
}

function cText(text: string, bold = false, size = 28) {
  return new TextRun({ text, bold, font: 'Times New Roman', size });
}

function cPara(textRuns: TextRun[], spacingBefore = 100, spacingAfter = 100) {
  return new Paragraph({
    children: textRuns,
    alignment: AlignmentType.CENTER,
    spacing: { before: spacingBefore, after: spacingAfter }
  });
}

export async function buildTitlePageDocx(store: ReportStore): Promise<any[]> {
  const meta = store.meta;
  const elements: any[] = [];
  
  elements.push(cPara([cText(meta.title || 'PROJECT TITLE', true, 32)], 400, 400));
  elements.push(cPara([cText(meta.subtitle || 'Mini Project Report', false, 24)], 200, 200));
  elements.push(cPara([cText('Submitted by', false, 24)], 200, 200));
  
  for (const s of meta.studentNames) {
      if (s.name) {
          const txt = `${s.name.toUpperCase()}${s.rollNo ? ` (${s.rollNo.toUpperCase()})` : ''}`;
          elements.push(cPara([cText(txt, true, 28)], 0, 100));
      }
  }

  elements.push(cPara([cText('To', false, 24)], 400, 200));

  try {
      const ktuBuffer = await fetchImageBuffer(getAbsoluteUrl('/ktulogo.png'));
      elements.push(new Paragraph({
          children: [new ImageRun({ data: ktuBuffer, transformation: { width: 100, height: 100 }, type: 'png' })],
          alignment: AlignmentType.CENTER,
      }));
  } catch(e) {}

  elements.push(cPara([cText(meta.universityName || 'The APJ Abdul Kalam Technological University', false, 28)], 100, 100));
  elements.push(cPara([cText('in partial fulfilment of the requirements for the award of the Degree Of', false, 24)], 100, 100));
  elements.push(cPara([cText(meta.degree || 'Bachelor of Technology', false, 24)], 100, 100));
  elements.push(cPara([cText('In', false, 24)], 100, 100));
  elements.push(cPara([cText(meta.branch || 'Electronics and Communication Engineering', true, 28)], 100, 400));
  
  try {
      const sbceUrl = meta.logoUrl || '/sbce_logo.png';
      const sbceBuffer = await fetchImageBuffer(getAbsoluteUrl(sbceUrl));
      elements.push(new Paragraph({
          children: [new ImageRun({ data: sbceBuffer, transformation: { width: 130, height: 130 }, type: 'png' })],
          alignment: AlignmentType.CENTER,
      }));
  } catch(e) {}

  elements.push(cPara([cText(meta.department ? `DEPARTMENT OF ${meta.department.toUpperCase()}` : 'DEPARTMENT', true, 26)], 200, 100));
  elements.push(cPara([cText(meta.collegeName || 'COLLEGE NAME', true, 28)], 100, 100));
  elements.push(cPara([cText(`${(meta.month || 'MONTH').toUpperCase()} ${meta.year || new Date().getFullYear()}`, true, 28)], 100, 100));
  
  return elements;
}

export async function buildCertificateDocx(store: ReportStore, section: ReportSection, rawParser: Function): Promise<any[]> {
  const meta = store.meta;
  const elements: any[] = [];
  
  elements.push(cPara([cText(meta.collegeName || 'COLLEGE NAME', true, 28)], 200, 100));
  elements.push(cPara([cText(meta.department ? `DEPARTMENT OF ${meta.department.toUpperCase()}` : 'DEPARTMENT', true, 24)], 100, 400));

  try {
      const sbceUrl = meta.logoUrl || '/sbce_logo.png';
      const sbceBuffer = await fetchImageBuffer(getAbsoluteUrl(sbceUrl));
      elements.push(new Paragraph({
          children: [new ImageRun({ data: sbceBuffer, transformation: { width: 130, height: 130 }, type: 'png' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
      }));
  } catch(e) {}

  elements.push(new Paragraph({
      text: 'CERTIFICATE',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
  }));

  // Helper method: string interpolate meta
  const simpleFields: any = {
    title: meta.title, subtitle: meta.subtitle, universityName: meta.universityName, 
    degree: meta.degree, branch: meta.branch, collegeName: meta.collegeName, 
    department: meta.department, guideName: meta.guideName, hodName: meta.hodName
  };
  let result = section.content || '';
  for (const key of Object.keys(simpleFields)) result = result.replace(new RegExp(`{{${key}}}`, 'g'), simpleFields[key] || '');
  
  // specially resolve students
  const studentsArr = meta.studentNames.filter(s => s.name);
  let studentsString = studentsArr.map((s, i) => {
      let txt = s.name.toUpperCase();
      if (s.rollNo) txt += ` (${s.rollNo.toUpperCase()})`;
      if (i < studentsArr.length - 2) txt += ', ';
      else if (i === studentsArr.length - 2) txt += ' and ';
      return txt;
  }).join('') || 'STUDENT NAME';
  result = result.replace(/{{studentNames}}/g, studentsString);

  const domParser = new DOMParser();
  const root = domParser.parseFromString(`<div>${result}</div>`, 'text/html').body.firstChild as HTMLElement;
  
  // Re-use docxBuilder parser for the rich text inside section.content:
  const contentDocs = await rawParser(root, null);
  elements.push(...contentDocs);
  
  elements.push(new Paragraph({ text: '', spacing: { before: 800 } }));

  // Signatures
  elements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: { style: BorderStyle.NONE, size: 0, color: "auto" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
      },
      rows: [
          new TableRow({
              children: [
                  new TableCell({
                      children: [
                          new Paragraph({ children: [cText(meta.guideName || 'Guide Name', true, 24)], alignment: AlignmentType.LEFT }),
                          new Paragraph({ children: [cText(meta.guideDesignation || 'Guide', false, 24)], alignment: AlignmentType.LEFT }),
                          new Paragraph({ children: [cText(`Dept. of ${meta.departmentShort || 'ECE'}`, false, 24)], alignment: AlignmentType.LEFT })
                      ]
                  }),
                  new TableCell({
                      children: [
                          new Paragraph({ children: [cText(meta.hodName || 'HOD Name', true, 24)], alignment: AlignmentType.RIGHT }),
                          new Paragraph({ children: [cText(meta.hodDesignation || 'HOD', false, 24)], alignment: AlignmentType.RIGHT }),
                          new Paragraph({ children: [cText(`Dept. of ${meta.departmentShort || 'ECE'}`, false, 24)], alignment: AlignmentType.RIGHT })
                      ]
                  })
              ]
          })
      ]
  }));

  return elements;
}

export async function buildTableOfContentsDocx(store: ReportStore): Promise<any[]> {
    const { paginateHtml } = await import('./pagination');
    const { resolvePlaceholders } = await import('@/components/preview/sections/ChapterPreview');
    const { TabStopType, TabStopPosition } = await import('docx');

    const elements: any[] = [];
    elements.push(new Paragraph({
        text: 'TABLE OF CONTENTS',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 }
    }));

    // Header row
    elements.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
            cText('Contents', true, 26),
            new TextRun({ text: '\t', font: 'Times New Roman', size: 26 }),
            cText('Page No.', true, 26),
        ],
        spacing: { after: 240 }
    }));

    // ── Calculate page numbers (same logic as TableOfContentsPreview) ──
    const NO_NUMBER_TYPES = new Set(['title-page', 'certificate', 'declaration', 'table-of-contents']);
    const PRE_CHAPTER_TYPES = new Set([
        'title-page', 'certificate', 'declaration', 'acknowledgement',
        'abstract', 'table-of-contents', 'list-of-figures', 'list-of-tables'
    ]);
    const toRoman = (n: number) => {
        const r = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii"];
        return r[n] || n.toString();
    };
    const pageMap = new Map<string, string>();
    let arabicCounter = 1;
    let romanCounter = 1;

    for (const section of store.sections) {
        const isPreChapter = PRE_CHAPTER_TYPES.has(section.type);
        const showArabic = !isPreChapter;
        const showRoman  = isPreChapter && !NO_NUMBER_TYPES.has(section.type);

        if (showArabic) pageMap.set(section.id, arabicCounter.toString());
        else if (showRoman) pageMap.set(section.id, toRoman(romanCounter));
        else pageMap.set(section.id, '');

        const isPaginatable = !['title-page', 'certificate', 'table-of-contents'].includes(section.type);
        let chunks = 1;
        if (isPaginatable && section.content && typeof window !== 'undefined') {
            try {
                const resolved = resolvePlaceholders(section.content, store.meta as any);
                const computedChunks = await paginateHtml(resolved, 870, section.type === 'chapter' ? 740 : 870);
                chunks = computedChunks.length;
            } catch(e) {}
        }
        if (showArabic) arabicCounter += chunks;
        else if (showRoman) romanCounter += chunks;
    }

    // ── Build TOC rows ──
    const domParser = new DOMParser();
    let chapterNum = 0;
    const tocSections = store.sections.filter(s => !NO_NUMBER_TYPES.has(s.type));

    for (const sec of tocSections) {
        const isChapter = sec.type === 'chapter';
        if (isChapter) chapterNum++;

        const prefix = isChapter ? `CHAPTER ${chapterNum}  ` : '';
        const label = `${prefix}${sec.title.toUpperCase()}`;
        const pageNo = pageMap.get(sec.id) ?? '';

        elements.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
                cText(label, isChapter, 24),
                new TextRun({ text: '\t', font: 'Times New Roman', size: 24 }),
                cText(pageNo, false, 24),
            ],
            spacing: { before: isChapter ? 240 : 120, after: 120 }
        }));

        if (isChapter && sec.content) {
            const doc = domParser.parseFromString(sec.content, 'text/html');
            const h2s = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim() || '').filter(Boolean);
            h2s.forEach((subTitle, idx) => {
                let subText = /^\d+\.\d+/.test(subTitle) ? subTitle : `${chapterNum}.${idx + 1}  ${subTitle}`;
                elements.push(new Paragraph({
                    indent: { left: 720 },
                    children: [
                        cText(subText, false, 22),
                    ],
                    spacing: { before: 60, after: 60 }
                }));
            });
        }
    }
    return elements;
}


