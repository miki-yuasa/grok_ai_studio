import { NextRequest, NextResponse } from "next/server";
import { generateWithGrok } from "@/lib/grok";

interface PostData {
  id: string;
  text: string;
  created_at: string;
  calculated: {
    impressions: number;
    engagements: number;
    engagement_rate: number;
    ctr: number;
  };
  raw_metrics?: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts } = body as { posts: PostData[] };

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: "No posts provided" },
        { status: 400 }
      );
    }

    // Sort by engagement rate
    const sorted = [...posts].sort(
      (a, b) => b.calculated.engagement_rate - a.calculated.engagement_rate
    );

    // Prepare data for Grok
    const postsForAnalysis = sorted.slice(0, 15).map((p, i) => ({
      rank: i + 1,
      text: p.text.substring(0, 150),
      er: p.calculated.engagement_rate,
      impressions: p.calculated.impressions,
      likes: p.raw_metrics?.like_count || 0,
      replies: p.raw_metrics?.reply_count || 0,
      retweets: p.raw_metrics?.retweet_count || 0,
      hour: new Date(p.created_at).getHours(),
      isReply: p.text.startsWith("@"),
    }));

    const avgER = posts.reduce((s, p) => s + p.calculated.engagement_rate, 0) / posts.length;
    const totalImpressions = posts.reduce((s, p) => s + p.calculated.impressions, 0);

    const systemPrompt = `You are a social media analytics expert specializing in X (Twitter) engagement optimization. 
Analyze the user's post performance data and provide actionable insights.
Be specific, data-driven, and practical.`;

    const analysisPrompt = `Analyze these X posts and provide strategic recommendations:

PERFORMANCE SUMMARY:
- Total Posts: ${posts.length}
- Average Engagement Rate: ${avgER.toFixed(2)}%
- Total Impressions: ${totalImpressions.toLocaleString()}

TOP PERFORMING POSTS (sorted by engagement rate):
${postsForAnalysis
  .map(
    (p) =>
      `${p.rank}. [${p.er.toFixed(2)}% ER, ${p.impressions} impr] "${p.text}${p.text.length >= 150 ? "..." : ""}"
   - Type: ${p.isReply ? "Reply" : "Original"} | Hour: ${p.hour}:00 | ❤️${p.likes} 🔁${p.retweets} 💬${p.replies}`
  )
  .join("\n")}

Respond with a JSON object (no markdown, just raw JSON):
{
  "topPerformers": [
    {"content": "abbreviated post text", "er": 0.0, "reason": "why it worked"}
  ],
  "worstPerformers": [
    {"content": "abbreviated post text", "er": 0.0, "issue": "why it underperformed"}
  ],
  "patterns": [
    "Pattern 1 with specific numbers",
    "Pattern 2 with comparison to average"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "bestPostingTimes": ["Time 1 (X% ER)", "Time 2 (X% ER)"],
  "contentMix": [
    {"type": "Original", "count": 0, "avgER": 0.0},
    {"type": "Replies", "count": 0, "avgER": 0.0}
  ]
}

Focus on:
1. What content types get the most engagement
2. Reply vs original tweet performance
3. Posting time patterns
4. Specific recommendations to improve engagement
5. What makes top posts stand out`;

    try {
      const response = await generateWithGrok(systemPrompt, analysisPrompt, 0.7);
      
      // Parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const insights = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        success: true,
        insights,
      });
    } catch (grokError) {
      console.error("Grok analysis failed:", grokError);
      
      // Return a fallback analysis
      const replies = posts.filter((p) => p.text.startsWith("@"));
      const originals = posts.filter((p) => !p.text.startsWith("@"));
      
      const avgReplyER = replies.length > 0 
        ? replies.reduce((s, p) => s + p.calculated.engagement_rate, 0) / replies.length 
        : 0;
      const avgOriginalER = originals.length > 0 
        ? originals.reduce((s, p) => s + p.calculated.engagement_rate, 0) / originals.length 
        : 0;

      return NextResponse.json({
        success: true,
        insights: {
          topPerformers: sorted.slice(0, 3).map((p) => ({
            content: p.text.substring(0, 80),
            er: p.calculated.engagement_rate,
            reason: "High engagement compared to average",
          })),
          worstPerformers: sorted.slice(-3).reverse().map((p) => ({
            content: p.text.substring(0, 80),
            er: p.calculated.engagement_rate,
            issue: "Below average engagement",
          })),
          patterns: [
            `Replies avg ${avgReplyER.toFixed(1)}% ER vs Original ${avgOriginalER.toFixed(1)}% ER`,
          ],
          recommendations: [
            "Focus on content that sparks conversation",
            "Experiment with different posting times",
            "Engage with larger accounts in your niche",
          ],
          bestPostingTimes: ["Evening hours tend to perform better"],
          contentMix: [
            { type: "Original", count: originals.length, avgER: avgOriginalER },
            { type: "Replies", count: replies.length, avgER: avgReplyER },
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing posts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze posts",
      },
      { status: 500 }
    );
  }
}

