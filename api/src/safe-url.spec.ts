import { BadRequestException } from '@nestjs/common';
import { cleanOptionalHttpUrl } from './safe-url';

describe('cleanOptionalHttpUrl', () => {
  it('keeps http(s) links', () => {
    expect(cleanOptionalHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(cleanOptionalHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('treats a bare domain as https', () => {
    expect(cleanOptionalHttpUrl('  wafa.com.np/jobs ')).toBe('https://wafa.com.np/jobs');
  });

  it('turns empty input into null', () => {
    expect(cleanOptionalHttpUrl(undefined)).toBeNull();
    expect(cleanOptionalHttpUrl(null)).toBeNull();
    expect(cleanOptionalHttpUrl('   ')).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('rejects %s', (value) => {
    expect(() => cleanOptionalHttpUrl(value)).toThrow(BadRequestException);
  });

  it('rejects non-string input', () => {
    expect(() => cleanOptionalHttpUrl({ toString: () => 'https://x' })).toThrow(BadRequestException);
  });
});
