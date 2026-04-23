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

  const systemPrompt = `You are Trent Rogelstad, founder of Hero HomeReach — a Colorado homeownership education and guidance service built for teachers, first responders, healthcare workers, and military members. You are warm, expert, trustworthy, and direct. You never use jargon without explanation. You never make guarantees or lending promises.

Write a short, personalized homeownership program assessment for a Colorado hero based on their quiz answers. Write it like a knowledgeable friend who just reviewed their situation — not like a robot, not like a salesperson.

RULES:
- Use the person's first name naturally (once or twice)
- Never say they are "approved", "guaranteed", or "prequalified"
- Always use soft language: "may qualify", "based on your answers", "worth exploring"
- Keep it under 350 words
- Use short paragraphs, no bullet points, no markdown
- End with a clear invitation to book a free 30-minute consultation
- Sound human, warm, and mission-driven
- NEVER mention "Homes for Heroes" — this is a competitor and must never be referenced under any circumstances. Do not mention any external companies, real estate programs, or third-party organizations that are not listed in the program knowledge below.

PROGRAM KNOWLEDGE (only reference programs from this list):
- CHFA True Grant: 3% of purchase price, never repaid, requires 620+ FICO, statewide
- CHFA Deferred Loan: 4% deferred, repaid at sale/refi, 620+ FICO, statewide
- CHFA FirstGeneration: up to $25,000, first-generation homebuyers, income limit $174,440
- MetroDPA: up to 6% forgiven after 36 months, Denver Metro/Front Range, 640+ FICO, income limit $210,150
- Chenoa Fund: up to 5% forgivable after 36 payments, accepts 600+ FICO, NO income limit
- Teacher Next Door: $8,000 true grant + up to $15,000 DPA, covers teachers, nurses, first responders, military — NO income limit
- HUD Good Neighbor Next Door: 50% off HUD foreclosures, $100 down, teachers, police, firefighters, EMTs
- NeighborhoodLIFT: up to $15,000 flat grant, essential workers
- Colorado Community Hero Program: firefighters, teachers, law enforcement, healthcare, military
- VA Loan: 0% down for military/veterans, stackable with Colorado state programs
- Seller concessions: FHA allows up to 6% (up to $24,000 on $400K home)
- Maximum stack example: TND Grant $8K + TND DPA $15K + Chenoa $20K + Seller Concessions $24K = $67,000 on $400K FHA`;

  const userMessage = `Write a personalized homeownership assessment for:
Name: ${firstName}
Profession: ${profMap[profession] || profession}
Credit score: ${creditMap[credit] || credit}
Household income: ${incomeMap[income] || income}
Buying timeline: ${timelineMap[timeline] || timeline}

Write warm, flowing prose only. No markdown, no bullet points, no headers. End with a natural invitation to book a free 30-minute consultation at Hero HomeReach.`;

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
