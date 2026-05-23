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

function rulesBasedEstimate(params: {
  projectName: string; projectType: string; builtUpArea: number;
  floors: number; quality: string; location: string;
}) {
  const area = params.builtUpArea;
  const rateMap: Record<string, { lo: number; hi: number }> = {
    economy: { lo: 1200, hi: 1500 },
    standard: { lo: 1500, hi: 2000 },
    premium: { lo: 2000, hi: 3000 },
  };
  const band = rateMap[params.quality.toLowerCase()] ?? rateMap.standard;
  const ratePerSqft = Math.round((band.lo + band.hi) / 2);
  const constructionCost = Math.round(area * ratePerSqft);
  const mepCost = Math.round(constructionCost * 0.13);
  const finishingCost = Math.round(constructionCost * 0.12);
  const professionalFees = Math.round(constructionCost * 0.04);
  const approvalCost = Math.round(constructionCost * 0.03);
  const contingency = Math.round(constructionCost * 0.05);
  const totalBudget = constructionCost + mepCost + finishingCost + professionalFees + approvalCost + contingency;
  return {
    constructionCost, mepCost, finishingCost, professionalFees,
    approvalCost, contingency, totalBudget,
    ratePerSqft: Math.round(totalBudget / area),
    explanation: `Rule-based estimate for ${params.quality} grade construction in ${params.location}, Gujarat at ₹${ratePerSqft}/sqft (2024-25 market rates). AI models were unavailable; this uses standard industry percentages.`,
    assumptions: [
      `${params.quality.charAt(0).toUpperCase() + params.quality.slice(1)} grade finish at ₹${band.lo}–${band.hi}/sqft`,
      'MEP at 13%, finishing at 12%, contingency at 5% of construction cost',
      'Gujarat 2024-25 market rates applied',
    ],
  };
}

// POST /api/ai/estimate-budget
router.post('/estimate-budget', async (req: Request, res: Response) => {
  const { projectName, projectType, builtUpArea, floors, quality, location, notes } = req.body;

  if (!projectName || !builtUpArea || !floors || !quality || !location) {
    return res.status(400).json({ success: false, message: 'Missing required fields: projectName, builtUpArea, floors, quality, location' });
  }

  const area = Number(builtUpArea);
  const numFloors = Number(floors);

  if (env.openRouter.apiKey) {
    const prompt = buildPrompt({ projectName, projectType: projectType || 'residential', builtUpArea: area, floors: numFloors, quality, location, notes });

    let response;
    let usedModel = FALLBACK_MODELS[0];

    for (const model of FALLBACK_MODELS) {
      usedModel = model;
      try {
        response = await callOpenRouter(model, prompt);
        break;
      } catch (err: unknown) {
        const { status } = extractError(err);
        const retryable = status === 402 || status === 429 || status === 451 || status === 502 || status === 503;
        if (!retryable) break;
      }
    }

    if (response) {
      try {
        const content = response.data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const estimate = JSON.parse(jsonMatch[0]);
          const required = ['constructionCost', 'mepCost', 'finishingCost', 'totalBudget', 'ratePerSqft', 'explanation'];
          if (required.every((f) => estimate[f] !== undefined)) {
            return res.json({
              success: true,
              data: { ...estimate, model: usedModel, inputParams: { projectName, projectType, builtUpArea, floors, quality, location } },
            });
          }
        }
      } catch {
        // fall through to rules-based
      }
    }
  }

  // Rules-based fallback — always works, no external dependency
  const estimate = rulesBasedEstimate({ projectName, projectType: projectType || 'residential', builtUpArea: area, floors: numFloors, quality, location });
  return res.json({
    success: true,
    data: { ...estimate, model: 'rules-based', inputParams: { projectName, projectType, builtUpArea, floors, quality, location } },
  });
});

export default router;
