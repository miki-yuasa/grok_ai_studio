"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Info,
  BarChart3,
  Sparkles,
  Clock,
  Award,
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
  // Campaign Performance Predictions
  estimatedReach?: number;
  engagementRate?: number;
  projectedROI?: number;
  breakEvenConversions?: number;
  optimalPostingTimes?: string[];
  performanceScore?: number;
}

interface PostPrediction {
  id: string;
  content: string;
  predictedCTR: string;
  predictedCVR?: string;
  estimatedCPM?: number;
  estimatedCVR?: number;
  ctrReasoning?: string;
  calculatedImpressions?: number;
  calculatedClicks?: number;
  calculatedConversions?: number;
}

export default function BudgetPredictions() {
  const [predictions, setPredictions] = useState<BudgetPredictionsData | null>(
    null
  );
  const [posts, setPosts] = useState<PostPrediction[]>([]);
  const [budget, setBudget] = useState<number>(0);

  // Load campaign data from localStorage
  const loadCampaignData = useCallback(() => {
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

  useEffect(() => {
    // Load on mount
    loadCampaignData();

    // Listen for storage events (when campaign is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cachedStrategy") {
        loadCampaignData();
      }
    };

    // Listen for focus events (when user navigates back to this tab)
    const handleFocus = () => {
      loadCampaignData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCampaignData]);

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
    const avgCTR = (totalCTR / postCount) * 100;
    const avgCVR = (totalCVR / postCount) * 100;
    const costPerConversion =
      totalConversions > 0 ? budget / totalConversions : 0;

    // Campaign Performance Predictions
    const estimatedReach = Math.round(totalImpressions * 0.85); // Assuming 85% unique reach
    const engagementRate = avgCTR + avgCVR * 0.1; // Combined engagement metric

    // Assuming average conversion value of $50 for ROI calculation
    const avgConversionValue = 50;
    const revenue = totalConversions * avgConversionValue;
    const projectedROI = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;

    // Break-even calculation
    const breakEvenConversions = Math.ceil(budget / avgConversionValue);

    // Performance score (0-100) based on industry benchmarks
    let performanceScore = 0;
    if (avgCTR >= 2) performanceScore += 25; // Good CTR
    else if (avgCTR >= 1.5) performanceScore += 15;
    else if (avgCTR >= 1) performanceScore += 10;

    if (avgCVR >= 2) performanceScore += 25; // Good CVR
    else if (avgCVR >= 1) performanceScore += 15;
    else if (avgCVR >= 0.5) performanceScore += 10;

    const avgCPM = totalCPM / postCount;
    if (avgCPM <= 6) performanceScore += 25; // Good CPM
    else if (avgCPM <= 8) performanceScore += 15;
    else if (avgCPM <= 10) performanceScore += 10;

    if (costPerConversion <= 30) performanceScore += 25; // Good CPA
    else if (costPerConversion <= 50) performanceScore += 15;
    else if (costPerConversion <= 75) performanceScore += 10;

    return {
      totalBudget: budget,
      totalPredictedImpressions: Math.round(totalImpressions),
      totalPredictedClicks: Math.round(totalClicks),
      totalPredictedConversions: Math.round(totalConversions * 10) / 10,
      avgCPM: Math.round(avgCPM * 100) / 100,
      avgCTR: Math.round(avgCTR * 100) / 100,
      avgCVR: Math.round(avgCVR * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      estimatedReach,
      engagementRate: Math.round(engagementRate * 100) / 100,
      projectedROI: Math.round(projectedROI * 10) / 10,
      breakEvenConversions,
      performanceScore: Math.round(performanceScore),
    };
  };

  const displayPredictions = predictions || calculatePredictions();

  const getPerformanceLevel = (score: number) => {
    if (score >= 80)
      return {
        label: "Excellent",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200",
      };
    if (score >= 60)
      return {
        label: "Good",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
      };
    if (score >= 40)
      return {
        label: "Average",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
      };
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium text-foreground">
            Campaign Performance Predictions
          </h2>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered analytics and performance forecasts for your campaign
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
                <p className="text-sm text-muted-foreground">
                  Cost per Click (CPC)
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Cost per 1K Impressions
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(displayPredictions.avgCPM)}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Performance Predictions */}
          {displayPredictions.performanceScore !== undefined && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">
                  Campaign Performance Prediction
                </h3>
              </div>

              {/* Performance Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Overall Performance Score
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      getPerformanceLevel(displayPredictions.performanceScore)
                        .bg
                    }
                  >
                    <span
                      className={
                        getPerformanceLevel(displayPredictions.performanceScore)
                          .color
                      }
                    >
                      {
                        getPerformanceLevel(displayPredictions.performanceScore)
                          .label
                      }
                    </span>
                  </Badge>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary transition-all duration-500"
                    style={{ width: `${displayPredictions.performanceScore}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">0</span>
                  <span className="text-xs font-semibold text-foreground">
                    {displayPredictions.performanceScore}/100
                  </span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {displayPredictions.estimatedReach && (
                  <div className="bg-background/50 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Estimated Reach</span>
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      {formatNumber(displayPredictions.estimatedReach)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~85% unique viewers
                    </p>
                  </div>
                )}

                {displayPredictions.engagementRate !== undefined && (
                  <div className="bg-background/50 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Engagement Rate</span>
                    </div>
                    <p className="text-xl font-semibold text-blue-600">
                      {displayPredictions.engagementRate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Combined metric
                    </p>
                  </div>
                )}

                {displayPredictions.projectedROI !== undefined && (
                  <div className="bg-background/50 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Award className="h-4 w-4" />
                      <span className="text-xs">Projected ROI</span>
                    </div>
                    <p
                      className={`text-xl font-semibold ${
                        displayPredictions.projectedROI > 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {displayPredictions.projectedROI > 0 ? "+" : ""}
                      {displayPredictions.projectedROI.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on $50 avg value
                    </p>
                  </div>
                )}

                {displayPredictions.breakEvenConversions && (
                  <div className="bg-background/50 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Target className="h-4 w-4" />
                      <span className="text-xs">Break-Even Point</span>
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      {displayPredictions.breakEvenConversions}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      conversions needed
                    </p>
                  </div>
                )}
              </div>

              {/* Performance Insights */}
              <div className="mt-6 p-4 bg-background/50 backdrop-blur rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Performance Insights
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {displayPredictions.avgCTR >= 2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Excellent CTR - Your ads are highly engaging</span>
                    </li>
                  )}
                  {displayPredictions.avgCVR >= 2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>
                        Strong conversion rate - Effective call-to-actions
                      </span>
                    </li>
                  )}
                  {displayPredictions.avgCPM <= 6 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Competitive CPM - Cost-efficient impressions</span>
                    </li>
                  )}
                  {displayPredictions.costPerConversion <= 30 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>
                        Low acquisition cost - Excellent value per conversion
                      </span>
                    </li>
                  )}
                  {displayPredictions.projectedROI &&
                    displayPredictions.projectedROI > 100 && (
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600">✓</span>
                        <span>
                          High ROI potential - Campaign likely to be profitable
                        </span>
                      </li>
                    )}
                  {displayPredictions.performanceScore < 40 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">!</span>
                      <span>
                        Consider optimizing budget allocation or targeting to
                        improve results
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

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
                <p className="text-foreground">(Budget ÷ CPM) × 1,000</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Clicks
                </p>
                <p className="text-foreground">Impressions × CTR</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Conversions
                </p>
                <p className="text-foreground">Clicks × CVR</p>
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
                  // Use actual values from post or calculate from predictions
                  const cpm =
                    post.estimatedCPM || displayPredictions.avgCPM || 8;

                  // Parse CTR from string format
                  let ctr = 2; // default
                  if (post.predictedCTR) {
                    const ctrStr = post.predictedCTR.replace("%", "").trim();
                    const parsed = parseFloat(ctrStr);
                    if (!isNaN(parsed)) ctr = parsed;
                  }

                  // Parse CVR - could be number or string
                  let cvr = 2; // default
                  if (post.estimatedCVR) {
                    cvr =
                      typeof post.estimatedCVR === "number"
                        ? post.estimatedCVR
                        : parseFloat(post.estimatedCVR);
                  } else if (post.predictedCVR) {
                    const cvrStr = post.predictedCVR.replace("%", "").trim();
                    const parsed = parseFloat(cvrStr);
                    if (!isNaN(parsed)) cvr = parsed;
                  }

                  const budgetPerPost =
                    displayPredictions.totalBudget / posts.length;

                  // Use calculated values from post if available, otherwise compute
                  const impressions =
                    post.calculatedImpressions ?? (budgetPerPost / cpm) * 1000;
                  const clicks =
                    post.calculatedClicks ?? impressions * (ctr / 100);
                  const conversions =
                    post.calculatedConversions ?? clicks * (cvr / 100);

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
                          <span className="font-medium text-blue-600">
                            {ctr}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CVR:</span>
                          <span className="font-medium text-emerald-600">
                            {cvr}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Est. Impressions:
                          </span>
                          <span className="font-medium">
                            {formatNumber(Math.round(impressions))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Est. Clicks:
                          </span>
                          <span className="font-medium">
                            {Math.round(clicks)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Est. Conversions:
                          </span>
                          <span className="font-medium">
                            {conversions.toFixed(1)}
                          </span>
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
            Generate a campaign strategy with a budget to see conversion
            predictions. Go to the Create page and include a budget in your
            campaign details.
          </p>
        </div>
      )}
    </div>
  );
}
