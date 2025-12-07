// Storage keys
export const STORAGE_KEYS = {
  SELF_ANALYTICS: "analytics_self_data",
  TRENDING: "analytics_trending_data",
  HOOKS: "analytics_hooks_data",
};

// Interfaces for stored data
export interface StoredSelfAnalytics {
  posts: any[];
  summary: any;
  insights: any | null;
  lastUpdated: string;
}

export interface StoredTrendingData {
  trendData: any;
  query: string;
  lastUpdated: string;
}

export interface StoredHooksData {
  hooks: any[];
  campaignDetails: string;
  targetAudience: string;
  hookType: "text" | "video" | "both";
  generation: number;
  evolutionHistory: any[];
  targetReached: boolean;
  lastUpdated: string;
}

// Helper functions
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
  }
  return null;
}

export function clearStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
  }
}

export function formatLastUpdated(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get all stored data summaries for pipeline builder
export function getAllStoredDataSummaries(): {
  analytics: { count: number; lastUpdated: string | null };
  trending: { count: number; lastUpdated: string | null };
  hooks: { count: number; lastUpdated: string | null };
} {
  const analytics = loadFromStorage<StoredSelfAnalytics>(STORAGE_KEYS.SELF_ANALYTICS);
  const trending = loadFromStorage<StoredTrendingData>(STORAGE_KEYS.TRENDING);
  const hooks = loadFromStorage<StoredHooksData>(STORAGE_KEYS.HOOKS);

  return {
    analytics: {
      count: analytics?.posts?.length || 0,
      lastUpdated: analytics?.lastUpdated || null,
    },
    trending: {
      count: trending?.trendData ? 
        (trending.trendData.trending_topics?.length || 0) + 
        (trending.trendData.viral_patterns?.top_hashtags?.length || 0) : 0,
      lastUpdated: trending?.lastUpdated || null,
    },
    hooks: {
      count: hooks?.hooks?.length || 0,
      lastUpdated: hooks?.lastUpdated || null,
    },
  };
}

