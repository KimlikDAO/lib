# KimlikDAO js compiler

Primarily wraps Google Closure Compiler (GCC) and UglifyJS but adds additional functionality
to GCC such as ability to compile es6 modules.

```shell
bun kdjs/kdjs.js entry.js
```

`kdc` will automatically crawl all the imported files from the entry.js and include the externs files for libraries that it recognizes.
