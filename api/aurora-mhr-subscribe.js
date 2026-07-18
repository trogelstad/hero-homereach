// /api/aurora-mhr-subscribe.js
//
// Vercel serverless function. Receives lead-capture form submissions from the
// Aurora Minor Home Repair page and adds/updates the subscriber in MailerLite
// via the MailerLite Connect API (https://developers.mailerlite.com/api/subscribers).
//
// SETUP REQUIRED before this works — see MHR_LEAD_CAPTURE_SETUP.md:
//   1. Create custom fields in MailerLite named exactly: "Repair Type", "Lead Source", "Landing Page URL"
//   2. Create a MailerLite group called "Aurora MHR Alert List" and copy its Group ID
//   3. In Vercel: Project Settings → Environment Variables, add:
//        MAILERLITE_API_KEY       = (generate at dashboard.mailerlite.com/integrations/api)
//        MAILERLITE_AURORA_GROUP_ID = (the group ID from step 2)
//   4. Redeploy so the env vars take effect.

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  // CORS / method guard — this endpoint only accepts same-origin POSTs from the site.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  body = body || {};

  const {
    email,
    first_name,
    zip,
    repair_type,
    phone,
    source,
    page_url,
    website, // honeypot — real users never fill this in
  } = body;

  // Honeypot tripped: pretend success so the bot doesn't learn anything, but
  // never call MailerLite with this submission.
  if (website && String(website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_AURORA_GROUP_ID;

  if (!apiKey || !groupId) {
    console.error('Missing MAILERLITE_API_KEY or MAILERLITE_AURORA_GROUP_ID env vars');
    return res.status(500).json({ error: 'Lead capture is not fully configured yet.' });
  }

  // Field keys below must match the auto-generated "key" MailerLite assigns
  // when the field is created (lowercase, spaces → underscores). Confirm the
  // exact keys via GET https://connect.mailerlite.com/api/fields after creating
  // them, and adjust here if they don't match.
  const fields = {};
  if (first_name) fields.name = String(first_name).trim();
  if (phone) fields.phone = String(phone).trim();
  if (zip) fields.zip = String(zip).trim();
  if (repair_type) fields.repair_type = String(repair_type).trim();
  if (source) fields.lead_source = String(source).trim();
  if (page_url) fields.landing_page_url = String(page_url).trim();

  try {
    const mlRes = await fetch(MAILERLITE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: String(email).trim(),
        fields,
        groups: [groupId],
      }),
    });

    const data = await mlRes.json().catch(() => ({}));

    if (!mlRes.ok) {
      console.error('MailerLite API error', mlRes.status, data);
      return res.status(400).json({
        error: 'We could not add you to the list. Please try again.',
        detail: data && data.message ? data.message : undefined,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('MailerLite request failed', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
};
