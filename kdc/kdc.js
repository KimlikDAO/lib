#!/usr/bin/env node

import { parseArgs } from "../util/cli";
import { compile } from "./compile";

compile(parseArgs(process.argv.slice(2), "inputs", { "-o": "output" }));
