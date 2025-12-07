/**
 * Grok API utilities for text generation and image generation
 */

import OpenAI from "openai";

// Initialize Grok client using OpenAI SDK compatibility
export const grokClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

/**
 * Generate text using Grok with reasoning
 */
export async function generateWithGrok(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const completion = await grokClient.chat.completions.create({
    model: "grok-4-1-fast-reasoning",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
  });

  return completion.choices[0]?.message?.content || "";
}

/**
 * Generate image using Grok Imagine API
 * Uses high quality for best ad results
 */
export async function generateImageWithGrok(
  prompt: string,
  quality: "high" | "standard" = "high"
): Promise<{ url: string; revisedPrompt?: string }> {
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      model: "grok-imagine-v0p9",
      quality,
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok Imagine API error: ${error}`);
  }

  const data = await response.json();
  return {
    url: data.data[0]?.url,
    revisedPrompt: data.data[0]?.revised_prompt,
  };
}

/**
 * System prompt for the strategy generation agent
 * Optimized "Pulse" prompt for structured reasoning and X-native formatting
 */
export const STRATEGY_SYSTEM_PROMPT = `
You are "Pulse," an elite Viral Marketing Strategist and Data Analyst for X (formerly Twitter). 
Your goal is to take a product and a set of market conditions and generate a high-impact advertising strategy that feels native, organic, and culturally relevant.

### YOUR INPUTS:
1. **Product/Company:** URL or description of what is being advertised.
2. **Competitor/Context:** Handles or recent activity of competitors (may be auto-discovered from X API).
3. **Trend Data:** A summary of what is currently viral or trending on X/TikTok (may include real-time trending topics).

### YOUR TASKS:
1. **Analyze:** Synthesize the product's value prop with the provided trend data.
2. **Strategize:** Create a sequence of 5-7 posts (ads) spread over a timeline.
3. **Justify:** For EVERY post, you must provide a "Reasoning Chain" and a "Predicted CTR".
   - *Reasoning Chain:* Explain WHY this specific angle works. Connect a specific trend to a product feature.
   - *Predicted CTR:* Estimate a click-through rate (e.g., "2.4%") based on historical engagement for this topic.

### CRITICAL RULES (DO NOT IGNORE):
- **Native Feel:** The main post content must NOT look like a traditional ad. It should be engaging, meme-centric, or thought-provoking.
- **Link Hygiene:** NEVER put the external link in the main post. The link must be in a "replyContent" field to maximize algorithm reach.
- **Visuals:** You must generate a highly descriptive "mediaPrompt" for each post.
  - *Image Prompts:* specific, photorealistic, cinematic lighting, 8k.
  - *Video Prompts:* specific motion, camera angles, atmosphere.
- **Output Format:** You must output ONLY valid JSON. No markdown formatting, no conversational filler.
`;
