export async function paginateHtml(
  html: string,
  availableHeight: number,
  firstPageAvailableHeight: number
): Promise<string[]> {
  if (typeof window === 'undefined') return [html];

  const measureDiv = document.createElement('div');
  measureDiv.style.width = '585px'; // Content width: 794 - 113(left) - 96(right)
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.position = 'absolute';
  measureDiv.style.top = '-9999px';
  // Enforce precise typography for accurate measurement
  measureDiv.style.fontFamily = "'Times New Roman', Times, serif";
  measureDiv.style.fontSize = '16px';
  measureDiv.style.lineHeight = '1.5';
  measureDiv.className = 'report-content text-[12pt] leading-relaxed text-justify';
  measureDiv.innerHTML = html;

  document.body.appendChild(measureDiv);

  // Wait for all images inside measureDiv to load their dimensions
  const images = Array.from(measureDiv.querySelectorAll('img'));
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve; // resolve anyway so we don't hang
    });
  }));

  const pages: string[] = [];
  let currentPageHtml = '';
  let currentHeight = 0;
  let isFirstPage = true;

  const childrenArray = Array.from(measureDiv.children);
  
  // Strip trailing empty elements to prevent trailing blank pages
  let lastIndex = childrenArray.length - 1;
  while (lastIndex >= 0) {
    const el = childrenArray[lastIndex] as HTMLElement;
    const isImg = el.tagName.toLowerCase() === 'img' || el.querySelector('img');
    const isTable = el.tagName.toLowerCase() === 'table' || el.querySelector('table');
    if (!el.textContent?.trim() && !isImg && !isTable) {
      measureDiv.removeChild(el);
      lastIndex--;
    } else {
      break;
    }
  }

  // Only strip truly excessive consecutive empty paragraphs (>6 in a row are likely accidental)
  // We preserve intentional user line-breaks (Enter key presses)
  let consecutiveEmptyCount = 0;
  Array.from(measureDiv.children).forEach((el) => {
    const htmlEl = el as HTMLElement;
    const isImg = htmlEl.tagName.toLowerCase() === 'img' || htmlEl.querySelector('img');
    const isTable = htmlEl.tagName.toLowerCase() === 'table' || htmlEl.querySelector('table');
    if (!htmlEl.textContent?.trim() && !isImg && !isTable) {
      consecutiveEmptyCount++;
      if (consecutiveEmptyCount > 6) {
        measureDiv.removeChild(htmlEl);
      }
    } else {
      consecutiveEmptyCount = 0;
    }
  });

  const children = Array.from(measureDiv.children);

  let prevMb = 0;

  // Helper: measure a single HTML string by injecting into a temp div
  const measureHtml = (htmlStr: string): number => {
    const temp = document.createElement('div');
    temp.style.cssText = measureDiv.style.cssText;
    temp.className = measureDiv.className;
    temp.style.position = 'absolute';
    temp.style.top = '-9999px';
    temp.style.visibility = 'hidden';
    temp.innerHTML = htmlStr;
    document.body.appendChild(temp);
    const h = temp.offsetHeight;
    document.body.removeChild(temp);
    return h;
  };

  // Helper: try to split a paragraph-like element into two parts.
  // Tier 1 — sentence boundaries (after .  !  ?)  → clean, preferred split point.
  // Tier 2 — word boundaries (any whitespace)     → finer grain, minimises blank space.
  const trySplitParagraph = (el: HTMLElement, remainingPx: number): [string, string] | null => {
    const tag = el.tagName.toLowerCase();
    if (!['p', 'div', 'li'].includes(tag)) return null;
    if (el.querySelector('img, table')) return null;

    const fullHtml = el.innerHTML;
    const styleAttr = el.getAttribute('style') ? ` style="${el.getAttribute('style')}"` : '';

    // ── Tier 1: sentence-level split ────────────────────────────────────────
    // Regex rules:
    //  • (?<!\d)\.  — period NOT preceded by a digit  → avoids "1. ", "3.14 " etc.
    //  • (?=[A-Z"'(\d]) — next char must be capital/quote/digit (real sentence start)
    //  • [!?] always count as sentence endings regardless of context
    const sentenceRe = /(?:(?<!\d)\.(?=\s+[A-Z"'(\d])|[!?])\s+/;
    const sentenceBreaks = fullHtml.split(sentenceRe);
    if (sentenceBreaks.length > 1) {
      let bestSplit = -1;
      let accumulated = '';
      for (let i = 0; i < sentenceBreaks.length - 1; i++) {
        accumulated += (i === 0 ? '' : ' ') + sentenceBreaks[i];
        const h = measureHtml(`<${tag}${styleAttr}>${accumulated}</${tag}>`);
        if (h <= remainingPx) {
          bestSplit = i;
        } else {
          break;
        }
      }
      if (bestSplit >= 0) {
        const first = sentenceBreaks.slice(0, bestSplit + 1).join(' ');
        const rest  = sentenceBreaks.slice(bestSplit + 1).join(' ');
        return [
          `<${tag}${styleAttr}>${first}</${tag}>`,
          `<${tag}${styleAttr}>${rest}</${tag}>`,
        ];
      }
    }

    // ── Tier 2: word-level split ─────────────────────────────────────────────
    // Tokenise into: HTML tags | words | whitespace runs — never breaks mid-tag.
    const tokens = fullHtml.match(/(<[^>]+>|[^\s<]+|\s+)/g);
    if (!tokens || tokens.length <= 1) return null;

    let bestWordIdx = -1; // index of the last whitespace token that still fits
    let accumulated = '';

    for (let i = 0; i < tokens.length - 1; i++) {
      accumulated += tokens[i];
      // Only consider splitting at whitespace boundaries (not inside words/tags)
      if (/^\s+$/.test(tokens[i])) {
        const preview = accumulated.trimEnd();
        const h = measureHtml(`<${tag}${styleAttr}>${preview}</${tag}>`);
        if (h <= remainingPx) {
          bestWordIdx = i;
        } else {
          break; // once we overshoot, later words will only be bigger
        }
      }
    }

    if (bestWordIdx < 0) return null;

    // Everything up to (but not including) the split whitespace token
    const firstPart = tokens.slice(0, bestWordIdx).join('').trimEnd();
    // Everything after the split whitespace token
    const restPart  = tokens.slice(bestWordIdx + 1).join('').trimStart();

    if (!firstPart || !restPart) return null;

    return [
      `<${tag}${styleAttr}>${firstPart}</${tag}>`,
      `<${tag}${styleAttr}>${restPart}</${tag}>`,
    ];
  };

  // Helper: split a <ul> or <ol> at item boundaries so bullet points
  // aren't needlessly pushed to the next page as a whole block.
  const trySplitList = (el: HTMLElement, remainingPx: number): [string, string] | null => {
    const tag = el.tagName.toLowerCase();
    if (!['ul', 'ol'].includes(tag)) return null;

    const items = Array.from(el.children) as HTMLElement[];
    if (items.length <= 1) return null;

    const styleAttr = el.getAttribute('style') ? ` style="${el.getAttribute('style')}"` : '';
    const classAttr = el.getAttribute('class') ? ` class="${el.getAttribute('class')}"` : '';

    let bestSplit = -1; // last item index that still fits
    let accumulated = '';

    for (let i = 0; i < items.length - 1; i++) {
      accumulated += items[i].outerHTML;
      const h = measureHtml(`<${tag}${styleAttr}${classAttr}>${accumulated}</${tag}>`);
      if (h <= remainingPx) {
        bestSplit = i;
      } else {
        break;
      }
    }

    if (bestSplit < 0) return null;

    const firstItems = items.slice(0, bestSplit + 1).map(li => li.outerHTML).join('');
    const restItems  = items.slice(bestSplit + 1).map(li => li.outerHTML).join('');

    return [
      `<${tag}${styleAttr}${classAttr}>${firstItems}</${tag}>`,
      `<${tag}${styleAttr}${classAttr}>${restItems}</${tag}>`,
    ];
  };

  const isHeading = (el: HTMLElement) => /^h[1-6]$/i.test(el.tagName);
  const isTableCaptionLike = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();
    if (!['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return false;

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 80) return false;

    return /^(tab(le)?\s*\d+[.:\-]?)|^(table\s*(no\.?|number)?\s*\d+[.:\-]?)|^(figure\s*\d+[.:\-]?)/i.test(text);
  };

  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;

    let nodeHeight = 0;
    let mb = 0;
    let mt = 0;
    let effectiveMt = 0;
    if (el.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(el);
      mt = parseFloat(style.marginTop) || 0;
      mb = parseFloat(style.marginBottom) || 0;
      effectiveMt = Math.max(0, mt - prevMb);
      nodeHeight = el.offsetHeight + effectiveMt + mb;
    }

    const targetHeight = isFirstPage ? firstPageAvailableHeight : availableHeight;
    const remainingOnPage = targetHeight - currentHeight;

    // ── Keep-with-next: if current element is a heading that fits the current page,
    //    but the following element does NOT fit, move the heading to the next page too.
    if (
      currentPageHtml !== '' &&
      (isHeading(el) || isTableCaptionLike(el)) &&
      currentHeight + nodeHeight <= targetHeight   // heading fits on current page
    ) {
      const next = children[i + 1] as HTMLElement | undefined;
      if (next) {
        const nextStyle = window.getComputedStyle(next);
        const nextMt = parseFloat(nextStyle.marginTop) || 0;
        const nextMb = parseFloat(nextStyle.marginBottom) || 0;
        const nextEffectiveMt = Math.max(0, nextMt - mb);
        const nextNodeHeight = next.offsetHeight + nextEffectiveMt + nextMb;
        // If heading + next element together don't fit, push the heading to next page
        if (currentHeight + nodeHeight + nextNodeHeight > targetHeight && (isHeading(el) || (isTableCaptionLike(el) && next.tagName.toLowerCase() === 'table'))) {
          pages.push(currentPageHtml);
          currentPageHtml = el.outerHTML;
          currentHeight = el.offsetHeight + mt + mb;
          prevMb = mb;
          isFirstPage = false;
          continue;
        }
      }
    }

    if (currentHeight + nodeHeight > targetHeight && currentPageHtml !== '') {
      // Use effectiveMt (collapsed margin) so the splitter knows the real available space
      const splitBudget = remainingOnPage - effectiveMt - mb;
      const split = trySplitParagraph(el, splitBudget)
               ?? trySplitList(el, splitBudget);
      if (split) {
        const [firstPart, remainder] = split;
        currentPageHtml += firstPart;
        pages.push(currentPageHtml);
        currentPageHtml = remainder;
        currentHeight = measureHtml(remainder) + effectiveMt + mb;
        prevMb = mb;
        isFirstPage = false;
      } else {
        pages.push(currentPageHtml);
        currentPageHtml = el.outerHTML;
        currentHeight = el.offsetHeight + mt + mb;
        prevMb = mb;
        isFirstPage = false;
      }
    } else {
      currentPageHtml += el.outerHTML || (el.textContent || '');
      currentHeight += nodeHeight;
      prevMb = mb;
    }
  }

  if (currentPageHtml !== '') {
    pages.push(currentPageHtml);
  } else if (pages.length === 0) {
    pages.push('');
  }

  document.body.removeChild(measureDiv);
  return pages;
}
