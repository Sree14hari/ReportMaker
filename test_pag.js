const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><div></div>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

function paginateHtml(html, availableHeight, firstPageAvailableHeight) {
  const measureDiv = document.createElement('div');
  measureDiv.innerHTML = html;
  
  const pages = [];
  let currentPageHtml = '';
  let currentHeight = 0;
  let isFirstPage = true;

  const childrenArray = Array.from(measureDiv.children);
  for (let i = childrenArray.length - 1; i >= 0; i--) {
    const el = childrenArray[i];
    if (!el.textContent?.trim() && !el.querySelector('img') && !el.querySelector('table')) {
      measureDiv.removeChild(el);
    } else {
      break;
    }
  }

  const children = Array.from(measureDiv.children);

  for (const child of children) {
    const el = child;
    let nodeHeight = 50; // Mock height
    
    const targetHeight = isFirstPage ? firstPageAvailableHeight : availableHeight;

    if (currentHeight + nodeHeight > targetHeight && currentPageHtml !== '') {
      pages.push(currentPageHtml);
      currentPageHtml = el.outerHTML || (el.textContent || '');
      currentHeight = nodeHeight;
      isFirstPage = false;
    } else {
      currentPageHtml += el.outerHTML || (el.textContent || '');
      currentHeight += nodeHeight;
    }
  }

  if (currentPageHtml !== '') {
    pages.push(currentPageHtml);
  } else if (pages.length === 0) {
    pages.push('');
  }

  return pages;
}

const html = Array.from({length: 40}).map((_, i) => `<p>Paragraph ${i}</p>`).join('');
const chunks = paginateHtml(html, 850, 700);
console.log("Chunks count:", chunks.length);
chunks.forEach((c, i) => console.log(`Chunk ${i}: length ${c.length}`));
