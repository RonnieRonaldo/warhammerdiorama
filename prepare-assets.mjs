import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Stage only the site's public pages and assets for Wrangler.
const output = 'dist';
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
cpSync('sitemap.xml', join(output, 'sitemap.xml'));
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    cpSync(entry.name, join(output, entry.name));
  }
}
for (const directory of ['assets', 'diorama-zum-ausdrucken']) {
  cpSync(directory, join(output, directory), { recursive: true });
}
