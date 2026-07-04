import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(import.meta.dirname);
const layers = ["domain", "application", "infrastructure", "presentation", "composition"] as const;
const allowed: Record<(typeof layers)[number], string[]> = {
  domain: ["domain"],
  application: ["domain", "application"],
  infrastructure: ["domain", "application", "infrastructure"],
  presentation: ["domain", "application", "presentation"],
  composition: ["domain", "application", "infrastructure", "composition"],
};

function sourceFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).flatMap((entry) => {
    const child = join(path, entry);
    return statSync(child).isDirectory()
      ? sourceFiles(child)
      : /\.(ts|tsx)$/.test(entry)
        ? [child]
        : [];
  });
}

function layerOf(path: string) {
  const first = relative(sourceRoot, path).split(sep)[0];
  return layers.find((layer) => layer === first);
}

describe("layer dependencies", () => {
  it("only points from outer layers toward inner layers", () => {
    const violations: string[] = [];

    for (const file of sourceFiles(sourceRoot)) {
      const sourceLayer = layerOf(file);
      if (!sourceLayer) continue;
      const imports = [...readFileSync(file, "utf8").matchAll(/from\s+["'](\.[^"']+)["']/g)];

      for (const [, specifier] of imports) {
        const targetLayer = layerOf(resolve(dirname(file), specifier));
        if (targetLayer && !allowed[sourceLayer].includes(targetLayer)) {
          violations.push(`${relative(sourceRoot, file)} -> ${targetLayer}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
