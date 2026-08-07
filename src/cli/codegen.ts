import { parseArgs, printHelp } from "./helpers";

export async function runCodegen(args: string[]) {
  const opts = parseArgs(args);
  if (!opts["schema"] || !opts["target"]) {
    console.error("[gigli] --schema and --target are required for codegen.");
    printHelp();
    process.exit(1);
  }
  const schemaPath = opts["schema"];
  const target = opts["target"];
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
    const { generateJsonSchema } = await import("../core/codegen/jsonSchema");
    const { generateOpenApiSchema } = await import("../core/codegen/openApi");
    const ast = typeof schema.toAST === "function" ? schema.toAST() : schema;
    if (target === "openapi") {
      const openapi = generateOpenApiSchema(ast);
      console.log(JSON.stringify(openapi, null, 2));
    } else if (target === "jsonschema") {
      const jsonschema = generateJsonSchema(ast);
      console.log(JSON.stringify(jsonschema, null, 2));
    } else {
      console.error("[gigli] Unknown target:", target);
      process.exit(1);
    }
  } catch (e) {
    console.error("[gigli] Failed to load schema:", e);
    process.exit(1);
  }
}
