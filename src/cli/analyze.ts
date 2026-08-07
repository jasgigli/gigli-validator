import { parseArgs, printHelp } from "./helpers";

export async function runAnalyze(args: string[]) {
  const opts = parseArgs(args);
  if (!opts["schema"]) {
    console.error("[gigli] --schema is required for analyze.");
    printHelp();
    process.exit(1);
  }

  const schemaPath = opts["schema"];
  // Efficient: Register ts-node if loading a .ts file
  if (schemaPath.endsWith(".ts")) {
    require("ts-node/register");
  }

  try {
    const schemaModule: any = await import(require("path").resolve(schemaPath));
    const schema =
      schemaModule.default || schemaModule.schema || schemaModule.UserSchema;
    if (!schema) {
      console.error("[gigli] Could not find a schema export in the file.");
      process.exit(1);
    }
    const { analyzeSchema } = await import("../core/analyze/analyzeSchema");
    const ast = typeof schema.toAST === "function" ? schema.toAST() : schema;
    const issues = analyzeSchema(ast);
    if (issues.length === 0) {
      console.log("No issues found.");
    } else {
      console.log("Schema analysis report:");
      for (const issue of issues) {
        console.log(" -", issue);
      }
    }
  } catch (e) {
    console.error("[gigli] Failed to load schema:", e);
    process.exit(1);
  }
}
