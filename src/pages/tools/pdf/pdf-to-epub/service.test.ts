import { XMLValidator } from 'fast-xml-parser';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ text: '' }));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({ items: [{ str: fixture.text }] })
      })
    })
  })
}));
import { convertPdfToEpub } from './service';

beforeEach(() => {
  fixture.text = 'A & B <b>literal</b> "quotes"';
});

describe('PDF to EPUB XML fidelity', () => {
  it('exports well-formed metadata and literal extracted text, not markup', async () => {
    const file = await convertPdfToEpub(
      new File(['synthetic'], 'R&D <draft>.pdf', { type: 'application/pdf' })
    );
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    expect(await zip.file('mimetype')!.async('string')).toBe(
      'application/epub+zip'
    );
    for (const name of ['OEBPS/content.opf', 'OEBPS/toc.ncx']) {
      const xml = await zip.file(name)!.async('string');
      expect(XMLValidator.validate(xml)).toBe(true);
      expect(xml).toContain('R&amp;D &lt;draft&gt;');
    }
    const chapter = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
    expect(XMLValidator.validate(chapter)).toBe(true);
    expect(chapter).toContain('A &amp; B &lt;b&gt;literal&lt;/b&gt; "quotes"');
    expect(chapter).not.toContain('<b>literal</b>');
    expect(file.type).toBe('application/epub+zip');
    expect(file.name).toBe('R&D <draft>.epub');
  });

  it.each(['\u0000', '\u000b', '\ud800'])(
    '%j is rejected instead of corrupting XML',
    async (invalid) => {
      fixture.text = `safe${invalid}text`;
      await expect(
        convertPdfToEpub(new File(['synthetic'], 'input.pdf'))
      ).rejects.toThrow(/XML/);
    }
  );

  it('preserves Unicode and literal links/scripts as text', async () => {
    fixture.text = 'Tiếng Việt 😀 <script>literal</script>';
    const file = await convertPdfToEpub(
      new File(['synthetic'], 'Nguyễn & An.pdf')
    );
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const chapter = await zip.file('OEBPS/chapter1.xhtml')!.async('string');
    expect(chapter).toContain(
      'Tiếng Việt 😀 &lt;script&gt;literal&lt;/script&gt;'
    );
    expect(chapter).not.toContain('<script>');
  });
});
