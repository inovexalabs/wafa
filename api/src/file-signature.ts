// Multer's file.mimetype is whatever the client put in the multipart header,
// so it can't be trusted on its own: an HTML or SVG file labelled image/png
// would be stored and later served with a type the browser may render. These
// helpers check the file's leading bytes instead.

const ooxmlTypes = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const legacyOfficeTypes = new Set([
  'application/msword',
  'application/vnd.ms-excel',
]);

function startsWith(buffer: Buffer, bytes: number[], offset = 0) {
  return (
    buffer.length >= offset + bytes.length &&
    bytes.every((byte, index) => buffer[offset + index] === byte)
  );
}

function sniff(buffer: Buffer) {
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return 'image/png';
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && // RIFF
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8) // WEBP
  )
    return 'image/webp';
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) return 'zip'; // .docx / .xlsx
  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    return 'ole'; // .doc / .xls
  return null;
}

/**
 * The file's real type if its contents match one of `allowed`, otherwise null.
 * Use the returned value (not file.mimetype) as the stored content type.
 */
export function verifiedMimeType(
  file: Express.Multer.File,
  allowed: ReadonlySet<string>,
): string | null {
  const detected = file.buffer ? sniff(file.buffer) : null;
  // Office formats share a container with other file kinds, so the bytes
  // only confirm the family; the declared type picks the exact one.
  if (detected === 'zip')
    return ooxmlTypes.has(file.mimetype) && allowed.has(file.mimetype)
      ? file.mimetype
      : null;
  if (detected === 'ole')
    return legacyOfficeTypes.has(file.mimetype) && allowed.has(file.mimetype)
      ? file.mimetype
      : null;
  return detected && allowed.has(detected) ? detected : null;
}
