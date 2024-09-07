const removeStringNamedExports = (code) => {
  const exportRegex = /export\s*{\s*([^}]*?)\s*}/g;
  return code.replace(exportRegex, (match, exports) => {
    const exportItems = exports.split(',').map(item => {
      return item.trim().replace(/\s*as\s*"([^"]+)"/, " as $1");
    });
    return `export{${exportItems.join(",")}}`;
  });
}

export { removeStringNamedExports };
