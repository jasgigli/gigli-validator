export function printHelp() {
  console.log(
    `gigli CLI\n\nUsage:\n  npx gigli codegen --schema <file> --target <openapi|jsonschema>\n  npx gigli analyze --schema <file>\n`,
  );
}

export function parseArgs(args: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      out[args[i].replace(/^--/, "")] = args[i + 1];
      i++;
    }
  }
  return out;
}
