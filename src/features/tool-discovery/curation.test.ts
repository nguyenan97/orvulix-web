import { describe, expect, it } from 'vitest';
import { categoryExample, orderBrowseTools } from './curation';

const tool = (path: string) => ({ path, name: path });
describe('editorial discovery independent of upstream insertion', () => {
  it('keeps new and established tools discoverable, demoting only local HTML without mutation', () => {
    const source = Object.freeze([
      tool('pdf/html-to-pdf'),
      tool('pdf/new-upstream-tool'),
      tool('pdf/merge-pdf'),
      tool('pdf/split-pdf')
    ]);
    expect(orderBrowseTools(source).map((item) => item.path)).toEqual([
      'pdf/new-upstream-tool',
      'pdf/merge-pdf',
      'pdf/split-pdf',
      'pdf/html-to-pdf'
    ]);
    expect(source[0].path).toBe('pdf/html-to-pdf');
  });
  it('chooses the same stable CTA when registry order changes', () => {
    const source = ['pdf/html-to-pdf', 'pdf/merge-pdf', 'pdf/split-pdf'].map(
      tool
    );
    expect(categoryExample('pdf', source)).toEqual(
      categoryExample('pdf', source.toReversed())
    );
    expect(categoryExample('pdf', source).path).toBe('pdf/split-pdf');
  });
  it('never recommends a filtered-out tool and picks the next available stable option', () => {
    expect(
      categoryExample('pdf', [tool('pdf/html-to-pdf'), tool('pdf/merge-pdf')])
        .path
    ).toBe('pdf/merge-pdf');
    const unknown = [
      tool('pdf/z-new'),
      tool('pdf/html-to-pdf'),
      tool('pdf/a-new')
    ];
    expect(categoryExample('pdf', unknown).path).toBe('pdf/a-new');
    expect(categoryExample('pdf', unknown.toReversed())).toEqual(
      categoryExample('pdf', unknown)
    );
  });
  it('preserves local tools when they are the only available tools and handles empty categories', () => {
    const local = [tool('image-generic/html-to-image')];
    expect(orderBrowseTools(local)).toEqual(local);
    expect(categoryExample('image-generic', local).path).toBe(local[0].path);
    expect(categoryExample('pdf', [])).toEqual({ title: '', path: '' });
  });
});
