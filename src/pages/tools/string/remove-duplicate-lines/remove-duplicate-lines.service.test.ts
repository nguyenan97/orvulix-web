import { describe, expect, it } from 'vitest';
import removeDuplicateLines, { DuplicateRemoverOptions } from './service';

describe('removeDuplicateLines function', () => {
  // Test for 'all' duplicate removal mode
  describe('mode: all', () => {
    it('should remove all duplicates keeping first occurrence', () => {
      const input = 'line1\nline2\nline1\nline3\nline2';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should handle case-sensitive duplicates correctly', () => {
      const input = 'Line1\nline1\nLine2\nline2';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('Line1\nline1\nLine2\nline2');
    });
  });

  // Test for 'consecutive' duplicate removal mode
  describe('mode: consecutive', () => {
    it('should remove only consecutive duplicates', () => {
      const input = 'line1\nline1\nline2\nline3\nline3\nline1';
      const options: DuplicateRemoverOptions = {
        mode: 'consecutive',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3\nline1');
    });
  });

  // Test for 'unique' duplicate removal mode
  describe('mode: unique', () => {
    it('should keep only lines that appear exactly once', () => {
      const input = 'line1\nline2\nline1\nline3\nline4\nline4';
      const options: DuplicateRemoverOptions = {
        mode: 'unique',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line2\nline3');
    });
  });

  // Test for newlines handling
  describe('newlines option', () => {
    it('should filter newlines when newlines is set to filter', () => {
      const input = 'line1\n\nline2\n\n\nline3';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\n\nline2\nline3');
    });

    it('should delete newlines when newlines is set to delete', () => {
      const input = 'line1\n\nline2\n\n\nline3';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'delete',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should preserve newlines when newlines is set to preserve', () => {
      const input = 'line1\n\nline2\n\nline2\nline3';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'preserve',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\n\nline2\n\nline3');
    });
  });

  // Literal expectations cover the interactions, not a second implementation.
  const input = ' b \na\n\nb\n  \na\nc\nc\n';
  const combinations: {
    mode: DuplicateRemoverOptions['mode'];
    newlines: DuplicateRemoverOptions['newlines'];
    trimTextLines: boolean;
    output: string;
    sorted: string;
  }[] = [
    {
      mode: 'all',
      newlines: 'preserve',
      trimTextLines: false,
      output: ' b \na\n\nb\n  \nc\n',
      sorted: '\n\n  \n b \na\nb\nc'
    },
    {
      mode: 'all',
      newlines: 'filter',
      trimTextLines: false,
      output: ' b \na\n\nb\n  \nc',
      sorted: '\n  \n b \na\nb\nc'
    },
    {
      mode: 'all',
      newlines: 'delete',
      trimTextLines: false,
      output: ' b \na\nb\nc',
      sorted: ' b \na\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'preserve',
      trimTextLines: false,
      output: ' b \na\n\nb\n  \na\nc\n',
      sorted: '\n\n  \n b \na\na\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'filter',
      trimTextLines: false,
      output: ' b \na\n\nb\n  \na\nc\n',
      sorted: '\n\n  \n b \na\na\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'delete',
      trimTextLines: false,
      output: ' b \na\nb\na\nc',
      sorted: ' b \na\na\nb\nc'
    },
    {
      mode: 'unique',
      newlines: 'preserve',
      trimTextLines: false,
      output: ' b \n\nb\n  \n',
      sorted: '\n\n  \n b \nb'
    },
    {
      mode: 'unique',
      newlines: 'filter',
      trimTextLines: false,
      output: ' b \nb\n  ',
      sorted: '  \n b \nb'
    },
    {
      mode: 'unique',
      newlines: 'delete',
      trimTextLines: false,
      output: ' b \nb',
      sorted: ' b \nb'
    },
    {
      mode: 'all',
      newlines: 'preserve',
      trimTextLines: true,
      output: 'b\na\n\n\nc\n',
      sorted: '\n\n\na\nb\nc'
    },
    {
      mode: 'all',
      newlines: 'filter',
      trimTextLines: true,
      output: 'b\na\n\nc',
      sorted: '\na\nb\nc'
    },
    {
      mode: 'all',
      newlines: 'delete',
      trimTextLines: true,
      output: 'b\na\nc',
      sorted: 'a\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'preserve',
      trimTextLines: true,
      output: 'b\na\n\nb\n\na\nc\n',
      sorted: '\n\n\na\na\nb\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'filter',
      trimTextLines: true,
      output: 'b\na\n\nb\n\na\nc\n',
      sorted: '\n\n\na\na\nb\nb\nc'
    },
    {
      mode: 'consecutive',
      newlines: 'delete',
      trimTextLines: true,
      output: 'b\na\nb\na\nc',
      sorted: 'a\na\nb\nb\nc'
    },
    {
      mode: 'unique',
      newlines: 'preserve',
      trimTextLines: true,
      output: '\n\n',
      sorted: '\n\n'
    },
    {
      mode: 'unique',
      newlines: 'filter',
      trimTextLines: true,
      output: '',
      sorted: ''
    },
    {
      mode: 'unique',
      newlines: 'delete',
      trimTextLines: true,
      output: '',
      sorted: ''
    }
  ];

  describe.each(combinations)(
    '$mode / $newlines / trim=$trimTextLines',
    ({ output, sorted, ...options }) => {
      it.each([false, true])(
        'returns the exact output with sort=%s',
        (sortLines) => {
          expect(removeDuplicateLines(input, { ...options, sortLines })).toBe(
            sortLines ? sorted : output
          );
        }
      );
    }
  );

  it.each(['\n', '\r\n', '\r'])(
    'handles %j line separators without retaining CR characters',
    (separator) => {
      expect(
        removeDuplicateLines(
          ['Tiếng Việt 😀', '', 'Tiếng Việt 😀', 'Khác', ''].join(separator),
          {
            mode: 'all',
            newlines: 'preserve',
            trimTextLines: false,
            sortLines: false
          }
        )
      ).toBe('Tiếng Việt 😀\n\nKhác\n');
    }
  );

  it.each(['all', 'consecutive', 'unique'] as const)(
    'preserves every blank line with mode=%s',
    (mode) => {
      expect(
        removeDuplicateLines('\n \n\t\n', {
          mode,
          newlines: 'preserve',
          trimTextLines: false,
          sortLines: false
        })
      ).toBe('\n \n\t\n');
    }
  );

  it('lets preserved blank lines interrupt consecutive runs', () => {
    const options = {
      mode: 'consecutive',
      newlines: 'preserve',
      trimTextLines: true,
      sortLines: false
    } as const;
    expect(removeDuplicateLines('a\n \na\na', options)).toBe('a\n\na');
    expect(
      removeDuplicateLines('a\n \na\na', { ...options, newlines: 'delete' })
    ).toBe('a');
  });

  it('keeps comparison case-sensitive and leaves options and later calls independent', () => {
    const options = Object.freeze({
      mode: 'all',
      newlines: 'preserve',
      trimTextLines: true,
      sortLines: false
    } as const);
    expect(removeDuplicateLines(' A \na\nA\n😀\n😀', options)).toBe('A\na\n😀');
    expect(removeDuplicateLines('A\nA', options)).toBe('A');
  });

  // Test for sorting
  describe('sortLines option', () => {
    it('should sort lines when sortLines is true', () => {
      const input = 'line3\nline1\nline2';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: true,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3');
    });
  });

  // Test for trimming
  describe('trimTextLines option', () => {
    it('should trim lines when trimTextLines is true', () => {
      const input = '  line1  \n  line2  \nline3';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: true
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should consider trimmed lines as duplicates', () => {
      const input = '  line1  \nline1\n  line2\nline2  ';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: true
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2');
    });
  });

  // Combined scenarios
  describe('combined options', () => {
    it('should handle all options together correctly', () => {
      const input = '  line3  \nline1\n\nline3\nline2\nline1';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'delete',
        sortLines: true,
        trimTextLines: true
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('line1\nline2\nline3');
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty input', () => {
      const input = '';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('');
    });

    it('should handle input with only newlines', () => {
      const input = '\n\n\n';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('');
    });

    it('should handle input with only whitespace', () => {
      const input = '   \n  \n    ';
      const options: DuplicateRemoverOptions = {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: true
      };
      const result = removeDuplicateLines(input, options);
      expect(result).toBe('');
    });
  });
});
