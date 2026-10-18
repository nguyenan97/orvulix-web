import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
import JSZip from 'jszip';
import {
  withPdfDocument,
  checkPdfActive,
  PdfConversionError
} from '../../../../features/pdf-conversion/document';
import { brand } from '../../../../brand/config'; // ORVULIX-BRAND

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** XML text context, not HTML sanitization: preserve every admitted character. */
function escapeXmlText(value: string): string {
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (
      (code < 0x20 && ![0x9, 0xa, 0xd].includes(code)) ||
      (code >= 0xd800 && code <= 0xdfff) ||
      code === 0xfffe ||
      code === 0xffff
    ) {
      throw new PdfConversionError(
        'The PDF title or text contains a character XML cannot represent.'
      );
    }
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTextToParagraphs(raw: string): string {
  return escapeXmlText(raw)
    .split(/\n{2,}|\r{2,}/g) // Split on double line breaks
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${p.replace(/\n/g, ' ')}</p>`)
    .join('\n');
}

export async function convertPdfToEpub(
  pdfFile: File,
  signal?: AbortSignal
): Promise<File> {
  return withPdfDocument(pdfFile, signal, async (pdfDoc, active) => {
    const numPages = pdfDoc.numPages;
    let textUnits = 0;

    // Extracting text
    const pages: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      checkPdfActive(active);
      const page = await pdfDoc.getPage(i);
      try {
        checkPdfActive(active);
        const textContent = await page.getTextContent();
        checkPdfActive(active);
        for (const item of textContent.items) {
          textUnits += 'str' in item ? item.str.length + 1 : 0;
          if (textUnits > 2 * 1024 * 1024)
            throw new PdfConversionError(
              'PDF text limit is 2 Mi UTF-16 units. Try fewer pages.'
            );
        }
        pages.push(
          textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join('\n')
        );
      } finally {
        page.cleanup();
      }
    }

    const zip = new JSZip();

    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    const metaInf = zip.folder('META-INF');
    metaInf!.file(
      'container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const oebps = zip.folder('OEBPS');
    const bookTitle = escapeXmlText(pdfFile.name.replace(/\.pdf$/i, ''));
    const bookId = Date.now().toString();

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${bookTitle}</dc:title>
    <dc:creator>Converted by ${escapeXmlText(brand.name)}</dc:creator>
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${pages
      .map(
        (_, index) =>
          `<item id="chapter${index + 1}" href="chapter${
            index + 1
          }.xhtml" media-type="application/xhtml+xml"/>`
      )
      .join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${pages
      .map((_, index) => `<itemref idref="chapter${index + 1}"/>`)
      .join('\n    ')}
  </spine>
</package>`;

    oebps!.file('content.opf', contentOpf);

    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${bookTitle}</text>
  </docTitle>
  <navMap>
    ${pages
      .map(
        (_, index) =>
          `<navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
        <navLabel>
          <text>Page ${index + 1}</text>
        </navLabel>
        <content src="chapter${index + 1}.xhtml"/>
      </navPoint>`
      )
      .join('\n    ')}
  </navMap>
</ncx>`;

    oebps!.file('toc.ncx', tocNcx);

    pages.forEach((pageText, index) => {
      const formattedBody = formatTextToParagraphs(pageText);

      const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Page ${index + 1}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <style>
    body {
      font-family: serif;
      line-height: 1.6;
      margin: 1em;
    }
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
  </style>
</head>
<body>
  <h1>Page ${index + 1}</h1>
  ${formattedBody}
</body>
</html>`;

      oebps!.file(`chapter${index + 1}.xhtml`, chapterXhtml);
    });

    checkPdfActive(active);
    const epubBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    checkPdfActive(active);
    if (epubBuffer.byteLength > 16 * 1024 * 1024)
      throw new PdfConversionError(
        'EPUB output limit is 16 MiB. Try fewer pages.'
      );

    return new File([epubBuffer], pdfFile.name.replace(/\.pdf$/i, '.epub'), {
      type: 'application/epub+zip'
    });
  });
}
