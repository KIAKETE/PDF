import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.10.121/legacy/build/pdf.worker.min.js`;

export async function findAnchorsInPdf(urlOrArrayBuffer, keyword) {
  const doc = await pdfjsLib.getDocument(urlOrArrayBuffer).promise;
  const numPages = doc.numPages;
  const keywordLC = keyword.toLowerCase();
  const matches = [];
  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      const str = String(item.str || '');
      if (!str) continue;
      if (str.toLowerCase().includes(keywordLC)) {
        const t = item.transform;
        const x = t[4];
        const y = t[5];
        const width = item.width || 50;
        const fontHeight = Math.abs(t[3]) || (item.height || 12);
        const topLeftY = viewport.height - y;
        const match = {
          pageIndex: p - 1,
          x: x,
          y: topLeftY,
          width: width,
          height: fontHeight
        };
        matches.push(match);
      }
    }
    page.cleanup?.();
  }
  await doc.destroy?.();
  return matches;
}