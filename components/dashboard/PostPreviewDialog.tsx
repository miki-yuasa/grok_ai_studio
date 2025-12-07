"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Image as ImageIcon, Video } from "lucide-react";
import { formatNumber } from "@/lib/metrics";

interface PostPreviewDialogProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  generated: "bg-blue-50 text-blue-700 border-blue-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function PostPreviewDialog({
  post,
  isOpen,
  onClose,
}: PostPreviewDialogProps) {
  if (!post) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Post Preview</DialogTitle>

        <div className="space-y-4">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusColors[post.status]}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(post.scheduledTime)}
            </div>
          </div>

          {/* Main Post Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Main Post
            </h3>
            <p className="text-base leading-relaxed bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              {post.content}
            </p>
          </div>

          {/* Reply Content */}
          {post.replyContent && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Reply Post (CTA + Link)
              </h3>
              <p className="text-sm leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
                {post.replyContent}
              </p>
            </div>
          )}

          {/* Media Preview */}
          {(post.imageUrl || post.videoUrl) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Visual Asset
              </h3>
              <div className="rounded-lg overflow-hidden border">
                {post.imageUrl && (
                  <div className="relative">
                    <img
                      src={post.imageUrl}
                      alt="Post media"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Image
                    </div>
                  </div>
                )}
                {post.videoUrl && (
                  <div className="relative">
                    <video
                      src={post.videoUrl}
                      controls
                      className="w-full h-64 object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Video
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Predicted Metrics */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Predicted Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Click-Through Rate
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {post.predictedCTR || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cost Per Mille</p>
                <p className="text-lg font-semibold text-foreground">
                  {post.predictedCPM || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-lg font-semibold text-foreground">
                  {post.predictedCVR || "—"}
                </p>
              </div>
            </div>

            {/* Calculated Metrics */}
            {(post.calculatedImpressions ||
              post.calculatedClicks ||
              post.calculatedConversions) && (
              <>
                <div className="border-t border-border pt-3 mt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                    Expected Results
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {post.calculatedImpressions && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Impressions
                        </p>
                        <p className="text-base font-semibold text-foreground">
                          {formatNumber(post.calculatedImpressions)}
                        </p>
                      </div>
                    )}
                    {post.calculatedClicks && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="text-base font-semibold text-foreground">
                          {formatNumber(post.calculatedClicks)}
                        </p>
                      </div>
                    )}
                    {post.calculatedConversions && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Conversions
                        </p>
                        <p className="text-base font-semibold text-foreground">
                          {post.calculatedConversions.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rationale */}
          {post.rationale && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Strategy Rationale
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground p-3 bg-muted/30 rounded-md">
                {post.rationale}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
