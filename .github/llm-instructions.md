We are working on kdjs, which is a highly optimizing javascript compiler and a type language that's somewhere 
in between TypeScript and Google Closure type language (from now on this will be called gcc or GCC, please don't confuse it with GCC the GNU compiler collection).

The goals
 - Take good parts of ts, try to look like ts, while still being highly optimization focused, probably more than gcc.
 - Provide file name and repo conventions that improve on ts and with optimization in mind.
 - es6 modules are at the core of the design, not an afterthought like in gcc.

For now, the js files will be written with jsdoc type annotated plain js. Later on we may support a specific subset of ts.
One exception is the d.ts files that we introduce. They are writte in (a subset of) ts, and serve like interface definitions that are
valid and hold externally.
The types and names defined in d.ts files are not renamed for optimization and minification -- so these files are an upgraded version
of gcc extern files.

The .d.ts files are translated to .d.js files internally, which is also a kdjs convention, but are basically extern files but @extern annotation
is not needed and imported as `import "type.d";`

In kdjs all js, jsx, ts, tsx files are imported without an extension. d.ts and d.js files are imported with "filename.d".
The resolution order is tsx, ts, jsx, js, which is consistent with bun. We provide a very small bun plugin which makes `bun run`
behave identically to kdjs.

In kdjs, if an import is found (resolved) it will be "linked" like gcc (unless you specifically tell not to link through command line arguments).
Unresolved imports are not an error but left as is in the compiled code. This is crucial for generating code that's supposed to run on
other platforms. Think CloudFlare Workers, node, bun etc. where the thing you import is not js code but platform apis.
For unresolved imports, either kdjs should have a built-in d.js definition, or you need to provide one manually.
Currently we have some basic ones for node and cloudflare workers. We add them as we need them.

Second important thing is that in kdjs you can compile an es6 module that only exports things but has no other side effect.
As you may know, in gcc, all code without side effects is eliminated.
Exporting is not considered a side effect. We fix this thereby allowing compilation of true es6 modules.

Currently our js files are passed to gcc with only small modifications to support the mentioned import / export enhancements and
we also have some additional optimization passes. Some of these optimizations we submitted to gcc codebase and due for removal from kdjs,
some of them are specific to kdjs and will stay in kdjs.

Our next efforts will be in desining a new type language that is ts aligned, can be translated to gcc type language accurately.
Once we have it, our entire codebase will be re-annotated in this type language.

Communication style
====================
We understand that the real value is coming up with the right design. 
Implementation is just the final step. Most of the work will be in coming up with the right abstractions and design.
Always brainstorm on the design and never implement anything without explicit instruction.
When instructed, provide an MVP implementation that gets the basics right.
Our motto: exhaustive is the enemy of good design.
Always implement the minimum skeleton first. Once we have it, making the code exhaustive, covering all bases is almost mechanical.
But if we try to make the code exhaustive from the start, we will get lost in details and get derailed from the design.

js coding style
=================
The operators === and !== are BANNED. We rely on typechecking and stay firmly away from memes.
`throw Error()` is banned. The message string should be thrown directly. Whether the function throws or returns already encodes this information and hence Error has no value add.
