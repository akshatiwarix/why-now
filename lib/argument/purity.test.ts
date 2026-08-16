import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The purity boundary.
 *
 * Every non-test file under `lib/argument/` must import only relative paths.
 * No allowlist, deliberately: the moment `zod` is allowed, `@google/genai` is
 * one plausible-sounding pull request away, and a module that can call a model
 * can invent a warrant. If engine code needs a package, the code belongs in
 * `lib/parse/` or a route handler instead.
 */

const ENGINE_DIR = join(process.cwd(), "lib", "argument");

function engineFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return engineFiles(path);
    if (!entry.name.endsWith(".ts")) return [];
    if (entry.name.endsWith(".test.ts")) return [];
    return [path];
  });
}

/** Matches `import … from "x"`, `export … from "x"`, and `import("x")`. */
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g;

describe("purity", () => {
  const files = engineFiles(ENGINE_DIR);

  it("finds engine files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.slice(process.cwd().length + 1), f] as const))(
    "%s imports nothing non-relative",
    (_label, file) => {
      const source = readFileSync(file, "utf8");
      const bare: string[] = [];
      for (const match of source.matchAll(SPECIFIER)) {
        const specifier = match[1];
        if (specifier === undefined) continue;
        if (specifier.startsWith("./") || specifier.startsWith("../")) continue;
        bare.push(specifier);
      }
      expect(bare).toEqual([]);
    },
  );
});
