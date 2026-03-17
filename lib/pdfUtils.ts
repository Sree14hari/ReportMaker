// lib/pdfUtils.ts

export async function downloadAsPDF(elementId: string, filename: string) {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;

  // Collect all stylesheets from the current page
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const styleBlocks = Array.from(document.querySelectorAll('style'))
    .map((el) => `<style>${el.innerHTML}</style>`)
    .join('\n');

  // Clone the report element and reset any CSS transform (scale)
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  ${styleLinks}
  ${styleBlocks}
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: white; }
    body > div {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .page-break-wrapper {
      page-break-after: always;
      break-after: page;
      width: 794px !important;
      min-height: 1123px !important;
      box-shadow: none !important;
      margin: 0 !important;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body { width: 794px; }
      .page-break-wrapper { page-break-after: always; break-after: page; }
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`);
  iframeDoc.close();

  // Wait for content (fonts/images) to load
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    // fallback if onload already fired
    setTimeout(resolve, 800);
  });

  // Set title so browser PDF dialog has correct filename
  if (iframe.contentWindow) {
    iframe.contentWindow.document.title = filename.endsWith('.pdf')
      ? filename.slice(0, -4)
      : filename;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  // Clean up after print dialog closes
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}


export async function downloadAsDOCX(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove absolute headers/footers which break MS Word rendering
  const absolutes = clone.querySelectorAll('.absolute');
  absolutes.forEach(el => el.parentNode?.removeChild(el));

  const htmlContent = clone.innerHTML;
  
  // Basic MS Word XML HTML wrapper
  const header = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <style>
    body { font-family: 'Times New Roman', Times, serif; }
    h1, h2, h3 { text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid black; padding: 5px; text-align: center;}
    p { margin-bottom: 1em; text-align: justify; }
    .page-break-wrapper { page-break-after: always; clear: both; }
  </style>
  <title>${filename}</title>
</head><body>
`;
  const footer = "</body></html>";
  
  const sourceHTML = header + htmlContent + footer;

  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = filename.endsWith('.doc') ? filename : filename + '.doc';
  fileDownload.click();
  document.body.removeChild(fileDownload);
}
