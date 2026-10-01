import { realpathSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { createHash } from "node:crypto";
/** Reject accidental npm-workspace hoisting or cross-library dependency resolution. */
export function isolation(projectRoot) {
  const root = realpathSync(projectRoot),
    shared = realpathSync(resolve(root, "../shared"));
  return {
    name: "showcase-dependency-isolation",
    generateBundle() {
      for (const raw of this.getModuleIds()) {
        const id = raw.split("?")[0];
        if (!id.startsWith("/")) continue;
        let actual;
        try {
          actual = realpathSync(id);
        } catch {
          continue;
        }
        if (!actual.startsWith(root + sep) && !actual.startsWith(shared + sep))
          throw new Error(
            `Showcase imported a file outside its isolated project/shared fixtures: ${actual}`,
          );
      }
      const pkg = JSON.parse(
        readFileSync(resolve(root, "package.json"), "utf8"),
      );
      this.emitFile({
        type: "asset",
        fileName: "build-metadata.json",
        source:
          JSON.stringify(
            {
              project: pkg.name,
              dependencies: pkg.dependencies,
              devDependencies: pkg.devDependencies,
              lockfileSha256: createHash("sha256")
                .update(readFileSync(resolve(root, "package-lock.json")))
                .digest("hex"),
              mode: "production",
              rendering: "client",
              theme: "single default light appearance",
              isolation:
                "all bundled filesystem modules belong to this project or dependency-free shared fixtures",
            },
            null,
            2,
          ) + "\n",
      });
    },
  };
}
