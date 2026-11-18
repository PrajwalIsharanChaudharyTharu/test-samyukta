// Architecture guard: fails when code breaks the project's import/URL rules.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const UI_DIRS = ['src/pages', 'src/components', 'src/layouts'];

const RULES = [
  {
    dirs: UI_DIRS,
    pattern: /\b(getCollection|getEntry|getEntries)\s*\(/,
    message: 'Read content through @lib/content, not getCollection/getEntry directly.',
  },
  {
    dirs: UI_DIRS,
    // href="/about" or href='/' — but not files (/favicon.svg) or protocol-relative URLs (//cdn)
    pattern: /href=["']\/(?!\/)[^"'.]*["']/,
    message: 'Hardcoded internal URL. Use routes.* from @config/routes.',
  },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : /\.(astro|ts|tsx|mdx)$/.test(e.name) ? [full] : [];
    }),
  );
  return files.flat();
}

const problems = [];
for (const rule of RULES) {
  for (const dir of rule.dirs) {
    for (const file of await walk(dir)) {
      const lines = (await readFile(file, 'utf8')).split('\n');
      lines.forEach((line, i) => {
        if (rule.pattern.test(line)) problems.push(`${file}:${i + 1}  ${rule.message}\n    ${line.trim()}`);
      });
    }
  }
}

if (problems.length) {
  console.error(`\n✖ ${problems.length} architecture rule violation(s):\n\n${problems.join('\n\n')}\n`);
  process.exit(1);
}
console.log('✓ architecture boundaries OK');
