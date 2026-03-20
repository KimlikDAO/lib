type Update = {
  beg: number;
  end: number;
  put: string;
};

const update = (orig: string, updates: Update[]): string => {
  updates.sort((a, b) => a.beg - b.beg);  /** @type {string} */
  let updated = "";
  let last = 0;
  for (const update of updates) {
    updated += orig.substring(last, update.beg) + update.put;
    last = update.end;
  }
  return updated + orig.substring(last);
}

export {
  Update,
  update
};
