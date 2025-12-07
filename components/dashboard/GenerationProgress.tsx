"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface GenerationProgressProps {
  steps: Step[];
}

export function GenerationProgress({ steps }: GenerationProgressProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-2 min-w-0">
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.status === "complete" &&
                    "border-primary bg-primary text-primary-foreground",
                  step.status === "active" &&
                    "border-primary bg-background text-primary",
                  step.status === "pending" &&
                    "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {step.status === "complete" && (
                  <Check className="h-5 w-5" />
                )}
                {step.status === "active" && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {step.status === "pending" && (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              
              {/* Step Label */}
              <p
                className={cn(
                  "text-xs font-medium text-center transition-colors duration-300 whitespace-nowrap",
                  step.status === "complete" && "text-muted-foreground",
                  step.status === "active" && "text-foreground",
                  step.status === "pending" && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-all duration-300 -mt-8",
                  step.status === "complete"
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
