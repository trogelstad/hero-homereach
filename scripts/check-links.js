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
 *   2. A trailing slash on any internal clean URL (e.g. "/blog/foo/" or
 *      "/faq/"), whether that page is backed by a folder/index.html or a
 *      flat .html file. (vercel.json trailingSlash:false strips the
 *      trailing slash either way.) This check resolves RELATIVE references
 *      (e.g. "../blog/", "../../tools/") against the linking page's own
 *      clean URL before checking, not just absolute "/blog/"-style values --
 *      a relative "../blog/" from a page whose clean URL has no trailing
 *      slash resolves exactly the way a browser resolves it, and needs the
 *      same fix as an absolute reference would.
 *   3. A bare "herohomereach.com" domain instead of "www.herohomereach.com"
 *      in a canonical tag, og:url, or JSON-LD field.
 *
 * What is explicitly NOT a violation (must stay untouched):
 *   - Third-party URLs, e.g. https://www.googletagmanager.com/ns.html
 *   - The site root "/" itself (the one URL allowed to end in "/")
 *   - vercel.json redirect "source"/"destination" entries (that file isn't
 *     scanned at all -- those .html sources must keep working so old
 *     backlinks/bookmarks still redirect correctly)
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

// Every valid internal clean URL on the site, with no leading/trailing
// slashes, covering BOTH folder/index.html pages (e.g. "blog/some-post")
// AND flat .html pages (e.g. "faq", "about"). Both forms lose any trailing
// slash under vercel.json's trailingSlash:false, so both need to be in the
// same validity set for the trailing-slash check below.
function findCleanPaths(root, files) {
  const clean = new Set();
  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (rel === 'index.html') {
      clean.add(''); // site root
    } else if (rel.endsWith('/index.html')) {
      clean.add(rel.slice(0, -'/index.html'.length));
    } else {
      clean.add(rel.slice(0, -'.html'.length));
    }
  }
  return clean;
}

// The base directory a RELATIVE reference on this page resolves against,
// mirroring RFC 3986 merge behavior: a page's clean URL (no trailing slash)
// has its last path segment treated as a "filename" and stripped before a
// relative reference is appended -- exactly what path.posix.dirname() does.
function dirBaseFor(root, file) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const cleanUrl = rel.endsWith('/index.html')
    ? '/' + rel.slice(0, -'/index.html'.length)
    : '/' + rel.slice(0, -'.html'.length);
  const normalizedClean = cleanUrl === '/index.html' ? '/' : cleanUrl;
  return path.posix.dirname(normalizedClean); // e.g. "/blog/foo" -> "/blog"
}

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

function checkTrailingSlash(value, dirBase, cleanPaths) {
  const [p] = pathAndSuffix(value);
  if (p === '') return null;
  if (p.startsWith('http') && isThirdParty(p)) return null;

  let resolved;
  if (p.startsWith('http')) {
    const m = p.match(/^https?:\/\/[^/]+(\/.*)$/);
    resolved = m ? m[1] : '/';
  } else if (p.startsWith('/')) {
    resolved = p;
  } else if (p.startsWith('#') || p.startsWith('mailto:') || p.startsWith('tel:')) {
    return null;
  } else {
    // Relative reference (e.g. "../blog/", "colorado-foo/") -- resolve
    // against the linking page's own clean-URL directory, the same way a
    // browser would.
    resolved = path.posix.normalize(dirBase + '/' + p);
  }

  if (!resolved.endsWith('/') || resolved === '/') return null;

  const slug = resolved.replace(/^\/+|\/+$/g, '');
  return cleanPaths.has(slug) ? 'trailing-slash' : null;
}

function checkBareDomain(value) {
  return value.startsWith('https://herohomereach.com') || value.startsWith('http://herohomereach.com')
    ? 'bare-domain'
    : null;
}

function scanFile(filePath, dirBase, cleanPaths) {
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
      if (checkTrailingSlash(value, dirBase, cleanPaths)) {
        violations.push({ file: filePath, line: idx + 1, value, kind: 'trailing slash on internal URL', context: classify(line) });
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
  const cleanPaths = findCleanPaths(ROOT, files);
  let allViolations = [];

  for (const file of files) {
    const dirBase = dirBaseFor(ROOT, file);
    allViolations = allViolations.concat(scanFile(file, dirBase, cleanPaths));
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
  console.error(`  trailing slash        -> drop the trailing slash (e.g. "/blog/{slug}" not "/blog/{slug}/", "../blog" not "../blog/")`);
  console.error(`  bare domain           -> use "https://www.herohomereach.com" not "https://herohomereach.com"`);
  console.error(`\nThe .html -> clean-URL redirect rule in vercel.json should stay in place for old backlinks — these checks only guard against the SITE linking to itself the wrong way.`);
  process.exit(1);
}

main();
