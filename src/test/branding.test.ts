import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'test') continue; // don't scan the tests themselves
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('branding', () => {
  const files = walk(join(process.cwd(), 'src'));

  it('has no stale 0.2.x version strings anywhere in the app source', () => {
    const hits: string[] = [];
    for (const f of files) {
      const c = readFileSync(f, 'utf8');
      if (/v0\.2\.0|0\.2\.0/.test(c)) hits.push(f);
    }
    expect(hits).toEqual([]);
  });

  it('carries v1.5.0 across the version surfaces', () => {
    const hits: string[] = [];
    for (const f of files) {
      const c = readFileSync(f, 'utf8');
      if (/v1\.5\.0|Version 1\.5\.0/.test(c)) hits.push(f);
    }
    // login, boot, terminal, settings/about, desktop wallpaper
    expect(hits.length).toBeGreaterThanOrEqual(4);
  });

  it('carries the SUPERCOMPUTE brand + version name', () => {
    const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(all).toContain('SUPERCOMPUTE');
    expect(all).toContain('Immersion OS v1.5.0');
  });

  it('keeps the design tokens version in sync with package.json', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const tokens = JSON.parse(readFileSync(join(process.cwd(), 'design/tokens.json'), 'utf8'));
    expect(tokens.version).toBe(pkg.version);
  });
});
