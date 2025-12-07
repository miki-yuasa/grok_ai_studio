import { NextRequest, NextResponse } from "next/server";
import {
  generateWithGrok,
  generateWithGrokVision,
  STRATEGY_SYSTEM_PROMPT,
} from "@/lib/grok";
import { AdStrategy, StrategyRequest } from "@/lib/types";
import { discoverCompetitors, getTrendingTopics } from "@/lib/x-api";
import { calculateCampaignMetrics } from "@/lib/metrics";

export async function POST(request: NextRequest) {
  try {
    const body: StrategyRequest = await request.json();
    let {
      productUrl,
      budget,
      competitorHandles,
      trendContext,
      targetMarket,
      campaignDetails,
      supplementaryImages,
    } = body;

    if (!productUrl) {
      return NextResponse.json(
        { error: "Product URL is required" },
        { status: 400 }
      );
    }

    if (!budget || budget <= 0) {
      return NextResponse.json(
        { error: "Valid budget is required" },
        { status: 400 }
      );
    }

    // Auto-discover competitors if not provided
    if (!competitorHandles && process.env.X_API_BEARER_TOKEN) {
      console.log("🔍 Auto-discovering competitors...");
      const discoveredCompetitors = await discoverCompetitors(productUrl, 5);
      if (discoveredCompetitors.length > 0) {
        competitorHandles = discoveredCompetitors.join(", ");
        console.log(
          `✅ Successfully discovered ${discoveredCompetitors.length} competitors:`,
          competitorHandles
        );
      } else {
        console.log(
          "⚠️  No competitor accounts found - proceeding with general market analysis"
        );
      }
    }

    // Enhance trend context with real trending topics if not provided
    if (!trendContext && process.env.X_API_BEARER_TOKEN) {
      console.log("🔍 Fetching trending topics...");
      const trends = await getTrendingTopics(10);
      if (trends.length > 0) {
        trendContext = `Current trending topics: ${trends.join(", ")}`;
        console.log(
          `✅ Successfully found ${trends.length} trending topics:`,
          trendContext
        );
      } else {
        console.log(
          "⚠️  No trending topics found - using general trend analysis"
        );
      }
    }

    // Build the user prompt
    const userPrompt = `Generate a comprehensive viral marketing strategy for X  with the following parameters:

Product/Company URL: ${productUrl}
Campaign Budget: $${budget.toLocaleString()} USD
${
  targetMarket
    ? `Target Market/Audience: ${targetMarket}`
    : "Target Market/Audience: Analyze and determine the best target audience"
}
${
  campaignDetails
    ? `Campaign Details: ${campaignDetails}`
    : "Campaign Details: Design an engaging viral campaign"
}
${
  competitorHandles
    ? `Competitor Handles (${
        competitorHandles.split(",").length > 3
          ? "Auto-discovered"
          : "User-provided"
      }): ${competitorHandles}`
    : "Competitor Handles: Not provided - using general market analysis"
}
${
  trendContext
    ? `Current Trend Context: ${trendContext}`
    : "Current Trend Context: Analyze current viral trends on X"
}
${
  supplementaryImages && supplementaryImages.length > 0
    ? `\n\nSupplementary Images: ${supplementaryImages.length} product/service image(s) have been provided above. Analyze these images to understand the product's visual identity, features, and aesthetic. Use insights from these images to create more targeted and visually coherent ad campaigns.`
    : ""
}

IMPORTANT: Your "strategySummary" MUST incorporate and reference the specific details provided above:
- If Target Market/Audience is provided, explicitly mention WHO you're targeting
- If Campaign Details are provided, explicitly reference the campaign goals/context
- If Supplementary Images are analyzed, mention key visual elements or product features discovered
- Connect these specific elements to your chosen viral angle
- CRITICAL: If Campaign Details contain scheduling information (dates, times, duration), you MUST parse and extract this information to determine the exact scheduled times for posts

Output the strategy as valid JSON matching this exact schema:
{
  "title": "A catchy, concise campaign title (3-6 words) that captures the essence of the campaign (e.g., 'Holiday Sale Blitz', 'Product Launch Hype', 'Summer Savings Storm')",
  "strategySummary": "A 2-sentence overview that EXPLICITLY references the provided target audience (if any), campaign details (if any), and explains the core viral angle being used.",
  "targetAudience": "Specific sub-culture or demographic (use provided target market if available, otherwise infer).",
  "posts": [
    {
      "id": "post_1",
      "scheduledTime": "ISO String - YOU MUST parse scheduling information from Campaign Details if provided. If Campaign Details mention specific dates/times/duration (e.g., '10 minute campaign starting at 8:39pm on 12/17/2025'), extract and use those exact times, distributing posts evenly within that timeframe. If no scheduling info is provided, default to starting from tomorrow and spreading over 7 days.",
      "content": "The main tweet text (engaging hook, no links, max 280 chars)",
      "replyContent": "The follow-up tweet containing the Call to Action and the LINK",
      "mediaType": "image" or "video",
      "mediaPrompt": "Detailed prompt for the AI generator (photorealistic for images, motion details for videos)",
      "predictedCTR": "e.g. 3.1% - REQUIRED: Estimate click-through rate based on content type, trend relevance, and audience engagement patterns.",
      "predictedCPM": "e.g. $5.50 - REQUIRED: Estimate the Cost Per Mille (cost per 1000 impressions) for X ads in this niche/audience. Consider factors like: competition level, audience specificity, media type (image vs video), time of year, and target demographics. Typical X CPM ranges: $2-$8 for broad audiences, $5-$15 for niche targeting, $10-$25 for highly competitive niches.",
      "predictedCVR": "e.g. 1.2% - REQUIRED: Estimate the Conversion Rate (percentage of clicks that convert). Consider: product price point, landing page quality assumptions, offer strength, audience intent level, and industry benchmarks. Typical CVR ranges: 0.5-2% for cold traffic, 2-5% for warm audiences, 5-15% for retargeting or highly qualified traffic.",
      "rationale": "REQUIRED: Comprehensive reasoning that includes: (1) WHY this specific angle/content works, (2) HOW it connects trends to product features and target audience, (3) JUSTIFICATION for the predicted CTR (why this engagement level?), (4) JUSTIFICATION for the predicted CPM (what market factors influenced this cost?), (5) JUSTIFICATION for the predicted CVR (why this conversion rate?). Example: 'I chose this meme angle because [Trend X] is peaking with 500M views, which aligns perfectly with [Feature Y] of the product. The CTR of 3.1% is justified by similar viral content in this niche achieving 2.8-3.5% engagement. The CPM of $6.50 reflects moderate competition in the tech enthusiast space during Q4. The CVR of 1.8% assumes a strong landing page and mid-tier product ($50-200 range), typical for warm audiences discovering via viral content.'",
      "status": "draft"
    }
  ]
}`;

    // Generate strategy using Grok (with vision if images are provided)
    const response =
      supplementaryImages && supplementaryImages.length > 0
        ? await generateWithGrokVision(
            STRATEGY_SYSTEM_PROMPT,
            userPrompt,
            supplementaryImages,
            0.7
          )
        : await generateWithGrok(STRATEGY_SYSTEM_PROMPT, userPrompt, 0.7);

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

    // Add budget to strategy and calculate all metrics
    strategy.budget = budget;
    strategy = calculateCampaignMetrics(strategy);

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
