import { NextRequest, NextResponse } from "next/server";
import {
  runEvolutionCycle,
  summarizeEvolution,
  HookWithScores,
  EvolutionResult,
} from "@/lib/hook-optimizer";

export const maxDuration = 120; // 2 minutes for evolution

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hooks,
      campaignDetails,
      targetAudience,
      currentGeneration = 1,
      evolutionHistory = [],
    } = body;

    if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return NextResponse.json(
        { error: "hooks array is required" },
        { status: 400 }
      );
    }

    if (!campaignDetails) {
      return NextResponse.json(
        { error: "campaignDetails is required" },
        { status: 400 }
      );
    }

    console.log(`🧬 [EVOLVE] Starting evolution cycle ${currentGeneration + 1}...`);
    console.log(`📊 Input hooks: ${hooks.length}`);

    // Cast hooks to HookWithScores (they should already have scores from generate-hooks)
    const scoredHooks: HookWithScores[] = hooks.map((h: any) => ({
      ...h,
      focusGroupScores: h.focusGroupScores || [],
      avgScore: h.avgScore || h.score || 50,
    }));

    // Run evolution cycle
    const result = await runEvolutionCycle(
      scoredHooks,
      campaignDetails,
      targetAudience || "General audience",
      currentGeneration
    );

    console.log(`✅ Evolution complete. Best score: ${result.bestHook.avgScore}`);
    console.log(`📈 Improvement: ${result.improvement > 0 ? "+" : ""}${result.improvement.toFixed(1)}`);

    // Update history
    const updatedHistory: EvolutionResult[] = [...evolutionHistory, result];
    const summary = summarizeEvolution(updatedHistory);

    // Check if we've reached target score
    const targetReached = result.bestHook.avgScore >= 90;

    // Separate by type
    const textHooks = result.hooks.filter((h) => h.type === "text");
    const videoHooks = result.hooks.filter((h) => h.type === "video");

    return NextResponse.json({
      success: true,
      generation: result.generation,
      target_reached: targetReached,
      hooks: result.hooks,
      best_hook: {
        id: result.bestHook.id,
        type: result.bestHook.type,
        content: result.bestHook.content,
        score: result.bestHook.avgScore,
        reasoning: result.bestHook.reasoning,
        focus_group_scores: result.bestHook.focusGroupScores,
      },
      improvement: Math.round(result.improvement * 10) / 10,
      stats: {
        total_hooks: result.hooks.length,
        text_hooks: textHooks.length,
        video_hooks: videoHooks.length,
        avg_score:
          Math.round(
            (result.hooks.reduce((sum, h) => sum + h.avgScore, 0) /
              result.hooks.length) *
              10
          ) / 10,
        top_score: result.bestHook.avgScore,
      },
      top_performers: {
        text: textHooks.slice(0, 3).map((h) => ({
          id: h.id,
          content: h.content,
          score: h.avgScore,
        })),
        video: videoHooks.slice(0, 3).map((h) => ({
          id: h.id,
          content: h.content,
          score: h.avgScore,
        })),
      },
      evolution_summary: {
        total_generations: summary.totalGenerations,
        start_score: summary.startScore,
        current_score: summary.endScore,
        total_improvement: summary.totalImprovement,
        improvement_rate_percent: summary.improvementRate,
      },
      recommendation: targetReached
        ? "Target score of 90% reached! Your hook is optimized for maximum scroll-stop potential."
        : result.improvement <= 1 && result.generation > 3
        ? "Diminishing returns detected. Consider using your best hook or trying different campaign angles."
        : "Continue evolving for better results. Each generation refines the strongest hooks.",
    });
  } catch (error) {
    console.error("Error evolving hooks:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to evolve hooks",
      },
      { status: 500 }
    );
  }
}

