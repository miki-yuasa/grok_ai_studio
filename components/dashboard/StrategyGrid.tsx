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

interface StrategyGridProps {
  strategy: AdStrategy | null;
  onMediaGenerated: (
    postId: string,
    mediaUrl: string,
    mediaType: "image" | "video"
  ) => void;
  onPostEdited: (postId: string, content: string, replyContent: string) => void;
  onMediaPromptEdited: (
    postId: string,
    imagePrompt: string,
    videoPrompt: string
  ) => void;
}

export function StrategyGrid({
  strategy,
  onMediaGenerated,
  onPostEdited,
  onMediaPromptEdited,
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
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Strategy Summary</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {strategy.strategySummary}
            </p>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
