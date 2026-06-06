# Hero HomeReach — Project Status
**Last updated: June 2026**

---

## What This File Is

Read this first at the start of any Cowork session. It tells Claude exactly where we are, what's been built, what the rules are, and what comes next. No rehashing required.

---

## The Project

**Hero HomeReach** (herohomereach.com) is a Colorado-focused educational resource helping public service workers — teachers, first responders, healthcare workers, and veterans — understand and access homebuyer assistance programs including CHFA, MetroDPA, SB25-167, SB26-053, and VA loan strategies.

**Business model:** Free educational resource that drives leads to a Hero Strategy Session (free 30-minute consultation). Consultations connect buyers with vetted Colorado real estate agents and mortgage professionals. Hero HomeReach is the trusted guide — not a hard lead gen product. Buyers are free to use the information without ever booking a call.

**What sets it apart:** Stacking expertise. Most resources list programs. Hero HomeReach maps which programs work together, which ones don't, and guides buyers through the combination strategy during consultation. Stacking is a core differentiator — it is intentional language and should never be softened or removed from copy.

**Owner:** Trent Rogelstad (trentrogelstad@gmail.com)

---

## Site Architecture

- **Live URL:** herohomereach.com
- **Platform:** Likely Webflow or similar (hosted, not self-managed WordPress)
- **Blog/Learning Center URL:** herohomereach.com/blog/
- **Individual post URL pattern:** herohomereach.com/blog/[post-slug]
- **Key pages:** /, /programs, /who-we-serve, /about, /blog/, /dpa-faq, /free-guide, /contact
- **Nav label:** "Learning Center" (links to /blog/)
- **_docs folder in GitHub:** /_docs/ — store all planning and reference docs here

---

## Brand Voice Rules (Critical)

Read the full brand SKILL at: skills/hero-homereach-writer/SKILL.md

Key rules Claude must follow for ALL Hero HomeReach content:

- **NO DASHES** — use commas instead. Every time. No exceptions.
- **Warm, plain-English, Colorado-specific** — no jargon, no hype, no fear
- **Stacking language is approved and encouraged** — it is the core differentiator
- **Never center content on Trent Rogelstad** — Hero HomeReach is the voice

**Prohibited language (legal/brand):**
"Free money," "Guaranteed," "You qualify," "Claim your money," "Approved," "Maximum benefit," "No cash needed," "$0 out-of-pocket," "Legally yours," "Secret grants"

**Prohibited programs to name as primary recommendations:**
Teacher Next Door, Homes for Heroes, Nurse Next Door, Hero Home Loans, NeighborhoodLIFT (unless verified), Colorado Community Hero Program

**Careful language required for:**
- SB26-053 (Colorado Champions): "best understood as," "designed to expand access," "final terms still depend on," "eligibility, lender participation, and program rules matter"
- SB25-167 (Educator First Home Ownership Program): Law signed June 4, 2025. Program being established by July 1, 2026. Use "being established," "final details depend on implementation," shared equity model.
- Any math examples: use "planning example," "may," "could," "depending on eligibility"

---

## Verified Program Facts

### CHFA (chfainfo.com)
- Grant: up to lesser of $25,000 or 3% of first mortgage. No repayment.
- Second mortgage: up to lesser of $25,000 or 4% of first mortgage. Deferred until sale/refi/payoff.
- Higher interest rate applies to the DPA option.
- Works through approved lenders only — CHFA does not lend directly.
- Homebuyer education required.
- First Generation program: up to $25,000 regardless of mortgage amount.
- Planning example on $500K home ($475K first mortgage): grant up to ~$14,250 (3%), second mortgage up to ~$19,000 (4%)

### MetroDPA (metro-dpa.com)
- Zero percent second mortgage, no scheduled payments
- Income limit: $210,150 (same for all family sizes)
- Min FICO: 620 (640 in some cases)
- No purchase price limit
- Available statewide (despite "front range" branding)
- No first-time homebuyer requirement — first-time AND repeat buyers eligible
- FHA, VA, USDA-RD, and conventional loan types

### SB26-053 (Colorado Champions)
- Designed to expand CHFA eligibility for law enforcement and first responders
- Was in House legislative process as of late March 2026 — final status uncertain (GA adjourns May)
- Use careful framing: "designed to," "if enacted," "verify current status"

### SB25-167 (Educator First Home Ownership Program)
- Signed into law June 4, 2025
- For public school employees (not all educators)
- Shared equity model — appreciation sharing between program and borrower
- Program to be established by July 1, 2026 — details being finalized
- Investment targets: $100M by 2028, $200M by 2030

### VA Loans
- No down payment required for eligible veterans, active duty, surviving spouses
- VA funding fee applies (varies by use, down payment, service type)
- Closing costs still apply — "zero down is not zero cash"
- Colorado veterans can explore stacking VA + MetroDPA or CHFA for closing cost help

---

## Content Calendar

Full 3-month, 18-post calendar: see `HeroHomeReach_ContentCalendar_v2.md` in this folder.

**Three lanes:**
- Lane 1: Hero Program Content — 55%
- Lane 2: Colorado Buyer Education — 20%
- Lane 3: Colorado Market and News — 25% (every post must include "What This Means for Colorado Public Service Workers" bridge section)

**Publishing cadence:** ~2 posts/week

---

## Content Status

| Post | Title | Status | File |
|---|---|---|---|
| Post 1 | Colorado Down Payment Assistance for First Responders and Teachers | WRITTEN, READY TO PUBLISH | HeroHomeReach_Post1.html |
| Posts 2-18 | See content calendar | NOT YET WRITTEN | — |

**Post 1 publishing note:** URL slug should be `/blog/colorado-down-payment-assistance-first-responders-teachers`. Canonical URL in the HTML file needs `/blog/` prefix — verify before publishing.

**Existing site content (already live at /blog/):**
The site launched with ~15 placeholder/seed articles across four audience categories. These are live but have not been reviewed for depth. Post 1 and all future posts we write together should be treated as the "real" content — longer, more verified, richer than the seed posts.

---

## Post 1 Internal Link Map

The following internal links are used in Post 1. Verify these URLs exist on the live site before publishing:

| Link text | Target URL |
|---|---|
| Programs overview | /programs |
| FAQ | /dpa-faq |
| Contact / Strategy Session | /contact |
| About | /about |
| Homepage guide CTA | / |

**Note:** The live site uses `/dpa-faq` for the FAQ page (confirmed from nav). Adjust any links in Post 1 that reference `/faq.html` to match the actual live URL.

---

## Files in This _docs Folder

| File | Purpose |
|---|---|
| PROJECT_STATUS.md | This file. Start here every session. |
| HeroHomeReach_ContentCalendar_v2.md | Full 18-post 3-month content calendar with per-post SEO metadata |
| learning-center-architecture.md | Existing site architecture reference (pre-dates this project) |
| HeroHomeReach_Post1.html | Blog post 1 — ready to publish (verify canonical URL first) |

---

## What Comes Next

1. Fix canonical URL in Post 1 and publish it
2. Write Post 3 — CHFA Explained (most-linked post in the calendar, anchors the internal link structure)
3. Add category tabs to Learning Center for Lane 2 and Lane 3 content before those posts go live
4. Continue publishing 2 posts/week following the calendar sequence

---

## Working Style Notes (for Claude)

- Trent learns best with a building-block approach: start simple, build to professional level
- Proactively push the project forward — don't wait to be asked "what's next"
- Recommend free tools when possible; give cost-benefit analysis when investment is required
- All plans must be designed to produce results within 3 months unless flagged otherwise
- Stacking is a feature, not a liability — lean into it
- Use the hero-homereach-writer SKILL for all content creation
- When in doubt about program facts, verify from official sources before writing
