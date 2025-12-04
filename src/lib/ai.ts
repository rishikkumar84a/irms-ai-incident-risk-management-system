import OpenAI from 'openai';
import { Severity } from '@prisma/client';

// Lazy initialization to avoid build errors when OPENAI_API_KEY is not set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
}

export interface IncidentAnalysisInput {
    title: string;
    description: string;
    category?: string;
    department?: string;
}

export interface IncidentAnalysisResult {
    suggestedSeverity: Severity;
    summary: string;
    recommendedActions: string[];
}

export async function analyzeIncident(input: IncidentAnalysisInput): Promise<IncidentAnalysisResult> {
    const { title, description, category, department } = input;

    const systemPrompt = `You are an expert incident management analyst. Your role is to analyze workplace and operational incidents and provide:
1. A severity assessment (LOW, MEDIUM, HIGH, or CRITICAL)
2. A concise executive summary (2-3 sentences)
3. 3-5 specific, actionable recommended actions

Base your analysis on:
- Potential impact on operations, safety, and business continuity
- Urgency of response required
- Scope of affected parties or systems
- Regulatory or compliance implications

Respond in valid JSON format only.`;

    const userPrompt = `Analyze this incident:

Title: ${title}
Description: ${description}
${category ? `Category: ${category}` : ''}
${department ? `Department: ${department}` : ''}

Provide your analysis in the following JSON format:
{
  "suggestedSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "2-3 sentence executive summary",
  "recommendedActions": ["action 1", "action 2", "action 3", "action 4", "action 5"]
}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        const parsed = JSON.parse(content);

        // Validate and normalize severity
        const validSeverities: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const severity = validSeverities.includes(parsed.suggestedSeverity)
            ? parsed.suggestedSeverity
            : 'MEDIUM';

        return {
            suggestedSeverity: severity as Severity,
            summary: parsed.summary || 'Unable to generate summary.',
            recommendedActions: Array.isArray(parsed.recommendedActions)
                ? parsed.recommendedActions.slice(0, 5)
                : ['Review the incident details and assess impact'],
        };
    } catch (error) {
        console.error('AI analysis error:', error);

        // Return a fallback response if AI fails
        return {
            suggestedSeverity: 'MEDIUM',
            summary: 'AI analysis is temporarily unavailable. Please manually assess this incident.',
            recommendedActions: [
                'Review incident details thoroughly',
                'Assess potential impact on operations',
                'Identify affected parties and systems',
                'Determine immediate response requirements',
                'Document findings and escalate if necessary',
            ],
        };
    }
}

export interface RiskMitigationInput {
    title: string;
    description: string;
    category: string;
    likelihood: string;
    impact: string;
}

export interface RiskMitigationResult {
    mitigationSuggestions: string[];
}

export async function suggestRiskMitigation(input: RiskMitigationInput): Promise<RiskMitigationResult> {
    const { title, description, category, likelihood, impact } = input;

    const systemPrompt = `You are an expert risk management consultant. Your role is to analyze operational and business risks and suggest effective mitigation strategies.

Consider:
- Preventive controls
- Detective controls
- Corrective actions
- Risk transfer options
- Acceptance criteria

Provide practical, implementable suggestions.`;

    const userPrompt = `Analyze this risk and suggest mitigation strategies:

Title: ${title}
Description: ${description}
Category: ${category}
Likelihood: ${likelihood}
Impact: ${impact}

Provide 4-6 specific mitigation strategies in JSON format:
{
  "mitigationSuggestions": ["strategy 1", "strategy 2", ...]
}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        const parsed = JSON.parse(content);

        return {
            mitigationSuggestions: Array.isArray(parsed.mitigationSuggestions)
                ? parsed.mitigationSuggestions.slice(0, 6)
                : ['Develop and implement appropriate controls'],
        };
    } catch (error) {
        console.error('AI mitigation suggestion error:', error);

        return {
            mitigationSuggestions: [
                'Implement preventive controls to reduce likelihood',
                'Establish monitoring mechanisms for early detection',
                'Develop contingency plans for risk occurrence',
                'Consider risk transfer through insurance or contracts',
                'Document risk acceptance criteria if mitigation is not feasible',
            ],
        };
    }
}
