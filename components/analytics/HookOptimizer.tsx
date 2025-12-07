"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  Database,
} from "lucide-react";
import {
  STORAGE_KEYS,
  StoredHooksData,
  saveToStorage,
  loadFromStorage,
  formatLastUpdated,
} from "@/lib/analytics-storage";

interface Hook {
  id: string;
  type: "text" | "video";
  content: string;
  score: number;
  avgScore: number;
  reasoning: string;
  focusGroupScores?: {
    persona: string;
    score: number;
    feedback: string;
  }[];
}

interface EvolutionStep {
  generation: number;
  bestScore: number;
  improvement: number;
}

interface DraggableInsight {
  id: string;
  type: "hook" | "timing" | "pattern" | "audience" | "trend" | "recommendation";
  label: string;
  value: string;
  source: string;
}

interface HookOptimizerProps {
  onInsightsGenerated?: (insights: DraggableInsight[]) => void;
}

export default function HookOptimizer({ onInsightsGenerated }: HookOptimizerProps) {
  const [campaignDetails, setCampaignDetails] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [hookType, setHookType] = useState<"text" | "video" | "both">("both");
  const [hookCount, setHookCount] = useState(20);

  const [loading, setLoading] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hooks, setHooks] = useState<Hook[]>([]);
  const [generation, setGeneration] = useState(0);
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionStep[]>([]);
  const [targetReached, setTargetReached] = useState(false);

  const [expandedHook, setExpandedHook] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage<StoredHooksData>(STORAGE_KEYS.HOOKS);
    if (stored) {
      setHooks(stored.hooks || []);
      setCampaignDetails(stored.campaignDetails || "");
      setTargetAudience(stored.targetAudience || "");
      setHookType(stored.hookType || "both");
      setGeneration(stored.generation || 0);
      setEvolutionHistory(stored.evolutionHistory || []);
      setTargetReached(stored.targetReached || false);
      setLastUpdated(stored.lastUpdated);
      
      // Emit insights if callback provided
      if (onInsightsGenerated && stored.hooks?.length > 0) {
        emitInsights(stored.hooks, stored.generation);
      }
    }
  }, []);

  // Helper to emit insights
  const emitInsights = (hooksData: Hook[], gen: number) => {
    if (!onInsightsGenerated) return;
    
    const topHooks = [...hooksData]
      .sort((a, b) => (b.avgScore || b.score) - (a.avgScore || a.score))
      .slice(0, 5);

    const draggableInsights: DraggableInsight[] = topHooks.map((hook, i) => ({
      id: `hook-gen${gen}-${i}`,
      type: "hook" as const,
      label: `${hook.type === "video" ? "🎬" : "✍️"} Hook Gen${gen} (${Math.round(hook.avgScore || hook.score)}%)`,
      value: hook.content,
      source: "Hook Optimizer",
    }));

    onInsightsGenerated(draggableInsights);
  };

  // Save to localStorage
  const saveData = (hooksData: Hook[], gen: number, history: EvolutionStep[], reached: boolean) => {
    const data: StoredHooksData = {
      hooks: hooksData,
      campaignDetails,
      targetAudience,
      hookType,
      generation: gen,
      evolutionHistory: history,
      targetReached: reached,
      lastUpdated: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.HOOKS, data);
    setLastUpdated(data.lastUpdated);
  };

  const generateHooks = async () => {
    if (!campaignDetails) {
      setError("Please enter campaign details");
      return;
    }

    setLoading(true);
    setError(null);
    setHooks([]);
    setGeneration(0);
    setEvolutionHistory([]);
    setTargetReached(false);

    try {
      const response = await fetch("/api/analytics/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignDetails,
          targetAudience: targetAudience || "General audience",
          hookType,
          count: hookCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate hooks");
      }

      const data = await response.json();
      const newHooks = data.hooks || [];
      const newHistory = [
        {
          generation: 1,
          bestScore: data.stats?.top_score || 0,
          improvement: 0,
        },
      ];
      
      setHooks(newHooks);
      setGeneration(1);
      setEvolutionHistory(newHistory);

      // Save to localStorage
      saveData(newHooks, 1, newHistory, false);

      // Emit insights
      emitInsights(newHooks, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const evolveHooks = async () => {
    if (hooks.length === 0) return;

    setEvolving(true);
    setError(null);

    try {
      const response = await fetch("/api/analytics/evolve-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hooks,
          campaignDetails,
          targetAudience: targetAudience || "General audience",
          currentGeneration: generation,
          evolutionHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to evolve hooks");
      }

      const data = await response.json();
      const newHooks = data.hooks || [];
      const newGen = data.generation;
      const reached = data.target_reached || false;
      const newHistory = [
        ...evolutionHistory,
        {
          generation: newGen,
          bestScore: data.best_hook?.score || 0,
          improvement: data.improvement || 0,
        },
      ];
      
      setHooks(newHooks);
      setGeneration(newGen);
      setTargetReached(reached);
      setEvolutionHistory(newHistory);

      // Save to localStorage
      saveData(newHooks, newGen, newHistory, reached);

      // Emit insights
      emitInsights(newHooks, newGen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEvolving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200";
    if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const textHooks = hooks.filter((h) => h.type === "text");
  const videoHooks = hooks.filter((h) => h.type === "video");
  const bestHook = hooks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-foreground">Hook Optimizer</h2>
        <p className="text-sm text-muted-foreground">
          Generate and evolve scroll-stopping hooks using AI focus groups
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

      {/* Input Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Campaign Details
          </label>
          <Textarea
            placeholder="Describe your product, campaign goals, and key selling points..."
            value={campaignDetails}
            onChange={(e) => setCampaignDetails(e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground">
              Target Audience
            </label>
            <Input
              placeholder="e.g., GenZ gamers, tech professionals"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Hook Type
            </label>
            <select
              value={hookType}
              onChange={(e) => setHookType(e.target.value as any)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="both">Both Text & Video</option>
              <option value="text">Text Only</option>
              <option value="video">Video Only</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Hook Count
            </label>
            <Input
              type="number"
              min={10}
              max={50}
              value={hookCount}
              onChange={(e) => setHookCount(parseInt(e.target.value) || 20)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={generateHooks} disabled={loading || evolving}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Hooks
              </>
            )}
          </Button>

          {hooks.length > 0 && !targetReached && (
            <Button
              onClick={evolveHooks}
              disabled={loading || evolving}
              variant="outline"
            >
              {evolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evolving...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Evolve (Gen {generation + 1})
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
        </div>
      )}

      {/* Evolution Progress */}
      {evolutionHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Evolution Progress
            </h3>
            {targetReached && (
              <Badge className="bg-emerald-100 text-emerald-700">
                🎯 Target Reached!
              </Badge>
            )}
          </div>

          {/* Progress visualization */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {evolutionHistory.map((step, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`rounded-lg px-3 py-2 text-center min-w-[80px] ${
                    i === evolutionHistory.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Gen {step.generation}</p>
                  <p className="text-lg font-semibold">{Math.round(step.bestScore)}%</p>
                  {step.improvement !== 0 && (
                    <p
                      className={`text-xs ${
                        step.improvement > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {step.improvement > 0 ? "+" : ""}
                      {step.improvement.toFixed(1)}
                    </p>
                  )}
                </div>
                {i < evolutionHistory.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Hook */}
      {bestHook && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-foreground">
                Best Hook (Score: {Math.round(bestHook.avgScore || bestHook.score)}%)
              </h3>
            </div>
            <Badge variant="outline">
              {bestHook.type === "text" ? (
                <FileText className="h-3 w-3 mr-1" />
              ) : (
                <Video className="h-3 w-3 mr-1" />
              )}
              {bestHook.type}
            </Badge>
          </div>
          <p className="text-foreground">{bestHook.content}</p>
          <p className="mt-2 text-sm text-muted-foreground">{bestHook.reasoning}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => copyToClipboard(bestHook.content, bestHook.id)}
          >
            {copiedId === bestHook.id ? (
              <>
                <Check className="mr-2 h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-3 w-3" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      )}

      {/* Hook Lists */}
      {hooks.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Text Hooks */}
          {textHooks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Hooks ({textHooks.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {textHooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground flex-1">
                        {hook.content}
                      </p>
                      <Badge variant="outline" className={getScoreColor(hook.avgScore || hook.score)}>
                        {Math.round(hook.avgScore || hook.score)}%
                      </Badge>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedHook(expandedHook === hook.id ? null : hook.id)
                      }
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {expandedHook === hook.id ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Show details
                        </>
                      )}
                    </button>
                    {expandedHook === hook.id && (
                      <div className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                        <p>{hook.reasoning}</p>
                        {hook.focusGroupScores && (
                          <div className="mt-2 space-y-1">
                            {hook.focusGroupScores.map((fg, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{fg.persona.replace(/_/g, " ")}</span>
                                <span>{Math.round(fg.score)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Hooks */}
          {videoHooks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Hooks ({videoHooks.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {videoHooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground flex-1 line-clamp-2">
                        {hook.content}
                      </p>
                      <Badge variant="outline" className={getScoreColor(hook.avgScore || hook.score)}>
                        {Math.round(hook.avgScore || hook.score)}%
                      </Badge>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedHook(expandedHook === hook.id ? null : hook.id)
                      }
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {expandedHook === hook.id ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Show details
                        </>
                      )}
                    </button>
                    {expandedHook === hook.id && (
                      <div className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                        <p className="whitespace-pre-wrap">{hook.content}</p>
                        <p className="mt-2 italic">{hook.reasoning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && hooks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Optimize your hooks
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Enter your campaign details and generate AI-scored hooks. Then evolve
            them through multiple generations until you reach 90%+ scroll-stop
            probability.
          </p>
        </div>
      )}
    </div>
  );
}

