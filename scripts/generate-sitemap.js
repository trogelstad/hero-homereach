#!/usr/bin/env node
/**
 * generate-sitemap.js
 *
 * Regenerates sitemap.xml automatically by scanning the blog/ directory for
 * every live post (both the folder/index.html pattern and legacy flat .html
 * files) and combining them with a small static list of core site pages.
 *
 * This exists so sitemap.xml never has to be hand-edited again. Run it any
 * time after adding, removing, or renaming a blog post, and it rebuilds the
 * whole file from what's actually on disk.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *   npm run generate-sitemap
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const SITE = 'https://www.herohomereach.com';
const TODAY = new Date().toISOString().slice(0, 10);

// Files in blog/ that are not real posts and should never appear in the sitemap.
const EXCLUDE_FILES = new Set(['index.html', 'post-template.html']);

// Hand-maintained: core pages that aren't blog posts and rarely change.
// Add a line here if a new top-level page (not a blog post) goes live.
const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/programs', changefreq: 'monthly', priority: '0.9' },
  { loc: '/who-we-serve', changefreq: 'monthly', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.8' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.8' },
  { loc: '/tools/', changefreq: 'monthly', priority: '0.7' },
  { loc: '/tools/quiz/', changefreq: 'monthly', priority: '0.7' },
  { loc: '/tools/colorado-assistance-explorer/', changefreq: 'monthly', priority: '0.7' },
  { loc: '/tools/class-finder/', changefreq: 'monthly', priority: '0.6' },
  { loc: '/community-partners/', changefreq: 'monthly', priority: '0.6' },
  { loc: '/partner-opportunity/', changefreq: 'monthly', priority: '0.5' },
];

function lastmodFor(filePath) {
  try {
    const rel = path.relative(ROOT, filePath);
    const out = execSync(`git log -1 --format=%cs -- "${rel}"`, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (out) return out;
  } catch (e) {
    // fall through to mtime
  }
  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
}

function findBlogPosts() {
  const posts = [];

  for (const entry of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const indexPath = path.join(BLOG_DIR, entry.name, 'index.html');
      if (fs.existsSync(indexPath)) {
        posts.push({
          loc: `/blog/${entry.name}/`,
          lastmod: lastmodFor(indexPath),
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.html') && !EXCLUDE_FILES.has(entry.name)) {
      const slug = entry.name.replace(/\.html$/, '');
      posts.push({
        loc: `/blog/${slug}`,
        lastmod: lastmodFor(path.join(BLOG_DIR, entry.name)),
      });
    }
  }

  return posts.sort((a, b) => a.loc.localeCompare(b.loc));
}

function urlEntry({ loc, changefreq = 'monthly', priority = '0.8', lastmod = TODAY }) {
  return (
    `  <url>\n` +
    `    <loc>${SITE}${loc}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `  </url>`
  );
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`generate-sitemap: blog directory not found at ${BLOG_DIR}`);
    process.exit(1);
  }

  const blogIndexPath = path.join(BLOG_DIR, 'index.html');
  const blogPosts = findBlogPosts();

  const entries = [
    ...STATIC_PAGES.map(urlEntry),
    urlEntry({
      loc: '/blog/',
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: fs.existsSync(blogIndexPath) ? lastmodFor(blogIndexPath) : TODAY,
    }),
    ...blogPosts.map((p) => urlEntry({ ...p, changefreq: 'monthly', priority: '0.8' })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n` +
    entries.join('\n\n') +
    `\n\n</urlset>\n`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');

  const total = STATIC_PAGES.length + 1 + blogPosts.length;
  console.log(`sitemap.xml regenerated: ${total} URLs total (${blogPosts.length} blog posts, ${STATIC_PAGES.length + 1} core pages).`);
  console.log(`Blog posts included:`);
  blogPosts.forEach((p) => console.log(`  ${p.loc}`));
}

main();
