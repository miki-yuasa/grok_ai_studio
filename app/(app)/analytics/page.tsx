"use client";

import { useState, useCallback, useEffect } from "react";
import { BarChart3, TrendingUp, Zap, DollarSign, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import SelfAnalytics from "@/components/analytics/SelfAnalytics";
import TrendingAnalysis from "@/components/analytics/TrendingAnalysis";
import HookOptimizer from "@/components/analytics/HookOptimizer";
import BudgetPredictions from "@/components/analytics/BudgetPredictions";
import PipelineBuilder from "@/components/analytics/PipelineBuilder";
import {
  STORAGE_KEYS,
  StoredSelfAnalytics,
  StoredTrendingData,
  StoredHooksData,
  loadFromStorage,
} from "@/lib/analytics-storage";

interface DraggableInsight {
  id: string;
  type: "hook" | "timing" | "pattern" | "audience" | "trend" | "recommendation";
  label: string;
  value: string;
  source: string;
}
import { Badge } from "@/components/ui/badge";

type TabId = "self" | "trends" | "hooks" | "budget" | "pipeline";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof BarChart3;
  description: string;
}

const tabs: Tab[] = [
  {
    id: "self",
    label: "Self Analytics",
    icon: BarChart3,
    description: "Analyze your posted tweets",
  },
  {
    id: "trends",
    label: "Trending",
    icon: TrendingUp,
    description: "Discover viral patterns",
  },
  {
    id: "hooks",
    label: "Hook Optimizer",
    icon: Zap,
    description: "AI-powered hook testing",
  },
  {
    id: "budget",
    label: "Predictions",
    icon: DollarSign,
    description: "Budget & conversion forecasts",
  },
  {
    id: "pipeline",
    label: "Pipeline Builder",
    icon: GitBranch,
    description: "Build visual data pipelines with LLM filtering",
  },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("self");
  const [insights, setInsights] = useState<DraggableInsight[]>([]);
  
  // Separate data for pipeline
  const [analyticsData, setAnalyticsData] = useState<string[]>([]);
  const [trendingData, setTrendingData] = useState<string[]>([]);
  const [hookData, setHookData] = useState<string[]>([]);

  // Load stored data on mount for pipeline
  useEffect(() => {
    // Load self analytics data
    const storedAnalytics = loadFromStorage<StoredSelfAnalytics>(STORAGE_KEYS.SELF_ANALYTICS);
    if (storedAnalytics?.insights) {
      const items: string[] = [];
      storedAnalytics.insights.topPerformers?.forEach((p: any) => {
        if (p.content) items.push(p.content);
      });
      storedAnalytics.insights.patterns?.forEach((p: string) => items.push(p));
      storedAnalytics.insights.recommendations?.forEach((r: string) => items.push(r));
      storedAnalytics.insights.bestPostingTimes?.forEach((t: string) => items.push(t));
      if (items.length > 0) setAnalyticsData(items);
    }

    // Load trending data
    const storedTrending = loadFromStorage<StoredTrendingData>(STORAGE_KEYS.TRENDING);
    if (storedTrending?.trendData) {
      const items: string[] = [];
      storedTrending.trendData.trending_topics?.forEach((t: string) => items.push(t));
      storedTrending.trendData.viral_patterns?.top_hashtags?.forEach((h: any) => {
        items.push(`#${h.tag}`);
      });
      storedTrending.trendData.sample_viral_tweets?.slice(0, 3).forEach((t: any) => {
        if (t.text) items.push(t.text.substring(0, 100));
      });
      if (items.length > 0) setTrendingData(items);
    }

    // Load hooks data
    const storedHooks = loadFromStorage<StoredHooksData>(STORAGE_KEYS.HOOKS);
    if (storedHooks?.hooks && storedHooks.hooks.length > 0) {
      const items = [...storedHooks.hooks]
        .sort((a: any, b: any) => (b.avgScore || b.score) - (a.avgScore || a.score))
        .slice(0, 10)
        .map((h: any) => h.content);
      setHookData(items);
    }
  }, []);

  const addInsights = useCallback((newInsights: DraggableInsight[]) => {
    setInsights((prev) => {
      // Filter out duplicates by id
      const existingIds = new Set(prev.map((i) => i.id));
      const unique = newInsights.filter((i) => !existingIds.has(i.id));
      return [...prev, ...unique];
    });
    
    // Also update pipeline data
    const analyticsItems = newInsights
      .filter((i) => i.source === "Self Analytics" || i.source === "AI Analysis")
      .map((i) => i.value);
    const trendItems = newInsights
      .filter((i) => i.source === "Trending")
      .map((i) => i.value);
    const hookItems = newInsights
      .filter((i) => i.source === "Hook Optimizer")
      .map((i) => i.value);
    
    if (analyticsItems.length > 0) {
      setAnalyticsData((prev) => Array.from(new Set([...prev, ...analyticsItems])));
    }
    if (trendItems.length > 0) {
      setTrendingData((prev) => Array.from(new Set([...prev, ...trendItems])));
    }
    if (hookItems.length > 0) {
      setHookData((prev) => Array.from(new Set([...prev, ...hookItems])));
    }
  }, []);

  const totalDataPoints = analyticsData.length + trendingData.length + hookData.length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Track performance, discover trends, and optimize your campaigns
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "pipeline" && totalDataPoints > 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {showBadge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {totalDataPoints}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="text-sm text-muted-foreground">
        {tabs.find((t) => t.id === activeTab)?.description}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "self" && <SelfAnalytics onInsightsGenerated={addInsights} />}
        {activeTab === "trends" && <TrendingAnalysis onInsightsGenerated={addInsights} />}
        {activeTab === "hooks" && <HookOptimizer onInsightsGenerated={addInsights} />}
        {activeTab === "budget" && <BudgetPredictions />}
        {activeTab === "pipeline" && (
          <PipelineBuilder
            analyticsData={analyticsData}
            trendingData={trendingData}
            hookData={hookData}
          />
        )}
      </div>
    </div>
  );
}
