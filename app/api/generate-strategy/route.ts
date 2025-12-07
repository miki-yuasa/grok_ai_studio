import { NextRequest, NextResponse } from "next/server";
import { generateWithGrok, STRATEGY_SYSTEM_PROMPT } from "@/lib/grok";
import { AdStrategy, StrategyRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: StrategyRequest = await request.json();
    const { productUrl, competitorHandles, trendContext } = body;

    if (!productUrl) {
      return NextResponse.json(
        { error: "Product URL is required" },
        { status: 400 }
      );
    }

    // Build the user prompt
    const userPrompt = `Generate a comprehensive viral marketing strategy for X (Twitter) with the following parameters:

Product/Company URL: ${productUrl}
${
  competitorHandles
    ? `Competitor Handles: ${competitorHandles}`
    : "Competitor Handles: Not provided"
}
${
  trendContext
    ? `Current Trend Context: ${trendContext}`
    : "Current Trend Context: Analyze current viral trends on X"
}

Output the strategy as valid JSON matching this exact schema:
{
  "strategySummary": "A 2-sentence overview of the campaign angle.",
  "targetAudience": "Specific sub-culture or demographic.",
  "posts": [
    {
      "id": "post_1",
      "scheduledTime": "ISO String (start from tomorrow, spread over 7 days)",
      "content": "The main tweet text (engaging hook, no links, max 280 chars)",
      "replyContent": "The follow-up tweet containing the Call to Action and the LINK",
      "mediaType": "image" or "video",
      "mediaPrompt": "Detailed prompt for the AI generator (photorealistic for images, motion details for videos)",
      "predictedCTR": "e.g. 3.1%",
      "rationale": "Detailed reasoning: 'I chose this angle because [Trend X] is peaking, and it highlights [Feature Y].'",
      "status": "draft"
    }
  ]
}`;

    // Generate strategy using Grok
    const response = await generateWithGrok(
      STRATEGY_SYSTEM_PROMPT,
      userPrompt,
      0.7
    );

    // Parse the JSON response
    let strategy: AdStrategy;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) ||
        response.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      strategy = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse strategy JSON:", parseError);
      return NextResponse.json(
        { error: "Failed to parse strategy response", details: response },
        { status: 500 }
      );
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error("Error generating strategy:", error);
    return NextResponse.json(
      {
        error: "Failed to generate strategy",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
