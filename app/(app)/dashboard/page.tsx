"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { formatNumber } from "@/lib/metrics";

interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: string;
  status: "draft" | "generated" | "posted";
  imageUrl?: string;
  videoUrl?: string;
  predictedCTR?: string;
}

interface CachedStrategy {
  title?: string;
  posts: ScheduledPost[];
}

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  generated: "bg-blue-50 text-blue-700 border-blue-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function DashboardPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    generated: 0,
    posted: 0,
  });

  useEffect(() => {
    // Load posts from localStorage
    const cachedStrategy = localStorage.getItem("cachedStrategy");
    if (cachedStrategy) {
      try {
        const parsed: CachedStrategy = JSON.parse(cachedStrategy);
        if (parsed.posts) {
          setPosts(parsed.posts);
          
          // Set campaign title if available
          if (parsed.title) {
            setCampaignTitle(parsed.title);
          }

          // Calculate stats
          const total = parsed.posts.length;
          const draft = parsed.posts.filter(
            (p: ScheduledPost) => p.status === "draft"
          ).length;
          const generated = parsed.posts.filter(
            (p: ScheduledPost) => p.status === "generated"
          ).length;
          const posted = parsed.posts.filter(
            (p: ScheduledPost) => p.status === "posted"
          ).length;

          setStats({ total, draft, generated, posted });
        }
      } catch (error) {
        console.error("Failed to parse cached strategy:", error);
      }
    }
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your campaign overview
          </p>
        </div>
        <Link href="/create">
          <Button className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Welcome card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-2 text-xl font-medium text-foreground">
          {posts.length > 0 && campaignTitle
            ? `Your Current Campaign: ${campaignTitle}`
            : posts.length > 0
            ? "Your campaigns are ready"
            : "Create your first campaign"}
        </h2>
        <p className="mb-4 text-muted-foreground">
          {posts.length > 0
            ? "Manage and monitor your ad campaigns from this dashboard"
            : "Get started by creating an AI-powered ad campaign for X"}
        </p>
        <Link href="/create">
          <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            {posts.length > 0 ? "Create another campaign" : "Get started"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>

      {/* Stats overview */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-lg font-medium text-foreground">
            Campaign Overview
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl font-semibold text-amber-600">
              {stats.draft}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Ready to Post</p>
            <p className="text-2xl font-semibold text-blue-600">
              {stats.generated}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Posted</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {stats.posted}
            </p>
          </div>
        </div>
      </div>

      {/* Ads table */}
      {posts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-medium text-foreground">
              Campaign Posts
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage and monitor your scheduled posts
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">
                  Scheduled
                </TableHead>
                <TableHead className="text-muted-foreground">Content</TableHead>
                <TableHead className="text-muted-foreground">Media</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. Impressions
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Predicted Impressions
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Expected number of times this ad will be shown.
                            Calculated as: (Budget / CPM) × 1,000.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. Clicks
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Predicted Clicks
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Expected number of clicks on this post. Calculated
                            as: Impressions × CTR.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. Conversions
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Predicted Conversions
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Expected number of conversions (purchases, sign-ups,
                            etc.). Calculated as: Clicks × CVR.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. CTR
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Predicted CTR</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Predicted Click-Through Rate - the percentage of
                            people who see the ad and click on it. Based on
                            content type, trend relevance, and historical
                            engagement patterns.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. CPM
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Predicted CPM</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Predicted Cost Per Mille (cost per 1,000
                            impressions). Estimated based on competition level,
                            audience specificity, media type, and target
                            demographics.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    Pred. CVR
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Predicted CVR</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Predicted Conversion Rate - the percentage of clicks
                            that result in conversions. Based on product price
                            point, offer strength, audience intent, and industry
                            benchmarks.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  className="border-border hover:bg-muted/50 cursor-pointer"
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[post.status]}
                    >
                      {post.status.charAt(0).toUpperCase() +
                        post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(post.scheduledTime)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-foreground">
                    {post.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {post.imageUrl && (
                        <div className="h-8 w-8 rounded bg-muted overflow-hidden">
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {post.videoUrl && (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                          🎥
                        </div>
                      )}
                      {!post.imageUrl && !post.videoUrl && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {post.calculatedImpressions
                      ? formatNumber(post.calculatedImpressions)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {post.calculatedClicks
                      ? formatNumber(post.calculatedClicks)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {post.calculatedConversions
                      ? post.calculatedConversions.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {post.predictedCTR || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {post.predictedCPM || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {post.predictedCVR || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No campaigns yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI-powered ad campaign to get started
          </p>
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
