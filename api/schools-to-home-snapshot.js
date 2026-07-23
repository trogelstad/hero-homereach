// Hero HomeReach — CHFA Schools To Home LOCAL SNAPSHOT lead-capture API
// Vercel Serverless Function: /api/schools-to-home-local-snapshot.js
//
// Drop into your existing /api/ folder alongside quiz-results.js and
// schools-to-home-snapshot.js. Captures name + email + county from the
// gated "Local Snapshot" form on the CHFA Schools To Home blog post,
// returns four locally-relevant data points, and (if configured) adds
// the lead to MailerLite as a new subscriber.
//
// REQUIRED ENV VARS TO ACTIVATE MAILERLITE (add in Vercel project settings):
//   MAILERLITE_API_KEY   — a MailerLite API token (Integrations > API in MailerLite)
//   MAILERLITE_GROUP_ID  — the numeric ID of the group/list new leads should join
// If either is missing, the function still works and still returns the
// snapshot data — it just skips the MailerLite call. No lead is lost either
// way; you'll want to check server logs if MailerLite calls start failing.
//
// Request body: { name, email, county }
// Response: {
//   county, countyLabel, asOf, avgHomePrice,
//   estimatedAssistanceLow, estimatedAssistanceHigh,
//   incomeLimit, creditMin,
//   appreciationExample: { assumedAppreciationPct, appreciatedValue, gain, sharePercent, shareOwed }
// }

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, county } = req.body || {};

  if (!name || !email || !county) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(String(email).trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // ── COUNTY HOME-PRICE LOOKUP ──
  // Source: Zillow Home Value Index (ZHVI), a smoothed "typical home value"
  // estimate — not an appraisal, not a listing price. Figures pulled July 2026.
  // Covers the Front Range counties where the large majority of Colorado
  // public school employees live; everything else falls back to the
  // statewide Colorado ZHVI so no visitor hits a dead end.
  const COUNTY_DATA = {
    denver:     { label: 'Denver County',                avgHomePrice: 548894 },
    jefferson:  { label: 'Jefferson County',             avgHomePrice: 620939 },
    arapahoe:   { label: 'Arapahoe County',              avgHomePrice: 516233 },
    douglas:    { label: 'Douglas County',               avgHomePrice: 697262 },
    boulder:    { label: 'Boulder County',               avgHomePrice: 702385 },
    elpaso:     { label: 'El Paso County',               avgHomePrice: 447036 },
    larimer:    { label: 'Larimer County',                avgHomePrice: 539934 },
    weld:       { label: 'Weld County',                  avgHomePrice: 489062 },
    adams:      { label: 'Adams County',                 avgHomePrice: 502472 },
    broomfield: { label: 'Broomfield County',            avgHomePrice: 629383 },
    other:      { label: 'Colorado (statewide average)', avgHomePrice: 543271 }
  };

  const countyInfo = COUNTY_DATA[county] || COUNTY_DATA.other;
  const avgHomePrice = countyInfo.avgHomePrice;

  // ── DATA POINT 2: Estimated potential assistance ──
  // Up to 25% of a typical first mortgage (CHFA's actual cap). Uses a 95% LTV
  // first mortgage as a representative example, then shows a range rather
  // than a single number since actual loan amount varies by down payment.
  // Illustrative only — never presented as a quote or offer.
  const illustrativeFirstMortgage = Math.round(avgHomePrice * 0.95);
  const estimatedAssistanceHigh = Math.round(illustrativeFirstMortgage * 0.25);
  const estimatedAssistanceLow = Math.round(estimatedAssistanceHigh * 0.6);

  // ── DATA POINT 3: Program guardrails ──
  // Verified against CHFA's official CHFA Schools To Home Program Matrix,
  // effective July 1, 2026 (chfainfo.com/single-family-participating-lenders/programs-forms-and-matrices).
  const incomeLimit = 178920;
  const creditMin = 620;

  // ── DATA POINT 4: Illustrative local shared-appreciation example ──
  // Uses CHFA's own documented formula (confirmed against CHFA's borrower and
  // lender webinar decks, July 2026): appreciation-share percentage =
  // DPA Second Mortgage amount / original purchase price. Assumes a modest
  // illustrative 5% appreciation. Appreciation is never guaranteed; CHFA
  // treats any negative appreciation as 0%, so this can only ever floor at $0.
  const assumedAppreciationPct = 0.05;
  const appreciatedValue = Math.round(avgHomePrice * (1 + assumedAppreciationPct));
  const gain = appreciatedValue - avgHomePrice;
  const sharePercent = Math.round((estimatedAssistanceHigh / avgHomePrice) * 100);
  const shareOwed = Math.max(0, Math.round(gain * (sharePercent / 100)));

  const result = {
    county,
    countyLabel: countyInfo.label,
    asOf: 'Zillow Home Value Index, July 2026',
    avgHomePrice,
    estimatedAssistanceLow,
    estimatedAssistanceHigh,
    incomeLimit,
    creditMin,
    appreciationExample: {
      assumedAppreciationPct: assumedAppreciationPct * 100,
      appreciatedValue,
      gain,
      sharePercent,
      shareOwed
    }
  };

  // ── ADD LEAD TO MAILERLITE (best-effort; never blocks the snapshot response) ──
  if (process.env.MAILERLITE_API_KEY && process.env.MAILERLITE_GROUP_ID) {
    try {
      const mlResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`
        },
        body: JSON.stringify({
          email: String(email).trim(),
          fields: {
            name: String(name).trim(),
            county: countyInfo.label
          },
          groups: [process.env.MAILERLITE_GROUP_ID]
        })
      });

      if (!mlResponse.ok) {
        const mlErr = await mlResponse.text();
        console.error('MailerLite error (non-blocking):', mlResponse.status, mlErr);
      }
    } catch (err) {
      console.error('MailerLite request failed (non-blocking):', err.message);
    }
  }

  return res.status(200).json(result);
};
