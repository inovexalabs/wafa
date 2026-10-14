import { verifiedMimeType } from './file-signature';

const images = new Set(['image/png', 'image/jpeg', 'image/webp']);
const documents = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
]);

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);
const PDF = Buffer.from('%PDF-1.7\n%...');
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);

function file(buffer: Buffer, mimetype: string, originalname = 'upload.bin') {
  return { buffer, mimetype, originalname, size: buffer.length } as Express.Multer.File;
}

describe('verifiedMimeType', () => {
  it('accepts real images and reports the detected type', () => {
    expect(verifiedMimeType(file(PNG, 'image/png'), images)).toBe('image/png');
    expect(verifiedMimeType(file(JPEG, 'image/jpeg'), images)).toBe('image/jpeg');
    expect(verifiedMimeType(file(WEBP, 'image/webp'), images)).toBe('image/webp');
  });

  it('uses the bytes, not the declared type, when they disagree', () => {
    // A real JPEG uploaded as "image/png" is stored as image/jpeg.
    expect(verifiedMimeType(file(JPEG, 'image/png'), images)).toBe('image/jpeg');
  });

  it.each([
    ['HTML labelled as PNG', Buffer.from('<html><script>alert(1)</script>'), 'image/png'],
    ['SVG labelled as PNG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), 'image/png'],
    ['SVG with its own type', Buffer.from('<?xml version="1.0"?><svg/>'), 'image/svg+xml'],
    ['JavaScript labelled as JPEG', Buffer.from('alert(document.cookie)'), 'image/jpeg'],
    ['an empty file', Buffer.alloc(0), 'image/png'],
    ['a truncated PNG header', PNG.subarray(0, 4), 'image/png'],
  ])('rejects %s', (_label, buffer, mimetype) => {
    expect(verifiedMimeType(file(buffer, mimetype), images)).toBeNull();
  });

  it('rejects a real file whose type is not on the allow-list', () => {
    expect(verifiedMimeType(file(PDF, 'application/pdf'), images)).toBeNull();
  });

  it('ignores a misleading file extension', () => {
    expect(verifiedMimeType(file(Buffer.from('<html>'), 'image/png', 'photo.png'), images)).toBeNull();
    expect(verifiedMimeType(file(PNG, 'image/png', 'evil.html'), images)).toBe('image/png');
  });

  it('only accepts zip / OLE containers for the matching Office types', () => {
    const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    expect(verifiedMimeType(file(ZIP, docx), documents)).toBe(docx);
    expect(verifiedMimeType(file(OLE, 'application/msword'), documents)).toBe('application/msword');
    // A zip (or any archive) can't pass itself off as an image or PDF.
    expect(verifiedMimeType(file(ZIP, 'image/png'), documents)).toBeNull();
    expect(verifiedMimeType(file(ZIP, 'application/pdf'), documents)).toBeNull();
    expect(verifiedMimeType(file(OLE, 'application/vnd.ms-excel'), documents)).toBeNull();
  });
});
