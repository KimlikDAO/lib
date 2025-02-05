import { DomIdMapper, GlobalMapper, LocalMapper } from "../../kdjs/domIdMapper";
import { filterGlobalProps } from "../props";

let Globals = {};

/**
 *
 * @param {!Object<string, *>} newGlobals - An object containing key-value pairs to set as globals.
 * @return {!Object<string, *>} The new globals object.
 */
const initGlobals = (globalsData) => Globals = new Proxy(filterGlobalProps(globalsData), {
  set(target, key, value) {
    if (key.charCodeAt(0) > 90)
      throw new Error(`Global key "${key}" must start with a capital letter.`);

    target[key] = value;
    return true;
  }
});

/**
 * Retrieves the current page compile time globals.
 *
 * @return {!Object<string, *>} The current page global state.
 */
const getGlobals = () => Globals;

const assignGlobals = (newGlobals) => Object.assign(Globals, newGlobals);

export {
  assignGlobals,
  getGlobals,
  initGlobals,
};
