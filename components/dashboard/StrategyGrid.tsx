"use client";

import { AdStrategy } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdCard } from "./AdCard";
import { formatNumber, formatPercentage, formatCurrency } from "@/lib/metrics";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StrategyGridProps {
  strategy: AdStrategy | null;
  onMediaGenerated: (
    postId: string,
    mediaUrl: string,
    mediaType: "image" | "video"
  ) => void;
  onPostEdited: (
    postId: string,
    content: string,
    replyContent: string,
    scheduledTime?: string
  ) => void;
  onMediaPromptEdited: (
    postId: string,
    imagePrompt: string,
    videoPrompt: string
  ) => void;
  onPostStatusChanged?: (
    postId: string,
    status: "draft" | "generated" | "posted"
  ) => void;
}

export function StrategyGrid({
  strategy,
  onMediaGenerated,
  onPostEdited,
  onMediaPromptEdited,
  onPostStatusChanged,
}: StrategyGridProps) {
  const metricExplanations = {
    budget:
      "The total budget allocated for this campaign. This amount is evenly split across all posts to calculate individual post performance.",
    impressions:
      "The total number of times your ads will be shown to users. Calculated as: (Budget / CPM) × 1,000 for each post, then summed.",
    traffic:
      "The total number of clicks expected from your campaign. Calculated as: Impressions × CTR for each post, then summed.",
    conversions:
      "The total number of expected conversions (purchases, sign-ups, etc.). Calculated as: Clicks × CVR for each post, then summed.",
    effectiveCTR:
      "Campaign-wide Click-Through Rate (weighted average). Calculated as: Total Traffic / Total Impressions. Higher CTR indicates more engaging content.",
    effectiveCVR:
      "Campaign-wide Conversion Rate (weighted average). Calculated as: Total Conversions / Total Traffic. Higher CVR indicates better conversion optimization.",
  };

  if (!strategy) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            Generate a strategy to see your viral ad campaign
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Strategy</CardTitle>
          <CardDescription>
            Target Audience: {strategy.targetAudience}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Strategy Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {strategy.strategySummary}
              </p>
            </div>

            {/* Campaign Metrics */}
            {strategy.budget && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  Campaign Performance Predictions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Budget</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.budget}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatCurrency(strategy.budget)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        Total Impressions
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Total Impressions</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.impressions}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatNumber(strategy.totalImpressions || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        Total Traffic
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Total Traffic</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.traffic}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatNumber(strategy.totalTraffic || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        Total Conversions
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Total Conversions</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.conversions}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {(strategy.totalConversions || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        Effective CTR
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Effective CTR</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.effectiveCTR}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatPercentage(strategy.effectiveCTR || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        Effective CVR
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Effective CVR</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {metricExplanations.effectiveCVR}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatPercentage(strategy.effectiveCVR || 0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Predictions based on even budget split across all posts.
                  Effective rates are weighted campaign averages (uniform
                  weights for demo).
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Campaign Posts ({strategy.posts.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategy.posts.map((post) => (
            <AdCard
              key={post.id}
              post={post}
              onMediaGenerated={onMediaGenerated}
              onPostEdited={onPostEdited}
              onMediaPromptEdited={onMediaPromptEdited}
              onPostStatusChanged={onPostStatusChanged}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
