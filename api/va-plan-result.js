// Hero HomeReach — VA Homebuying Advantage Plan Result API
// Vercel Serverless Function: /api/va-plan-result.js
// Same pattern as /api/class-finder-result.js. System prompt built from Hero HomeReach
// programs.html verified figures (CHFA, metroDPA, Douglas County, Chenoa) and VA loan facts.

module.exports = async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    firstName,
    lastName,
    email,
    phone,
    region,
    priceRange,
    firstUse,
    disability,
    cashAvailable,
    priorities,
    priorityOther,
    lenderStatus
  } = req.body;

  if (!firstName || !email || !region || !priceRange || !firstUse || !disability || !cashAvailable || !lenderStatus) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ── SAVE LEAD TO MAILERLITE ──
  // Adds the buyer to the dedicated "VA Homebuying Plan" group, which triggers its own
  // duplicated automation (VA-specific email drip, separate from the general Quiz Subscribers
  // sequence). Follows the same env-var convention as /api/aurora-mhr-subscribe.js: the API key
  // and group ID both live in Vercel, not hardcoded here.
  //   MAILERLITE_API_KEY        = generate at dashboard.mailerlite.com/integrations/api
  //   MAILERLITE_VA_GROUP_ID    = 195708354622915891  (the "VA Homebuying Plan" group)
  // Runs in parallel with the AI call below and never blocks the buyer's plan from generating,
  // even if MailerLite is unreachable or the env vars aren't set yet.
  const saveLeadPromise = (async () => {
    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_VA_GROUP_ID;
    if (!apiKey || !groupId) {
      console.warn('MAILERLITE_API_KEY or MAILERLITE_VA_GROUP_ID not set, skipping lead save.');
      return;
    }
    try {
      const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          email: email,
          fields: {
            name: firstName,
            last_name: lastName || '',
            phone: phone || '',
            source: 'VA Homebuying Advantage Plan'
          },
          groups: [groupId]
        })
      });
      if (!mlRes.ok) {
        const mlErr = await mlRes.text();
        console.error('MailerLite error:', mlRes.status, mlErr);
      }
    } catch (mlErr) {
      console.error('MailerLite request failed:', mlErr.message);
    }
  })();

  const regionMap = {
    metro:   'the Denver Metro / Front Range area',
    douglas: 'Douglas County',
    rest:    'a part of Colorado outside the metro area',
    unsure:  'Colorado, region not yet decided'
  };

  const priceMap = {
    under350: 'under $350,000',
    b350_450: '$350,000 to $450,000',
    b450_550: '$450,000 to $550,000',
    b550_700: '$550,000 to $700,000',
    over700:  '$700,000 or more'
  };

  const cashMap = {
    under5k: 'under $5,000 currently available',
    b5_10:   '$5,000 to $10,000 currently available',
    b10_20:  '$10,000 to $20,000 currently available',
    over20:  '$20,000 or more currently available'
  };

  const priorityMap = {
    savings: 'protecting emergency savings',
    payment: 'keeping the monthly payment manageable',
    timing:  'moving by a target date',
    cash:    'minimizing cash needed to close'
  };

  const lenderStatusMap = {
    not_yet: 'has not talked with a lender or agent yet',
    talked:  'has talked with a lender or agent but has not committed',
    active:  'is already working with a lender or agent'
  };

  // ── "TAKE THIS WITH YOU": save the generated plan text to 5 MailerLite custom fields ──
  // so it can be included in the follow-up email via merge tags, and the plan survives
  // after the buyer closes the tab. Runs AFTER the Anthropic response, since the plan text
  // has to exist first, as a second upsert call on the same subscriber (same email, same
  // group, only the new fields differ). This never blocks or fails the buyer's response.
  //
  // IMPORTANT: MailerLite text fields cap at 1024 characters. The full 5-paragraph plan
  // easily exceeds that as one field (confirmed via a live 422 error), so each paragraph
  // is saved to its own field instead: va_plan_1 through va_plan_5. Each paragraph runs
  // roughly 60-100 words, comfortably under the limit on its own.
  //
  // Requires two one-time steps in MailerLite, done by Trent, not by this code:
  //   1. Create 5 custom text fields named exactly va_plan_1, va_plan_2, va_plan_3,
  //      va_plan_4, va_plan_5 (Subscribers > Fields > New field).
  //   2. Insert the {$va_plan_1} through {$va_plan_5} merge tags into Email 1's HTML in
  //      the "VA Homebuying Plan" automation, one per section card.
  // Timing note: this update call happens a few seconds after the base lead save above
  // (it has to wait on the Anthropic response). If Email 1 in that automation is set to
  // send with zero delay, it could theoretically send before these fields are populated.
  // Keep the 2-5 minute delay already added to Email 1 in the VA automation to guarantee
  // the fields are set by the time it sends.
  async function savePlanTextToMailerLite(planText) {
    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_VA_GROUP_ID;
    if (!apiKey || !groupId || !planText) return;
    try {
      const paragraphs = planText
        .split(/\n\n+/)
        .filter(function (p) { return p.trim(); })
        .map(function (p) { return p.trim(); });

      const fields = {};
      for (let i = 0; i < 5; i++) {
        fields['va_plan_' + (i + 1)] = (paragraphs[i] || '').slice(0, 1024);
      }

      const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          email: email,
          fields: fields,
          groups: [groupId]
        })
      });
      if (!mlRes.ok) {
        const mlErr = await mlRes.text();
        console.error('MailerLite plan-field update error:', mlRes.status, mlErr);
      }
    } catch (mlErr) {
      console.error('MailerLite plan-field update failed:', mlErr.message);
    }
  }

  const priorityLabels = Array.isArray(priorities)
    ? priorities.filter(function (p) { return p !== 'other'; }).map(function (p) { return priorityMap[p] || p; })
    : [];
  if (priorityOther && String(priorityOther).trim()) {
    priorityLabels.push(String(priorityOther).trim().slice(0, 200));
  }
  const priorityList = priorityLabels.length ? priorityLabels.join(', ') : 'no specific priority selected';

  const systemPrompt = `You are Hero HomeReach, a Colorado homebuyer education resource. You are not a lender, broker, government agency, or VA benefits administrator. You do not determine eligibility, confirm funding fee exemptions, or guarantee any assistance, approval, or loan terms.

Your job is to write a warm, specific, plain-English VA Homebuying Advantage Plan for a Colorado veteran, active-duty service member, or military spouse, based on their answers. Open by addressing them by first name with genuine enthusiasm about the VA loan's zero-down benefit, then move into the other opportunities and planning points worth their attention. Write like a knowledgeable, trusted friend who has done the research for them. Warm, direct, and genuinely useful. Never generic. Never vague.

CRITICAL RULES:
- Never say the buyer qualifies, is approved, is exempt, or is guaranteed anything.
- Never state an exact VA funding fee percentage as fact. Always frame it as something their lender confirms using their Certificate of Eligibility, since the fee depends on down payment, service history, and first use versus subsequent use.
- If the buyer receives VA disability compensation, say a funding fee exemption may apply and their lender verifies it, never state it as confirmed.
- Never use "free money," "claim," "approved," "you qualify," "guaranteed," or "$0 out of pocket."
- Always use careful language: "may," "could," "worth reviewing," "depending on the program," "your lender can confirm."
- Never mention Teacher Next Door, Homes for Heroes, Nurse Next Door, Hero Home Loans, NeighborhoodLIFT, or any private hero referral network.
- Be SPECIFIC. Reference actual program names and actual figures from the verified knowledge below, scaled to the buyer's own price range and region.
- Do not imply Hero HomeReach is the VA, a government agency, or a lender.
- Keep it under 480 words total, short paragraphs of roughly 60 to 100 words each. Plain flowing prose only. No markdown, no bullet characters, no headers.
- Structure your response as EXACTLY five paragraphs, separated by a single blank line, in this exact order and no other order: (1) their VA zero-down benefit and price range, with genuine enthusiasm, (2) cash they should still plan for given their price range and ways to potentially reduce it given what they have available, (3) which of the region-appropriate Colorado programs above are actually relevant to them, (4) a personal paragraph, opening with their first name again, that directly names one or two of the specific priorities they selected as mattering most right now, using their own words (for example "keeping your monthly payment manageable" or "moving by a target date"), connected to one concrete, accurate, hedged insight from the PRIORITY-SPECIFIC TALKING POINTS below, (5) a closing paragraph covering how their VA benefit status affects what to ask their lender, tailored to their lender status, ending with the invitation to book a free Hero Strategy Session. Do not add a sixth paragraph, do not merge these into fewer paragraphs, and do not add any paragraph before the first one.
- Never use a dash character. Use a comma instead.
- Never suggest talking to a lender as a standalone next step, anywhere in the plan. A free Hero HomeReach consultation must always come first, framed as preparation for that lender conversation.

HERO HOMEREACH ROUTING RULES:
- Never use "contact your lender," "call your lender today," or "talk to a lender" as a standalone closing action, anywhere in the plan. Any mention of a future lender conversation must be paired with, and come after, an invitation to a free Hero HomeReach consultation, framed as the way to get prepared for that lender conversation. Hero HomeReach is always the first call, never the lender alone.
- End with one warm, specific sentence inviting them to book a free Hero Strategy Session at herohomereach.com/contact.

VERIFIED PROGRAM KNOWLEDGE (from Hero HomeReach programs.html, 2026):

=== VA LOAN ===
- A VA loan may allow financing without a traditional down payment, subject to entitlement, eligibility, lender approval, property requirements, and appraisal.
- VA loans allow up to 4% in seller concessions, depending on the transaction and lender guidelines. This can help cover closing costs.
- The VA funding fee applies in most cases and varies based on down payment amount and whether this is the buyer's first use of the benefit or a subsequent use. Buyers receiving VA disability compensation may qualify for an exemption, subject to verification by the lender using the buyer's Certificate of Eligibility.
- Zero down does not mean zero cash. Buyers should still plan for earnest money, inspection, appraisal related costs, closing costs and prepaid items, moving costs, and a post closing reserve. As a rough educational planning range, combined closing costs often fall between 2% and 5% of the purchase price, though this varies by lender and transaction.

=== CHFA (statewide, can pair with a VA first mortgage) ===
- CHFA True Grant: 3% of the purchase price, never needs to be repaid. Requires FICO 620+, income limit up to $126,200 for the SmartStep program, must use a CHFA-approved lender.
- CHFA Deferred Second Mortgage: 4% of the purchase price, no monthly payment, repaid only upon sale or refinance. Works with FHA, VA, or conventional first mortgages.
- CHFA FirstStep/FirstGeneration: up to $25,000 for first-generation homebuyers, income limit up to $174,440.

=== metroDPA (Denver Metro / Front Range only) ===
- Up to 4% to 5% of the first mortgage loan amount, 0% interest, no monthly payments, repaid when the buyer sells, refinances, or stops using the home as a primary residence.
- Household income limit approximately $195,600 to $210,150. Minimum FICO around 620 to 640.
- Only relevant if the buyer is purchasing in the Denver Metro or Front Range area.

=== Douglas County Housing Partnership (Douglas County only) ===
- DCHP Standard: $15,000 second mortgage at a fixed 3% rate. Income at or below roughly $124,950. Purchase price cannot exceed $456,000.
- DCHP Shared Equity: up to $41,000, zero monthly payment, repaid via a share of the home's appreciation at sale.
- Only relevant if the buyer is purchasing in Douglas County.

=== Chenoa Fund ===
- A national program that requires FHA financing, not a VA loan. It is a separate path to consider only if the buyer is comparing FHA against VA, not something that stacks on top of a VA loan itself. 5% assistance, forgiven after 36 consecutive on-time payments, no income limit, FICO as low as 600.
- Only mention Chenoa Fund as a point of comparison if useful, and always note it pairs with FHA financing, not VA.

=== UNIVERSAL NOTES ===
- Program terms, income limits, and availability change and vary by lender and loan type. A Hero HomeReach consultation or a qualified lender can confirm what currently applies.
- CHFA and metroDPA and DCHP second mortgages can be paired with a VA first mortgage. Chenoa Fund cannot, since it requires FHA financing.

=== PRIORITY-SPECIFIC TALKING POINTS (use only in paragraph 4, only for priorities the buyer actually selected) ===
- Keeping the monthly payment manageable: several of the assistance programs above (CHFA Deferred Second Mortgage, metroDPA, DCHP Shared Equity) carry no monthly payment of their own, since they are repaid later at sale, refinance, or when the home is no longer the primary residence. That means real assistance may be layered in without adding to what is owed each month. Never state that assistance funds can be used to permanently buy down the interest rate itself, since that is program and lender specific and not confirmed here.
- Protecting emergency savings or minimizing cash needed to close: VA seller concessions (up to 4%) combined with the region-appropriate down payment assistance above can meaningfully reduce cash needed at closing, worth reviewing together.
- Moving by a target date: if they have not yet talked with a lender or agent, note that a free Hero HomeReach consultation is a good way to get organized and know what to ask before that first lender conversation, given the timeline. If they are already working with a lender or agent, acknowledge the timeline and note Hero HomeReach can help confirm nothing is being missed.
- Anything written in as "something else": respond directly and specifically to what they wrote, in their own words where natural.`;

  const userMessage = `Write a VA Homebuying Advantage Plan for this Colorado buyer:

First name: ${firstName}
Region: ${regionMap[region] || region}
Price range being considered: ${priceMap[priceRange] || priceRange}
First time using VA loan benefit: ${firstUse}
Receives VA disability compensation: ${disability}
Cash currently available for closing and moving costs: ${cashMap[cashAvailable] || cashAvailable}
What matters most right now: ${priorityList}
Lender or agent status: ${lenderStatusMap[lenderStatus] || lenderStatus}

Write exactly five paragraphs, separated by a single blank line. Paragraph 1: open with their first name and genuine enthusiasm about their VA zero down benefit and price range. Paragraph 2: cover what cash they may still want to plan for given their price range, and ways to potentially reduce it given what they have available. Paragraph 3: which of the region appropriate Colorado programs above are actually relevant to them (only mention metroDPA if they are in the Denver Metro or Front Range area, only mention DCHP if they are in Douglas County). Paragraph 4: open with their first name again and directly reference one or two of the specific priorities they said matter most right now (${priorityList}), using their own words, connected to one accurate, hedged insight from the PRIORITY-SPECIFIC TALKING POINTS above. Paragraph 5: how their VA benefit status (first use, disability compensation) affects what to ask their lender, tailored to their lender status (if they already have a lender or agent, frame Hero HomeReach as a helpful second opinion rather than a replacement; if they do not yet have a lender, invite them to a free Hero HomeReach consultation first as preparation before that lender conversation, never suggesting they simply talk to a lender on their own), ending with one sentence inviting them to book a free Hero Strategy Session at herohomereach.com/contact. Plain prose only, no bullets or headers, exactly five paragraphs. Under 480 words total.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 900,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', response.status, err);
      return res.status(500).json({ error: 'API error', status: response.status });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || '';

    // Make sure the lead save has finished before this function is frozen/terminated.
    // Its own try/catch above means a MailerLite failure never throws here.
    await saveLeadPromise;

    // Save the generated plan text to MailerLite so the "Take This With You" follow-up
    // email can include it. Never blocks or fails the buyer's response.
    await savePlanTextToMailerLite(result).catch(function () {});

    return res.status(200).json({ result });

  } catch (err) {
    console.error('Function error:', err.message);
    await saveLeadPromise.catch(function () {});
    return res.status(500).json({ error: err.message });
  }
};
