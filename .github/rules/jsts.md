---
description: Ts and Js rules
alwaysApply: true
---
1) The operators === and !== are banned. We rely on typechecking and stay 
firmly away from memes such as == being bad.

2) `throw Error()` is banned. The message string should be thrown directly. 
Whether the function throws or returns already encodes this information and 
hence Error has no value add. If we ever need detailed error logging, for
example when doing parsing and need to output the file name + location, we'll
use a carefully designed error reporting function. We just don't allow casual
new Error() in the codebase.

3) We prefer `const f = () => {}` style function everywhere we don't need the 
`this`. This fits our style better, eliminates the unnecessary this, and
compresses better.

4) No exporting from a module except at the very bottom. `export const ` is not 
allowed. `export class` is not allowed. Every export must happen all the way to 
the bottom of the file.
The reason for this is that just like we can see what names a module imports at
the top, we would like to see what a module exports at a single location,
without scanning the entire file.