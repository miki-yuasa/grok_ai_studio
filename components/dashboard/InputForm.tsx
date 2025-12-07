"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface InputFormProps {
  onStrategyGenerated: (strategy: any) => void;
  onProgressUpdate?: (step: string) => void;
}

export function InputForm({
  onStrategyGenerated,
  onProgressUpdate,
}: InputFormProps) {
  const [productUrl, setProductUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [competitorHandles, setCompetitorHandles] = useState("");
  const [trendContext, setTrendContext] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [campaignDetails, setCampaignDetails] = useState("");
  const [supplementaryImages, setSupplementaryImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    setSupplementaryImages((prev) => [...prev, ...imageFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setSupplementaryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      onProgressUpdate?.("analyzing");

      // Convert images to base64 for sending
      const imageData: string[] = [];
      for (const file of supplementaryImages) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          imageData.push(base64);
        } catch (err) {
          console.error("Failed to read image:", file.name, err);
        }
      }

      onProgressUpdate?.("searching");

      const response = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productUrl,
          budget: parseFloat(budget),
          competitorHandles: competitorHandles || undefined,
          trendContext: trendContext || undefined,
          targetMarket: targetMarket || undefined,
          campaignDetails: campaignDetails || undefined,
          supplementaryImages: imageData.length > 0 ? imageData : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate strategy");
      }

      onProgressUpdate?.("predicting");

      // Simulate a small delay for the predicting step to be visible
      await new Promise((resolve) => setTimeout(resolve, 800));

      onProgressUpdate?.("synthesizing");

      const strategy = await response.json();

      onProgressUpdate?.("complete");

      onStrategyGenerated(strategy);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Your Ad Campaign</CardTitle>
        <CardDescription>
          Provide details about your product and target market to generate a
          viral marketing strategy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productUrl">Product/Company URL *</Label>
            <Input
              id="productUrl"
              type="url"
              placeholder="https://example.com"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Campaign Budget (USD) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="budget"
                type="number"
                placeholder="1000"
                min="1"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total budget for this campaign - used to calculate predicted
              impressions, traffic, and conversions
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-center gap-2 px-6"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Optional Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Optional Details
                </>
              )}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="campaignDetails">Campaign Details</Label>
                <Textarea
                  id="campaignDetails"
                  placeholder="e.g., Product launch, seasonal promotion, brand awareness campaign..."
                  value={campaignDetails}
                  onChange={(e) => setCampaignDetails(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide specific details about your campaign goals and context
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplementaryImages">
                  Supplementary Images
                </Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  <Input
                    id="supplementaryImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <label
                    htmlFor="supplementaryImages"
                    className="cursor-pointer block"
                  >
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {isDragging
                          ? "Drop images here..."
                          : "Drag & drop images here, or click to browse"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Upload product/service images to enhance your ad
                        campaign
                      </div>
                    </div>
                  </label>
                </div>
                {supplementaryImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {supplementaryImages.length} file
                      {supplementaryImages.length > 1 ? "s" : ""} selected:
                    </p>
                    <div className="space-y-1">
                      {supplementaryImages.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                        >
                          <span className="truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="h-6 px-2 text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetMarket">Target Market/Audience</Label>
                <Textarea
                  id="targetMarket"
                  placeholder="e.g., Tech-savvy millennials, B2B enterprise decision makers, Gen Z gamers..."
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Describe your target audience demographics, interests, and
                  behaviors
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitorHandles">Competitor Handles</Label>
                <Input
                  id="competitorHandles"
                  type="text"
                  placeholder="@competitor1, @competitor2"
                  value={competitorHandles}
                  onChange={(e) => setCompetitorHandles(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated X handles to analyze
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trendContext">Current Trend Context</Label>
                <Textarea
                  id="trendContext"
                  placeholder="Describe current trending topics, viral content patterns, or market dynamics..."
                  value={trendContext}
                  onChange={(e) => setTrendContext(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Add context about trending topics to help generate more
                  relevant campaigns
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <Button type="submit" className="px-8" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Strategy...
                </>
              ) : (
                "Generate Strategy"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
