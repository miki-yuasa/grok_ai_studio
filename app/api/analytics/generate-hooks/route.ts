import { NextRequest, NextResponse } from "next/server";
import {
  generateHooks,
  scoreHooks,
  Hook,
  HookWithScores,
} from "@/lib/hook-optimizer";

export const maxDuration = 120; // 2 minutes for hook generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignDetails,
      targetAudience,
      hookType = "both",
      count = 20, // Reduced from 50 for faster initial generation
    } = body;

    if (!campaignDetails) {
      return NextResponse.json(
        { error: "campaignDetails is required" },
        { status: 400 }
      );
    }

    console.log("🎣 [HOOKS] Generating initial hooks...");
    console.log(`📋 Campaign: ${campaignDetails.substring(0, 100)}...`);
    console.log(`👥 Target: ${targetAudience || "General audience"}`);
    console.log(`📝 Type: ${hookType}, Count: ${count}`);

    // Generate initial hooks
    const hooks = await generateHooks(
      campaignDetails,
      targetAudience || "General audience",
      hookType,
      count
    );

    if (hooks.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate hooks" },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${hooks.length} hooks`);

    // Score the hooks with AI focus group
    console.log("🎯 [HOOKS] Scoring hooks with AI focus group...");
    const scoredHooks = await scoreHooks(
      hooks,
      campaignDetails,
      targetAudience || "General audience"
    );

    console.log(`✅ Scored ${scoredHooks.length} hooks`);

    // Calculate stats
    const avgScore =
      scoredHooks.reduce((sum, h) => sum + h.avgScore, 0) / scoredHooks.length;
    const topScore = scoredHooks[0]?.avgScore || 0;
    const bottomScore = scoredHooks[scoredHooks.length - 1]?.avgScore || 0;

    // Separate by type
    const textHooks = scoredHooks.filter((h) => h.type === "text");
    const videoHooks = scoredHooks.filter((h) => h.type === "video");

    return NextResponse.json({
      success: true,
      generation: 1,
      hooks: scoredHooks,
      stats: {
        total_hooks: scoredHooks.length,
        text_hooks: textHooks.length,
        video_hooks: videoHooks.length,
        avg_score: Math.round(avgScore * 10) / 10,
        top_score: Math.round(topScore * 10) / 10,
        bottom_score: Math.round(bottomScore * 10) / 10,
        score_spread: Math.round((topScore - bottomScore) * 10) / 10,
      },
      top_performers: {
        text: textHooks.slice(0, 3).map((h) => ({
          id: h.id,
          content: h.content,
          score: h.avgScore,
          reasoning: h.reasoning,
        })),
        video: videoHooks.slice(0, 3).map((h) => ({
          id: h.id,
          content: h.content,
          score: h.avgScore,
          reasoning: h.reasoning,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating hooks:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate hooks",
      },
      { status: 500 }
    );
  }
}

