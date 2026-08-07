#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { printHelp } from "./helpers";

const [, , command, ...args] = process.argv;

(async () => {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    // Read version from package.json, resolving from the CLI file location
    try {
      let pkgPath = "";
      // Try to resolve from process.cwd() (for npx or global usage)
      if (existsSync(join(process.cwd(), "package.json"))) {
        pkgPath = join(process.cwd(), "package.json");
      } else {
        // Try to resolve from dist/cli location
        const cliPath =
          typeof __dirname !== "undefined" ? __dirname : process.cwd();
        pkgPath = join(cliPath, "../../package.json");
        if (!existsSync(pkgPath)) {
          // Fallback: try up from dist/cli/index.js
          pkgPath = join(cliPath, "../../../package.json");
        }
      }
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      console.log(pkg.version);
    } catch (e) {
      console.error("Could not read version:", e);
    }
    process.exit(0);
  }

  if (command === "codegen") {
    const { runCodegen } = await import("./codegen");
    await runCodegen(args);
    return;
  }
  if (command === "analyze") {
    const { runAnalyze } = await import("./analyze");
    await runAnalyze(args);
    return;
  }
  console.error(`[gigli] Unknown command: ${command}`);
  printHelp();
  process.exit(1);
})();
