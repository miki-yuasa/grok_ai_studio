"use client";

import { useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trash2,
  ArrowRight,
  GripVertical,
  Target,
  Clock,
  TrendingUp,
  Lightbulb,
  Zap,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface DraggableInsight {
  id: string;
  type: "hook" | "timing" | "pattern" | "audience" | "trend" | "recommendation";
  label: string;
  value: string;
  source: string;
}

interface DropZone {
  id: string;
  label: string;
  placeholder: string;
  icon: typeof Target;
  items: DraggableInsight[];
}

interface StrategyBuilderProps {
  availableInsights: DraggableInsight[];
}

export default function StrategyBuilder({ availableInsights }: StrategyBuilderProps) {
  const router = useRouter();
  const [dropZones, setDropZones] = useState<DropZone[]>([
    {
      id: "audience",
      label: "Target Audience",
      placeholder: "Drag audience insights here...",
      icon: Target,
      items: [],
    },
    {
      id: "hooks",
      label: "Hook Inspiration",
      placeholder: "Drag top-performing hooks here...",
      icon: Zap,
      items: [],
    },
    {
      id: "timing",
      label: "Posting Schedule",
      placeholder: "Drag best posting times here...",
      icon: Clock,
      items: [],
    },
    {
      id: "trends",
      label: "Trend Context",
      placeholder: "Drag trending topics here...",
      icon: TrendingUp,
      items: [],
    },
    {
      id: "strategy",
      label: "Campaign Strategy",
      placeholder: "Drag recommendations & patterns here...",
      icon: Lightbulb,
      items: [],
    },
  ]);

  const [draggedItem, setDraggedItem] = useState<DraggableInsight | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDragStart = (e: DragEvent, item: DraggableInsight) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
  };

  const handleDragOver = (e: DragEvent, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverZone(zoneId);
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDrop = (e: DragEvent, zoneId: string) => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedItem) return;

    // Check if item already exists in this zone
    setDropZones((zones) =>
      zones.map((zone) => {
        if (zone.id === zoneId) {
          const exists = zone.items.some((item) => item.id === draggedItem.id);
          if (!exists) {
            return { ...zone, items: [...zone.items, draggedItem] };
          }
        }
        return zone;
      })
    );

    setDraggedItem(null);
  };

  const removeFromZone = (zoneId: string, itemId: string) => {
    setDropZones((zones) =>
      zones.map((zone) => {
        if (zone.id === zoneId) {
          return { ...zone, items: zone.items.filter((item) => item.id !== itemId) };
        }
        return zone;
      })
    );
  };

  const clearZone = (zoneId: string) => {
    setDropZones((zones) =>
      zones.map((zone) => {
        if (zone.id === zoneId) {
          return { ...zone, items: [] };
        }
        return zone;
      })
    );
  };

  const generateStrategyPayload = () => {
    const audienceZone = dropZones.find((z) => z.id === "audience");
    const hooksZone = dropZones.find((z) => z.id === "hooks");
    const timingZone = dropZones.find((z) => z.id === "timing");
    const trendsZone = dropZones.find((z) => z.id === "trends");
    const strategyZone = dropZones.find((z) => z.id === "strategy");

    const targetMarket = audienceZone?.items.map((i) => i.value).join(". ") || "";
    const hookInspiration = hooksZone?.items.map((i) => i.value).join("\n- ") || "";
    const timing = timingZone?.items.map((i) => i.value).join(", ") || "";
    const trends = trendsZone?.items.map((i) => i.value).join(", ") || "";
    const strategy = strategyZone?.items.map((i) => i.value).join(". ") || "";

    let campaignDetails = "";
    if (hookInspiration) {
      campaignDetails += `Use these high-performing hook styles as inspiration:\n- ${hookInspiration}\n\n`;
    }
    if (timing) {
      campaignDetails += `Optimal posting times based on my analytics: ${timing}\n\n`;
    }
    if (strategy) {
      campaignDetails += `Strategy notes: ${strategy}`;
    }

    return {
      targetMarket,
      trendContext: trends,
      campaignDetails: campaignDetails.trim(),
    };
  };

  const exportToCreate = () => {
    const payload = generateStrategyPayload();
    // Store in localStorage for the create page to pick up
    localStorage.setItem("strategyBuilderData", JSON.stringify(payload));
    router.push("/create");
  };

  const copyToClipboard = () => {
    const payload = generateStrategyPayload();
    const text = `TARGET AUDIENCE:\n${payload.targetMarket || "Not specified"}\n\nTREND CONTEXT:\n${payload.trendContext || "Not specified"}\n\nCAMPAIGN DETAILS:\n${payload.campaignDetails || "Not specified"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasAnyItems = dropZones.some((zone) => zone.items.length > 0);

  const getTypeColor = (type: DraggableInsight["type"]) => {
    switch (type) {
      case "hook":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "timing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pattern":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "audience":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "trend":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "recommendation":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Strategy Builder</h2>
          <p className="text-sm text-muted-foreground">
            Drag insights from your analytics to build a data-driven strategy
          </p>
        </div>
        {hasAnyItems && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button size="sm" onClick={exportToCreate}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Use in Create
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Insights (Draggable) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Available Insights
            <Badge variant="secondary" className="ml-auto">
              {availableInsights.length} items
            </Badge>
          </h3>

          {availableInsights.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Fetch analytics data first to get draggable insights
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {availableInsights.map((insight) => (
                <div
                  key={insight.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, insight)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing
                    transition-all hover:shadow-md hover:scale-[1.01]
                    ${getTypeColor(insight.type)}
                  `}
                >
                  <GripVertical className="h-4 w-4 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{insight.label}</p>
                    <p className="text-xs opacity-75 truncate">{insight.value}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {insight.source}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop Zones */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Strategy Template</h3>

          <div className="space-y-3">
            {dropZones.map((zone) => {
              const Icon = zone.icon;
              const isOver = dragOverZone === zone.id;

              return (
                <div
                  key={zone.id}
                  onDragOver={(e) => handleDragOver(e, zone.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`
                    rounded-xl border-2 border-dashed p-4 transition-all min-h-[80px]
                    ${isOver 
                      ? "border-primary bg-primary/10 scale-[1.02]" 
                      : "border-border bg-card hover:border-muted-foreground/50"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isOver ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-foreground">{zone.label}</span>
                    </div>
                    {zone.items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearZone(zone.id)}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {zone.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{zone.placeholder}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {zone.items.map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="text-xs pr-1 flex items-center gap-1"
                        >
                          {item.label}
                          <button
                            onClick={() => removeFromZone(zone.id, item.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview */}
          {hasAnyItems && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 mt-4">
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Generated Strategy Input
              </h4>
              <div className="text-xs text-muted-foreground space-y-2">
                {dropZones.map((zone) => {
                  if (zone.items.length === 0) return null;
                  return (
                    <div key={zone.id}>
                      <span className="font-medium text-foreground">{zone.label}: </span>
                      {zone.items.map((i) => i.value).join(", ")}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

