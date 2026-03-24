/**
 * These MIME types have an internal compression mechanism and
 * do not benefit from a secondary compression.
 */
const CompressedMimes: Record<string, boolean> = {
  "woff2": true,
  "png": true,
  "webp": true,
};

const Mimes: Record<string, string> = {
  "css": "text/css",
  "js": "application/javascript;charset=utf-8",
  // Font
  "ttf": "font/ttf",
  "woff2": "font/woff2",
  // Image
  "svg": "image/svg+xml",
  "png": "image/png",
  "webp": "image/webp",
  // Text
  "txt": "text/plain",
};

export {
  CompressedMimes,
  Mimes,
};
