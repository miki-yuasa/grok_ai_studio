/**
 * X (Twitter) API Analytics utilities
 * Requires Pro/Enterprise API access for full analytics data
 */

import OAuth from "oauth-1.0a";
import crypto from "crypto";

// Types for X API Analytics responses
export interface PostMetrics {
  id: string;
  text: string;
  created_at: string;
  organic_metrics?: {
    impression_count: number;
    like_count: number;
    reply_count: number;
    retweet_count: number;
    url_link_clicks?: number;
    user_profile_clicks?: number;
  };
  non_public_metrics?: {
    impression_count: number;
    url_link_clicks?: number;
    user_profile_clicks?: number;
  };
  public_metrics: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
}

export interface TrendingTopic {
  name: string;
  tweet_volume: number | null;
  url: string;
}

export interface ViralTweet {
  id: string;
  text: string;
  author_username: string;
  created_at: string;
  metrics: {
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    bookmarks: number;
  };
  engagement_rate: number;
  hashtags: string[];
  has_media: boolean;
  media_type?: "photo" | "video" | "animated_gif";
}

export interface TrendAnalysis {
  trending_topics: string[];
  viral_patterns: {
    top_hashtags: { tag: string; count: number }[];
    content_types: { type: string; percentage: number }[];
    avg_engagement_rate: number;
    peak_posting_hours: number[];
  };
  sample_viral_tweets: ViralTweet[];
}

/**
 * Get OAuth 1.0a instance for X API
 */
function getOAuth(): OAuth {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("X_API_KEY and X_API_SECRET must be configured");
  }

  return new OAuth({
    consumer: {
      key: apiKey,
      secret: apiSecret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

/**
 * Make authenticated request to X API v2
 */
async function makeAuthenticatedRequest(
  url: string,
  method: "GET" | "POST" = "GET"
): Promise<any> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error("X API OAuth credentials not configured");
  }

  const oauth = getOAuth();
  const requestData = { url, method };
  const token = { key: accessToken, secret: accessTokenSecret };
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token)).Authorization;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Get analytics for a specific tweet
 * Requires Pro/Enterprise API access for organic_metrics and non_public_metrics
 */
export async function getPostAnalytics(tweetId: string): Promise<PostMetrics | null> {
  try {
    const fields = [
      "created_at",
      "public_metrics",
      "organic_metrics",
      "non_public_metrics",
    ].join(",");

    const url = `https://api.x.com/2/tweets/${tweetId}?tweet.fields=${fields}`;
    const data = await makeAuthenticatedRequest(url);

    if (!data.data) {
      console.error("No data returned for tweet:", tweetId);
      return null;
    }

    return data.data as PostMetrics;
  } catch (error) {
    console.error("Error fetching post analytics:", error);
    throw error;
  }
}

/**
 * Get analytics for multiple tweets
 */
export async function getBatchPostAnalytics(tweetIds: string[]): Promise<PostMetrics[]> {
  if (tweetIds.length === 0) return [];

  try {
    // X API allows up to 100 tweet IDs per request
    const batchSize = 100;
    const results: PostMetrics[] = [];

    for (let i = 0; i < tweetIds.length; i += batchSize) {
      const batch = tweetIds.slice(i, i + batchSize);
      const ids = batch.join(",");
      const fields = [
        "created_at",
        "public_metrics",
        "organic_metrics",
        "non_public_metrics",
      ].join(",");

      const url = `https://api.x.com/2/tweets?ids=${ids}&tweet.fields=${fields}`;
      const data = await makeAuthenticatedRequest(url);

      if (data.data) {
        results.push(...data.data);
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching batch post analytics:", error);
    throw error;
  }
}

/**
 * Get trending topics and viral content analysis
 * 
 * Note: min_faves/min_retweets operators are ONLY available for Full-Archive Search
 * (/2/tweets/search/all), not Recent Search (/2/tweets/search/recent).
 * 
 * For Recent Search, we use available operators and filter locally for engagement.
 * 
 * Available operators for v2 Recent Search:
 * - Keywords, exact phrases, hashtags, mentions
 * - from:, to:, url:
 * - is:retweet, is:reply, is:quote, is:verified
 * - has:hashtags, has:links, has:mentions, has:media, has:images, has:videos
 * - lang:
 */
export async function getTrendAnalysis(
  query?: string,
  maxResults: number = 100
): Promise<TrendAnalysis> {
  try {
    // Build search query - fetch more results so we can filter for high engagement locally
    let searchQuery: string;
    
    if (query) {
      // User provided a specific topic - search for it from verified accounts
      searchQuery = `${query} is:verified -is:retweet -is:reply lang:en`;
    } else {
      // Default: find content from verified accounts (more likely to be viral)
      // Using popular broad topics to get engaging content
      searchQuery = "(breaking OR announcement OR news OR update) is:verified has:media -is:retweet -is:reply lang:en";
    }

    const encodedQuery = encodeURIComponent(searchQuery);
    const fields = "created_at,public_metrics,entities";
    const expansions = "author_id,attachments.media_keys";
    const mediaFields = "type";
    const userFields = "username,verified";

    // Request more results so we can filter for high engagement locally
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodedQuery}&max_results=${Math.min(maxResults, 100)}&tweet.fields=${fields}&expansions=${expansions}&media.fields=${mediaFields}&user.fields=${userFields}`;

    // Use Bearer token for search
    const bearerToken = process.env.X_API_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error("X_API_BEARER_TOKEN not configured. Get your Bearer Token from the X Developer Portal.");
    }

    console.log(`🔍 [TRENDS] Searching with query: ${searchQuery}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔍 [TRENDS] API error: ${errorText}`);
      throw new Error(`X API search error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`🔍 [TRENDS] Found ${data.data?.length || 0} tweets`);

    // Process results
    const tweets = data.data || [];
    const users = data.includes?.users || [];
    const media = data.includes?.media || [];

    // Build user map
    const userMap = new Map<string, string>();
    users.forEach((user: any) => {
      userMap.set(user.id, user.username);
    });

    // Build media map
    const mediaMap = new Map<string, string>();
    media.forEach((m: any) => {
      mediaMap.set(m.media_key, m.type);
    });

    // Analyze viral tweets
    const viralTweets: ViralTweet[] = tweets.map((tweet: any) => {
      const metrics = tweet.public_metrics || {};
      const impressions = metrics.impression_count || 0;
      const engagements =
        (metrics.like_count || 0) +
        (metrics.retweet_count || 0) +
        (metrics.reply_count || 0) +
        (metrics.quote_count || 0);
      const engagement_rate = impressions > 0 ? (engagements / impressions) * 100 : 0;

      // Extract hashtags
      const hashtags =
        tweet.entities?.hashtags?.map((h: any) => h.tag) || [];

      // Check for media
      const mediaKeys = tweet.attachments?.media_keys || [];
      const hasMedia = mediaKeys.length > 0;
      const mediaType = hasMedia ? mediaMap.get(mediaKeys[0]) : undefined;

      return {
        id: tweet.id,
        text: tweet.text,
        author_username: userMap.get(tweet.author_id) || "unknown",
        created_at: tweet.created_at,
        metrics: {
          impressions,
          likes: metrics.like_count || 0,
          retweets: metrics.retweet_count || 0,
          replies: metrics.reply_count || 0,
          quotes: metrics.quote_count || 0,
          bookmarks: metrics.bookmark_count || 0,
        },
        engagement_rate,
        hashtags,
        has_media: hasMedia,
        media_type: mediaType as any,
      };
    });

    // Analyze patterns
    const hashtagCounts = new Map<string, number>();
    const contentTypes = { text_only: 0, with_media: 0 };
    const postingHours: number[] = [];
    let totalEngagementRate = 0;

    viralTweets.forEach((tweet) => {
      // Count hashtags
      tweet.hashtags.forEach((tag) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });

      // Content type
      if (tweet.has_media) {
        contentTypes.with_media++;
      } else {
        contentTypes.text_only++;
      }

      // Posting hour
      const hour = new Date(tweet.created_at).getUTCHours();
      postingHours.push(hour);

      // Engagement rate
      totalEngagementRate += tweet.engagement_rate;
    });

    // Top hashtags
    const topHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Content type percentages
    const total = viralTweets.length || 1;
    const contentTypePercentages = [
      { type: "Text Only", percentage: Math.round((contentTypes.text_only / total) * 100) },
      { type: "With Media", percentage: Math.round((contentTypes.with_media / total) * 100) },
    ];

    // Peak posting hours (find most common hours)
    const hourCounts = new Map<number, number>();
    postingHours.forEach((hour) => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Trending topics from hashtags
    const trendingTopics = topHashtags.slice(0, 5).map((h) => `#${h.tag}`);

    // Sort tweets by engagement (likes + retweets) to show highest engagement first
    const sortedTweets = viralTweets.sort((a, b) => {
      const aEngagement = a.metrics.likes + a.metrics.retweets;
      const bEngagement = b.metrics.likes + b.metrics.retweets;
      return bEngagement - aEngagement;
    });

    // Filter for tweets with meaningful engagement (at least 50 likes or 10 retweets)
    // This compensates for not having min_faves at the API level
    const highEngagementTweets = sortedTweets.filter((t) => 
      t.metrics.likes >= 50 || t.metrics.retweets >= 10
    );

    // Use high engagement tweets if available, otherwise use top sorted tweets
    const bestTweets = highEngagementTweets.length >= 3 
      ? highEngagementTweets 
      : sortedTweets;

    // Calculate avg engagement only from the tweets we'll show
    const displayTweets = bestTweets.slice(0, 10);
    const displayAvgER = displayTweets.length > 0 
      ? displayTweets.reduce((sum, t) => sum + t.engagement_rate, 0) / displayTweets.length 
      : 0;

    console.log(`🔍 [TRENDS] Filtered to ${highEngagementTweets.length} high-engagement tweets`);
    console.log(`🔍 [TRENDS] Top tweet has ${sortedTweets[0]?.metrics.likes || 0} likes`);

    return {
      trending_topics: trendingTopics,
      viral_patterns: {
        top_hashtags: topHashtags,
        content_types: contentTypePercentages,
        avg_engagement_rate: displayAvgER,
        peak_posting_hours: peakHours,
      },
      sample_viral_tweets: displayTweets,
    };
  } catch (error) {
    console.error("Error fetching trend analysis:", error);
    throw error;
  }
}

/**
 * Get user's own tweets for self-analytics
 */
export async function getUserTweets(
  userId?: string,
  maxResults: number = 20
): Promise<PostMetrics[]> {
  try {
    // If no userId provided, get authenticated user's tweets
    let targetUserId = userId;

    if (!targetUserId) {
      // Get authenticated user ID
      const meUrl = "https://api.x.com/2/users/me";
      const meData = await makeAuthenticatedRequest(meUrl);
      targetUserId = meData.data?.id;
    }

    if (!targetUserId) {
      throw new Error("Could not determine user ID");
    }

    const fields = [
      "created_at",
      "public_metrics",
      "organic_metrics",
      "non_public_metrics",
    ].join(",");

    const url = `https://api.x.com/2/users/${targetUserId}/tweets?max_results=${Math.min(maxResults, 100)}&tweet.fields=${fields}`;
    const data = await makeAuthenticatedRequest(url);

    return data.data || [];
  } catch (error) {
    console.error("Error fetching user tweets:", error);
    throw error;
  }
}

/**
 * Calculate engagement metrics from post data
 */
export function calculateEngagementMetrics(post: PostMetrics) {
  const metrics = post.public_metrics || post.organic_metrics;
  if (!metrics) {
    return {
      impressions: 0,
      engagements: 0,
      engagement_rate: 0,
      ctr: 0,
    };
  }

  const impressions = metrics.impression_count || 0;
  const engagements =
    (metrics.like_count || 0) +
    (metrics.retweet_count || 0) +
    (metrics.reply_count || 0) +
    ((metrics as any).quote_count || 0);

  const urlClicks = (post.organic_metrics?.url_link_clicks || post.non_public_metrics?.url_link_clicks || 0);

  return {
    impressions,
    engagements,
    engagement_rate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    ctr: impressions > 0 ? (urlClicks / impressions) * 100 : 0,
  };
}

