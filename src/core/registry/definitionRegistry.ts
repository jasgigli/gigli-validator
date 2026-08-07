const ruleDefinitions: Record<string, string> = {};

export function define(name: string, ruleString: string) {
  if (ruleDefinitions[name]) {
    console.warn(`[gigli] Overwriting existing rule definition: "${name}"`);
  }
  ruleDefinitions[name] = ruleString;
}
export function getDefinition(name: string): string | undefined {
  return ruleDefinitions[name];
}
