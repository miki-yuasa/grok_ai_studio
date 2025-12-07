"use client";

import { useState, useEffect } from "react";
import { InputForm } from "@/components/dashboard/InputForm";
import { StrategyGrid } from "@/components/dashboard/StrategyGrid";
import { GenerationProgress } from "@/components/dashboard/GenerationProgress";
import { AdStrategy } from "@/lib/types";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [generationSteps, setGenerationSteps] = useState<
    Array<{ id: string; label: string; status: "pending" | "active" | "complete" }>
  >([]);

  // Load cached strategy on mount
  useEffect(() => {
    const cachedStrategy = localStorage.getItem("cachedStrategy");
    if (cachedStrategy) {
      try {
        const parsed = JSON.parse(cachedStrategy);
        // Migrate old mediaUrl to imageUrl/videoUrl based on mediaType
        // Migrate old mediaPrompt to imagePrompt/videoPrompt
        if (parsed.posts) {
          parsed.posts = parsed.posts.map((post: any) => {
            const migrated = { ...post };

            // Migrate mediaUrl
            if (post.mediaUrl && !post.imageUrl && !post.videoUrl) {
              if (post.mediaType === "image") {
                migrated.imageUrl = post.mediaUrl;
              } else {
                migrated.videoUrl = post.mediaUrl;
              }
            }

            // Migrate mediaPrompt to both image and video prompts if not already set
            if (post.mediaPrompt && !post.imagePrompt && !post.videoPrompt) {
              migrated.imagePrompt = post.mediaPrompt;
              migrated.videoPrompt = post.mediaPrompt;
            }

            return migrated;
          });
        }
        setStrategy(parsed);
      } catch (error) {
        console.error("Failed to parse cached strategy:", error);
        localStorage.removeItem("cachedStrategy");
      }
    }
  }, []);

  // Cache strategy whenever it changes
  useEffect(() => {
    if (strategy) {
      localStorage.setItem("cachedStrategy", JSON.stringify(strategy));
    }
  }, [strategy]);

  const handleProgressUpdate = (step: string) => {
    const stepConfig = [
      { id: "analyzing", label: "Analyzing Product" },
      { id: "searching", label: "Searching Trends" },
      { id: "predicting", label: "Predicting Traffic" },
      { id: "synthesizing", label: "Synthesizing Strategy" },
    ];

    if (step === "analyzing") {
      // Initialize all steps
      setGenerationSteps(
        stepConfig.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "active" : "pending",
        }))
      );
    } else if (step === "complete") {
      // Mark all steps as complete
      setGenerationSteps((prev) =>
        prev.map((s) => ({ ...s, status: "complete" as const }))
      );
      // Clear after a short delay
      setTimeout(() => setGenerationSteps([]), 2000);
    } else {
      // Update progress
      setGenerationSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status:
            s.id === step
              ? "active"
              : stepConfig.findIndex((c) => c.id === s.id) <
                stepConfig.findIndex((c) => c.id === step)
              ? "complete"
              : "pending",
        }))
      );
    }
  };

  const handleStrategyGenerated = async (newStrategy: AdStrategy) => {
    // Clear cache and set new strategy when regenerating
    setStrategy(newStrategy);

    // Save all posts to database for scheduling
    try {
      for (const post of newStrategy.posts) {
        await fetch("/api/save-scheduled-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...post,
            strategyId: `strategy_${Date.now()}`,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to save posts to database:", error);
      // Don't block the UI if saving fails
    }
  };

  const handleMediaGenerated = async (
    postId: string,
    mediaUrl: string,
    mediaType: "image" | "video"
  ) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            ...(mediaType === "image"
              ? { imageUrl: mediaUrl }
              : { videoUrl: mediaUrl }),
            status: "generated" as const,
          }
        : post
    );

    setStrategy({
      ...strategy,
      posts: updatedPosts,
    });

    // Save updated post to database
    const updatedPost = updatedPosts.find((p) => p.id === postId);
    if (updatedPost) {
      try {
        await fetch("/api/save-scheduled-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPost),
        });
      } catch (error) {
        console.error("Failed to save post with media:", error);
      }
    }
  };

  const handlePostEdited = async (
    postId: string,
    content: string,
    replyContent: string,
    scheduledTime?: string
  ) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            content,
            replyContent,
            ...(scheduledTime && { scheduledTime }),
          }
        : post
    );

    setStrategy({
      ...strategy,
      posts: updatedPosts,
    });

    // Save updated post to database
    const updatedPost = updatedPosts.find((p) => p.id === postId);
    if (updatedPost) {
      try {
        await fetch("/api/save-scheduled-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPost),
        });
      } catch (error) {
        console.error("Failed to save updated post:", error);
      }
    }
  };

  const handleMediaPromptEdited = (
    postId: string,
    imagePrompt: string,
    videoPrompt: string
  ) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId ? { ...post, imagePrompt, videoPrompt } : post
    );

    setStrategy({
      ...strategy,
      posts: updatedPosts,
    });
  };

  const handlePostStatusChanged = async (
    postId: string,
    status: "draft" | "generated" | "posted"
  ) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId ? { ...post, status } : post
    );

    setStrategy({
      ...strategy,
      posts: updatedPosts,
    });

    // Save updated post status to database
    const updatedPost = updatedPosts.find((p) => p.id === postId);
    if (updatedPost) {
      try {
        await fetch("/api/save-scheduled-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPost),
        });
      } catch (error) {
        console.error("Failed to save post status:", error);
      }
    }
  };

  const handleClearAllPosts = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all posts? This cannot be undone."
      )
    ) {
      return;
    }

    setIsClearing(true);
    setClearMessage(null);

    try {
      const response = await fetch("/api/clear-all-posts", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear the strategy from state and localStorage
        setStrategy(null);
        localStorage.removeItem("cachedStrategy");
        setClearMessage({
          type: "success",
          text: "All posts cleared successfully!",
        });
      } else {
        setClearMessage({
          type: "error",
          text: data.error || "Failed to clear posts",
        });
      }
    } catch (error) {
      console.error("Failed to clear all posts:", error);
      setClearMessage({
        type: "error",
        text: "Failed to clear posts. Please try again.",
      });
    } finally {
      setIsClearing(false);
      // Clear message after 5 seconds
      setTimeout(() => setClearMessage(null), 5000);
    }
  };

  return (
    <div className="p-8 overflow-x-hidden">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-medium text-foreground">
              Create Campaign
            </h1>
          </div>
          {strategy && strategy.posts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllPosts}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Generate viral ad campaigns for X with AI
        </p>
        {clearMessage && (
          <div
            className={`mt-4 p-3 text-sm rounded-md ${
              clearMessage.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {clearMessage.text}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        <InputForm 
          onStrategyGenerated={handleStrategyGenerated}
          onProgressUpdate={handleProgressUpdate}
        />
        
        {/* Generation Progress */}
        {generationSteps.length > 0 && (
          <GenerationProgress steps={generationSteps} />
        )}
        
        <StrategyGrid
          strategy={strategy}
          onMediaGenerated={handleMediaGenerated}
          onPostEdited={handlePostEdited}
          onMediaPromptEdited={handleMediaPromptEdited}
          onPostStatusChanged={handlePostStatusChanged}
        />
      </div>
    </div>
  );
}
