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
