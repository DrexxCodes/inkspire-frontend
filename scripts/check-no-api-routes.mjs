#!/usr/bin/env node
/**
 * Architecture guard: Inkspire must not expose Next.js API routes. Every operation goes
 * through the Fastify backend. Fails (exit 1) if it finds
 *   - an `api` folder inside `app/` or `pages/`
 *   - any `route.ts|js|tsx|jsx` route handler file under `app/`
 *   - a `rewrites()` function in next.config.* that points at /api
 *
 * Usage: node scripts/check-no-api-routes.mjs [projectRoot]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function findViolations(root) {
  const problems = [];

  const walk = (dir, visit) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".next") continue;
      const full = join(dir, name);
      const isDir = statSync(full).isDirectory();
      visit(full, name, isDir);
      if (isDir) walk(full, visit);
    }
  };

  for (const base of ["app", "pages", "src/app", "src/pages"]) {
    walk(join(root, base), (full, name, isDir) => {
      if (isDir && name === "api") problems.push(`API folder: ${relative(root, full)}`);
      if (!isDir && /^route\.(ts|tsx|js|jsx|mjs)$/.test(name)) {
        problems.push(`Route handler: ${relative(root, full)}`);
      }
    });
  }

  for (const file of ["next.config.ts", "next.config.js", "next.config.mjs"]) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    if (/rewrites\s*\(/.test(text) && /["'`]\/?api\b/.test(text)) {
      problems.push(`Rewrite to /api in ${file}`);
    }
  }
  return problems;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const root = process.argv[2] ?? process.cwd();
  const problems = findViolations(root);
  if (problems.length) {
    console.error("Architecture violation: Next.js API routes are not allowed in Inkspire.");
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }
  console.log("OK: no Next.js API routes found.");
}
