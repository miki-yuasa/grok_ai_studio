/**
 * Hook Optimizer - AI-powered hook generation and evolutionary refinement
 * Uses multiple AI "personas" to simulate focus group scoring
 */

import { generateWithGrok } from "./grok";

// Types
export interface Hook {
  id: string;
  type: "text" | "video";
  content: string;
  score: number;
  reasoning: string;
  generation: number;
  parentIds?: string[];
}

export interface FocusGroupScore {
  persona: string;
  score: number;
  feedback: string;
}

export interface HookWithScores extends Hook {
  focusGroupScores: FocusGroupScore[];
  avgScore: number;
}

export interface EvolutionResult {
  generation: number;
  hooks: HookWithScores[];
  bestHook: HookWithScores;
  improvement: number;
}

// Demographic personas for the AI focus group
const FOCUS_GROUP_PERSONAS = [
  {
    name: "GenZ_TikTok_Native",
    description: "18-24 year old, heavy TikTok user, values authenticity and humor, short attention span, responds to trends and memes",
    weight: 1.2,
  },
  {
    name: "Millennial_Professional",
    description: "28-38 year old, career-focused, values efficiency and quality, moderate social media user, responds to aspirational content",
    weight: 1.0,
  },
  {
    name: "GenX_Skeptic",
    description: "42-55 year old, skeptical of ads, values substance over style, prefers clear value propositions, dislikes hype",
    weight: 0.9,
  },
  {
    name: "Content_Creator",
    description: "Active content creator, highly aware of trends and formats, appreciates creative hooks, values shareability",
    weight: 1.1,
  },
  {
    name: "Casual_Scroller",
    description: "Average social media user, scrolls quickly, needs immediate visual/emotional hook, low engagement threshold",
    weight: 1.3,
  },
];

/**
 * Generate a unique ID for hooks
 */
function generateHookId(): string {
  return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate initial hooks using Grok
 */
export async function generateHooks(
  campaignDetails: string,
  targetAudience: string,
  hookType: "text" | "video" | "both",
  count: number = 50
): Promise<Hook[]> {
  const hooks: Hook[] = [];
  const countPerType = hookType === "both" ? Math.ceil(count / 2) : count;

  const systemPrompt = `You are an expert viral content creator specializing in scroll-stopping hooks. Your goal is to create the first 3 seconds of content that makes people STOP scrolling. 

Key principles:
- Pattern interrupt: Do something unexpected
- Curiosity gap: Create an open loop
- Emotional trigger: Hit a nerve immediately
- Visual hook (for video): Strong opening frame
- Specificity: Concrete details > vague claims`;

  // Generate text hooks
  if (hookType === "text" || hookType === "both") {
    const textPrompt = `Generate ${countPerType} unique text hooks (tweet openers) for this campaign:

Campaign: ${campaignDetails}
Target Audience: ${targetAudience}

Each hook should be:
- Under 100 characters (first line only)
- Designed to stop scrolling in the first 3 seconds
- Different angle/approach for each

Output as JSON array:
[
  {"content": "hook text here", "reasoning": "why this works"}
]

Generate exactly ${countPerType} hooks. Be creative and diverse in approaches.`;

    try {
      const response = await generateWithGrok(systemPrompt, textPrompt, 0.9);
      const parsed = JSON.parse(response);
      
      if (Array.isArray(parsed)) {
        parsed.forEach((h: any) => {
          hooks.push({
            id: generateHookId(),
            type: "text",
            content: h.content || h.text || "",
            score: 0,
            reasoning: h.reasoning || "",
            generation: 1,
          });
        });
      }
    } catch (error) {
      console.error("Error generating text hooks:", error);
    }
  }

  // Generate video hooks
  if (hookType === "video" || hookType === "both") {
    const videoPrompt = `Generate ${countPerType} unique 3-second video hook concepts for this campaign:

Campaign: ${campaignDetails}
Target Audience: ${targetAudience}

Each hook should describe:
- Opening frame visual (what viewer sees first)
- Motion/action in first 3 seconds
- Audio hook (if applicable)
- Why it stops scrolling

Output as JSON array:
[
  {"content": "detailed video hook concept", "reasoning": "why this visual hook works"}
]

Generate exactly ${countPerType} video concepts. Focus on the FIRST 3 SECONDS only.`;

    try {
      const response = await generateWithGrok(systemPrompt, videoPrompt, 0.9);
      const parsed = JSON.parse(response);
      
      if (Array.isArray(parsed)) {
        parsed.forEach((h: any) => {
          hooks.push({
            id: generateHookId(),
            type: "video",
            content: h.content || h.text || "",
            score: 0,
            reasoning: h.reasoning || "",
            generation: 1,
          });
        });
      }
    } catch (error) {
      console.error("Error generating video hooks:", error);
    }
  }

  return hooks;
}

/**
 * Score a hook using AI focus group simulation
 */
export async function scoreHook(
  hook: Hook,
  campaignDetails: string,
  targetAudience: string
): Promise<HookWithScores> {
  const focusGroupScores: FocusGroupScore[] = [];

  // Score with each persona
  for (const persona of FOCUS_GROUP_PERSONAS) {
    const systemPrompt = `You are simulating a focus group participant with this profile:
${persona.description}

You are evaluating advertising hooks for scroll-stop effectiveness.`;

    const scorePrompt = `Rate this ${hook.type} hook for a campaign targeting: ${targetAudience}

Campaign: ${campaignDetails}

Hook: "${hook.content}"

As ${persona.name}, would you stop scrolling for this?

Respond with JSON only:
{
  "score": <1-100 integer, where 100 = definitely stop scrolling>,
  "feedback": "<brief 1-sentence reaction as this persona>"
}`;

    try {
      const response = await generateWithGrok(systemPrompt, scorePrompt, 0.7);
      const parsed = JSON.parse(response);
      
      focusGroupScores.push({
        persona: persona.name,
        score: Math.min(100, Math.max(1, parsed.score || 50)) * persona.weight,
        feedback: parsed.feedback || "",
      });
    } catch (error) {
      console.error(`Error scoring with ${persona.name}:`, error);
      focusGroupScores.push({
        persona: persona.name,
        score: 50 * persona.weight,
        feedback: "Scoring failed",
      });
    }
  }

  // Calculate weighted average
  const totalWeight = FOCUS_GROUP_PERSONAS.reduce((sum, p) => sum + p.weight, 0);
  const avgScore = focusGroupScores.reduce((sum, s) => sum + s.score, 0) / totalWeight;

  return {
    ...hook,
    score: Math.round(avgScore),
    focusGroupScores,
    avgScore: Math.round(avgScore * 10) / 10,
  };
}

/**
 * Score multiple hooks in batch
 */
export async function scoreHooks(
  hooks: Hook[],
  campaignDetails: string,
  targetAudience: string
): Promise<HookWithScores[]> {
  // Process in parallel with rate limiting
  const batchSize = 5;
  const results: HookWithScores[] = [];

  for (let i = 0; i < hooks.length; i += batchSize) {
    const batch = hooks.slice(i, i + batchSize);
    const scored = await Promise.all(
      batch.map((hook) => scoreHook(hook, campaignDetails, targetAudience))
    );
    results.push(...scored);
  }

  return results.sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * Evolve hooks through mutation and crossover
 */
export async function evolveHooks(
  scoredHooks: HookWithScores[],
  campaignDetails: string,
  targetAudience: string,
  currentGeneration: number
): Promise<Hook[]> {
  // Sort by score
  const sorted = [...scoredHooks].sort((a, b) => b.avgScore - a.avgScore);
  
  // Keep top 50%
  const survivors = sorted.slice(0, Math.ceil(sorted.length / 2));
  
  // Generate new hooks through mutation and crossover
  const newHooks: Hook[] = [];
  const targetCount = scoredHooks.length - survivors.length;

  const systemPrompt = `You are an expert at improving advertising hooks through creative iteration. 
Your goal is to take successful hooks and make them even more effective at stopping scrolling.`;

  // Mutation: Take top performers and create variations
  const mutationPrompt = `Here are the top-performing hooks from the previous generation:

${survivors.slice(0, 5).map((h, i) => `${i + 1}. "${h.content}" (Score: ${h.avgScore}/100)`).join("\n")}

Campaign: ${campaignDetails}
Target: ${targetAudience}

Create ${targetCount} NEW hook variations by:
1. Combining elements from multiple successful hooks
2. Amplifying what made them work
3. Trying unexpected twists on the winning themes
4. Testing different emotional angles

Output as JSON array:
[
  {"content": "new hook text", "reasoning": "how this improves on the originals", "parentIndices": [0, 2]}
]

The hooks should be the same type as the originals (${survivors[0]?.type || "text"}).`;

  try {
    const response = await generateWithGrok(systemPrompt, mutationPrompt, 0.95);
    const parsed = JSON.parse(response);
    
    if (Array.isArray(parsed)) {
      parsed.forEach((h: any) => {
        const parentIndices = h.parentIndices || [];
        newHooks.push({
          id: generateHookId(),
          type: survivors[0]?.type || "text",
          content: h.content || "",
          score: 0,
          reasoning: h.reasoning || "",
          generation: currentGeneration + 1,
          parentIds: parentIndices.map((i: number) => survivors[i]?.id).filter(Boolean),
        });
      });
    }
  } catch (error) {
    console.error("Error evolving hooks:", error);
  }

  // Combine survivors with new hooks
  const evolvedHooks = [
    ...survivors.map((h) => ({
      id: h.id,
      type: h.type,
      content: h.content,
      score: h.score,
      reasoning: h.reasoning,
      generation: h.generation,
      parentIds: h.parentIds,
    })),
    ...newHooks,
  ];

  return evolvedHooks;
}

/**
 * Run a full evolution cycle
 */
export async function runEvolutionCycle(
  scoredHooks: HookWithScores[],
  campaignDetails: string,
  targetAudience: string,
  currentGeneration: number
): Promise<EvolutionResult> {
  // Evolve hooks
  const evolvedHooks = await evolveHooks(
    scoredHooks,
    campaignDetails,
    targetAudience,
    currentGeneration
  );

  // Score the new generation
  const newScored = await scoreHooks(
    evolvedHooks,
    campaignDetails,
    targetAudience
  );

  // Find best hook
  const bestHook = newScored.reduce((best, current) =>
    current.avgScore > best.avgScore ? current : best
  );

  // Calculate improvement
  const prevBestScore = scoredHooks.reduce(
    (best, current) => Math.max(best, current.avgScore),
    0
  );
  const improvement = bestHook.avgScore - prevBestScore;

  return {
    generation: currentGeneration + 1,
    hooks: newScored,
    bestHook,
    improvement,
  };
}

/**
 * Get evolution history summary
 */
export function summarizeEvolution(
  history: EvolutionResult[]
): {
  totalGenerations: number;
  startScore: number;
  endScore: number;
  totalImprovement: number;
  improvementRate: number;
} {
  if (history.length === 0) {
    return {
      totalGenerations: 0,
      startScore: 0,
      endScore: 0,
      totalImprovement: 0,
      improvementRate: 0,
    };
  }

  const startScore = history[0].hooks[0]?.avgScore || 0;
  const endScore = history[history.length - 1].bestHook.avgScore;
  const totalImprovement = endScore - startScore;

  return {
    totalGenerations: history.length,
    startScore: Math.round(startScore),
    endScore: Math.round(endScore),
    totalImprovement: Math.round(totalImprovement),
    improvementRate:
      startScore > 0
        ? Math.round((totalImprovement / startScore) * 100)
        : 0,
  };
}

