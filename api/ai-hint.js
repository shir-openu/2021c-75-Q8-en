// api/ai-hint.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_ATTEMPTS = 10;

// Helper function to call OpenRouter API
async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to call Google Gemini API
async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export default async function handler(req, res) {
  // CORS headers - simple approach matching DF_7 for reliability
  res.setHeader('Access-Control-Allow-Origin', 'https://shir-openu.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, currentStep, problemData, conversationHistory } = req.body;

  // Check attempt limit
  if (conversationHistory && conversationHistory.length >= MAX_ATTEMPTS) {
    return res.status(200).json({
      hint: `You have used all ${MAX_ATTEMPTS} attempts. Here is the full solution:\n\n` + problemData.fullSolution
    });
  }

  try {
    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'google';

    // Build conversation history text
    let conversationText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(turn => {
        conversationText += `Student answer: ${turn.user}\nTeacher response: ${turn.ai}\n\n`;
      });
    }

const prompt = `
# CRITICAL INSTRUCTIONS
1. Respond in ENGLISH only
2. Be PRACTICAL and SPECIFIC - give concrete mathematical guidance
3. Keep responses 2-4 sentences
4. Use gender-neutral language (plural forms)
5. NEVER give the complete final answer until ${MAX_ATTEMPTS} attempts exhausted
6. NEVER repeat the same hint - check conversation history and progress
7. NEVER put quotes around equations - write them directly without '' or "" marks
8. ACCEPT ANY MATHEMATICALLY EQUIVALENT FORM of the correct answer

---

# The Exercise: 2×2 Variable-Coefficient System (Euler-type) with Reduction of Order
# (Exam 2021c, Moed 75, Question 8)

## The Problem:

**Part A - Homogeneous system** (find solution with t^alpha component):
dx/dt = (3/t)x - 4ty
dy/dt = (1/t^3)x + (5/t)y

**Part B - Non-homogeneous system** (find all solutions):
dx/dt = (3/t)x - 4ty + 5t^3
dy/dt = (1/t^3)x + (5/t)y - 4t

## COMPLETE SOLUTIONS (your reference):

**Step 1 - Homogeneous Solution (Power Ansatz):**
- Try x = at^alpha, y = bt^beta
- From equation structure: alpha = beta + 2
- Try beta = 3, alpha = 5: get a = -2b
- Choose b = 1: a = -2
- ANSWER: alpha = 5, beta = 3, solution = [-2t^5, t^3]^T

**Step 2 - Set Up Substitution (Reduction of Order):**
- Using known solution [-2t^5, t^3], define: x = xi - 2t^5*eta, y = t^3*eta
- Substitute into non-homogeneous system
- After simplification, get two scalar ODEs:
- ANSWER: dxi/dt = (5/t)*xi - 3t^3 and deta/dt = t^(-6)*xi - 4t^(-2)
- Coefficient of xi in first eq: 5 (i.e., 5/t)
- Power of t multiplying xi in second eq: -6 (i.e., t^(-6))

**Step 3 - Solve xi Equation:**
- First-order linear ODE: dxi/dt - (5/t)*xi = -3t^3
- Integrating factor: mu = t^(-5)
- (t^(-5)*xi)' = -3t^(-2)
- Integrate: t^(-5)*xi = 3t^(-1) + A
- ANSWER: xi = 3t^4 + At^5 (c1 = 3)

**Step 4 - Solve eta Equation:**
- Substitute xi: deta/dt = t^(-6)(3t^4 + At^5) - 4t^(-2)
- Simplify: deta/dt = -t^(-2) + At^(-1)
- Integrate: eta = t^(-1) + A*ln(t) + B
- ANSWER: coefficient of t^(-1) is 1 (c2 = 1)

**Step 5 - General Solution (Substitute Back):**
- x = xi - 2t^5*eta with A=B=0: x = 3t^4 - 2t^4 = t^4
- y = t^3*eta with A=B=0: y = t^3*t^(-1) = t^2
- ANSWER: particular solution x_p = t^4, y_p = t^2 (powers: 4 and 2)

**General Solution:**
x(t) = t^4 + A(t^5 - 2t^5*ln t) - 2Bt^5
y(t) = t^2 + At^3*ln t + Bt^3

---

## Current Step: ${currentStep}
## Expected Answer: ${problemData.correctAnswer}
## Student Input: ${userInput}

${conversationText ? `## Previous Conversation:\n${conversationText}` : ''}

---

# SPECIFIC HINTS BY STEP (give progressively):

## If Step 1 (homogeneous solution - power ansatz):
- Hint 1: "Try a solution of the form x = at^alpha, y = bt^beta. Substitute into the homogeneous system."
- Hint 2: "From the equation structure, all terms must have the same power. This gives alpha = beta + 2."
- Hint 3: "Try beta = 3, alpha = 5. Substitute and verify the equations hold."
- Hint 4: "From equation 1: 5a = 3a - 4b, i.e. a = -2b. With b = 1: the solution is [-2t^5, t^3]^T."

## If Step 2 (substitution setup):
- Hint 1: "Define x = xi - 2t^5*eta, y = t^3*eta and differentiate using the product rule."
- Hint 2: "Substitute dx/dt and dy/dt into the non-homogeneous system and simplify. The homogeneous terms cancel."
- Hint 3: "The first equation for xi: dxi/dt = (5/t)*xi - 3t^3."
- Hint 4: "The second equation for eta: deta/dt = t^(-6)*xi - 4t^(-2)."

## If Step 3 (solve xi equation):
- Hint 1: "This is a first-order linear equation. Find an integrating factor."
- Hint 2: "The integrating factor is mu = e^{-int(5/t)dt} = t^(-5)."
- Hint 3: "Multiply by t^(-5): d/dt(t^(-5)*xi) = -3t^(-2). Integrate."
- Hint 4: "xi = 3t^4 + At^5. The coefficient c1 is 3."

## If Step 4 (solve eta equation):
- Hint 1: "Substitute xi = 3t^4 + At^5 into the eta equation and simplify."
- Hint 2: "deta/dt = t^(-6)(3t^4 + At^5) - 4t^(-2) = 3t^(-2) + At^(-1) - 4t^(-2) = -t^(-2) + At^(-1)."
- Hint 3: "Integrate term by term: int(-t^(-2))dt = t^(-1) and int(At^(-1))dt = A*ln(t)."
- Hint 4: "eta = t^(-1) + A*ln(t) + B. The coefficient of t^(-1) is 1."

## If Step 5 (general solution):
- Hint 1: "Substitute back x = xi - 2t^5*eta, y = t^3*eta. The particular solution is obtained when A = B = 0."
- Hint 2: "With A=B=0: xi = 3t^4, eta = t^(-1). Substitute and find x and y."
- Hint 3: "x = 3t^4 - 2t^5*t^(-1) = 3t^4 - 2t^4 = t^4."
- Hint 4: "y = t^3*t^(-1) = t^2. The particular solution is [t^4, t^2]^T."

# COMMON ERRORS TO CHECK:
- Wrong relationship between alpha and beta (should be alpha = beta + 2)
- Wrong sign in the coefficient a (should be a = -2b, not a = 2b)
- Forgetting to use product rule when differentiating x = xi - 2t^5*eta
- Wrong integrating factor (should be t^(-5), not t^5)
- Sign error in integration of -t^(-2) (integral is t^(-1), not -t^(-1))
- Forgetting that the constant A in eta is the SAME A from xi

# YOUR RESPONSE:
1. If CORRECT: "Correct! [brief confirmation]" and encourage next step
2. If INCORRECT: Identify the specific error and give the appropriate hint from above
3. If student asks for help/hint: Give the next hint in progression
4. After 3+ attempts: Give more explicit guidance, show intermediate steps
`;

    // Call the appropriate AI provider
    let hint;
    if (aiProvider === 'openrouter') {
      hint = await callOpenRouter(prompt);
    } else {
      // Default to Google Gemini
      hint = await callGemini(prompt);
    }

    return res.status(200).json({ hint, provider: aiProvider });

  } catch (error) {
    console.error('AI API Error:', error);
    const aiProvider = process.env.AI_PROVIDER || 'google';
    return res.status(500).json({
      error: 'Error processing the request. Please try again.',
      provider: aiProvider,
      details: error.message
    });
  }
}
