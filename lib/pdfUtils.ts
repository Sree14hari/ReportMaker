// lib/pdfUtils.ts

export async function downloadAsPDF(elementId: string, filename: string) {
  // Update document title for the print modal to pick up the default PDF filename
  const originalTitle = document.title;
  
  // Strip .pdf suffix if it exists so the browser doesn't double it
  const titleForPrint = filename.endsWith('.pdf') ? filename.slice(0, -4) : filename;
  document.title = titleForPrint;

  // Let the browser paint any pending layout changes
  await new Promise(resolve => setTimeout(resolve, 300));

  window.print();

  // Restore the original title
  document.title = originalTitle;
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
