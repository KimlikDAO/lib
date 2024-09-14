
const StyleSheet = ({ src, shared, SharedCss, PageCss }) => {
  (shared ? SharedCss : PageCss).add(src);
  return;
}

export { StyleSheet };
