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
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(strategy.budget)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Total Impressions
                    </p>
                    <p className="text-lg font-semibold">
                      {formatNumber(strategy.totalImpressions || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Total Traffic
                    </p>
                    <p className="text-lg font-semibold">
                      {formatNumber(strategy.totalTraffic || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Total Conversions
                    </p>
                    <p className="text-lg font-semibold">
                      {(strategy.totalConversions || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Effective CTR
                    </p>
                    <p className="text-lg font-semibold">
                      {formatPercentage(strategy.effectiveCTR || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Effective CVR
                    </p>
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
