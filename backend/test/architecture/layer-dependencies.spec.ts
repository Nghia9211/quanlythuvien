import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const modulesRoot = join(process.cwd(), "src", "modules");

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? typescriptFiles(path)
      : path.endsWith(".ts") && !path.endsWith(".spec.ts")
        ? [path]
        : [];
  });
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

describe("feature module layered dependencies", () => {
  const rules: Array<{ layer: string; forbidden: RegExp[] }> = [
    {
      layer: "domain",
      forbidden: [/application/, /infrastructure/, /presentation/, /^@nestjs\//, /^typeorm$/],
    },
    {
      layer: "application",
      forbidden: [/infrastructure/, /presentation/, /^@nestjs\//, /^typeorm$/],
    },
    { layer: "infrastructure", forbidden: [/presentation/] },
    { layer: "presentation", forbidden: [/infrastructure/, /\/domain\//] },
  ];

  const featureRoots = readdirSync(modulesRoot)
    .map((entry) => join(modulesRoot, entry))
    .filter((path) => statSync(path).isDirectory());

  it.each(rules)("keeps $layer imports pointing inward", ({ layer, forbidden }) => {
    const violations = featureRoots.flatMap((featureRoot) => {
      const layerRoot = join(featureRoot, layer);
      try {
        return typescriptFiles(layerRoot).flatMap((file) =>
          importsOf(file)
            .filter((dependency) => forbidden.some((pattern) => pattern.test(dependency)))
            .map((dependency) => `${relative(featureRoot, file)} -> ${dependency}`),
        );
      } catch {
        return [];
      }
    });

    expect(violations).toEqual([]);
  });
});
