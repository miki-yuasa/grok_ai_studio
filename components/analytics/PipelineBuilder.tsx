"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
  Trash2,
  Filter,
  Combine,
  X,
  GripVertical,
  Plus,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllStoredDataSummaries, formatLastUpdated } from "@/lib/analytics-storage";

// Node Types
type NodeType = "source" | "filter" | "combiner" | "output";

interface PipelineNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: {
    name: string;
    sourceType?: "analytics" | "trending" | "hooks";
    items?: string[];
    filterPrompt?: string;
    filteredItems?: string[];
    isProcessing?: boolean;
    isComplete?: boolean;
  };
}

interface Connection {
  id: string;
  fromNode: string;
  toNode: string;
  fromPort: "output";
  toPort: "input";
}

interface PipelineBuilderProps {
  analyticsData?: string[];
  trendingData?: string[];
  hookData?: string[];
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string; icon: string }> = {
  source: { bg: "bg-blue-500", border: "border-blue-400", icon: "text-blue-500" },
  filter: { bg: "bg-purple-500", border: "border-purple-400", icon: "text-purple-500" },
  combiner: { bg: "bg-amber-500", border: "border-amber-400", icon: "text-amber-500" },
  output: { bg: "bg-emerald-500", border: "border-emerald-400", icon: "text-emerald-500" },
};

const SOURCE_ICONS = {
  analytics: BarChart3,
  trending: TrendingUp,
  hooks: Zap,
};

export default function PipelineBuilder({
  analyticsData = [],
  trendingData = [],
  hookData = [],
}: PipelineBuilderProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [storedSummaries, setStoredSummaries] = useState<ReturnType<typeof getAllStoredDataSummaries> | null>(null);

  // Load stored data summaries on mount
  useEffect(() => {
    const summaries = getAllStoredDataSummaries();
    setStoredSummaries(summaries);
  }, [analyticsData, trendingData, hookData]);

  // Available data sources with last updated info
  const dataSources = [
    { 
      id: "analytics", 
      name: "Self Analytics", 
      items: analyticsData, 
      icon: BarChart3, 
      color: "from-blue-500 to-cyan-500",
      lastUpdated: storedSummaries?.analytics.lastUpdated || null,
    },
    { 
      id: "trending", 
      name: "Trending Data", 
      items: trendingData, 
      icon: TrendingUp, 
      color: "from-pink-500 to-rose-500",
      lastUpdated: storedSummaries?.trending.lastUpdated || null,
    },
    { 
      id: "hooks", 
      name: "Optimized Hooks", 
      items: hookData, 
      icon: Zap, 
      color: "from-amber-500 to-orange-500",
      lastUpdated: storedSummaries?.hooks.lastUpdated || null,
    },
  ];

  // Available node types for palette
  const nodeTemplates = [
    { type: "filter" as NodeType, name: "LLM Filter", icon: Filter, description: "AI-powered data filtering" },
    { type: "combiner" as NodeType, name: "Combiner", icon: Combine, description: "Merge multiple sources" },
    { type: "output" as NodeType, name: "Campaign Output", icon: ArrowRight, description: "Send to campaign creation" },
  ];

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add source node from palette
  const addSourceNode = (sourceType: "analytics" | "trending" | "hooks", x: number, y: number) => {
    const source = dataSources.find((s) => s.id === sourceType);
    if (!source) return;

    const newNode: PipelineNode = {
      id: generateId(),
      type: "source",
      x,
      y,
      data: {
        name: source.name,
        sourceType,
        items: source.items,
      },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  // Add processing node
  const addProcessingNode = (type: NodeType, x: number, y: number) => {
    const template = nodeTemplates.find((t) => t.type === type);
    if (!template) return;

    const newNode: PipelineNode = {
      id: generateId(),
      type,
      x,
      y,
      data: {
        name: template.name,
        filterPrompt: type === "filter" ? "" : undefined,
        items: [],
      },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  // Handle drag from palette
  const handlePaletteDragStart = (e: React.DragEvent, type: string, sourceType?: string) => {
    e.dataTransfer.setData("nodeType", type);
    if (sourceType) {
      e.dataTransfer.setData("sourceType", sourceType);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - 100;
    const y = e.clientY - rect.top - 40;

    const nodeType = e.dataTransfer.getData("nodeType");
    const sourceType = e.dataTransfer.getData("sourceType");

    if (nodeType === "source" && sourceType) {
      addSourceNode(sourceType as any, x, y);
    } else if (nodeType) {
      addProcessingNode(nodeType as NodeType, x, y);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Node dragging within canvas
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest(".port")) return;
    
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingNode) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNode ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n))
      );
    },
    [draggingNode, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Connection handling
  const handlePortClick = (nodeId: string, port: "input" | "output") => {
    if (port === "output") {
      setConnectingFrom(nodeId);
    } else if (connectingFrom && connectingFrom !== nodeId) {
      // Check if connection already exists
      const exists = connections.some(
        (c) => c.fromNode === connectingFrom && c.toNode === nodeId
      );
      if (!exists) {
        setConnections((prev) => [
          ...prev,
          {
            id: generateId(),
            fromNode: connectingFrom,
            toNode: nodeId,
            fromPort: "output",
            toPort: "input",
          },
        ]);
      }
      setConnectingFrom(null);
    }
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) =>
      prev.filter((c) => c.fromNode !== nodeId && c.toNode !== nodeId)
    );
    setSelectedNode(null);
  };

  // Update filter prompt
  const updateFilterPrompt = (nodeId: string, prompt: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, filterPrompt: prompt } } : n
      )
    );
  };

  // Get incoming data for a node
  const getIncomingData = (nodeId: string): string[] => {
    const incomingConnections = connections.filter((c) => c.toNode === nodeId);
    let items: string[] = [];

    for (const conn of incomingConnections) {
      const sourceNode = nodes.find((n) => n.id === conn.fromNode);
      if (sourceNode) {
        if (sourceNode.type === "source") {
          items = [...items, ...(sourceNode.data.items || [])];
        } else if (sourceNode.data.filteredItems) {
          items = [...items, ...sourceNode.data.filteredItems];
        } else if (sourceNode.data.items) {
          items = [...items, ...sourceNode.data.items];
        }
      }
    }

    return items;
  };

  // Run the pipeline
  const runPipeline = async () => {
    setIsRunning(true);

    // Topological sort to determine execution order
    const executed = new Set<string>();
    const sortedNodes: PipelineNode[] = [];

    const canExecute = (node: PipelineNode) => {
      const incoming = connections.filter((c) => c.toNode === node.id);
      return incoming.every((c) => executed.has(c.fromNode));
    };

    // Source nodes first
    const sourceNodes = nodes.filter((n) => n.type === "source");
    for (const node of sourceNodes) {
      executed.add(node.id);
      sortedNodes.push(node);
    }

    // Then process other nodes
    let remaining = nodes.filter((n) => n.type !== "source");
    while (remaining.length > 0) {
      const executable = remaining.filter(canExecute);
      if (executable.length === 0) break;

      for (const node of executable) {
        executed.add(node.id);
        sortedNodes.push(node);
      }
      remaining = remaining.filter((n) => !executed.has(n.id));
    }

    // Execute nodes in order
    for (const node of sortedNodes) {
      if (node.type === "source") continue;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, isProcessing: true } } : n
        )
      );

      await new Promise((r) => setTimeout(r, 500));

      const incomingData = getIncomingData(node.id);

      if (node.type === "filter" && node.data.filterPrompt) {
        // LLM filtering
        try {
          const response = await fetch("/api/analytics/filter-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: incomingData,
              prompt: node.data.filterPrompt,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setNodes((prev) =>
              prev.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        items: incomingData,
                        filteredItems: result.filtered,
                        isProcessing: false,
                        isComplete: true,
                      },
                    }
                  : n
              )
            );
          } else {
            // Fallback: pass through
            setNodes((prev) =>
              prev.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        items: incomingData,
                        filteredItems: incomingData,
                        isProcessing: false,
                        isComplete: true,
                      },
                    }
                  : n
              )
            );
          }
        } catch {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      items: incomingData,
                      filteredItems: incomingData,
                      isProcessing: false,
                      isComplete: true,
                    },
                  }
                : n
            )
          );
        }
      } else if (node.type === "combiner") {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    items: incomingData,
                    filteredItems: incomingData,
                    isProcessing: false,
                    isComplete: true,
                  },
                }
              : n
          )
        );
      } else if (node.type === "output") {
        // Collect all data and export
        const allData = incomingData;
        
        // Categorize data
        let campaignDetails = "";
        let trendContext = "";
        let targetMarket = "";

        for (const item of allData) {
          if (item.toLowerCase().includes("audience") || item.toLowerCase().includes("target")) {
            targetMarket = item;
          } else if (item.startsWith("#") || item.toLowerCase().includes("trend")) {
            trendContext += (trendContext ? ", " : "") + item;
          } else {
            campaignDetails += (campaignDetails ? "\n• " : "• ") + item;
          }
        }

        const payload = {
          targetMarket,
          trendContext,
          campaignDetails: campaignDetails ? `Based on pipeline analysis:\n${campaignDetails}` : "",
        };

        localStorage.setItem("strategyBuilderData", JSON.stringify(payload));

        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    items: allData,
                    isProcessing: false,
                    isComplete: true,
                  },
                }
              : n
          )
        );
      }
    }

    setIsRunning(false);
  };

  // Export to create
  const exportToCreate = () => {
    router.push("/create");
  };

  // Check if output node has data
  const outputNode = nodes.find((n) => n.type === "output");
  const hasOutput = outputNode?.data.isComplete;

  // Get connection line coordinates
  const getConnectionPath = (conn: Connection) => {
    const fromNode = nodes.find((n) => n.id === conn.fromNode);
    const toNode = nodes.find((n) => n.id === conn.toNode);
    if (!fromNode || !toNode) return "";

    const fromX = fromNode.x + 200;
    const fromY = fromNode.y + 40;
    const toX = toNode.x;
    const toY = toNode.y + 40;

    const midX = (fromX + toX) / 2;

    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Pipeline Builder</h2>
          <p className="text-sm text-muted-foreground">
            Drag data sources and nodes to build your analytics pipeline
          </p>
        </div>
        <div className="flex gap-2">
          {nodes.length > 0 && !isRunning && (
            <Button onClick={runPipeline} className="gap-2">
              <Play className="h-4 w-4" />
              Run Pipeline
            </Button>
          )}
          {hasOutput && (
            <Button onClick={exportToCreate} variant="default" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Node Palette - Left Side */}
        <div className="lg:col-span-1 space-y-4">
          {/* Data Sources */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Sources
            </h3>
            <div className="space-y-2">
              {dataSources.map((source) => {
                const Icon = source.icon;
                const hasData = source.items.length > 0;

                return (
                  <div
                    key={source.id}
                    draggable={hasData}
                    onDragStart={(e) => handlePaletteDragStart(e, "source", source.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all
                      ${hasData
                        ? "cursor-grab active:cursor-grabbing border-border hover:border-primary/50 hover:shadow-sm bg-gradient-to-r " + source.color + " text-white"
                        : "cursor-not-allowed border-dashed border-border bg-muted/30 opacity-50"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{source.name}</p>
                      <p className="text-xs opacity-80">
                        {hasData ? `${source.items.length} items` : "No data"}
                      </p>
                      {source.lastUpdated && (
                        <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatLastUpdated(source.lastUpdated)}
                        </p>
                      )}
                    </div>
                    {hasData && <GripVertical className="h-4 w-4 opacity-50" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Processing Nodes */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Processing Nodes
            </h3>
            <div className="space-y-2">
              {nodeTemplates.map((template) => {
                const Icon = template.icon;

                return (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, template.type)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing
                      border-border hover:border-primary/50 hover:shadow-sm bg-card transition-all
                    `}
                  >
                    <div className={`p-1.5 rounded-md ${NODE_COLORS[template.type].bg}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas - Right Side */}
        <div className="lg:col-span-3">
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onClick={() => {
              setSelectedNode(null);
              setConnectingFrom(null);
            }}
            className="relative rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-background to-muted/20 min-h-[500px] overflow-hidden"
            style={{ backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                </linearGradient>
              </defs>
              {connections.map((conn) => (
                <path
                  key={conn.id}
                  d={getConnectionPath(conn)}
                  stroke="url(#connectionGradient)"
                  strokeWidth="2"
                  fill="none"
                  className="transition-all duration-300"
                />
              ))}
              {/* Temporary connection line when connecting */}
              {connectingFrom && (
                <circle
                  cx={nodes.find((n) => n.id === connectingFrom)?.x || 0 + 200}
                  cy={nodes.find((n) => n.id === connectingFrom)?.y || 0 + 40}
                  r="8"
                  fill="rgb(139, 92, 246)"
                  className="animate-ping"
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const colors = NODE_COLORS[node.type];
              const Icon =
                node.type === "source" && node.data.sourceType
                  ? SOURCE_ICONS[node.data.sourceType]
                  : node.type === "filter"
                  ? Filter
                  : node.type === "combiner"
                  ? Combine
                  : ArrowRight;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node.id);
                  }}
                  className={`
                    absolute w-[200px] rounded-xl border-2 bg-card shadow-lg transition-all
                    ${selectedNode === node.id ? "ring-2 ring-primary" : ""}
                    ${node.data.isProcessing ? "animate-pulse" : ""}
                    ${node.data.isComplete ? colors.border : "border-border"}
                  `}
                  style={{ left: node.x, top: node.y, cursor: draggingNode === node.id ? "grabbing" : "grab" }}
                >
                  {/* Header */}
                  <div className={`flex items-center gap-2 p-3 rounded-t-xl ${node.data.isComplete ? `bg-gradient-to-r ${node.type === "source" ? "from-blue-500/10" : node.type === "filter" ? "from-purple-500/10" : node.type === "combiner" ? "from-amber-500/10" : "from-emerald-500/10"} to-transparent` : ""}`}>
                    <div className={`p-1.5 rounded-md ${colors.bg}`}>
                      {node.data.isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                      ) : node.data.isComplete ? (
                        <Check className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{node.data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {node.data.filteredItems?.length || node.data.items?.length || 0} items
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Filter prompt input */}
                  {node.type === "filter" && (
                    <div className="p-3 pt-0">
                      <Textarea
                        placeholder="Filter prompt (e.g., 'Keep only items about engagement')"
                        value={node.data.filterPrompt || ""}
                        onChange={(e) => updateFilterPrompt(node.id, e.target.value)}
                        className="text-xs min-h-[60px] resize-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Ports */}
                  {node.type !== "source" && (
                    <div
                      className={`port absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-card cursor-pointer hover:scale-125 transition-transform ${connectingFrom ? "ring-2 ring-primary animate-pulse" : "border-muted-foreground"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePortClick(node.id, "input");
                      }}
                    />
                  )}
                  {node.type !== "output" && (
                    <div
                      className={`port absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform ${connectingFrom === node.id ? "bg-primary border-primary" : "bg-card border-muted-foreground"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePortClick(node.id, "output");
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">Start Building</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Drag data sources and processing nodes from the left panel to build your pipeline
                  </p>
                </div>
              </div>
            )}

            {/* Connection Mode Indicator */}
            {connectingFrom && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg">
                Click on an input port to connect
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Node Details</h3>
          {(() => {
            const node = nodes.find((n) => n.id === selectedNode);
            if (!node) return null;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{node.type}</Badge>
                  <span className="text-sm text-foreground">{node.data.name}</span>
                </div>
                {(node.data.filteredItems || node.data.items)?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Data Preview:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {(node.data.filteredItems || node.data.items)?.slice(0, 5).map((item, i) => (
                        <p key={i} className="text-xs text-foreground bg-muted/50 p-2 rounded">
                          {item.substring(0, 100)}...
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Data Source</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>LLM Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Combiner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Output</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground bg-card" />
          <span>Input Port</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground bg-card" />
          <span>Output Port</span>
        </div>
      </div>
    </div>
  );
}

