#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const workspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");

if (!workspace.includes("nodeLinker: isolated")) {
  console.error("Dependency boundary check failed: pnpm isolated linking is not enabled.");
  process.exit(1);
}

const forbiddenImportPatterns = [
  /services[\\/]nexora-api[\\/]/,
  /from\s+["'][.]{1,2}[\\/]+.*services[\\/]nexora-api[\\/]/,
  /require\(\s*["'][.]{1,2}[\\/]+.*services[\\/]nexora-api[\\/]/,
];

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredDirectories = new Set(["node_modules", ".git", ".next", ".expo", "dist", "build"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else {
      const dot = entry.name.lastIndexOf(".");
      if (dot !== -1 && sourceExtensions.has(entry.name.slice(dot))) files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const rootDir of ["apps", "packages"]) {
  for (const file of await walk(join(root, rootDir))) {
    const text = await readFile(file, "utf8");
    if (forbiddenImportPatterns.some((pattern) => pattern.test(text))) {
      violations.push(relative(root, file));
    }
  }
}

if (violations.length) {
  console.error("Dependency boundary check failed. Client/workspace code references backend source:");
  for (const file of violations) console.error(` - ${file}`);
  process.exit(1);
}

console.log("Dependency boundary check passed.");
