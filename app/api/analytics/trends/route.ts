import { NextRequest, NextResponse } from "next/server";
import { getTrendAnalysis } from "@/lib/x-analytics";
import { generateWithGrok } from "@/lib/grok";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "50", 10);
    const includeAnalysis = searchParams.get("includeAnalysis") !== "false";

    console.log("📊 [TRENDS] Fetching trend analysis...");
    const trendData = await getTrendAnalysis(query, maxResults);

    let grokAnalysis = null;

    if (includeAnalysis && trendData.sample_viral_tweets.length > 0) {
      console.log("🤖 [TRENDS] Generating Grok analysis of viral patterns...");

      // Prepare data for Grok analysis
      const viralSamples = trendData.sample_viral_tweets
        .slice(0, 5)
        .map((t) => ({
          text: t.text.substring(0, 200),
          engagement_rate: t.engagement_rate.toFixed(2) + "%",
          has_media: t.has_media,
        }));

      const analysisPrompt = `Analyze these viral tweets and extract actionable patterns for creating engaging content:

Top Hashtags: ${trendData.viral_patterns.top_hashtags.map((h) => "#" + h.tag).join(", ")}
Content Types: ${trendData.viral_patterns.content_types.map((c) => `${c.type}: ${c.percentage}%`).join(", ")}
Average Engagement Rate: ${trendData.viral_patterns.avg_engagement_rate.toFixed(2)}%
Peak Posting Hours (UTC): ${trendData.viral_patterns.peak_posting_hours.join(", ")}

Sample Viral Tweets:
${viralSamples.map((t, i) => `${i + 1}. "${t.text}" (Engagement: ${t.engagement_rate}, Media: ${t.has_media})`).join("\n")}

Provide a concise analysis with:
1. KEY HOOKS: What makes people stop scrolling? (3 patterns)
2. CONTENT FORMULA: The structure/format that works best
3. EMOTIONAL TRIGGERS: What emotions drive engagement
4. TIMING INSIGHTS: When to post for maximum reach
5. ACTIONABLE TIPS: 3 specific things to implement immediately

Keep each section to 2-3 sentences max. Be specific and actionable.`;

      try {
        const systemPrompt = "You are an expert social media analyst specializing in viral content patterns. Provide concise, actionable insights.";
        grokAnalysis = await generateWithGrok(systemPrompt, analysisPrompt, 0.7);
      } catch (grokError) {
        console.error("Grok analysis failed:", grokError);
        grokAnalysis = "Analysis unavailable - Grok API error";
      }
    }

    return NextResponse.json({
      success: true,
      query: query || "general trends",
      trending_topics: trendData.trending_topics,
      viral_patterns: {
        top_hashtags: trendData.viral_patterns.top_hashtags,
        content_types: trendData.viral_patterns.content_types,
        avg_engagement_rate:
          Math.round(trendData.viral_patterns.avg_engagement_rate * 100) / 100,
        peak_posting_hours: trendData.viral_patterns.peak_posting_hours,
      },
      sample_viral_tweets: trendData.sample_viral_tweets.map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        author: `@${tweet.author_username}`,
        metrics: tweet.metrics,
        engagement_rate: Math.round(tweet.engagement_rate * 100) / 100,
        hashtags: tweet.hashtags,
        has_media: tweet.has_media,
        media_type: tweet.media_type,
      })),
      grok_analysis: grokAnalysis,
    });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch trends",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 50 } = body;

    const trendData = await getTrendAnalysis(query, maxResults);

    return NextResponse.json({
      success: true,
      ...trendData,
    });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch trends",
      },
      { status: 500 }
    );
  }
}

