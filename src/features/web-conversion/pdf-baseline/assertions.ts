import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFStream,
  decodePDFRawStream
} from 'pdf-lib';

// Test helper only: inspect actual page content, not mocked jsPDF calls.
function content(pdf: PDFDocument, index: number) {
  const contents = pdf.getPage(index).node.Contents()!;
  const streams =
    contents instanceof PDFArray
      ? contents
          .asArray()
          .map((ref) => pdf.context.lookup(ref, PDFStream) as PDFRawStream)
      : [contents as PDFRawStream];
  return streams
    .map((stream) =>
      new TextDecoder().decode(decodePDFRawStream(stream).decode())
    )
    .join('\n');
}
export function placement(pdf: PDFDocument, index = 0) {
  const text = content(pdf, index);
  if (!text.includes(' Do'))
    throw Error('No drawn image in PDF content stream.');
  let matrix = [1, 0, 0, 1, 0, 0];
  const transforms = text
    .slice(0, text.indexOf(' Do'))
    .matchAll(
      /([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+cm/g
    );
  for (const match of transforms) {
    const [a, b, c, d, e, f] = matrix,
      [g, h, i, j, k, l] = match.slice(1).map(Number);
    matrix = [
      a * g + c * h,
      b * g + d * h,
      a * i + c * j,
      b * i + d * j,
      a * k + c * l + e,
      b * k + d * l + f
    ];
  }
  return [matrix[0], matrix[3], matrix[4], matrix[5]];
}
export function drawnImage(pdf: PDFDocument, index = 0) {
  const name = content(pdf, index).match(/\/([^\s/]+)\s+Do/)?.[1];
  if (!name) throw Error('No image draw operator.');
  return pdf
    .getPage(index)
    .node.Resources()!
    .lookup(PDFName.of('XObject'), PDFDict)
    .lookup(PDFName.of(name), PDFStream);
}
export function images(pdf: PDFDocument, index = 0) {
  const objects = pdf
    .getPage(index)
    .node.Resources()!
    .lookup(PDFName.of('XObject'), PDFDict);
  return objects.keys().map((key) => objects.lookup(key, PDFStream));
}
