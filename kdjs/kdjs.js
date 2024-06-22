#!/usr/bin/env node

import process from "node:process";
import { parseArgs } from "../util/cli";
import { compile } from "./compile";

const params = parseArgs(process.argv.slice(2), "entry", {
  "-o": "output",
  "-d": "exports",
});
params["output"] ||= /** @type {string} */(params["entry"])
  .replace(/\.js$/, ".out.js");

compile(params);
