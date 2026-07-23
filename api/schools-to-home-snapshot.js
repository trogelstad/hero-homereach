// Hero HomeReach — CHFA Schools To Home Opportunity Snapshot API
// Vercel Serverless Function: /api/schools-to-home-snapshot.js
//
// Drop this file into your existing /api/ folder alongside quiz-results.js.
// No new environment variable needed — it reuses the ANTHROPIC_API_KEY
// already configured in Vercel for quiz-results.js.
//
// Called from: blog/chfa-schools-to-home-colorado/index.html
// Request body: { schoolEmployment, roleCategory, incomeRange, creditRange, resultHint }
// Response: { result: "<personalized snapshot text>" }

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { schoolEmployment, roleCategory, incomeRange, creditRange, resultHint } = req.body || {};

  if (!schoolEmployment || !incomeRange || !creditRange) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ── READABLE MAPPINGS (no PII, categorical only) ──
  const employmentMap = {
    yes: 'a full-time employee of a Colorado public-school organization',
    no: 'not currently a full-time employee of a Colorado public-school organization',
    unsure: 'not sure whether their employer is classified as an eligible Colorado public-school organization'
  };

  const roleMap = {
    teacher: 'a classroom teacher',
    para: 'a paraprofessional',
    transport: 'a transportation or bus-driving role',
    facilities: 'a facilities or custodial role',
    food: 'a food-services role',
    counseling: 'a counseling or student-services role',
    admin: 'an administrative role',
    other: 'another school role',
    '': 'a school role they did not specify'
  };

  const incomeMap = {
    under100: 'a household income under $100,000',
    '100-140': 'a household income between $100,000 and $140,000',
    '140-178920': 'a household income between $140,001 and the current $178,920 statewide limit',
    above178920: 'a household income above the current $178,920 statewide limit',
    unsure: 'uncertainty about which income is counted toward the program limit'
  };

  const creditMap = {
    '660plus': 'a credit profile at 660 or higher',
    '620-659': 'a credit profile between 620 and 659',
    under620: 'a credit profile below 620',
    unknown: 'an unknown credit profile at this time'
  };

  const resultHintMap = {
    A: 'Several parts of their snapshot line up with the current starting guidelines.',
    B: 'One part of their snapshot, likely the income or credit picture, or the employer classification, deserves a closer look before drawing any conclusions.',
    C: 'They indicated they are not currently a full-time Colorado public-school employee, so Schools To Home specifically may not be the first program to explore, though other Colorado paths may be relevant.'
  };

  // ── SYSTEM PROMPT ──
  const systemPrompt = `You are Hero HomeReach, a Colorado homebuyer education resource for public-school employees. You are not a lender, broker, government agency, or underwriting system. You do not determine eligibility, approval, qualification, or final program fit.

Write a short, personalized "Schools To Home Snapshot" reacting to the reader's answers about CHFA Schools To Home, a Colorado shared-appreciation second-mortgage assistance program for full-time public-school employees. Write it like a knowledgeable, warm friend who just reviewed their situation. Not a robot. Not a salesperson.

CRITICAL RULES:
- Discuss ONLY CHFA Schools To Home. Do not mention any other down payment program, lender, company, or benefit network by name.
- Never say the reader qualifies, is approved, is guaranteed, is pre-qualified, is denied, or is ineligible. Do not use the words "qualified," "eligible," "ineligible," "approved," or "denied" anywhere in your response.
- Never use phrases like "free money," "no cash needed," "claim your benefit," "maximum assistance," or "every program you qualify for."
- Use careful, hedged language: "may be worth exploring," "could be relevant," "based on what you shared," "worth discussing with Hero HomeReach."
- Make clear that final numbers and terms depend on program rules, credit, income, employer classification, and lender review, without listing those as a checklist.
- Never tell the reader to contact, call, or ask a lender as a next step. Hero HomeReach is the first conversation, not a lender.
- End with exactly one warm, clear invitation to book a free Hero HomeReach consultation.
- Keep the entire response under 120 words, as 2 to 4 short sentences.
- Do not use markdown, bullet points, or headers. Plain prose only.
- Reference their specific school role and whichever guideline (income or credit) is most relevant, naturally, without sounding like a form summary.`;

  // ── USER MESSAGE ──
  const userMessage = `Write a personalized Schools To Home Snapshot for a reader who shared:
Employment: They are ${employmentMap[schoolEmployment] || 'in an unspecified employment situation'}.
School role: They described their role as ${roleMap[roleCategory] || roleMap['']}.
Income: They shared ${incomeMap[incomeRange] || 'an unspecified income range'}.
Credit: They shared ${creditMap[creditRange] || 'an unspecified credit range'}.

Context to weave in naturally, do not quote this verbatim: ${resultHintMap[resultHint] || resultHintMap.B}

Write warm, flowing prose only. No markdown, no bullets, no headers. End with a natural invitation to book a free Hero HomeReach consultation.`;

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
        max_tokens: 300,
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
