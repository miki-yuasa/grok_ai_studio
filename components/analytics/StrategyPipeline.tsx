"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  X,
  Play,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DataNode {
  id: string;
  type: "source" | "processor" | "output";
  name: string;
  icon: typeof BarChart3;
  color: string;
  glowColor: string;
  data: string[];
  connected: boolean;
  active: boolean;
}

interface Connection {
  from: string;
  to: string;
  active: boolean;
}

interface StrategyPipelineProps {
  analyticsData?: string[];
  trendingData?: string[];
  hookData?: string[];
}

export default function StrategyPipeline({
  analyticsData = [],
  trendingData = [],
  hookData = [],
}: StrategyPipelineProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<DataNode[]>([
    {
      id: "analytics",
      type: "source",
      name: "Self Analytics",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
      glowColor: "shadow-blue-500/50",
      data: analyticsData,
      connected: false,
      active: false,
    },
    {
      id: "trending",
      type: "source",
      name: "Trending Data",
      icon: TrendingUp,
      color: "from-pink-500 to-rose-500",
      glowColor: "shadow-pink-500/50",
      data: trendingData,
      connected: false,
      active: false,
    },
    {
      id: "hooks",
      type: "source",
      name: "Optimized Hooks",
      icon: Zap,
      color: "from-amber-500 to-orange-500",
      glowColor: "shadow-amber-500/50",
      data: hookData,
      connected: false,
      active: false,
    },
    {
      id: "processor",
      type: "processor",
      name: "Strategy Mixer",
      icon: Sparkles,
      color: "from-violet-500 to-purple-500",
      glowColor: "shadow-violet-500/50",
      data: [],
      connected: false,
      active: false,
    },
    {
      id: "output",
      type: "output",
      name: "Campaign Output",
      icon: ArrowRight,
      color: "from-emerald-500 to-green-500",
      glowColor: "shadow-emerald-500/50",
      data: [],
      connected: false,
      active: false,
    },
  ]);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<{
    targetMarket: string;
    trendContext: string;
    campaignDetails: string;
  } | null>(null);

  // Update nodes when data changes
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === "analytics") return { ...node, data: analyticsData };
        if (node.id === "trending") return { ...node, data: trendingData };
        if (node.id === "hooks") return { ...node, data: hookData };
        return node;
      })
    );
  }, [analyticsData, trendingData, hookData]);

  const toggleConnection = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== "source") return;

    const isCurrentlyConnected = connections.some((c) => c.from === nodeId);

    if (isCurrentlyConnected) {
      // Disconnect
      setConnections((prev) => prev.filter((c) => c.from !== nodeId));
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, connected: false } : n))
      );
    } else {
      // Connect to processor
      setConnections((prev) => [
        ...prev,
        { from: nodeId, to: "processor", active: false },
      ]);
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, connected: true } : n))
      );
    }
  };

  const runPipeline = async () => {
    const connectedSources = connections.filter((c) => c.to === "processor");
    if (connectedSources.length === 0) return;

    setIsProcessing(true);

    // Animate connections
    for (let i = 0; i < connectedSources.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setConnections((prev) =>
        prev.map((c) =>
          c.from === connectedSources[i].from ? { ...c, active: true } : c
        )
      );
      setNodes((prev) =>
        prev.map((n) =>
          n.id === connectedSources[i].from ? { ...n, active: true } : n
        )
      );
    }

    // Activate processor
    await new Promise((r) => setTimeout(r, 500));
    setNodes((prev) =>
      prev.map((n) => (n.id === "processor" ? { ...n, active: true } : n))
    );

    // Process data
    await new Promise((r) => setTimeout(r, 800));
    
    const analyticsNode = nodes.find((n) => n.id === "analytics");
    const trendingNode = nodes.find((n) => n.id === "trending");
    const hooksNode = nodes.find((n) => n.id === "hooks");

    const isAnalyticsConnected = connections.some((c) => c.from === "analytics");
    const isTrendingConnected = connections.some((c) => c.from === "trending");
    const isHooksConnected = connections.some((c) => c.from === "hooks");

    let campaignDetails = "";
    if (isHooksConnected && hooksNode && hooksNode.data.length > 0) {
      campaignDetails += `Use these high-performing hooks:\n${hooksNode.data.slice(0, 3).map((h) => `• ${h}`).join("\n")}\n\n`;
    }
    if (isAnalyticsConnected && analyticsNode && analyticsNode.data.length > 0) {
      campaignDetails += `Based on analytics insights:\n${analyticsNode.data.slice(0, 3).map((d) => `• ${d}`).join("\n")}\n\n`;
    }

    const processed = {
      targetMarket: isAnalyticsConnected && analyticsNode ? analyticsNode.data.find((d) => d.toLowerCase().includes("audience")) || "" : "",
      trendContext: isTrendingConnected && trendingNode ? trendingNode.data.join(", ") : "",
      campaignDetails: campaignDetails.trim(),
    };

    setProcessedData(processed);

    // Connect processor to output
    setConnections((prev) => [
      ...prev,
      { from: "processor", to: "output", active: true },
    ]);

    // Activate output
    await new Promise((r) => setTimeout(r, 500));
    setNodes((prev) =>
      prev.map((n) => (n.id === "output" ? { ...n, active: true, connected: true } : n))
    );

    setIsProcessing(false);
  };

  const exportToCreate = () => {
    if (!processedData) return;
    localStorage.setItem("strategyBuilderData", JSON.stringify(processedData));
    router.push("/create");
  };

  const resetPipeline = () => {
    setConnections([]);
    setProcessedData(null);
    setNodes((prev) =>
      prev.map((n) => ({ ...n, connected: false, active: false }))
    );
  };

  const sourceNodes = nodes.filter((n) => n.type === "source");
  const processorNode = nodes.find((n) => n.type === "processor")!;
  const outputNode = nodes.find((n) => n.type === "output")!;

  const hasConnections = connections.length > 0;
  const hasOutput = processedData !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Data Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Connect your data sources to build a strategy
          </p>
        </div>
        <div className="flex gap-2">
          {hasConnections && !isProcessing && !hasOutput && (
            <Button onClick={runPipeline} className="gap-2">
              <Play className="h-4 w-4" />
              Run Pipeline
            </Button>
          )}
          {hasOutput && (
            <Button onClick={exportToCreate} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Use in Create
            </Button>
          )}
          {(hasConnections || hasOutput) && (
            <Button variant="outline" onClick={resetPipeline}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Canvas */}
      <div
        ref={canvasRef}
        className="relative rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-background to-muted/30 p-8 min-h-[400px] overflow-hidden"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Pipeline Layout */}
        <div className="relative flex items-center justify-between gap-4">
          {/* Source Nodes Column */}
          <div className="flex flex-col gap-4">
            {sourceNodes.map((node) => {
              const Icon = node.icon;
              const hasData = node.data.length > 0;

              return (
                <div
                  key={node.id}
                  onClick={() => hasData && toggleConnection(node.id)}
                  className={`
                    relative group cursor-pointer transition-all duration-300
                    ${!hasData && "opacity-50 cursor-not-allowed"}
                  `}
                >
                  {/* Node Card */}
                  <div
                    className={`
                      relative w-48 rounded-xl border-2 p-4 transition-all duration-300
                      ${node.connected
                        ? `border-transparent bg-gradient-to-br ${node.color} text-white shadow-lg ${node.glowColor}`
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                      }
                      ${node.active && "scale-105 animate-pulse"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          p-2 rounded-lg
                          ${node.connected ? "bg-white/20" : "bg-muted"}
                        `}
                      >
                        <Icon className={`h-5 w-5 ${node.connected ? "text-white" : "text-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${node.connected ? "text-white" : "text-foreground"}`}>
                          {node.name}
                        </p>
                        <p className={`text-xs truncate ${node.connected ? "text-white/70" : "text-muted-foreground"}`}>
                          {hasData ? `${node.data.length} items` : "No data"}
                        </p>
                      </div>
                      {node.connected ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : hasData ? (
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      ) : null}
                    </div>
                  </div>

                  {/* Connection Line */}
                  {node.connected && (
                    <div className="absolute top-1/2 -right-4 w-8 h-0.5">
                      <div
                        className={`
                          h-full rounded-full transition-all duration-500
                          ${node.active
                            ? `bg-gradient-to-r ${node.color} animate-pulse`
                            : "bg-border"
                          }
                        `}
                      />
                      {node.active && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${node.color} animate-ping`}
                          style={{ right: "-4px" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connection Lines SVG */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                <stop offset="100%" stopColor="rgb(168, 85, 247)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Processor Node */}
          <div className="flex flex-col items-center">
            <div
              className={`
                relative w-56 rounded-2xl border-2 p-6 transition-all duration-500
                ${hasConnections
                  ? `border-transparent bg-gradient-to-br ${processorNode.color} text-white shadow-xl ${processorNode.glowColor}`
                  : "border-dashed border-border bg-card/50"
                }
                ${processorNode.active && "scale-110 animate-pulse"}
              `}
            >
              <div className="text-center">
                <div
                  className={`
                    inline-flex p-3 rounded-xl mb-3
                    ${hasConnections ? "bg-white/20" : "bg-muted"}
                  `}
                >
                  <Sparkles
                    className={`h-8 w-8 ${hasConnections ? "text-white" : "text-muted-foreground"} ${processorNode.active && "animate-spin"}`}
                  />
                </div>
                <p className={`font-medium ${hasConnections ? "text-white" : "text-foreground"}`}>
                  {processorNode.name}
                </p>
                <p className={`text-xs mt-1 ${hasConnections ? "text-white/70" : "text-muted-foreground"}`}>
                  {hasConnections
                    ? `${connections.filter((c) => c.to === "processor").length} sources connected`
                    : "Click sources to connect"
                  }
                </p>
              </div>

              {/* Animated Border */}
              {processorNode.active && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 animate-spin-slow"
                    style={{
                      background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Arrow to Output */}
            {hasOutput && (
              <div className="my-4 flex flex-col items-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-emerald-500 rounded-full" />
                <ChevronRight className="h-6 w-6 text-emerald-500 rotate-90 -mt-1" />
              </div>
            )}
          </div>

          {/* Output Node */}
          {hasOutput && (
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-56 rounded-2xl border-2 p-6 transition-all duration-500
                  border-transparent bg-gradient-to-br ${outputNode.color} text-white shadow-xl ${outputNode.glowColor}
                  ${outputNode.active && "scale-105"}
                `}
              >
                <div className="text-center">
                  <div className="inline-flex p-3 rounded-xl mb-3 bg-white/20">
                    <ArrowRight className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-medium text-white">{outputNode.name}</p>
                  <p className="text-xs mt-1 text-white/70">Ready to export</p>
                </div>

                {/* Success Pulse */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-0" />
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!hasConnections && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-sm text-muted-foreground">
              ← Click on data sources to connect them to the pipeline
            </p>
          </div>
        )}
      </div>

      {/* Output Preview */}
      {processedData && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Pipeline Output</h3>
              <p className="text-sm text-muted-foreground">
                This data will be sent to campaign creation
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {processedData.targetMarket && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
                <p className="text-sm text-foreground">{processedData.targetMarket}</p>
              </div>
            )}
            {processedData.trendContext && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-1">Trend Context</p>
                <p className="text-sm text-foreground line-clamp-2">{processedData.trendContext}</p>
              </div>
            )}
            {processedData.campaignDetails && (
              <div className="rounded-lg bg-muted/50 p-4 md:col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Campaign Strategy</p>
                <p className="text-sm text-foreground line-clamp-3 whitespace-pre-line">
                  {processedData.campaignDetails}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          <span>Analytics Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
          <span>Trending Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <span>Hook Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
          <span>Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500" />
          <span>Output</span>
        </div>
      </div>
    </div>
  );
}

