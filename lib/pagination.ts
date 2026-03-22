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

  // Strip excessive consecutive empty paragraphs (e.g. manual page breaks the user made before)
  let consecutiveEmptyCount = 0;
  Array.from(measureDiv.children).forEach((el) => {
    const htmlEl = el as HTMLElement;
    const isImg = htmlEl.tagName.toLowerCase() === 'img' || htmlEl.querySelector('img');
    const isTable = htmlEl.tagName.toLowerCase() === 'table' || htmlEl.querySelector('table');
    if (!htmlEl.textContent?.trim() && !isImg && !isTable) {
      consecutiveEmptyCount++;
      if (consecutiveEmptyCount > 2) {
        measureDiv.removeChild(htmlEl);
      }
    } else {
      consecutiveEmptyCount = 0;
    }
  });

  const children = Array.from(measureDiv.children);

  let prevMb = 0;

  for (const child of children) {
    const el = child as HTMLElement;
    
    let nodeHeight = 0;
    let mb = 0;
    let mt = 0;
    if (el.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(el);
      mt = parseFloat(style.marginTop) || 0;
      mb = parseFloat(style.marginBottom) || 0;
      
      const effectiveMt = Math.max(0, mt - prevMb);
      nodeHeight = el.offsetHeight + effectiveMt + mb;
    }

    const targetHeight = isFirstPage ? firstPageAvailableHeight : availableHeight;

    if (currentHeight + nodeHeight > targetHeight && currentPageHtml !== '') {
      pages.push(currentPageHtml);
      currentPageHtml = el.outerHTML;
      // Restart height calculation for the new page
      currentHeight = el.offsetHeight + mt + mb; // mt does not collapse at top of a new page block
      prevMb = mb;
      isFirstPage = false;
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
