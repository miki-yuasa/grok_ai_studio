/**
 * X (Twitter) API utilities for competitor discovery, trend analysis, and posting
 */

import OAuth from "oauth-1.0a";
import crypto from "crypto";

interface XUser {
  id: string;
  name: string;
  username: string;
  description: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

interface XSearchResponse {
  data?: XUser[];
  meta?: {
    result_count: number;
  };
}

/**
 * Search for competitor accounts on X based on product/company keywords
 */
export async function discoverCompetitors(
  productUrl: string,
  maxResults: number = 5
): Promise<string[]> {
  try {
    // Extract company name and keywords from URL
    const keywords = extractKeywordsFromUrl(productUrl);

    if (!keywords) {
      console.warn("Could not extract keywords from URL for competitor search");
      return [];
    }

    console.log(`Searching for competitors with keywords: "${keywords}"`);

    // Search tweets by keywords and extract unique authors
    // This is more reliable than user search which may require higher API access
    return await searchByKeywords(keywords, maxResults);
  } catch (error) {
    console.error("Error discovering competitors:", error);
    return [];
  }
}

/**
 * Search X for accounts by keywords using tweet search
 */
async function searchByKeywords(
  keywords: string,
  maxResults: number
): Promise<string[]> {
  try {
    // Use X API v2 search endpoint to find tweets, then extract authors
    const searchQuery = encodeURIComponent(`${keywords} -is:retweet`);
    const response = await fetch(
      `https://api.x.com/2/tweets/search/recent?query=${searchQuery}&max_results=${Math.min(
        maxResults * 3,
        100
      )}&expansions=author_id&user.fields=username,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("X API search failed:", response.status, errorText);
      return [];
    }

    const data = await response.json();

    if (!data.includes?.users) {
      console.log("No users found in search results");
      return [];
    }

    // Extract unique usernames from most active accounts
    const userMap = new Map<string, XUser>();
    data.includes.users.forEach((user: XUser) => {
      userMap.set(user.id, user);
    });

    // Get unique handles sorted by followers
    const handles = Array.from(userMap.values())
      .sort(
        (a, b) =>
          b.public_metrics.followers_count - a.public_metrics.followers_count
      )
      .slice(0, maxResults)
      .map((user) => `@${user.username}`);

    console.log(
      `Found ${handles.length} competitor accounts:`,
      handles.join(", ")
    );
    return handles;
  } catch (error) {
    console.error("Error in keyword search:", error);
    return [];
  }
}

/**
 * Extract keywords from product URL for competitor search
 */
function extractKeywordsFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

    // Extract company name from domain (e.g., "example.com" -> "example")
    const companyName = domain.split(".")[0];

    // Clean and format for search
    const keywords = companyName
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter((word) => word.length > 2)
      .join(" ");

    return keywords || companyName;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

/**
 * Fetch trending topics from X using search queries
 * Note: X API v2 trends endpoint requires Enterprise access, so we use an alternative approach
 */
export async function getTrendingTopics(limit: number = 10): Promise<string[]> {
  try {
    // Search for high-engagement tweets to identify trending topics
    // Use popular hashtags and filter out retweets
    // X API requires at least one positive term, can't use only negations
    const searchQuery = encodeURIComponent(
      "(#trending OR #viral OR #news) -is:retweet lang:en"
    );
    const response = await fetch(
      `https://api.x.com/2/tweets/search/recent?query=${searchQuery}&max_results=${Math.min(
        limit * 2,
        100
      )}&tweet.fields=public_metrics,created_at`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Trends search error:", response.status, errorText);
      return [];
    }

    const data = await response.json();

    // Extract hashtags and trending phrases from top tweets
    if (!data.data || !Array.isArray(data.data)) {
      console.log("No trending data found");
      return [];
    }

    const trends = new Set<string>();
    data.data.forEach((tweet: any) => {
      if (tweet.text) {
        // Extract all hashtags
        const hashtags = tweet.text.match(/#\w+/g);
        if (hashtags) {
          // Filter out the search hashtags we used
          hashtags.forEach((tag: string) => {
            const lowerTag = tag.toLowerCase();
            if (
              lowerTag !== "#trending" &&
              lowerTag !== "#viral" &&
              lowerTag !== "#news"
            ) {
              trends.add(tag);
            }
          });
        }
      }
    });

    const trendsList = Array.from(trends).slice(0, limit);
    console.log(
      `Found ${trendsList.length} trending topics:`,
      trendsList.join(", ")
    );
    return trendsList;
  } catch (error) {
    console.error("Error fetching trends:", error);
    return [];
  }
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
 * Post a tweet to X (Twitter)
 * Requires OAuth 1.0a authentication with API keys
 */
export async function postTweet(
  text: string,
  mediaIds?: string[],
  replyToTweetId?: string
): Promise<{ id: string; text: string }> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  // Check if we have OAuth credentials (required for posting)
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      "X API OAuth credentials not configured. Posting requires X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET environment variables."
    );
  }

  try {
    const oauth = getOAuth();
    const url = "https://api.x.com/2/tweets";

    const payload: any = {
      text: text.substring(0, 280), // X character limit
    };

    if (mediaIds && mediaIds.length > 0) {
      payload.media = {
        media_ids: mediaIds,
      };
    }

    if (replyToTweetId) {
      payload.reply = {
        in_reply_to_tweet_id: replyToTweetId,
      };
    }

    // Generate OAuth 1.0a authorization header
    const requestData = {
      url,
      method: "POST",
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(requestData, token)
    ).Authorization;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      throw new Error(
        errorData.detail || `Failed to post tweet: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      id: data.data.id,
      text: data.data.text,
    };
  } catch (error) {
    console.error("Error posting tweet:", error);
    throw error;
  }
}

/**
 * Upload media to X (Twitter) and return media_id
 * Required before posting tweets with images/videos
 */
export async function uploadMedia(
  mediaUrl: string,
  mediaType: "image" | "video"
): Promise<string> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      "X API OAuth credentials not configured for media upload."
    );
  }

  try {
    const oauth = getOAuth();
    const url = "https://upload.x.com/1.1/media/upload.json";

    // First, download the media from the URL
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media from ${mediaUrl}`);
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const mediaBase64 = Buffer.from(mediaBuffer).toString("base64");

    // Generate OAuth 1.0a authorization header
    const requestData = {
      url,
      method: "POST",
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(requestData, token)
    ).Authorization;

    // Upload to X media endpoint
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: new URLSearchParams({
        media_data: mediaBase64,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to upload media: ${errorData}`);
    }

    const data = await response.json();
    return data.media_id_string;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
}
