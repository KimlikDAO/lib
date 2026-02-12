const removeStringNamedExports = (code) => {
  const exportRegex = /export\s*{\s*([^}]*?)\s*}/g;
  return code.replace(exportRegex, (match, exports) => {
    const exportItems = exports.split(',').map(item => {
      return item.trim().replace(/\s*as\s*"([^"]+)"/, " as $1");
    });
    return `export{${exportItems.join(",")}}`;
  });
}

const removeDanglingObjectAssignments = (code) => code.replaceAll("Object.assign(()=>null,{})", "0");

const tweakPasses = (code) => removeStringNamedExports(removeDanglingObjectAssignments(code));

/** @define {string} */
const DEEP_INFRA_TOKEN = "";

const deepInfraPass = (fileName, code) => {
  const input = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a compiler pass of an advanced JavaScript to JavaScript compiler.
You will be given a single es6 module file which is type annotated using
the Google Closure Compiler's type annotation syntax. Your task is to make
smart simplifications on a macroscoping scale to make the final code
more efficient and compact.

Don't worry about minification or variable renamings; those tedious tasks
will be handled later with simpler tools. Your task is to come up with some
statements about the code and prove them correct and make simplification
based on these facts.

For instance, you may figure out that a variable will never be used and
remove it. Or may prove that some properties of an object is never read,
and remove them.

Or you may prove that some function is pure and constant-propogate through
the function (if the parameters are known at compile time, the function
call can be replaced with the result of the function). Since you are given
a single module only, you may not always figure out that a function is pure.
However if the function name looks like it could be pure, (such as add(a, b),
.toString(16) etc.) go ahead and assume it's pure. However, if it's a difficult
function to evaluate and you cannot calculate the result accurately, please
do not make up the evaluation result and avoid the constant replacement.

Your output will go through a small modification and then will be fed into
Google Closure Compiler. (The modification is so that Google Closure Compiler
can work with es6 module exports without any issues.)

The Google Closure Compiler is run in ADVANCED mode with strict type checks
enabled. You are guaranteed that the code you are given is correctly type
annotated and if you made no changes, would compile cleanly. Please ensure
the code you output is valid JavaScript with valid Google Closure Compiler
annotations.

When making simplifications, you may safely make use of the type information.
You are guaranteed that the functions will only be fed with values of the
annotated types. Let's go over an example:

Given this:
\`\`\` javascript
  /**
   * @param {bigint} x
   * @param {bigint} y
   * @param {bigint} z
   * @return {boolean}
   */
  export const f = (x, y, z) => x * x * x + y * y * y == z * z * z;
\`\`\`

A great great output is the following:
\`\`\` javascript
  /**
   * @param {bigint} x
   * @param {bigint} y
   * @param {bigint} z
   * @return {boolean}
   */
  export const f = (x, y, z) => x + y == 0n && z == 0n;
\`\`\`
Let's go over what happened here. Firstly, for bigint inputs, x^3 + y^3 == z^3
has no non-trivial solution by Fermat's Last Theorem. The trivial solutions are
when x == -y and z == 0n. If x,y,z were not bigints this transformation would 
have been invalid. We curcially used the input type guarantees. You can and
should do transformations based on the provided type guarantees. Secondly, the
output kept the type annotations, since the output will be fed into Google
Closure Compiler. Thirdly, we used a very advanced knowledge and reasoning,
which traditional compilers cannot do. I want you to strive to make discoveries
and simplifications of this level.

Here is another example:

\`\`\` javascript
import { LangCode } from "./lib/util/i18n";

/** @const {!Object<LangCode, string>} */
const Routes = {
  [LangCode.TR]: "al",
  [LangCode.EN]: "mint",
  [LangCode.KZ]: "al",
};
/**
 * @param {LangCode} lang
 */
const f = (lang) => {
  if (lang === LangCode.TR) {
    console.log(Routes[lang]);
  }
}

export { f };
\`\`\`

This can be simplified to:

\`\`\` javascript
import { LangCode } from "./lib/util/i18n";
/**
 * @param {LangCode} lang
 */
export const f = (lang) => {
  if (lang === LangCode.TR)
    console.log("al");
}
\`\`\`
This is because when lang == LangCode.TR, then the input to the console.log is
fixed, which we can inline. Once we do that, Routes object is not being used
and is private to the current module, so we can safely remove it.

Since you are supposed to produce code annotated with the Google Closure Compiler
annotations, let's go over some basics:

The following types are nonnullable:
number, bigint, boolean, string, function, and typedefs

For other types, if you want to disallow null, you explicitly need to type !
before the type. Example:

\`\`\`javascript
/** @const {bigint[]} */
const x = [1n, 2n, 3n];

/**
 * @typedef {{
 *  n: string
 *  a: number
 * }}
 */
const NameAge = {};

/** @const {!Array<NameAge>} */
const x = [{n: "Alice", a: 30}, {n: "Bob", a: 25}];
\`\`\`

Follwoing the GFMD header (which will include the file name as well), you will be
given the es6 module code. Your output should be the final code only and nothing
else. Your output will be directly fed into Google Closure Compiler (after a
small export modification).

Do not write any explanation. Only output the code please.

\`\`\` javascript ${fileName}
` + code + "\n<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n";
  return fetch("https://api.deepinfra.com/v1/inference/meta-llama/Meta-Llama-3.1-405B-Instruct", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEP_INFRA_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input
    })
  }).then((res) => res.json())
    .then((res) => {
      const text = res["results"][0]["generated_text"];
      const idx = text.indexOf("```");
      const jid = text.indexOf("javascript");
      let rid = text.lastIndexOf("```");
      if (rid == -1) rid = text.length;
      return (idx != -1 && jid != -1 && idx < jid) ? text.slice(jid + 10, rid) : text;
    });
}

export { removeStringNamedExports, deepInfraPass, tweakPasses };
