const StyleSheet = ({ src, shared, SharedCss, PageCss }) => {
  (shared ? SharedCss : PageCss).add(src.startsWith("/") ? src : "/" + src);
  return;
}

export { StyleSheet };
