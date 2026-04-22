// ============================================================
// Hero HomeReach — Quiz Results API
// Vercel Serverless Function: /api/quiz-results.js
//
// This function acts as a secure proxy between the quiz frontend
// and the Anthropic Claude API. The API key never touches the browser.
//
// Setup:
// 1. In Vercel dashboard → Settings → Environment Variables
// 2. Add: ANTHROPIC_API_KEY = your_key_here
// 3. Redeploy
// ============================================================

export default async function handler(req, res) {

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://herohomereach.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { firstName, profession, credit, income, timeline } = req.body;

  // Validate required fields
  if (!firstName || !profession || !credit || !income || !timeline) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ── MAP ANSWER VALUES TO READABLE LABELS ──
  const professionMap = {
    educator:   'a K-12 teacher, educator, or school staff member',
    responder:  'a first responder (police, firefighter, EMT, or paramedic)',
    healthcare: 'a healthcare professional or nurse',
    military:   'an active duty service member, veteran, or military spouse',
    other:      'a public service professional'
  };
  const creditMap = {
    '660plus':  '660 or higher',
    '620to659': '620 to 659',
    '600to619': '600 to 619',
    'under600': 'below 600',
    'unsure':   'unknown at this time'
  };
  const incomeMap = {
    'under126': 'under $126,000',
    '126to174': 'between $126,000 and $174,000',
    '174to210': 'between $174,000 and $210,150',
    'over210':  'over $210,150',
    'unsure':   'unknown at this time'
  };
  const timelineMap = {
    'asap':     'as soon as possible (within 1–3 months)',
    '3to6':     'within 3 to 6 months',
    'research': 'still researching, 6+ months out'
  };

  const profLabel   = professionMap[profession] || profession;
  const creditLabel = creditMap[credit] || credit;
  const incomeLabel = incomeMap[income] || income;
  const timeLabel   = timelineMap[timeline] || timeline;

  // ── SYSTEM PROMPT ──
  const systemPrompt = `You are Trent Rogelstad, founder of Hero HomeReach™ — a Colorado homeownership education and guidance service built specifically for teachers, first responders, healthcare workers, and military members. You are warm, expert, trustworthy, and direct. You never use jargon without explanation. You never make guarantees or lending promises.

Your job is to write a short, personalized homeownership program assessment for a Colorado hero based on their quiz answers. Write it like a knowledgeable friend who just reviewed their situation — not like a robot, not like a salesperson.

IMPORTANT RULES:
- Always use the person's first name naturally (once or twice, not excessively)
- Never say they are "approved", "guaranteed", "prequalified", or "eligible for" any specific amount
- Always use soft language: "may qualify", "based on your answers", "worth exploring", "a strong candidate to review"
- Keep it under 350 words
- Use short paragraphs — no walls of text
- End with exactly ONE clear next step: booking a free consultation
- Do not use bullet points or markdown — write in clean flowing prose
- Do not include a subject line or greeting like "Dear" — start directly with their name or a personal opener
- Sound human, warm, and mission-driven

COLORADO PROGRAM KNOWLEDGE (use this accurately):
- CHFA True Grant: 3% of purchase price, never repaid, requires 620+ FICO, statewide
- CHFA Deferred Loan: 4% deferred, repaid at sale/refi, 620+ FICO, statewide
- CHFA FirstGeneration: up to $25,000, for first-generation homebuyers, income limit $174,440
- MetroDPA: up to 6% forgiven after 36 months, Denver Metro/Front Range, requires 640+ FICO, income limit $210,150
- Chenoa Fund: up to 5% forgivable after 36 payments, accepts 600+ FICO, NO income limit, national
- Teacher Next Door: $8,000 true grant + up to $15,000 DPA, covers teachers, nurses, first responders, military, government — NO income limit
- HUD Good Neighbor Next Door: 50% off HUD foreclosures, $100 down, for teachers, police, firefighters, EMTs
- NeighborhoodLIFT: up to $15,000 flat grant, essential workers
- Colorado Community Hero Program: specialized for firefighters, teachers, law enforcement, healthcare, military
- Homes for Heroes: 0.7% post-closing rebate, all hero professions
- VA Loan: 0% down for military/veterans, stackable with Colorado state programs
- Seller concessions: FHA allows up to 6% (up to $24,000 on $400K home)
- Maximum stack example: Teacher Next Door Grant ($8K) + TND DPA ($15K) + Chenoa Fund ($20K) + Seller Concessions ($24K) = $67,000 on a $400K FHA purchase

TONE GUIDANCE BY SITUATION:
- Credit under 600: Be encouraging, not discouraging. Explain it's fixable. Give a hopeful path forward.
- Military: Always mention VA loan + Colorado stack opportunity
- Educator: Lead with Teacher Next Door
- Healthcare: Lead with TND (covers nurses) + Chenoa (no income limit)
- First responder: Lead with MetroDPA + TND + HUD GNND
- High income (over $210K): Focus on no-income-limit programs (TND, Chenoa, Homes for Heroes)
- ASAP timeline: Use a slightly stronger CTA tone
- Research phase: Use softer, educational tone`;

  // ── USER MESSAGE ──
  const userMessage = `Please write a personalized homeownership program assessment for:

Name: ${firstName}
Profession: ${profLabel}
Estimated credit score: ${creditLabel}
Estimated household income: ${incomeLabel}
Buying timeline: ${timeLabel}

Write the assessment now. Do not include any markdown formatting, bullet points, or headers. Just warm, expert, flowing prose. End with a clear, natural invitation to book a free 30-minute consultation at Hero HomeReach.`;

  try {
    // ── CALL CLAUDE API ──
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [
          { role: 'user', content: userMessage }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return res.status(500).json({ error: 'Failed to generate result' });
    }

    const data = await response.json();
    const resultText = data.content?.[0]?.text || '';

    return res.status(200).json({ result: resultText });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error — please try again' });
  }
}
