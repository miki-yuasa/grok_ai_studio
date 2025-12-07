"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Info,
  BarChart3,
} from "lucide-react";

interface BudgetPredictionsData {
  totalBudget: number;
  totalPredictedImpressions: number;
  totalPredictedClicks: number;
  totalPredictedConversions: number;
  avgCPM: number;
  avgCTR: number;
  avgCVR: number;
  costPerConversion: number;
}

interface PostPrediction {
  id: string;
  content: string;
  predictedCTR: string;
  estimatedCPM?: number;
  estimatedCVR?: number;
  ctrReasoning?: string;
}

export default function BudgetPredictions() {
  const [predictions, setPredictions] = useState<BudgetPredictionsData | null>(null);
  const [posts, setPosts] = useState<PostPrediction[]>([]);
  const [budget, setBudget] = useState<number>(0);

  useEffect(() => {
    // Load from localStorage
    const cachedStrategy = localStorage.getItem("cachedStrategy");
    if (cachedStrategy) {
      try {
        const parsed = JSON.parse(cachedStrategy);
        if (parsed.budgetPredictions) {
          setPredictions(parsed.budgetPredictions);
          setBudget(parsed.budgetPredictions.totalBudget || 0);
        }
        if (parsed.posts) {
          setPosts(parsed.posts);
        }
      } catch (error) {
        console.error("Failed to parse cached strategy:", error);
      }
    }
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Calculate predictions manually if not in cache
  const calculatePredictions = () => {
    if (budget <= 0 || posts.length === 0) return null;

    const budgetPerPost = budget / posts.length;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalCPM = 0;
    let totalCTR = 0;
    let totalCVR = 0;

    posts.forEach((post) => {
      const cpm = post.estimatedCPM || 8;
      const ctrStr = post.predictedCTR || "2%";
      const ctr = parseFloat(ctrStr.replace("%", "")) / 100;
      const cvr = (post.estimatedCVR || 2) / 100;

      const impressions = (budgetPerPost / cpm) * 1000;
      const clicks = impressions * ctr;
      const conversions = clicks * cvr;

      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += conversions;
      totalCPM += cpm;
      totalCTR += ctr;
      totalCVR += cvr;
    });

    const postCount = posts.length;
    return {
      totalBudget: budget,
      totalPredictedImpressions: Math.round(totalImpressions),
      totalPredictedClicks: Math.round(totalClicks),
      totalPredictedConversions: Math.round(totalConversions * 10) / 10,
      avgCPM: Math.round((totalCPM / postCount) * 100) / 100,
      avgCTR: Math.round(((totalCTR / postCount) * 100) * 100) / 100,
      avgCVR: Math.round(((totalCVR / postCount) * 100) * 100) / 100,
      costPerConversion:
        totalConversions > 0
          ? Math.round((budget / totalConversions) * 100) / 100
          : 0,
    };
  };

  const displayPredictions = predictions || calculatePredictions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-foreground">
          Budget & Conversion Predictions
        </h2>
        <p className="text-sm text-muted-foreground">
          AI-estimated campaign performance based on your strategy
        </p>
      </div>

      {displayPredictions ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Budget</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(displayPredictions.totalBudget)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Predicted Impressions</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatNumber(displayPredictions.totalPredictedImpressions)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                @ ${displayPredictions.avgCPM} CPM avg
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                <span className="text-xs">Predicted Clicks</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-blue-600">
                {formatNumber(displayPredictions.totalPredictedClicks)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                @ {displayPredictions.avgCTR}% CTR avg
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-xs">Predicted Conversions</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {displayPredictions.totalPredictedConversions}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                @ {displayPredictions.avgCVR}% CVR avg
              </p>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Cost Analysis
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Cost per Click (CPC)</p>
                <p className="text-xl font-semibold text-foreground">
                  {displayPredictions.totalPredictedClicks > 0
                    ? formatCurrency(
                        displayPredictions.totalBudget /
                          displayPredictions.totalPredictedClicks
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Cost per Conversion (CPA)
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {displayPredictions.costPerConversion > 0
                    ? formatCurrency(displayPredictions.costPerConversion)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost per 1K Impressions</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(displayPredictions.avgCPM)}
                </p>
              </div>
            </div>
          </div>

          {/* Formulas Explanation */}
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                How predictions are calculated
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Impressions
                </p>
                <p className="text-foreground">
                  (Budget ÷ CPM) × 1,000
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Clicks
                </p>
                <p className="text-foreground">
                  Impressions × CTR
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Conversions
                </p>
                <p className="text-foreground">
                  Clicks × CVR
                </p>
              </div>
            </div>
          </div>

          {/* Per-Post Breakdown */}
          {posts.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-lg font-medium text-foreground">
                  Per-Post Predictions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Individual estimates for each campaign post
                </p>
              </div>
              <div className="divide-y divide-border">
                {posts.map((post, i) => {
                  const cpm = post.estimatedCPM || 8;
                  const ctrStr = post.predictedCTR || "2%";
                  const ctr = parseFloat(ctrStr.replace("%", ""));
                  const cvr = post.estimatedCVR || 2;
                  const budgetPerPost = displayPredictions.totalBudget / posts.length;
                  const impressions = (budgetPerPost / cpm) * 1000;
                  const clicks = impressions * (ctr / 100);
                  const conversions = clicks * (cvr / 100);

                  return (
                    <div key={post.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-1">
                            {post.content}
                          </p>
                          {post.ctrReasoning && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {post.ctrReasoning}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          Post {i + 1}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CPM:</span>
                          <span className="font-medium">${cpm}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CTR:</span>
                          <span className="font-medium text-blue-600">{ctr}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CVR:</span>
                          <span className="font-medium text-emerald-600">{cvr}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Est. Impressions:</span>
                          <span className="font-medium">{formatNumber(Math.round(impressions))}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Est. Clicks:</span>
                          <span className="font-medium">{Math.round(clicks)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Est. Conversions:</span>
                          <span className="font-medium">{conversions.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No predictions available
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Generate a campaign strategy with a budget to see conversion predictions.
            Go to the Create page and include a budget in your campaign details.
          </p>
        </div>
      )}
    </div>
  );
}

