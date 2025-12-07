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
 * Generate text using Grok with vision support (images + text)
 */
export async function generateWithGrokVision(
  systemPrompt: string,
  userPrompt: string,
  images: string[] = [],
  temperature: number = 0.7
): Promise<string> {
  // Build content array with images and text
  const userContent: Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string; detail: "high" | "low" | "auto" };
  }> = [];

  // Add images first
  for (const imageData of images) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: imageData, // Already in base64 format from frontend
        detail: "high",
      },
    });
  }

  // Add text prompt
  userContent.push({
    type: "text",
    text: userPrompt,
  });

  const completion = await grokClient.chat.completions.create({
    model: "grok-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent as any },
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
2. **Target Market/Audience:** Specific demographics, interests, and behaviors of the target audience (if provided).
3. **Campaign Details:** Specific campaign goals, context, and objectives (if provided).
4. **Competitor/Context:** Handles or recent activity of competitors (may be auto-discovered from X API).
5. **Trend Data:** A summary of what is currently viral or trending on X/TikTok (may include real-time trending topics).
6. **Supplementary Images:** Product/service images for visual analysis (if provided).

### YOUR TASKS:
1. **Analyze:** Synthesize ALL provided information including target audience, campaign details, product features, trend data, and visual assets.
2. **Strategize:** Create a sequence of 5-7 posts (ads) spread over a timeline that DIRECTLY addresses the specified target market and campaign objectives.
3. **Strategy Summary:** Create a 2-sentence overview that EXPLICITLY mentions the target audience (if provided), campaign goals (if provided), and the core campaign angle. Make it clear how the strategy aligns with the user's specific requirements.
4. **Justify:** For EVERY post, you must provide a "Reasoning Chain" and a "Predicted CTR".
   - *Reasoning Chain:* Explain WHY this specific angle works. Connect trends to product features AND target audience preferences.
   - *Predicted CTR:* Estimate a click-through rate (e.g., "2.4%") based on historical engagement for this topic and audience.

### CRITICAL RULES (DO NOT IGNORE):
- **Native Feel:** The main post content must NOT look like a traditional ad. It should be engaging, meme-centric, or thought-provoking.
- **Link Hygiene:** NEVER put the external link in the main post. The link must be in a "replyContent" field to maximize algorithm reach.
- **Visuals:** You must generate a highly descriptive "mediaPrompt" for each post.
  - *Image Prompts:* specific, photorealistic, cinematic lighting, 8k.
  - *Video Prompts:* specific motion, camera angles, atmosphere.
- **Output Format:** You must output ONLY valid JSON. No markdown formatting, no conversational filler.
`;
