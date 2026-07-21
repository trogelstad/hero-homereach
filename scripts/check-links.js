#!/usr/bin/env node
/**
 * check-links.js
 *
 * Guards against the Hero HomeReach ".html vs clean URL" bug ever coming back.
 * Scans built HTML output for any internal href, canonical link, or og:url
 * that still points at a *.html URL, and fails the build (non-zero exit) if
 * one is found.
 *
 * What counts as a violation:
 *   - <a href="...something.html">      (internal links)
 *   - <link rel="canonical" href="...something.html">
 *   - <meta property="og:url" content="...something.html">
 *   - JSON-LD "url" / "@id" / "item" fields ending in .html
 *
 * What is explicitly NOT a violation (must stay untouched):
 *   - Third-party URLs, e.g. https://www.googletagmanager.com/ns.html
 *   - vercel.json redirect "source" entries (that file isn't scanned at all —
 *     those .html sources must keep working so old backlinks/bookmarks still
 *     redirect correctly)
 *
 * Usage:
 *   node scripts/check-links.js [rootDir]
 *   npm run check-links
 *
 * rootDir defaults to the repo root (this script's parent directory), since
 * this is a static site with no separate build output folder. If a build
 * step is ever introduced, pass the output directory instead, e.g.:
 *   node scripts/check-links.js dist
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));

const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts']);

// Only ever an internal-page reference; never legitimately these files.
const OWN_DOMAIN_HINTS = ['herohomereach.com'];

function isThirdParty(urlLike) {
  if (!urlLike.startsWith('http')) return false; // relative URL -> internal
  return !OWN_DOMAIN_HINTS.some((h) => urlLike.includes(h));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

// Matches quoted attribute/JSON-LD values ending in .html (optionally
// followed by a #fragment or ?query before the closing quote).
const HTML_VALUE_RE = /"([^"\n]*?\.html(?:[#?][^"\n]*)?)"/g;

// Which HTML attribute / JSON-LD key produced the match, for reporting.
const CONTEXT_PATTERNS = [
  { name: 'href', re: /\bhref\s*=\s*"[^"]*\.html[^"]*"/ },
  { name: 'og:url (content=)', re: /\bcontent\s*=\s*"[^"]*\.html[^"]*"/ },
  { name: 'JSON-LD url/@id/item', re: /"(?:url|@id|item)"\s*:\s*"[^"]*\.html[^"]*"/ },
];

function classify(line) {
  for (const { name, re } of CONTEXT_PATTERNS) {
    if (re.test(line)) return name;
  }
  return 'other .html reference';
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    let match;
    HTML_VALUE_RE.lastIndex = 0;
    while ((match = HTML_VALUE_RE.exec(line)) !== null) {
      const value = match[1];
      if (isThirdParty(value)) continue; // e.g. googletagmanager.com/ns.html
      violations.push({
        file: filePath,
        line: idx + 1,
        value,
        context: classify(line),
      });
    }
  });

  return violations;
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`check-links: root directory not found: ${ROOT}`);
    process.exit(1);
  }

  const files = walk(ROOT);
  let allViolations = [];

  for (const file of files) {
    allViolations = allViolations.concat(scanFile(file));
  }

  if (allViolations.length === 0) {
    console.log(`check-links: OK — scanned ${files.length} HTML files, no .html references found in hrefs, canonical tags, og:url, or JSON-LD.`);
    process.exit(0);
  }

  console.error(`check-links: FAILED — found ${allViolations.length} disallowed .html reference(s):\n`);
  for (const v of allViolations) {
    const rel = path.relative(ROOT, v.file);
    console.error(`  ${rel}:${v.line}  [${v.context}]  "${v.value}"`);
  }
  console.error(`\nFix: use the extensionless clean URL instead (e.g. "/blog/${'{slug}'}" not "/blog/${'{slug}'}.html").`);
  console.error(`The .html -> clean-URL redirect rule in vercel.json should stay in place for old backlinks — this check only guards against the SITE linking to itself with .html.`);
  process.exit(1);
}

main();
