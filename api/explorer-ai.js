// Hero HomeReach — Explorer AI API
// Vercel Serverless Function: /api/explorer-ai.js
// Mirrors the quiz-results.js pattern exactly.
// Takes: regionId, professionChip, situationChips[], question
// Returns: { result: "plain-English educational response" }

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { regionId, regionTitle, professionChip, situationChips, question } = req.body;

  if (!regionId || !regionTitle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ── PROFESSION LABELS ──
  const professionLabels = {
    veteran:      'a veteran, active-duty military member, or military spouse',
    educator:     'a K-12 teacher, educator, or school staff member',
    responder:    'a first responder (police, firefighter, EMT, or paramedic)',
    healthcare:   'a healthcare professional or nurse',
    other:        'a Colorado public service professional'
  };

  // ── SITUATION LABELS ──
  const situationLabels = {
    'cash-to-close':  'trying to reduce cash needed to close',
    'va-loan':        'using or considering a VA loan',
    'first-time':     'a first-time homebuyer',
    'refinance':      'planning to refinance within five years',
    'rural':          'considering a rural or smaller-community property',
    'education':      'unsure about homebuyer education requirements'
  };

  const profLabel = professionLabels[professionChip] || 'a Colorado homebuyer';
  const sitLabels = (situationChips || [])
    .map(s => situationLabels[s])
    .filter(Boolean);
  const sitContext = sitLabels.length > 0
    ? `Their specific situation: ${sitLabels.join(', ')}.`
    : '';

  const userQuestion = question && question.trim().length > 10
    ? `Their specific question: "${question.trim()}"`
    : '';

  // ── APPROVED PROGRAM CONTEXT BY REGION ──
  // Only programs relevant to the selected region are surfaced.
  // This mirrors the quiz eligiblePrograms gate pattern exactly.
  const regionPrograms = {
    'statewide': [
      'CHFA down payment assistance may be worth reviewing through a CHFA participating lender if credit, income, loan type, homebuyer education, and program rules fit.',
      'Chenoa Fund may be worth discussing with an FHA-approved lender as a national DPA option.',
      'Seller concessions may help reduce cash needed at closing depending on loan type, offer strategy, and lender limits.',
      'VA Home Loan benefits may be relevant for eligible veterans and active-duty buyers. VA loans may allow zero down payment, but closing costs and funding fees may still apply.',
      'CHAC low-interest second mortgage may help fill a small gap when primary assistance falls short, but requires 1% personal savings and a mandatory counseling session.',
      'Homebuyer education is required for most Colorado assistance programs. The right course depends on which program is being used.'
    ],
    'chfa': [
      'CHFA down payment assistance may be worth reviewing through a CHFA participating lender.',
      'CHFA offers income limits that vary by household size, and a targeted area map in the FAQ section that may allow higher limits for some property addresses.',
      'CHFA Schools To Home is scheduled to launch July 2026 for eligible Colorado teachers with a shared appreciation structure.',
      'CHFA Mortgage Credit Certificate may be worth asking about as a separate annual tax benefit alongside a CHFA first mortgage.',
      'Homebuyer education is required for CHFA programs. The course and provider must be confirmed with the lender before registering.'
    ],
    'chac': [
      'CHAC provides a low-interest second mortgage that must be repaid. It is not a grant.',
      'CHAC requires at least 1% of the purchase price in personal savings, not gift funds.',
      'CHAC requires a mandatory one-on-one counseling session by phone after conditional loan commitment, in addition to the standard homebuyer education class.',
      'CHAC may stack with CHFA and seller credits to fill small financial gaps when primary assistance is not enough.',
      'CHAC income limit is 80% AMI for the county and household size.'
    ],
    'denver-metro': [
      'metroDPA may provide assistance as a percentage of the first mortgage amount through approved Front Range lenders. It is a repayable second mortgage, not a grant.',
      'metroDPA will not subordinate on refinance. The full balance becomes due as a lump sum if the buyer refinances, moves out, or converts to rental.',
      'VA buyers may be able to direct metroDPA assistance entirely toward allowable closing costs since the VA loan covers the down payment. This is undermarketed and worth asking for specifically.',
      'CHFA statewide programs may be available as an alternative or complement to metroDPA depending on income and loan type.',
      'Seller concessions may help reduce cash needed at closing and may be combinable with assistance programs depending on lender approval.',
      'CHFA Mortgage Credit Certificate may be worth asking about as a separate tax benefit.'
    ],
    'metrodpa': [
      'metroDPA may provide assistance as a percentage of the first mortgage note amount through approved participating lenders.',
      'metroDPA is a repayable second mortgage. It has no monthly payments but must be repaid in full on refinance, sale, or move-out.',
      'VA buyers may be able to direct metroDPA assistance entirely toward allowable closing costs. This is a significant and undermarketed strategy.',
      'metroDPA uses a flat income limit regardless of household size, unlike CHFA which adjusts by household size.',
      'Everyone on the Title or Warranty Deed must complete homebuyer education for metroDPA, even if they are not on the loan.'
    ],
    'boulder-longmont': [
      'CHFA statewide programs may be available but Boulder-area home prices can push against CHFA purchase price limits.',
      'CHFA targeted areas may offer higher income and purchase price limits for some Boulder County addresses. Check the CHFA FAQ section for the targeted area map.',
      'Local city and county programs in Boulder may exist for income-qualified buyers but availability changes throughout the year.',
      'Employer-related assistance through school districts, hospitals, or public agencies may be worth asking about for qualifying employees.'
    ],
    'douglas-county': [
      'Douglas County Housing Partnership may be worth exploring for buyers purchasing in Douglas County.',
      'metroDPA may also be available as a Front Range path depending on property location and lender review.',
      'CHFA statewide programs may be available as a starting point.',
      'Seller concessions may help reduce cash needed at closing depending on loan type and contract.'
    ],
    'pikes-peak': [
      'CHFA statewide programs may be worth exploring with a participating lender.',
      'VA Home Loan benefits may be highly relevant for military and veteran buyers near Peterson SFB and Fort Carson.',
      'Seller concessions may help cover allowable closing costs under VA loan rules.',
      'Local nonprofit or city and county housing resources in El Paso County may be worth checking before assuming no local assistance exists.'
    ],
    'northern-colorado': [
      'CHFA statewide programs may be a useful starting point for Larimer and Weld County buyers.',
      'metroDPA may apply in parts of the northern Front Range depending on the specific property location.',
      'USDA rural loan eligibility may apply for properties in outer communities. Property address eligibility must be verified first.',
      'Seller concessions may help reduce cash needed at closing.'
    ],
    'western-slope': [
      'HomesFund provides assistance through a shared appreciation model for buyers in La Plata, Montezuma, Archuleta, San Juan, and Dolores counties only.',
      'HomesFund requires in-person homebuyer education. Online courses are not accepted.',
      'HomesFund requires buyers to demonstrate they can save 5% of gross monthly income after all expenses including the new mortgage.',
      'HomesFund counts all adults over 18 in the household toward income limits.',
      'CHFA statewide programs may also be available in Southwest Colorado as an alternative to HomesFund.',
      'USDA rural loan eligibility may apply in parts of Southwest Colorado.'
    ],
    'mountain': [
      'Local workforce housing programs may be available in mountain communities but often come with deed restrictions, resale limitations, or shared appreciation terms.',
      'CHFA statewide programs may still be a baseline option depending on income limits and property location.',
      'Employer-related assistance may be available through resort operators, school districts, or hospitals in some mountain communities.',
      'Buyers should ask about deed restrictions and resale rules before making an offer on any workforce housing.'
    ],
    'rural-usda': [
      'USDA loan eligibility depends on the specific property address, not just the general area. Rural does not automatically mean USDA-eligible.',
      'CHFA statewide programs may pair with certain loan types through participating lenders.',
      'Seller concessions may help with allowable closing costs depending on loan type.',
      'USDA income limits consider the entire household, not just the borrower.'
    ],
    'southern-colorado': [
      'CHFA statewide programs may be a useful starting point for Pueblo-area buyers.',
      'USDA rural loan eligibility may apply for properties outside city limits. Property address verification is the first step.',
      'VA Home Loan benefits may be relevant for eligible military and veteran buyers.',
      'Local Pueblo-area housing resources may exist and are worth verifying directly before assuming none are available.'
    ],
    'chenoa': [
      'Chenoa Fund may be worth discussing with an FHA-approved lender who participates in the program as a national DPA option.',
      'Chenoa Fund is not a Colorado-specific program and requires lender participation.',
      'The assistance structure and repayment terms vary by product within the Chenoa Fund program.',
      'Homebuyer education requirements may apply depending on borrower credit profile.'
    ],
    'education': [
      'Homebuyer education is required for most Colorado assistance programs but the right course depends on the specific program.',
      'metroDPA requires education for everyone on the Title, not just the borrower on the loan.',
      'CHFA requires education for every borrower on the Note.',
      'HomesFund requires in-person education only. Online courses are not accepted.',
      'CHAC requires a standard class plus a separate mandatory one-on-one counseling session.',
      'CHFA Schools To Home for teachers requires the standard class plus an additional Understanding Your Financial Commitment course.'
    ],
    'va-strategy': [
      'VA Home Loan benefits may eliminate the down payment requirement for eligible veterans and active-duty buyers, but closing costs, prepaids, and the VA funding fee may still apply.',
      'metroDPA assistance may be directed entirely toward allowable closing costs for VA buyers since the down payment is already covered. This is undermarketed and worth asking for specifically.',
      'Seller concessions may cover additional allowable closing costs under VA loan rules.',
      'CHFA Mortgage Credit Certificate may be available alongside a VA loan as a separate annual tax benefit.',
      'Some lenders redirect veterans away from state DPA programs because VA covers down payment. Ask specifically whether metroDPA is available with your VA loan.'
    ],
    'seller-credits': [
      'Seller concessions may help reduce cash needed at closing but must follow loan-type rules and contract limits.',
      'Seller credits on VA loans must follow VA allowable cost rules.',
      'Seller credits may pair with assistance programs when permitted by the lender and program rules.',
      'The contract, appraisal, and lender review can all affect whether seller credits are usable as planned.'
    ]
  };

  const programs = regionPrograms[regionId] || regionPrograms['statewide'];
  const programContext = programs
    .map((p, i) => `${i + 1}. ${p}`)
    .join('\n');

  // ── SYSTEM PROMPT ──
  const systemPrompt = `You are the Hero HomeReach Colorado Assistance Explorer educational assistant. Hero HomeReach is a Colorado homebuyer education resource for public service professionals. You are not a lender, broker, realtor, government agency, or underwriting system. You do not determine eligibility, approval, qualification, or final program fit.

Your job is to provide a plain-English educational brief based on the user's selected region, profession, situation, and question. Write like a knowledgeable, trustworthy advisor who knows Colorado homebuyer programs deeply, not a robot and not a salesperson.

CRITICAL RULES:
- Use ONLY the approved program paths listed in the context below. Do not mention any program, company, or benefit not listed there.
- NEVER mention Teacher Next Door, Homes for Heroes, Nurse Next Door, Hero Home Loans, NeighborhoodLIFT, Colorado Community Hero Program, or any private referral or commission-based program.
- Never say the user is approved, guaranteed, prequalified, or definitely qualifies.
- Never use: "free money," "guaranteed," "maximum assistance," "claim your benefit," "no cash needed," "every program you qualify for."
- Use careful language: "may be worth exploring," "could be relevant," "worth asking about," "depending on eligibility and program rules."
- Always make clear that final options depend on credit, income, location, loan type, property, available funding, lender review, and program rules.
- Keep the response under 280 words.
- Use short paragraphs. Two to four sentences each.
- No markdown, no bullet points, no headers, no numbered lists in the response.
- Sound warm, plain-English, specific to their situation, and genuinely useful.
- End with a natural one-sentence invitation to book a free Hero Strategy Session at Hero HomeReach.`;

  // ── USER MESSAGE ──
  const userMessage = `The user is exploring the "${regionTitle}" section of the Colorado Assistance Explorer.

They are: ${profLabel}.
${sitContext}
${userQuestion}

Based only on the approved program context below, write a plain-English educational brief that is specific to their profession and situation. Prioritize the paths most relevant to who they are. If they are military or veteran, lead with VA stacking strategies. If they are an educator, lead with CHFA and the upcoming Schools To Home program. If they are a first responder, lead with Colorado Champions and CHFA.

APPROVED PROGRAM CONTEXT FOR THIS REGION:
${programContext}

Write warm flowing prose only. No bullets, no markdown, no headers. End with a natural invitation to book a free Hero Strategy Session.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
    console.error('Explorer AI error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
