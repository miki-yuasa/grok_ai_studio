"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Hash,
  Clock,
  Image,
  FileText,
  Sparkles,
  RefreshCw,
  Loader2,
  ExternalLink,
  Save,
  Database,
} from "lucide-react";
import {
  STORAGE_KEYS,
  StoredTrendingData,
  saveToStorage,
  loadFromStorage,
  formatLastUpdated,
} from "@/lib/analytics-storage";

interface ViralTweet {
  id: string;
  text: string;
  author: string;
  metrics: {
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
  };
  engagement_rate: number;
  hashtags: string[];
  has_media: boolean;
  media_type?: string;
}

interface TrendData {
  trending_topics: string[];
  viral_patterns: {
    top_hashtags: { tag: string; count: number }[];
    content_types: { type: string; percentage: number }[];
    avg_engagement_rate: number;
    peak_posting_hours: number[];
  };
  sample_viral_tweets: ViralTweet[];
  grok_analysis: string | null;
}

interface DraggableInsight {
  id: string;
  type: "hook" | "timing" | "pattern" | "audience" | "trend" | "recommendation";
  label: string;
  value: string;
  source: string;
}

interface TrendingAnalysisProps {
  onInsightsGenerated?: (insights: DraggableInsight[]) => void;
}

export default function TrendingAnalysis({ onInsightsGenerated }: TrendingAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [savedTrends, setSavedTrends] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage<StoredTrendingData>(STORAGE_KEYS.TRENDING);
    if (stored) {
      setTrendData(stored.trendData);
      setQuery(stored.query || "");
      setLastUpdated(stored.lastUpdated);
      
      // Emit insights if callback provided
      if (onInsightsGenerated && stored.trendData) {
        emitInsights(stored.trendData);
      }
    }
  }, []);

  // Helper to emit insights
  const emitInsights = (data: TrendData) => {
    if (!onInsightsGenerated) return;
    
    const draggableInsights: DraggableInsight[] = [];

    data.trending_topics?.forEach((topic: string, i: number) => {
      draggableInsights.push({
        id: `trend-topic-${i}`,
        type: "trend",
        label: topic,
        value: topic,
        source: "Trending",
      });
    });

    data.viral_patterns?.top_hashtags?.slice(0, 5).forEach((h: any, i: number) => {
      draggableInsights.push({
        id: `trend-hashtag-${i}`,
        type: "trend",
        label: `#${h.tag}`,
        value: `#${h.tag} (${h.count} uses)`,
        source: "Trending",
      });
    });

    data.viral_patterns?.peak_posting_hours?.forEach((hour: number, i: number) => {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      draggableInsights.push({
        id: `trend-hour-${i}`,
        type: "timing",
        label: `Peak Hour: ${displayHour}${ampm}`,
        value: `${displayHour}${ampm} UTC`,
        source: "Trending",
      });
    });

    data.sample_viral_tweets?.slice(0, 3).forEach((tweet: any, i: number) => {
      draggableInsights.push({
        id: `trend-viral-${i}`,
        type: "hook",
        label: `Viral Hook (${tweet.engagement_rate?.toFixed(1) || 0}% ER)`,
        value: tweet.text?.substring(0, 100) || "",
        source: "Trending",
      });
    });

    onInsightsGenerated(draggableInsights);
  };

  // Save to localStorage
  const saveData = (data: TrendData, searchQuery: string) => {
    const stored: StoredTrendingData = {
      trendData: data,
      query: searchQuery,
      lastUpdated: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.TRENDING, stored);
    setLastUpdated(stored.lastUpdated);
  };

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      params.set("maxResults", "50");
      params.set("includeAnalysis", "true");

      const response = await fetch(`/api/analytics/trends?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trends");
      }

      const data = await response.json();
      setTrendData(data);

      // Save to localStorage
      saveData(data, query);

      // Emit draggable insights
      emitInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatHour = (hour: number): string => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm} UTC`;
  };

  const saveTrend = (trend: string) => {
    if (!savedTrends.includes(trend)) {
      setSavedTrends([...savedTrends, trend]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Trending Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Discover what's going viral and extract winning patterns
          </p>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 mt-1">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search topic (optional)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-48"
          />
          <Button onClick={fetchTrends} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {trendData ? "Refresh" : "Analyze"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Saved Trends */}
      {savedTrends.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Saved for Inspiration</h3>
          <div className="flex flex-wrap gap-2">
            {savedTrends.map((trend, i) => (
              <Badge key={i} variant="secondary">
                {trend}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {trendData && (
        <>
          {/* Viral Patterns */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Top Hashtags */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span className="text-sm font-medium">Top Hashtags</span>
              </div>
              <div className="space-y-2">
                {trendData.viral_patterns.top_hashtags.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <button
                      onClick={() => saveTrend(`#${h.tag}`)}
                      className="text-foreground hover:text-primary flex items-center gap-1"
                    >
                      #{h.tag}
                      <Save className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </button>
                    <span className="text-muted-foreground">{h.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Content Types</span>
              </div>
              <div className="space-y-2">
                {trendData.viral_patterns.content_types.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {c.type === "With Media" ? (
                        <Image className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-foreground">{c.type}</span>
                    </div>
                    <span className="text-muted-foreground">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Avg Engagement</span>
              </div>
              <p className="text-3xl font-semibold text-emerald-600">
                {trendData.viral_patterns.avg_engagement_rate.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                On viral content in this category
              </p>
            </div>

            {/* Peak Hours */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Peak Hours</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendData.viral_patterns.peak_posting_hours.map((hour, i) => (
                  <Badge key={i} variant="secondary">
                    {formatHour(hour)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Grok Analysis */}
          {trendData.grok_analysis && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">
                  AI Pattern Analysis
                </h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                  {trendData.grok_analysis}
                </pre>
              </div>
            </div>
          )}

          {/* Viral Tweets */}
          {trendData.sample_viral_tweets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">
                  🔥 Top Engaging Content
                </h3>
                <span className="text-xs text-muted-foreground">
                  From verified accounts • Sorted by engagement
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {trendData.sample_viral_tweets.slice(0, 6).map((tweet) => (
                  <div
                    key={tweet.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {tweet.author}
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {tweet.engagement_rate.toFixed(1)}% ER
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-foreground line-clamp-3">
                      {tweet.text}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>❤️ {formatNumber(tweet.metrics.likes)}</span>
                        <span>🔁 {formatNumber(tweet.metrics.retweets)}</span>
                        <span>💬 {formatNumber(tweet.metrics.replies)}</span>
                      </div>
                      <a
                        href={`https://x.com/i/web/status/${tweet.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && !trendData && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Discover viral patterns
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a topic or click "Analyze" to see what's trending and extract winning patterns.
          </p>
        </div>
      )}
    </div>
  );
}

