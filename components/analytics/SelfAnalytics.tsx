"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Eye,
  Heart,
  Repeat2,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
  Sparkles,
  Trophy,
  AlertTriangle,
  Clock,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Filter,
  Database,
} from "lucide-react";
import {
  STORAGE_KEYS,
  StoredSelfAnalytics,
  saveToStorage,
  loadFromStorage,
  formatLastUpdated,
} from "@/lib/analytics-storage";

interface PostAnalytics {
  id: string;
  text: string;
  created_at: string;
  raw_metrics: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  calculated: {
    impressions: number;
    engagements: number;
    engagement_rate: number;
    ctr: number;
  };
}

interface AnalyticsSummary {
  total_posts: number;
  total_impressions: number;
  total_engagements: number;
  avg_engagement_rate: number;
  avg_ctr: number;
}

interface AIInsights {
  topPerformers: { content: string; er: number; reason: string }[];
  worstPerformers: { content: string; er: number; issue: string }[];
  patterns: string[];
  recommendations: string[];
  bestPostingTimes: string[];
  contentMix: { type: string; count: number; avgER: number }[];
}

type FilterType = "all" | "original" | "replies" | "high_er" | "low_er";

interface DraggableInsight {
  id: string;
  type: "hook" | "timing" | "pattern" | "audience" | "trend" | "recommendation";
  label: string;
  value: string;
  source: string;
}

interface SelfAnalyticsProps {
  onInsightsGenerated?: (insights: DraggableInsight[]) => void;
}

export default function SelfAnalytics({ onInsightsGenerated }: SelfAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showInsights, setShowInsights] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage<StoredSelfAnalytics>(STORAGE_KEYS.SELF_ANALYTICS);
    if (stored) {
      setPosts(stored.posts || []);
      setSummary(stored.summary || null);
      setInsights(stored.insights || null);
      setLastUpdated(stored.lastUpdated);
      if (stored.insights) {
        setShowInsights(true);
      }
      
      // Emit insights if callback provided
      if (onInsightsGenerated && stored.insights) {
        emitInsights(stored.posts, stored.insights);
      }
    }
  }, []);

  // Helper to emit insights
  const emitInsights = (postsData: PostAnalytics[], insightsData: AIInsights | null) => {
    if (!onInsightsGenerated) return;
    
    const draggableInsights: DraggableInsight[] = [];
    
    if (insightsData) {
      insightsData.topPerformers?.forEach((p, i) => {
        draggableInsights.push({
          id: `self-hook-${i}`,
          type: "hook",
          label: `Top Hook #${i + 1} (${p.er?.toFixed(1) || 0}% ER)`,
          value: p.content || "",
          source: "Self Analytics",
        });
      });

      insightsData.bestPostingTimes?.forEach((time, i) => {
        draggableInsights.push({
          id: `self-timing-${i}`,
          type: "timing",
          label: `Best Time #${i + 1}`,
          value: time,
          source: "Self Analytics",
        });
      });

      insightsData.patterns?.forEach((pattern, i) => {
        draggableInsights.push({
          id: `self-pattern-${i}`,
          type: "pattern",
          label: `Pattern #${i + 1}`,
          value: pattern,
          source: "Self Analytics",
        });
      });

      insightsData.recommendations?.forEach((rec, i) => {
        draggableInsights.push({
          id: `self-rec-${i}`,
          type: "recommendation",
          label: `Recommendation #${i + 1}`,
          value: rec,
          source: "Self Analytics",
        });
      });
    }
    
    onInsightsGenerated(draggableInsights);
  };

  // Save to localStorage
  const saveData = (postsData: PostAnalytics[], summaryData: AnalyticsSummary | null, insightsData: AIInsights | null) => {
    const data: StoredSelfAnalytics = {
      posts: postsData,
      summary: summaryData,
      insights: insightsData,
      lastUpdated: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.SELF_ANALYTICS, data);
    setLastUpdated(data.lastUpdated);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to get tweet IDs from localStorage (posted tweets)
      const cachedStrategy = localStorage.getItem("cachedStrategy");
      let tweetIds: string[] = [];

      if (cachedStrategy) {
        const parsed = JSON.parse(cachedStrategy);
        if (parsed.posts) {
          // Get IDs of posted tweets (would need to store tweet IDs after posting)
          tweetIds = parsed.posts
            .filter((p: any) => p.status === "posted" && p.tweetId)
            .map((p: any) => p.tweetId);
        }
      }

      // If no specific tweet IDs, fetch user's recent tweets
      const response = await fetch(
        `/api/analytics/post-metrics?userTweets=true&maxResults=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setSummary(data.summary || null);
      // Save to localStorage (insights preserved if they exist)
      saveData(data.posts || [], data.summary || null, insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzePerformance = async () => {
    if (posts.length === 0) return;

    setAnalyzing(true);
    try {
      const response = await fetch("/api/analytics/analyze-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze posts");
      }

      const data = await response.json();
      setInsights(data.insights);
      setShowInsights(true);
      
      // Save to localStorage
      saveData(posts, summary, data.insights);
      
      // Emit draggable insights
      emitInsights(posts, data.insights);
    } catch (err) {
      // Generate local insights if API fails
      generateLocalInsights();
    } finally {
      setAnalyzing(false);
    }
  };

  const generateLocalInsights = () => {
    // Sort posts by engagement rate
    const sorted = [...posts].sort(
      (a, b) => b.calculated.engagement_rate - a.calculated.engagement_rate
    );

    // Top 3 performers
    const topPerformers = sorted.slice(0, 3).map((p) => ({
      content: p.text.substring(0, 80) + (p.text.length > 80 ? "..." : ""),
      er: p.calculated.engagement_rate,
      reason: p.calculated.engagement_rate > 5 ? "High conversation value" : 
              p.text.startsWith("@") ? "Quality reply" : "Engaging content",
    }));

    // Bottom 3 performers
    const worstPerformers = sorted.slice(-3).reverse().map((p) => ({
      content: p.text.substring(0, 80) + (p.text.length > 80 ? "..." : ""),
      er: p.calculated.engagement_rate,
      issue: p.text.length < 50 ? "Too short" : 
             p.text.includes("http") ? "Link may reduce visibility" : "Low resonance",
    }));

    // Analyze patterns
    const patterns: string[] = [];
    const replies = posts.filter((p) => p.text.startsWith("@"));
    const originals = posts.filter((p) => !p.text.startsWith("@"));
    
    const avgReplyER = replies.length > 0 
      ? replies.reduce((s, p) => s + p.calculated.engagement_rate, 0) / replies.length 
      : 0;
    const avgOriginalER = originals.length > 0 
      ? originals.reduce((s, p) => s + p.calculated.engagement_rate, 0) / originals.length 
      : 0;

    if (avgReplyER > avgOriginalER) {
      patterns.push(`Your replies (${avgReplyER.toFixed(1)}% ER) outperform original tweets (${avgOriginalER.toFixed(1)}% ER)`);
    } else if (avgOriginalER > avgReplyER) {
      patterns.push(`Your original tweets (${avgOriginalER.toFixed(1)}% ER) outperform replies (${avgReplyER.toFixed(1)}% ER)`);
    }

    // Check for question marks (questions often get more engagement)
    const questions = posts.filter((p) => p.text.includes("?"));
    if (questions.length > 0) {
      const avgQuestionER = questions.reduce((s, p) => s + p.calculated.engagement_rate, 0) / questions.length;
      if (avgQuestionER > (summary?.avg_engagement_rate || 0)) {
        patterns.push(`Questions get ${avgQuestionER.toFixed(1)}% ER (${(avgQuestionER / (summary?.avg_engagement_rate || 1) * 100 - 100).toFixed(0)}% above average)`);
      }
    }

    // Analyze posting times
    const hourlyEngagement: { [key: number]: { count: number; totalER: number } } = {};
    posts.forEach((p) => {
      const hour = new Date(p.created_at).getHours();
      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = { count: 0, totalER: 0 };
      }
      hourlyEngagement[hour].count++;
      hourlyEngagement[hour].totalER += p.calculated.engagement_rate;
    });

    const bestHours = Object.entries(hourlyEngagement)
      .map(([hour, data]) => ({ hour: parseInt(hour), avgER: data.totalER / data.count }))
      .sort((a, b) => b.avgER - a.avgER)
      .slice(0, 3);

    const bestPostingTimes = bestHours.map((h) => {
      const ampm = h.hour >= 12 ? "PM" : "AM";
      const displayHour = h.hour % 12 || 12;
      return `${displayHour}${ampm} (${h.avgER.toFixed(1)}% ER)`;
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (avgReplyER > avgOriginalER * 1.5) {
      recommendations.push("Focus on quality replies - they're your strength. Engage with larger accounts in your niche.");
    }
    
    if (questions.length < posts.length * 0.2) {
      recommendations.push("Try asking more questions to boost engagement and start conversations.");
    }

    if (posts.some((p) => p.calculated.engagement_rate > 10)) {
      recommendations.push("Analyze your high-performing posts and replicate their style/format.");
    }

    recommendations.push(`Post more during your peak hours: ${bestPostingTimes[0]?.split(" ")[0] || "evening"}`);

    // Content mix analysis
    const contentMix = [
      { 
        type: "Original", 
        count: originals.length, 
        avgER: avgOriginalER 
      },
      { 
        type: "Replies", 
        count: replies.length, 
        avgER: avgReplyER 
      },
    ];

    const newInsights = {
      topPerformers,
      worstPerformers,
      patterns,
      recommendations,
      bestPostingTimes,
      contentMix,
    };
    
    setInsights(newInsights);
    setShowInsights(true);

    // Save to localStorage
    saveData(posts, summary, newInsights);
    
    // Emit draggable insights
    emitInsights(posts, newInsights);
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    switch (filter) {
      case "original":
        return !post.text.startsWith("@");
      case "replies":
        return post.text.startsWith("@");
      case "high_er":
        return post.calculated.engagement_rate > (summary?.avg_engagement_rate || 0);
      case "low_er":
        return post.calculated.engagement_rate <= (summary?.avg_engagement_rate || 0);
      default:
        return true;
    }
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Post Performance</h2>
          <p className="text-sm text-muted-foreground">
            Analyze your posted tweets and get AI-powered insights
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
          <Button onClick={fetchAnalytics} disabled={loading || analyzing}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {posts.length > 0 ? "Refresh" : "Fetch Analytics"}
              </>
            )}
          </Button>
          {posts.length > 0 && (
            <Button 
              onClick={analyzePerformance} 
              disabled={loading || analyzing}
              variant="outline"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Insights
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="text-sm">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure your X API credentials are configured with Pro/Enterprise access.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Total Posts</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {summary.total_posts}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Impressions</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatNumber(summary.total_impressions)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Engagements</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatNumber(summary.total_engagements)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg Engagement</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">
              {summary.avg_engagement_rate}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg CTR</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {summary.avg_ctr}%
            </p>
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {showInsights && insights && (
        <div className="space-y-4">
          {/* Top & Worst Performers */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-emerald-600" />
                <h3 className="font-medium text-foreground">Top Performers</h3>
              </div>
              <div className="space-y-3">
                {insights.topPerformers.map((post, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-foreground line-clamp-2">{post.content}</p>
                      <Badge className="bg-emerald-100 text-emerald-700 shrink-0">
                        {post.er.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ✨ {post.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-medium text-foreground">Needs Improvement</h3>
              </div>
              <div className="space-y-3">
                {insights.worstPerformers.map((post, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-foreground line-clamp-2">{post.content}</p>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 shrink-0">
                        {post.er.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ {post.issue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patterns & Best Times */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Patterns Discovered */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Patterns Discovered</h3>
              </div>
              <ul className="space-y-2">
                {insights.patterns.map((pattern, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {pattern}
                  </li>
                ))}
                {insights.patterns.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Need more data to identify patterns
                  </li>
                )}
              </ul>
            </div>

            {/* Best Posting Times */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Best Posting Times</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.bestPostingTimes.map((time, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {i === 0 && "🥇 "}
                    {i === 1 && "🥈 "}
                    {i === 2 && "🥉 "}
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Content Mix Analysis */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Content Mix</h3>
            </div>
            <div className="flex gap-6">
              {insights.contentMix.map((item, i) => (
                <div key={i} className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{item.type}</span>
                    <span className="text-sm text-muted-foreground">{item.count} posts</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(item.avgER * 10, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.avgER.toFixed(1)}% avg ER
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">AI Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Recent Posts</h3>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="text-sm rounded-md border border-input bg-background px-2 py-1"
              >
                <option value="all">All Posts ({posts.length})</option>
                <option value="original">
                  Original ({posts.filter((p) => !p.text.startsWith("@")).length})
                </option>
                <option value="replies">
                  Replies ({posts.filter((p) => p.text.startsWith("@")).length})
                </option>
                <option value="high_er">
                  Above Avg ER ({posts.filter((p) => p.calculated.engagement_rate > (summary?.avg_engagement_rate || 0)).length})
                </option>
                <option value="low_er">
                  Below Avg ER ({posts.filter((p) => p.calculated.engagement_rate <= (summary?.avg_engagement_rate || 0)).length})
                </option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const isAboveAvg = post.calculated.engagement_rate > (summary?.avg_engagement_rate || 0);
              
              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {post.text.startsWith("@") && (
                          <Badge variant="outline" className="text-xs">Reply</Badge>
                        )}
                        {isAboveAvg ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 mt-1">
                        {post.text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        post.calculated.engagement_rate > 5
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : post.calculated.engagement_rate > 1
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : post.calculated.engagement_rate > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {post.calculated.engagement_rate}% ER
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{formatNumber(post.calculated.impressions)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{formatNumber(post.raw_metrics?.like_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Repeat2 className="h-3.5 w-3.5" />
                      <span>{formatNumber(post.raw_metrics?.retweet_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{formatNumber(post.raw_metrics?.reply_count || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No posts match this filter
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No analytics data yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Click "Fetch Analytics" to load your post performance data from X.
          </p>
        </div>
      )}
    </div>
  );
}

