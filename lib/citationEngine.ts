// lib/citationEngine.ts
// Automatic citation insertion engine

export interface CitationRef {
  index: number;       // [1], [2], etc.
  raw: string;         // original reference paragraph text
  keywords: string[];  // extracted keywords to match in chapter text
}

export interface CitationMatch {
  chapterId: string;
  chapterTitle: string;
  citationIndex: number;    // which reference [N]
  keyword: string;          // the keyword that matched
  contextSnippet: string;   // surrounding text for preview
}

export interface CitationResult {
  refs: CitationRef[];
  matches: CitationMatch[];
  updatedSections: { id: string; newContent: string }[];
}

// Words to ignore when building keyword list
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','been','be','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','that','this',
  'these','those','its','it','he','she','they','we','you','i','their','our',
  'your','his','her','him','us','them','which','who','what','how','when','where',
  'journal','proceedings','international','conference','vol','pp','no','doi',
  'retrieved','https','http','www','com','org','edu','et','al','author','year',
  'title','page','issue','volume','publisher','retrieved','url','link',
]);

/**
 * Parse the references HTML to extract individual references and their keywords.
 */
export function parseReferences(referencesHtml: string): CitationRef[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${referencesHtml}</div>`, 'text/html');
  const refs: CitationRef[] = [];

  // Get all block-level elements (p, li, h1-h4, div)
  const blocks = Array.from(
    doc.body.querySelectorAll('p, li, h1, h2, h3, h4')
  );

  let citIndex = 0;
  for (const block of blocks) {
    const text = block.textContent?.trim() || '';
    if (!text) continue;

    // Check if it looks like a numbered reference: [1] ... or 1. ...
    const hasNumber = /^\[?\d+\]?[\.\s]/.test(text) || /\[\d+\]/.test(text);
    if (!hasNumber && text.length < 20) continue;

    citIndex++;
    const keywords = extractKeywords(text);
    if (keywords.length === 0) continue;

    refs.push({
      index: citIndex,
      raw: text,
      keywords,
    });
  }

  // If no numbered references found, treat each paragraph as a reference
  if (refs.length === 0) {
    citIndex = 0;
    for (const block of blocks) {
      const text = block.textContent?.trim() || '';
      if (text.length < 15) continue;
      citIndex++;
      const keywords = extractKeywords(text);
      if (keywords.length < 1) continue;
      refs.push({ index: citIndex, raw: text, keywords });
    }
  }

  return refs;
}

/**
 * Extract meaningful, multi-char keywords from a reference string
 */
function extractKeywords(text: string): string[] {
  // Remove citation markers like [1], 1., etc.
  const cleaned = text
    .replace(/^\[?\d+\]?[\.\)\s]+/, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\d{4}/g, '') // remove years
    .replace(/[()[\]{}.,;:!?"""''']/g, ' ');

  const words = cleaned.split(/\s+/).map(w => w.toLowerCase().trim()).filter(Boolean);

  const keywords: string[] = [];
  for (const word of words) {
    if (
      word.length >= 4 &&
      !STOP_WORDS.has(word) &&
      /^[a-z]/.test(word)
    ) {
      keywords.push(word);
    }
  }

  // Return top-weighted unique keywords (longer words first = more specific)
  const unique = [...new Set(keywords)];
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, 8);
}

/**
 * For each reference, find the best-matching sentence/paragraph in each chapter
 * and insert [N] citation marker at end of that sentence.
 */
export function runCitationMatching(
  refs: CitationRef[],
  chapters: { id: string; title: string; content: string }[]
): CitationResult {
  const matches: CitationMatch[] = [];
  // Track which (chapterId, sentenceEnd offset) already has a citation to avoid duplicates
  const chapterUpdates: Map<string, string> = new Map();

  // Initialize updated content map
  for (const ch of chapters) {
    chapterUpdates.set(ch.id, ch.content);
  }

  for (const ref of refs) {
    for (const chapter of chapters) {
      let content = chapterUpdates.get(chapter.id)!;
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');

      // Find paragraphs and headings
      const paragraphs = Array.from(doc.body.querySelectorAll('p, li'));

      let bestMatch: { el: Element; score: number; keyword: string } | null = null;

      for (const para of paragraphs) {
        const paraText = para.textContent?.toLowerCase() || '';
        // Skip paras that already contain [N] for this ref
        if (paraText.includes(`[${ref.index}]`)) continue;
        // Skip paras that already have 3+ citations
        const existingCitations = (para.innerHTML.match(/\[\d+\]/g) || []).length;
        if (existingCitations >= 3) continue;

        let score = 0;
        let matchedKeyword = '';
        for (const kw of ref.keywords) {
          if (paraText.includes(kw)) {
            score += kw.length; // longer keywords = stronger match
            if (!matchedKeyword) matchedKeyword = kw;
          }
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { el: para, score, keyword: matchedKeyword };
        }
      }

      if (bestMatch) {
        // Insert [N] at end of best matching paragraph's innerHTML (before closing tag)
        const originalHtml = bestMatch.el.innerHTML;
        const citationTag = `<sup>[${ref.index}]</sup>`;

        // Avoid double-inserting
        if (!originalHtml.includes(`[${ref.index}]`)) {
          bestMatch.el.innerHTML = originalHtml + citationTag;

          // Serialize back
          const updatedHtml = doc.body.firstElementChild?.innerHTML || content;
          chapterUpdates.set(chapter.id, updatedHtml);

          const contextSnippet = (bestMatch.el.textContent || '').slice(0, 120);
          matches.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            citationIndex: ref.index,
            keyword: bestMatch.keyword,
            contextSnippet,
          });
        }
      }
    }
  }

  const updatedSections = Array.from(chapterUpdates.entries())
    .filter(([id, html]) => {
      const original = chapters.find(c => c.id === id)?.content || '';
      return html !== original;
    })
    .map(([id, newContent]) => ({ id, newContent }));

  return { refs, matches, updatedSections };
}
