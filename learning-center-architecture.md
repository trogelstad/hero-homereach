# Hero HomeReach — Learning Center Architecture Plan

## Current State
The Learning Center lives at `herohomereach.com/blog/` as a single hub page (`blog/index.html`).
Audience filtering is handled by JavaScript tabs on that one page.
Each "See all" link currently points to the most relevant existing post as a placeholder.

---

## Planned Architecture (build when ready)

```
blog/
  index.html                        ← Learning Center hub (LIVE)
  veterans/
    index.html                      ← Veterans & Military category page
  educators/
    index.html                      ← Educators category page
  first-responders/
    index.html                      ← First Responders category page
  healthcare/
    index.html                      ← Healthcare Workers category page
```

Each category `index.html` is a standalone HTML page listing all posts for that audience.
Posts themselves do not move. No content is duplicated. Google indexes four new pages.

---

## Build Trigger

**Do not build category pages until each audience has 6 to 8 published posts.**

Below that threshold the category pages look thin to Google and to users.
Current post counts (update as posts publish):

| Audience | Posts Live | Ready to Build |
|---|---|---|
| Veterans & Military | 2 | No |
| Educators | 2 | No |
| First Responders | 2 | No |
| Healthcare Workers | 0 | No |

---

## When You Build: Update These Two Things

**1. The "See all" links on `blog/index.html`**

Each shelf header has a "See all →" link. Currently pointing to placeholder post URLs.
When the category page exists, update each one:

| Shelf | Current placeholder | Final URL |
|---|---|---|
| Veterans & Military | `va-loan-down-payment-assistance-colorado.html` | `../blog/veterans/` |
| Educators | `down-payment-assistance-teachers-colorado.html` | `../blog/educators/` |
| First Responders | `colorado-firefighter-emt-home-buying-help.html` | `../blog/first-responders/` |
| Healthcare Workers | `../who-we-serve.html` | `../blog/healthcare/` |

**2. The subnav tabs**

The tab filter currently shows/hides shelves on the hub page.
When category pages exist, tabs can optionally navigate to the category URL instead.
Decision: keep as filter OR convert to navigation. Decide at build time based on UX preference.

---

## Canonical Tag Rule

**Category pages linking to articles: no canonical tag needed.**
Card grids are just `<a href>` links. No content is duplicated.

**If you ever show a full article excerpt on a category page:**
Add this to the category page's `<head>`:
```html
<link rel="canonical" href="https://www.herohomereach.com/blog/[article-slug].html">
```
pointing back to the original article URL.

**Individual article pages:** each already has its own canonical tag. Do not change them.

---

## SEO Value of Category Pages

Each category page becomes an indexable destination targeting searches like:
- "Colorado homebuyer resources for teachers"
- "veteran home buying help Colorado"
- "first responder mortgage assistance Colorado"

These are mid-funnel informational queries with real search volume and low competition.
Internal linking from articles back to their category page strengthens both.

---

## CSS and Path Notes

Category pages live one level deeper than current root posts.
Use the same relative path pattern as blog subfolder posts:

```html
<link rel="stylesheet" href="/css/main.css">
<img src="/logo-mark_transparent.png">
<script src="/js/ebook-modal.js"></script>
```

Use absolute paths (leading `/`) for all shared assets. Do not use `../../` relative paths.

---

## Reference

- Decision made: June 2026
- Inspired by: Zillow Learning Center architecture (zillow.com/learn/)
- Built by: Claude + Trent Rogelstad
