/**
 * These MIME types have an internal compression mechanism and
 * do not benefit from a secondary compression.
 *
 * @const {Object<string, boolean>}
 */
const CompressedMimes = {
  "woff2": true,
  "png": true,
  "webp": true,
};

/** @const {Object<string, string>} */
const Mimes = {
  "css": "text/css",
  "js": "application/javascript;charset=utf-8",
  // Font
  "ttf": "font/ttf",
  "woff2": "font/woff2",
  // Resim ve foto
  "svg": "image/svg+xml",
  "png": "image/png",
  "webp": "image/webp",
  // Metin
  "txt": "text/plain",
};

export {
  Mimes,
  CompressedMimes
};
