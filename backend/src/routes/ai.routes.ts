import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.middleware';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

const SYSTEM_PROMPT = `You are an expert construction cost estimator for Gujarat, India with 20+ years of experience.
You provide accurate budget estimates based on current market rates (2024-2025).
Always respond with ONLY a valid JSON object — no markdown, no explanation outside the JSON.`;

function buildPrompt(params: {
  projectName: string;
  projectType: string;
  builtUpArea: number;
  floors: number;
  quality: string;
  location: string;
  notes?: string;
}): string {
  return `Estimate the total construction project budget for the following project in Gujarat, India.

Project Details:
- Name: ${params.projectName}
- Type: ${params.projectType} (residential/commercial/mixed)
- Total Built-up Area: ${params.builtUpArea} sq ft (this is the TOTAL area of the entire project — all units across all floors combined, not per flat/unit)
- Number of Floors: ${params.floors}
- Quality Grade: ${params.quality} (economy = basic finishes, standard = mid-range, premium = high-end)
- Location: ${params.location}, Gujarat
${params.notes ? `- Additional Notes: ${params.notes}` : ''}

Gujarat market rate guidelines (2024-2025):
- Economy: ₹1,200–1,500/sqft (structure)
- Standard: ₹1,500–2,000/sqft (structure)
- Premium: ₹2,000–3,000/sqft (structure)

Return ONLY this JSON structure with amounts in Indian Rupees (numbers only, no commas or currency symbols):
{
  "constructionCost": <structure + civil works>,
  "mepCost": <mechanical, electrical, plumbing — typically 12-15% of construction>,
  "finishingCost": <flooring, painting, doors/windows — typically 10-15%>,
  "professionalFees": <architect + consultants — typically 3-5%>,
  "approvalCost": <RERA, municipal, NOCs — typically 2-4%>,
  "contingency": <contingency reserve — typically 5%>,
  "totalBudget": <sum of all above>,
  "ratePerSqft": <totalBudget divided by builtUpArea>,
  "explanation": "<2-3 sentences explaining the estimate and key assumptions>",
  "assumptions": ["<assumption 1>", "<assumption 2>", "<assumption 3>"]
}`;
}

async function callOpenRouter(model: string, prompt: ReturnType<typeof buildPrompt>) {
  return axios.post(
    `${env.openRouter.baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${env.openRouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://foreverbuildcon.com',
        'X-Title': 'Forever Buildcon',
      },
      timeout: 80000,
    }
  );
}

// Fallback chain: try each model in order, skip on 429/502/503
const FALLBACK_MODELS = [
  env.openRouter.model,
  'deepseek/deepseek-chat:free',
  'deepseek/deepseek-r1:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

function extractError(err: unknown): { status?: number; message: string } {
  const e = err as { response?: { status?: number; data?: unknown }; message?: string };
  const status = e?.response?.status;
  const data = e?.response?.data as Record<string, unknown> | undefined;
  const errObj = data?.error as Record<string, unknown> | undefined;
  const raw = (errObj?.metadata as Record<string, unknown>)?.raw as string | undefined;
  const message = typeof errObj?.message === 'string' ? errObj.message
    : typeof data?.message === 'string' ? data.message
    : e?.message || 'AI estimation failed. Please try again.';
  return { status, message: raw || message };
}

// POST /api/ai/estimate-budget
router.post('/estimate-budget', async (req: Request, res: Response) => {
  const { projectName, projectType, builtUpArea, floors, quality, location, notes } = req.body;

  if (!projectName || !builtUpArea || !floors || !quality || !location) {
    return res.status(400).json({ success: false, message: 'Missing required fields: projectName, builtUpArea, floors, quality, location' });
  }

  if (!env.openRouter.apiKey) {
    return res.status(503).json({ success: false, message: 'OpenRouter API key not configured. Add OPENROUTER_API_KEY to backend .env file.' });
  }

  const prompt = buildPrompt({ projectName, projectType: projectType || 'residential', builtUpArea: Number(builtUpArea), floors: Number(floors), quality, location, notes });

  let response;
  let usedModel = FALLBACK_MODELS[0];
  let lastErr: { status?: number; message: string } = { message: 'AI estimation failed.' };

  for (const model of FALLBACK_MODELS) {
    usedModel = model;
    try {
      response = await callOpenRouter(model, prompt);
      break;
    } catch (err: unknown) {
      lastErr = extractError(err);
      const retryable = lastErr.status === 402 || lastErr.status === 429 || lastErr.status === 502 || lastErr.status === 503;
      if (!retryable) break;
    }
  }

  if (!response) {
    return res.status(500).json({ success: false, message: lastErr.message });
  }

  try {
    const content = response.data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle cases where model wraps in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ success: false, message: 'AI returned an unexpected response format. Try again.' });
    }

    const estimate = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const required = ['constructionCost', 'mepCost', 'finishingCost', 'totalBudget', 'ratePerSqft', 'explanation'];
    for (const field of required) {
      if (estimate[field] === undefined) {
        return res.status(502).json({ success: false, message: `AI response missing field: ${field}. Try again.` });
      }
    }

    return res.json({
      success: true,
      data: {
        ...estimate,
        model: usedModel,
        inputParams: { projectName, projectType, builtUpArea, floors, quality, location },
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return res.status(500).json({ success: false, message: e.message || 'Failed to parse AI response.' });
  }
});

export default router;
