/**
 * @fileoverview A tiny LaTeX to html/css renderer
 */

/**
 * TeX book p. 158
 * @const
 * @enum {number} Atom type
 */
const Atom = {
  None: -1,
  Ord: 0,
  Op: 1,
  Bin: 2,
  Rel: 3,
  Open: 4,
  Close: 5,
  Punct: 6,
  Inner: 7
};

/**
 * @const
 * @enum {string}
 */
const Spaces = {
  Regular: " ",
  ThreePerEm: " ",
  FourPerEm: " ",
  SixPerEm: " "
};

/**
 * @const {!Object<string, !Array<!Atom | string>>}
 */
const Substitute = {
  // Atom.Ord
  "eps": [Atom.Ord, "<i>ϵ</i>"],
  "Theta": [Atom.Ord, "Θ"],
  "theta": [Atom.Ord, "θ"],
  "Omega": [Atom.Ord, "Ω"],
  "omega": [Atom.Ord, "ω"],
  "field": [Atom.Ord, "𝔽"],
  "reals": [Atom.Ord, "ℝ"],
  "integers": [Atom.Ord, "ℤ"],
  "infty": [Atom.Ord, "∞"],
  "\\|": [Atom.Ord, "‖"],
  "delta": [Atom.Ord, "<i>δ</i>"],
  // Atom.Op
  "log": [Atom.Op, null],
  "mod": [Atom.Op, null],
  // Atom.Bin
  "times": [Atom.Bin, "×"],
  "*": [Atom.Bin, '<span class=laasx>*</span>'],
  "+": [Atom.Bin, '+'],
  "/": [Atom.Bin, '<span class=ladiv>/</span>'],
  "-": [Atom.Bin, '<span class=lamns>−</span>'],
  "cdot": [Atom.Bin, '·'],
  "neq": [Atom.Bin, "≠"],
  // Atom.Rel
  "=": [Atom.Rel, '<span class=laeq>=</span>'],
  "to": [Atom.Rel, "<span class=lato>→</span>"],
  "mapsto": [Atom.Rel, "<span class=lamt>↦</span>"],
  "in": [Atom.Rel, "<span class=lain>∈</span>"],
  // Atom.Open
  "langle": [Atom.Open, "<span class=laal>⟨</span>"],
  "lVert": [Atom.Open, "‖"],
  "\\{": [Atom.Open, "<span class=lacl>{</span>"],
  "(": [Atom.Open, '<span class=lapl>(</span>'],
  "[": [Atom.Open, '<span class=lasl>[</span>'],
  // Atom.Close
  "rangle": [Atom.Close, "<span class=laar>⟩</span>"],
  "rVert": [Atom.Close, "‖"],
  "\\}": [Atom.Close, "<span class=lacr>}</span>"],
  ")": [Atom.Close, '<span class=lapr>)</span>'],
  "]": [Atom.Close, '<span class=lasr>]</span>'],
  // Atom.Punct
  ",": [Atom.Punct, ','],
  "colon": [Atom.Punct, ":"],
  // Atom.Inner
  "ldots": [Atom.Inner, "…"],
  "quad": [Atom.Inner, "  "]
};

/**
 * TeX book p. 170
 *
 * @const {!Array<!Array<number>>}
 */
const SpaceTable = [
  [0, 1, 2, 3, 0, 0, 0, 1],
  [1, 1, 9, 3, 0, 0, 0, 1],
  [2, 2, 9, 9, 2, 9, 9, 2],
  [3, 3, 9, 0, 3, 0, 0, 3],
  [0, 0, 9, 0, 0, 0, 0, 0],
  [0, 1, 2, 3, 0, 0, 0, 1],
  [1, 1, 9, 1, 1, 1, 1, 1],
  [1, 1, 2, 3, 1, 0, 1, 1]
];

/**
 * @const {!RegExp}
 */
const Alpha = /[a-zA-Z]*/;
/**
 * @const {!RegExp}
 */
const Digits = /[0-9]*/;
/**
 * @const {!RegExp}
 */
const RightAttachment = /[a-zA-Z._’\-,]*/;
/**
 * @const {!RegExp}
 */
const LeftAttachment = /[a-zA-Z.\-]*$/;

/**
 * @param {!Atom} leftAtom
 * @param {!Atom} rightAtom
 * @return {string}
 */
const getSpace = (leftAtom, rightAtom) => {
  if (leftAtom == Atom.None || rightAtom == Atom.None)
    return "";
  /** @const {number} */
  const spaceType = SpaceTable[leftAtom][rightAtom];
  return spaceType == 0
    ? ""
    : spaceType == 3 ? Spaces.ThreePerEm : Spaces.Regular;
}

/**
 * @param {string} texStr to render
 * @param {?string} leftAttach the text before the formula e.g., length-$n$
 * @param {?string} rightAttach the text after the formula e.g., $k$-party
 * @return {string} html output
 */
const renderInline = (texStr, leftAttach, rightAttach) => {
  /** @const {boolean} */
  const baseMode = leftAttach != null
  /** @const {number} */
  const n = texStr.length;
  /** @type {string} */
  let output = "";
  /** @type {!Atom} */
  let lastAtom = Atom.None;

  for (let /** number */ i = 0; i < n;) {
    /** @const {code} */
    const code = texStr.charCodeAt(i);
    /** @const {string} */
    const char = texStr.charAt(i);
    i++;
    if (code == "\\".charCodeAt(0)) {
      let command = texStr.slice(i).match(Alpha)[0];
      if (command.length == 0) {
        command = texStr.slice(i - 1, i + 1);
        i += 1;
      } else {
        i += command.length;
      }

      const subs = Substitute[command];
      if (subs) {
        output += getSpace(lastAtom, subs[0]);
        output += (subs[1] == null) ?
          '<span class=laop>' + command + '</span>' : subs[1];
        lastAtom = subs[0];
      }
    } else if (code == "^".charCodeAt(0)) {
      /** @type {string} */
      let sup;
      if (texStr.charCodeAt(i) == "{".charCodeAt(0)) {
        /** @const {number} */
        let supEnd = texStr.indexOf("}", i);
        sup = texStr.slice(i + 1, supEnd);
        i = supEnd + 1;
      } else {
        sup = texStr.charAt(i);
        i++;
      }
      output += '<sup class=lasup>' + renderInline(sup, null, null) + '</sup>';
    } else if (code == "_".charCodeAt(0)) {
      /** @type {string} */
      let sub;
      if (texStr.charCodeAt(i) == "{".charCodeAt(0)) {
        /** @const {number} */
        let subEnd = texStr.indexOf("}", i);
        sub = texStr.slice(i + 1, subEnd);
        i = subEnd + 1;
      } else {
        sub = texStr.charAt(i);
        i++;
      }
      if (texStr.charCodeAt(i) == "^".charCodeAt(0)) {
        i++;
        /** @type {string} */
        let sup;
        if (texStr.charCodeAt(i) == "{".charCodeAt(0)) {
          /** @const {number} */
          let supEnd = texStr.indexOf("}", i);
          sup = texStr.slice(i + 1, supEnd);
          i = supEnd + 1;
        } else {
          sup = texStr.charAt(i);
          i++;
        }
        output += '<span class=lasupsub><sup class=lassup>' + renderInline(sup, null, null) +
          '</sup><br><sub class=lassub>' + renderInline(sub, null, null) +
          '</sub></span>';
      } else {
        output += '<sub class=lasub>' + renderInline(sub, null, null) + '</sub>';
      }
    } else if ("0".charCodeAt(0) <= code && code <= "9".charCodeAt(0)) {
      /** @const {string} */
      let number = texStr.slice(i).match(Digits)[0];
      i += number.length;
      output += getSpace(lastAtom, Atom.Ord) + char + number;
      lastAtom = Atom.Ord;
    } else if (code == ' '.charCodeAt(0)) {
    } else {
      let subs = Substitute[char];
      if (subs) {
        /** @type {!Atom} */
        let atom = subs[0];
        // In the baseMode, split across relations
        if (baseMode && atom == Atom.Rel) {
          /**
           * TODO(KimlikDAO-bot): switch this to literal counter
           * @const {boolean}
           */
          let smallLeftHandSide = (i < 3);
          return '<span class=law>' + leftAttach + output +
            getSpace(lastAtom, Atom.Rel) +
            (smallLeftHandSide ? "" : "</span><span class=law>") +
            subs[1] + getSpace(lastAtom, Atom.Rel) + "</span>" +
            renderInline(texStr.slice(i), "", rightAttach);
        }
        output += getSpace(lastAtom, atom) + subs[1];
        lastAtom = atom;
      } else {
        output += getSpace(lastAtom, Atom.Ord) + '<i>' + char + '</i>';
        lastAtom = Atom.Ord;
      }
    }
  }
  return !baseMode ||
    (leftAttach == "" && rightAttach == "" && output.length < 9) ?
    output :
    '<span class="law">' + leftAttach + output + rightAttach + "</span>";
}

/**
 * @param {!Element} elem to populate
 */
const renderElement = (elem) => elem.innerHTML = renderParagraph(elem.innerHTML);

/**
 * @param {string} paragraph
 * @return {string}
 */
const renderParagraph = (paragraph) => {
  {
    const blocks = paragraph.split("$$");
    if (blocks.length % 2 == 0)
      return paragraph;
    const n = blocks.length;
    for (let i = 1; i < n; i += 2)
      blocks[i] = "<div class=laeqn><div class=laeqni>" +
        renderInline(blocks[i], null, null) + "</div></div>";
    paragraph = blocks.join("");

  }

  /** @const {!Array<string>} */
  const parts = paragraph.split("$");
  if (parts.length % 2 == 0)
    return paragraph;

  /** @const {number} */
  const n = parts.length;
  for (let /** number */ i = 1; i < n; i += 2) {
    /** @const {string} */
    const leftAttach = parts[i - 1].match(LeftAttachment)[0];
    /** @const {string} */
    const rightAttach = parts[i + 1].match(RightAttachment)[0];
    if (leftAttach.length > 0)
      parts[i - 1] = parts[i - 1].slice(0, -leftAttach.length);
    parts[i + 1] = parts[i + 1].slice(rightAttach.length);
    parts[i] = renderInline(parts[i], leftAttach, rightAttach);

    if (leftAttach == "" && parts[i - 1].length > 0)
      parts[i - 1] = parts[i - 1].replace(/\s+$/, '') + Spaces.FourPerEm;
    if (rightAttach == "" && parts[i + 1].length > 0)
      parts[i + 1] = Spaces.FourPerEm + parts[i + 1].replace(/^\s+/, '');
  }
  return parts.join("");
}

export {
  renderParagraph,
  renderElement,
  renderInline,
};
