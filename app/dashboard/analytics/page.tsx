"use client";

import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Track your campaign performance</p>
      </div>

      {/* Coming Soon */}
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">
            Analytics Coming Soon
          </h2>
          <p className="text-muted-foreground mb-8">
            We're building powerful analytics to help you track impressions, clicks, 
            engagement, and ROI across all your campaigns.
          </p>

          {/* Preview of what's coming */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="rounded-xl border border-border bg-card p-4">
              <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
              <h3 className="font-medium text-foreground text-sm">Performance Tracking</h3>
              <p className="text-xs text-muted-foreground">Real-time campaign metrics</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <Users className="h-5 w-5 text-blue-500 mb-2" />
              <h3 className="font-medium text-foreground text-sm">Audience Insights</h3>
              <p className="text-xs text-muted-foreground">Know your audience better</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <Eye className="h-5 w-5 text-purple-500 mb-2" />
              <h3 className="font-medium text-foreground text-sm">Engagement Reports</h3>
              <p className="text-xs text-muted-foreground">Deep dive into interactions</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <BarChart3 className="h-5 w-5 text-amber-500 mb-2" />
              <h3 className="font-medium text-foreground text-sm">ROI Calculator</h3>
              <p className="text-xs text-muted-foreground">Measure campaign success</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
