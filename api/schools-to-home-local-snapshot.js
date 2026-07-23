// Hero HomeReach — CHFA Schools To Home LOCAL SNAPSHOT lead-capture API
// Vercel Serverless Function: /api/schools-to-home-local-snapshot.js

module.exports = async function handler(req, res) {

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

  const illustrativeFirstMortgage = Math.round(avgHomePrice * 0.95);
  const estimatedAssistanceHigh = Math.round(illustrativeFirstMortgage * 0.25);
  const estimatedAssistanceLow = Math.round(estimatedAssistanceHigh * 0.6);

  const incomeLimit = 178920;
  const creditMin = 620;

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
