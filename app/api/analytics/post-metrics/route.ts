import { NextRequest, NextResponse } from "next/server";
import {
  getPostAnalytics,
  getBatchPostAnalytics,
  getUserTweets,
  calculateEngagementMetrics,
  PostMetrics,
} from "@/lib/x-analytics";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tweetId = searchParams.get("tweetId");
    const tweetIds = searchParams.get("tweetIds");
    const fetchUserTweets = searchParams.get("userTweets") === "true";
    const maxResults = parseInt(searchParams.get("maxResults") || "20", 10);

    let metrics: PostMetrics[] = [];

    if (tweetId) {
      // Single tweet analytics
      const result = await getPostAnalytics(tweetId);
      if (result) {
        metrics = [result];
      }
    } else if (tweetIds) {
      // Batch tweet analytics
      const ids = tweetIds.split(",").filter((id) => id.trim());
      metrics = await getBatchPostAnalytics(ids);
    } else if (fetchUserTweets) {
      // Get authenticated user's tweets
      metrics = await getUserTweets(undefined, maxResults);
    } else {
      return NextResponse.json(
        { error: "Please provide tweetId, tweetIds, or set userTweets=true" },
        { status: 400 }
      );
    }

    // Calculate engagement metrics for each post
    const analyticsData = metrics.map((post) => {
      const calculated = calculateEngagementMetrics(post);
      return {
        id: post.id,
        text: post.text,
        created_at: post.created_at,
        raw_metrics: post.public_metrics || post.organic_metrics,
        organic_metrics: post.organic_metrics,
        non_public_metrics: post.non_public_metrics,
        calculated: {
          impressions: calculated.impressions,
          engagements: calculated.engagements,
          engagement_rate: Math.round(calculated.engagement_rate * 100) / 100,
          ctr: Math.round(calculated.ctr * 100) / 100,
        },
      };
    });

    // Calculate aggregate stats
    const totalImpressions = analyticsData.reduce(
      (sum, post) => sum + post.calculated.impressions,
      0
    );
    const totalEngagements = analyticsData.reduce(
      (sum, post) => sum + post.calculated.engagements,
      0
    );
    const avgEngagementRate =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, post) => sum + post.calculated.engagement_rate, 0) /
          analyticsData.length
        : 0;
    const avgCTR =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, post) => sum + post.calculated.ctr, 0) /
          analyticsData.length
        : 0;

    return NextResponse.json({
      success: true,
      posts: analyticsData,
      summary: {
        total_posts: analyticsData.length,
        total_impressions: totalImpressions,
        total_engagements: totalEngagements,
        avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
        avg_ctr: Math.round(avgCTR * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error fetching post metrics:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch post metrics",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetIds } = body;

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      return NextResponse.json(
        { error: "tweetIds array is required" },
        { status: 400 }
      );
    }

    const metrics = await getBatchPostAnalytics(tweetIds);

    const analyticsData = metrics.map((post) => {
      const calculated = calculateEngagementMetrics(post);
      return {
        id: post.id,
        text: post.text,
        created_at: post.created_at,
        raw_metrics: post.public_metrics || post.organic_metrics,
        calculated: {
          impressions: calculated.impressions,
          engagements: calculated.engagements,
          engagement_rate: Math.round(calculated.engagement_rate * 100) / 100,
          ctr: Math.round(calculated.ctr * 100) / 100,
        },
      };
    });

    return NextResponse.json({
      success: true,
      posts: analyticsData,
    });
  } catch (error) {
    console.error("Error fetching batch post metrics:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch post metrics",
      },
      { status: 500 }
    );
  }
}

