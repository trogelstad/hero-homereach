// Hero HomeReach — Quiz Results API
// Vercel Serverless Function: /api/quiz-results.js

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, profession, credit, income, timeline } = req.body;

  if (!firstName || !profession || !credit || !income || !timeline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const profMap = {
    educator: 'a K-12 teacher, educator, or school staff member',
    responder: 'a first responder (police, firefighter, EMT, or paramedic)',
    healthcare: 'a healthcare professional or nurse',
    military: 'an active duty service member, veteran, or military spouse',
    other: 'a public service professional'
  };
  const creditMap = {
    '660plus': '660 or higher', '620to659': '620 to 659',
    '600to619': '600 to 619', 'under600': 'below 600', 'unsure': 'unknown at this time'
  };
  const incomeMap = {
    'under126': 'under $126,000', '126to174': 'between $126,000 and $174,000',
    '174to210': 'between $174,000 and $210,150', 'over210': 'over $210,150', 'unsure': 'unknown at this time'
  };
  const timelineMap = {
    'asap': 'as soon as possible (within 1-3 months)',
    '3to6': 'within 3 to 6 months',
    'research': 'still researching, 6+ months out'
  };

  // ── BUILD APPROVED PROGRAM PATHS ──
  // This controls exactly what Claude is allowed to mention.
  // Do not add any program here that is not a public assistance program.
  const eligiblePrograms = [];

  if (['660plus', '620to659'].includes(credit)) {
    eligiblePrograms.push(
      'CHFA down payment assistance may be worth reviewing if credit, income, loan type, homebuyer education, borrower contribution, and lender review fit CHFA program rules.'
    );
  }

  if (credit === '600to619') {
    eligiblePrograms.push(
      'Some assistance paths may still be worth discussing, but many Colorado programs use 620 as an important credit-score threshold. A readiness review may help clarify the best next step.'
    );
  }

  if (credit === 'under600') {
    eligiblePrograms.push(
      'A homebuyer readiness plan may be the best next step before narrowing specific down payment assistance options, since many programs and lenders use minimum credit-score requirements.'
    );
  }

  if (credit === 'unsure') {
    eligiblePrograms.push(
      'Checking your current credit score may be an important first step before narrowing down specific assistance options, since program rules often depend on credit score, loan type, and lender review.'
    );
  }

  if (profession === 'military') {
    eligiblePrograms.push(
      'VA Home Loan benefits may be relevant for eligible veterans, active-duty service members, and qualifying surviving spouses. VA loans may allow zero down payment, but closing costs, funding fees, and lender review may still apply.'
    );
  }

  if (profession === 'responder') {
    eligiblePrograms.push(
      'Colorado Champions / SB26-053 may be worth watching or discussing with a CHFA Participating Lender if you are an eligible first responder.'
    );
  }

  if (profession === 'educator') {
    eligiblePrograms.push(
      'Colorado educator shared-equity assistance under SB25-167 may be worth reviewing if you are an eligible Colorado public school employee using a CHFA first mortgage.'
    );
  }

  if (['educator', 'responder'].includes(profession)) {
    eligiblePrograms.push(
      'HUD Good Neighbor Next Door is a legitimate federal HUD program that may be relevant for eligible Pre-K–12 teachers, law enforcement officers, firefighters, and EMTs when qualifying HUD homes are available in eligible areas.'
    );
  }

  if (['660plus', '620to659', '600to619'].includes(credit)) {
    eligiblePrograms.push(
      'Chenoa Fund may be worth discussing with an FHA-approved lender as a national down payment assistance option. It is not a hero-specific program.'
    );
  }

  if (income !== 'over210') {
    eligiblePrograms.push(
      'metroDPA may be worth reviewing if you are buying in an eligible Front Range area and meet current income, credit, loan, location, and program rules.'
    );
  }

  if (income === 'over210') {
    eligiblePrograms.push(
      'Some income-limited down payment assistance programs may be less likely to fit if household income is above current limits, but seller concessions, VA benefits if applicable, and lender-specific strategies may still be worth reviewing.'
    );
  }

  eligiblePrograms.push(
    'Seller concessions may help reduce cash needed at closing depending on loan type, offer strategy, seller agreement, and lender limits.'
  );

  const approvedProgramPaths = eligiblePrograms
    .map((program, index) => `${index + 1}. ${program}`)
    .join('\n');

  // ── SYSTEM PROMPT ──
  const systemPrompt = `You are Hero HomeReach, a Colorado homebuyer education resource for public service professionals. You are not a lender, broker, realtor, government agency, or underwriting system. You do not determine eligibility, approval, qualification, loan terms, grant eligibility, or final program fit.

Write a short, personalized Hero Homebuyer Snapshot based on the user's answers. Write it like a knowledgeable, trustworthy friend who just reviewed their situation — warm, plain-English, and honest. Not a robot. Not a salesperson.

CRITICAL RULES:
- Use ONLY the approved program paths listed below. Do not mention any program, company, grant, lender, realtor network, or benefit program that is not listed in the approved program paths.
- NEVER mention Teacher Next Door, Homes for Heroes, Nurse Next Door, Hero Home Loans, NeighborhoodLIFT, Colorado Community Hero Program, private hero benefit networks, referral-fee programs, or commercial real estate benefit companies under any circumstances.
- Never say the user is approved, guaranteed, prequalified, eligible, or definitely qualifies.
- Never use phrases like "free money," "maximum assistance," "claim your benefit," "no cash needed," "no out-of-pocket," or "every program you qualify for."
- Use careful language: "may be worth reviewing," "could be relevant," "based on your answers," "may be a fit," and "worth discussing with a lender."
- Make clear that final options depend on program rules, credit, income, location, loan type, property, available funding, and lender review.
- Use the person's first name naturally once or twice.
- Keep it under 350 words.
- Use short paragraphs.
- Do not use markdown, bullet points, or headers.
- Sound warm, plain-English, trustworthy, and helpful.
- End with a natural invitation to book a free 30-minute Hero Strategy Session with Hero HomeReach.

APPROVED PROGRAM PATHS:
${approvedProgramPaths}`;

  // ── USER MESSAGE ──
  const userMessage = `Write a personalized Hero Homebuyer Snapshot for:
Name: ${firstName}
Profession: ${profMap[profession] || profession}
Credit score: ${creditMap[credit] || credit}
Household income: ${incomeMap[income] || income}
Buying timeline: ${timelineMap[timeline] || timeline}

Only discuss these approved program paths:
${approvedProgramPaths}

Write warm, flowing prose only. No markdown, no bullets, no headers. End with a natural invitation to book a free 30-minute Hero Strategy Session with Hero HomeReach.`;

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
        max_tokens: 600,
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
    return res.status(200).json({ result });

  } catch (err) {
    console.error('Function error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
