#!/usr/bin/env node
/**
 * check-links.js
 *
 * Guards against three link-hygiene bugs coming back, all the same shape of
 * problem: the site linking to itself using a URL that Vercel will silently
 * redirect away from, instead of the true clean URL. Scans every HTML file
 * and fails the build (non-zero exit) if it finds any of:
 *
 *   1. A ".html" URL in an href, canonical tag, og:url, or JSON-LD field.
 *      (vercel.json cleanUrls:true means the real address has no extension.)
 *   2. A trailing slash on a folder-style page's URL (e.g. "/blog/foo/").
 *      (vercel.json trailingSlash:false means the real address has no
 *      trailing slash, even for folder/index.html pages.)
 *   3. A bare "herohomereach.com" domain instead of "www.herohomereach.com"
 *      in a canonical tag, og:url, or JSON-LD field.
 *
 * What is explicitly NOT a violation (must stay untouched):
 *   - Third-party URLs, e.g. https://www.googletagmanager.com/ns.html
 *   - The site root "/" itself (the one URL allowed to end in "/")
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

// Discover every folder-style clean URL on the site (any directory that
// contains an index.html), so the trailing-slash check stays accurate as
// new blog posts or sections get added -- no hardcoded list to maintain.
function findFolderPaths(root) {
  const folders = new Set();
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, 'index.html'))) {
        folders.add(path.relative(root, full).split(path.sep).join('/'));
      }
      scan(full);
    }
  }
  scan(root);
  return folders;
}

const FOLDER_PATHS = findFolderPaths(ROOT);

// Matches quoted attribute/JSON-LD values ending in .html (optionally
// followed by a #fragment or ?query before the closing quote).
const HTML_VALUE_RE = /"([^"\n]*?\.html(?:[#?][^"\n]*)?)"/g;

// Matches any quoted value at all, for the trailing-slash and bare-domain checks.
const QUOTED_VALUE_RE = /"([^"\n]*)"/g;

const CONTEXT_PATTERNS = [
  { name: 'href', re: /\bhref\s*=\s*"[^"]*"/ },
  { name: 'og:url/og:image (content=)', re: /\bcontent\s*=\s*"[^"]*"/ },
  { name: 'JSON-LD url/@id/item', re: /"(?:url|@id|item)"\s*:\s*"[^"]*"/ },
];

function classify(line) {
  for (const { name, re } of CONTEXT_PATTERNS) {
    if (re.test(line)) return name;
  }
  return 'other reference';
}

function pathAndSuffix(value) {
  let idx = -1;
  for (const ch of ['#', '?']) {
    const i = value.indexOf(ch);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  return idx === -1 ? [value, ''] : [value.slice(0, idx), value.slice(idx)];
}

function checkTrailingSlash(value) {
  const [p] = pathAndSuffix(value);
  if (!p.endsWith('/') || p === '/') return null;
  if (p.startsWith('http') && isThirdParty(p)) return null;

  const m = p.match(/^https?:\/\/[^/]+(\/.*)$/);
  const relPath = m ? m[1] : p.startsWith('/') ? p : '/' + p;
  const slug = relPath.replace(/^\/+|\/+$/g, '');
  return FOLDER_PATHS.has(slug) ? 'trailing-slash' : null;
}

function checkBareDomain(value) {
  return value.startsWith('https://herohomereach.com') || value.startsWith('http://herohomereach.com')
    ? 'bare-domain'
    : null;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, idx) => {
    // .html check
    let match;
    HTML_VALUE_RE.lastIndex = 0;
    while ((match = HTML_VALUE_RE.exec(line)) !== null) {
      const value = match[1];
      if (isThirdParty(value)) continue;
      violations.push({ file: filePath, line: idx + 1, value, kind: '.html URL', context: classify(line) });
    }

    // trailing-slash + bare-domain checks
    QUOTED_VALUE_RE.lastIndex = 0;
    while ((match = QUOTED_VALUE_RE.exec(line)) !== null) {
      const value = match[1];
      if (checkTrailingSlash(value)) {
        violations.push({ file: filePath, line: idx + 1, value, kind: 'trailing slash on folder URL', context: classify(line) });
      }
      if (checkBareDomain(value)) {
        violations.push({ file: filePath, line: idx + 1, value, kind: 'bare domain (missing www)', context: classify(line) });
      }
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
    console.log(`check-links: OK — scanned ${files.length} HTML files, no .html URLs, trailing-slash mismatches, or bare-domain references found.`);
    process.exit(0);
  }

  console.error(`check-links: FAILED — found ${allViolations.length} issue(s):\n`);
  for (const v of allViolations) {
    const rel = path.relative(ROOT, v.file);
    console.error(`  ${rel}:${v.line}  [${v.kind} / ${v.context}]  "${v.value}"`);
  }
  console.error(`\nFixes:`);
  console.error(`  .html URL             -> use the extensionless clean URL (e.g. "/blog/{slug}" not "/blog/{slug}.html")`);
  console.error(`  trailing slash        -> drop the trailing slash (e.g. "/blog/{slug}" not "/blog/{slug}/")`);
  console.error(`  bare domain           -> use "https://www.herohomereach.com" not "https://herohomereach.com"`);
  console.error(`\nThe .html -> clean-URL redirect rule in vercel.json should stay in place for old backlinks — these checks only guard against the SITE linking to itself the wrong way.`);
  process.exit(1);
}

main();
