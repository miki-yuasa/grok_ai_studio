/**
 * X (Twitter) API utilities for competitor discovery and trend analysis
 */

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

    // Search for relevant accounts using X API v2
    const searchQuery = encodeURIComponent(keywords);
    const response = await fetch(
      `https://api.twitter.com/2/users/by?usernames=${searchQuery}&user.fields=description,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("X API search failed:", await response.text());
      return [];
    }

    const data: XSearchResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      // Fallback: Try search by keywords
      return await searchByKeywords(keywords, maxResults);
    }

    // Return top competitor handles based on follower count
    const competitors = data.data
      .sort(
        (a, b) =>
          b.public_metrics.followers_count - a.public_metrics.followers_count
      )
      .slice(0, maxResults)
      .map((user) => `@${user.username}`);

    return competitors;
  } catch (error) {
    console.error("Error discovering competitors:", error);
    return [];
  }
}

/**
 * Fallback: Search X for accounts by keywords
 */
async function searchByKeywords(
  keywords: string,
  maxResults: number
): Promise<string[]> {
  try {
    // Use X API v2 search endpoint
    const searchQuery = encodeURIComponent(`${keywords} -is:retweet`);
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=${Math.min(
        maxResults * 2,
        100
      )}&expansions=author_id&user.fields=username,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.includes?.users) {
      return [];
    }

    // Extract unique usernames from most active accounts
    const userMap = new Map();
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
 * Fetch trending topics from X using the Trends API v2
 * Works with any approved developer account (Free, Basic, Pro, Enterprise)
 */
export async function getTrendingTopics(limit: number = 10): Promise<string[]> {
  try {
    // Use X API v2 trends endpoint
    // WOEID 23424977 = United States trends
    const response = await fetch(
      `https://api.x.com/2/trends/by/woeid/23424977`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Trends API error:",
        response.status,
        await response.text()
      );
      return [];
    }

    const data = await response.json();

    // Extract trend names from v2 response format
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    const trends = data.data
      .slice(0, limit)
      .map((trend: any) => trend.trend_name)
      .filter((name: string) => name && name.trim().length > 0);

    return trends;
  } catch (error) {
    console.error("Error fetching trends:", error);
    return [];
  }
}
