"use client";

import { useState } from "react";
import { InputForm } from "@/components/dashboard/InputForm";
import { StrategyGrid } from "@/components/dashboard/StrategyGrid";
import { AdStrategy } from "@/lib/types";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);

  const handleStrategyGenerated = (newStrategy: AdStrategy) => {
    setStrategy(newStrategy);
  };

  const handleMediaGenerated = (postId: string, mediaUrl: string) => {
    if (!strategy) return;

    const updatedPosts = strategy.posts.map((post) =>
      post.id === postId
        ? { ...post, mediaUrl, status: "generated" as const }
        : post
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
