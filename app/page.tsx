"use client";

import { useState, useEffect } from "react";
import { InputForm } from "@/components/dashboard/InputForm";
import { StrategyGrid } from "@/components/dashboard/StrategyGrid";
import { AdStrategy } from "@/lib/types";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);

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

  const handleStrategyGenerated = (newStrategy: AdStrategy) => {
    // Clear cache and set new strategy when regenerating
    setStrategy(newStrategy);
  };

  const handleMediaGenerated = (
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
  };

  const handlePostEdited = (
    postId: string,
    content: string,
    replyContent: string
  ) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId ? { ...post, content, replyContent } : post
    );

    setStrategy({
      ...strategy,
      posts: updatedPosts,
    });
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Studio</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-Powered Ad Agency for X (Twitter) - Generate viral campaigns with
            Grok & Veo
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          <InputForm onStrategyGenerated={handleStrategyGenerated} />
          <StrategyGrid
            strategy={strategy}
            onMediaGenerated={handleMediaGenerated}
            onPostEdited={handlePostEdited}
            onMediaPromptEdited={handleMediaPromptEdited}
          />
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Grok API, and Google Gemini</p>
        </footer>
      </div>
    </main>
  );
}
