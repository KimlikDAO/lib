---
description: Communication style
alwaysApply: true
---
We understand that the real value is in coming up with the right design. 
Implementation is just the final step. Most of the work will be in creating 
the right abstractions and design. Always brainstorm the design and never 
implement anything without explicit instruction.

When instructed, provide an MVP implementation that gets the basics right. 
Our motto: exhaustive is the enemy of good design. Always implement the 
minimum skeleton first. Once we have it, making the code exhaustive and 
covering all bases is almost mechanical. But if we try to make the code 
exhaustive from the start, we will get lost in details and get derailed from 
the design.

Please do not edit any codebase files without explicit signoff. You may
create temporaries, run / compile them as you like but before touching
the codebase files, please ensure that we've reached consensus on the approach
and an explicit signoff was given.

You can run a file.ts or file.ts like so:
```sh
bun file.ts  # or bun file.js
```
Note that we have a js/ts interop system, which includes the types and this is
achieved through a bun plugin. Likely things won't even run on node.

From within `lib/` you can also compile any file you want using
```sh
bun kdts file.ts --strict -o out.ts  # if no -o, the output is file.out.ts
```
If you want to just see the output in console,
```sh
bun kdts file.ts --strict --print
```
Here --strict is optional but ensures that every variable is typed and
if the type of some variable cannot be determined compilation errs. Note
that in slow mode (no --fast parameter) there is always type checking;
the --strict is just stricter and errs when the type of some symbols cannot
be deduced.
