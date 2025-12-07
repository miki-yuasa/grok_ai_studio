"use client";

import { useState } from "react";
import { AdPost } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Image,
  Video,
  Loader2,
  TrendingUp,
  Edit2,
  Save,
  X,
  Send,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatNumber } from "@/lib/metrics";
import { ImagePreview } from "@/components/dashboard/ImagePreview";

interface AdCardProps {
  post: AdPost;
  onMediaGenerated: (
    postId: string,
    mediaUrl: string,
    mediaType: "image" | "video"
  ) => void;
  onPostEdited: (
    postId: string,
    content: string,
    replyContent: string,
    scheduledTime?: string
  ) => void;
  onMediaPromptEdited: (
    postId: string,
    imagePrompt: string,
    videoPrompt: string
  ) => void;
  onPostStatusChanged?: (
    postId: string,
    status: "draft" | "generated" | "posted"
  ) => void;
}

export function AdCard({
  post,
  onMediaGenerated,
  onPostEdited,
  onMediaPromptEdited,
  onPostStatusChanged,
}: AdCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<"image" | "video" | null>(
    post.imageUrl ? "image" : post.videoUrl ? "video" : null
  );
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImagePrompt, setIsEditingImagePrompt] = useState(false);
  const [isEditingVideoPrompt, setIsEditingVideoPrompt] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedReplyContent, setEditedReplyContent] = useState(
    post.replyContent
  );
  const [editedImagePrompt, setEditedImagePrompt] = useState(
    post.imagePrompt || post.mediaPrompt
  );
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(
    post.videoPrompt || post.mediaPrompt
  );
  const [editedScheduledTime, setEditedScheduledTime] = useState(
    post.scheduledTime
  );
  const [timeError, setTimeError] = useState("");

  // Convert ISO string to datetime-local format
  const toDatetimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Convert datetime-local to ISO string
  const toISOString = (datetimeLocal: string) => {
    return new Date(datetimeLocal).toISOString();
  };

  // Validate that the time is in the future
  const validateTime = (datetimeLocal: string): boolean => {
    const selectedTime = new Date(datetimeLocal);
    const now = new Date();
    if (selectedTime <= now) {
      setTimeError("Scheduled time must be in the future");
      return false;
    }
    setTimeError("");
    return true;
  };

  const handleGenerateMedia = async (
    mediaType: "image" | "video",
    customPrompt?: string
  ) => {
    setIsGenerating(true);
    setError("");

    try {
      const promptToUse =
        customPrompt ||
        (mediaType === "image" ? editedImagePrompt : editedVideoPrompt);

      const endpoint =
        mediaType === "image" ? "/api/generate-image" : "/api/generate-video";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate media");
      }

      const data = await response.json();
      const mediaUrl = mediaType === "image" ? data.url : data.videoUrl;
      onMediaGenerated(post.id, mediaUrl, mediaType);

      // Save the edited prompts if they were changed
      if (
        editedImagePrompt !== (post.imagePrompt || post.mediaPrompt) ||
        editedVideoPrompt !== (post.videoPrompt || post.mediaPrompt)
      ) {
        onMediaPromptEdited(post.id, editedImagePrompt, editedVideoPrompt);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImagePrompt = () => {
    onMediaPromptEdited(post.id, editedImagePrompt, editedVideoPrompt);
    setIsEditingImagePrompt(false);
  };

  const handleCancelImagePromptEdit = () => {
    setEditedImagePrompt(post.imagePrompt || post.mediaPrompt);
    setIsEditingImagePrompt(false);
  };

  const handleSaveVideoPrompt = () => {
    onMediaPromptEdited(post.id, editedImagePrompt, editedVideoPrompt);
    setIsEditingVideoPrompt(false);
  };

  const handleCancelVideoPromptEdit = () => {
    setEditedVideoPrompt(post.videoPrompt || post.mediaPrompt);
    setIsEditingVideoPrompt(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveEdit = () => {
    // Validate time if it was changed
    if (editedScheduledTime !== post.scheduledTime) {
      const datetimeLocal = toDatetimeLocal(editedScheduledTime);
      if (!validateTime(datetimeLocal)) {
        return; // Don't save if time is invalid
      }
    }
    onPostEdited(
      post.id,
      editedContent,
      editedReplyContent,
      editedScheduledTime
    );
    setIsEditing(false);
    setTimeError("");
  };

  const handleCancelEdit = () => {
    setEditedContent(post.content);
    setEditedReplyContent(post.replyContent);
    setEditedScheduledTime(post.scheduledTime);
    setTimeError("");
    setIsEditing(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datetimeLocal = e.target.value;
    if (datetimeLocal) {
      validateTime(datetimeLocal);
      setEditedScheduledTime(toISOString(datetimeLocal));
    }
  };

  const handleSchedulePost = async () => {
    setIsScheduling(true);
    setError("");

    try {
      const response = await fetch("/api/save-scheduled-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
          content: post.content,
          replyContent: post.replyContent,
          scheduledTime: post.scheduledTime,
          imageUrl: selectedAsset === "image" ? post.imageUrl : undefined,
          videoUrl: selectedAsset === "video" ? post.videoUrl : undefined,
          predictedCTR: post.predictedCTR,
          predictedCPM: post.predictedCPM,
          predictedCVR: post.predictedCVR,
          status: "generated",
          mediaType: post.mediaType,
          imagePrompt: post.imagePrompt,
          videoPrompt: post.videoPrompt,
          rationale: post.rationale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule post");
      }

      setIsScheduled(true);
      console.log("Post scheduled successfully for", post.scheduledTime);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePostToX = async () => {
    setIsPosting(true);
    setError("");

    try {
      const response = await fetch("/api/post-to-x", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: post.content,
          replyContent: post.replyContent,
          imageUrl: selectedAsset === "image" ? post.imageUrl : undefined,
          videoUrl: selectedAsset === "video" ? post.videoUrl : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post to X");
      }

      const data = await response.json();

      // Update post status
      if (onPostStatusChanged) {
        onPostStatusChanged(post.id, "posted");
      }

      // Show success message
      console.log("Posted successfully:", data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Scheduled Time</span>
                </div>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocal(editedScheduledTime)}
                  onChange={handleTimeChange}
                  className="w-auto text-sm"
                  min={toDatetimeLocal(new Date().toISOString())}
                />
                {timeError && (
                  <p className="text-xs text-destructive">{timeError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardDescription>
                  {formatDate(post.scheduledTime)}
                </CardDescription>
              </div>
            )}
            {/* Prediction Metrics */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  Predicted CTR: {post.predictedCTR}
                </span>
              </div>
              {post.predictedCPM && post.predictedCVR && (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>CPM: {post.predictedCPM}</div>
                  <div>CVR: {post.predictedCVR}</div>
                </div>
              )}
              {post.calculatedImpressions && (
                <div className="border-t pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions:</span>
                    <span className="font-medium">
                      {formatNumber(post.calculatedImpressions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clicks:</span>
                    <span className="font-medium">
                      {formatNumber(post.calculatedClicks || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversions:</span>
                    <span className="font-medium">
                      {(post.calculatedConversions || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Edit/Save Controls */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit Posts
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Tweet */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Main Post</h4>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="text-sm leading-relaxed min-h-[100px]"
              placeholder="Main post content..."
            />
          ) : (
            <p className="text-sm leading-relaxed bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              {post.content}
            </p>
          )}
        </div>

        {/* Reply Tweet with CTA */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reply Post (CTA + Link)</h4>
          {isEditing ? (
            <Textarea
              value={editedReplyContent}
              onChange={(e) => setEditedReplyContent(e.target.value)}
              className="text-xs leading-relaxed min-h-[80px]"
              placeholder="Reply post with CTA and link..."
            />
          ) : (
            <p className="text-xs leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
              {post.replyContent}
            </p>
          )}
        </div>

        {/* Rationale - Collapsible */}
        <details className="space-y-2" open={showRationale}>
          <summary
            className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setShowRationale(!showRationale);
            }}
          >
            <TrendingUp className="h-4 w-4" />
            Strategy Rationale
          </summary>
          {showRationale && (
            <div className="pl-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {post.rationale}
              </p>
            </div>
          )}
        </details>

        {/* Media Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Visual Assets</h4>

          {/* Display existing media with selection */}
          {(post.imageUrl || post.videoUrl) && (
            <div className="space-y-2">
              {post.imageUrl && post.videoUrl && (
                <p className="text-xs text-muted-foreground">
                  Select which asset to post:
                </p>
              )}
              {post.imageUrl && (
                <div
                  className="relative rounded-md overflow-hidden border group cursor-pointer"
                  onClick={() => setSelectedAsset("image")}
                >
                  <ImagePreview
                    src={post.imageUrl}
                    alt="Generated ad image"
                    className="w-full h-48 object-cover"
                  />
                  {/* Checkbox overlay */}
                  <div
                    className={`absolute top-3 right-3 transition-opacity ${
                      post.videoUrl
                        ? "opacity-0 group-hover:opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    {selectedAsset === "image" ? (
                      <CheckCircle2 className="h-6 w-6 text-primary bg-white dark:bg-black rounded-full" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground bg-white dark:bg-black rounded-full" />
                    )}
                  </div>
                  {/* Selected indicator always visible when both assets exist */}
                  {post.videoUrl && selectedAsset === "image" && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-6 w-6 text-primary bg-white dark:bg-black rounded-full" />
                    </div>
                  )}
                  {/* Image label */}
                  {post.videoUrl && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Image
                    </div>
                  )}
                </div>
              )}
              {post.videoUrl && (
                <div
                  className="relative rounded-md overflow-hidden border group cursor-pointer"
                  onClick={() => setSelectedAsset("video")}
                >
                  <video
                    src={post.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-48 object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                  {/* Checkbox overlay */}
                  <div
                    className={`absolute top-3 right-3 transition-opacity ${
                      post.imageUrl
                        ? "opacity-0 group-hover:opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    {selectedAsset === "video" ? (
                      <CheckCircle2 className="h-6 w-6 text-primary bg-white dark:bg-black rounded-full" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground bg-white dark:bg-black rounded-full" />
                    )}
                  </div>
                  {/* Selected indicator always visible when both assets exist */}
                  {post.imageUrl && selectedAsset === "video" && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-6 w-6 text-primary bg-white dark:bg-black rounded-full" />
                    </div>
                  )}
                  {/* Video label */}
                  {post.imageUrl && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Video
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generation buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleGenerateMedia("image")}
              disabled={isGenerating}
              className="flex-1 min-w-[140px]"
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  {post.imageUrl ? "Regenerate" : "Generate"} Image
                </>
              )}
            </Button>
            <Button
              onClick={() => handleGenerateMedia("video")}
              disabled={isGenerating}
              className="flex-1 min-w-[140px]"
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  {post.videoUrl ? "Regenerate" : "Generate"} Video
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Image Prompt Section - Collapsible */}
        <details className="space-y-2" open={showImagePrompt}>
          <summary
            className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setShowImagePrompt(!showImagePrompt);
            }}
          >
            <Image className="h-4 w-4" />
            Image Prompt
          </summary>
          {showImagePrompt && (
            <div className="space-y-2 pl-6">
              {isEditingImagePrompt ? (
                <>
                  <Textarea
                    value={editedImagePrompt}
                    onChange={(e) => setEditedImagePrompt(e.target.value)}
                    className="text-xs leading-relaxed min-h-[100px] font-mono"
                    placeholder="Describe the image you want to generate..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelImagePromptEdit}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveImagePrompt}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs p-3 bg-muted rounded-md leading-relaxed font-mono">
                    {post.imagePrompt || post.mediaPrompt}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingImagePrompt(true)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          )}
        </details>

        {/* Video Prompt Section - Collapsible */}
        <details className="space-y-2" open={showVideoPrompt}>
          <summary
            className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setShowVideoPrompt(!showVideoPrompt);
            }}
          >
            <Video className="h-4 w-4" />
            Video Prompt
          </summary>
          {showVideoPrompt && (
            <div className="space-y-2 pl-6">
              {isEditingVideoPrompt ? (
                <>
                  <Textarea
                    value={editedVideoPrompt}
                    onChange={(e) => setEditedVideoPrompt(e.target.value)}
                    className="text-xs leading-relaxed min-h-[100px] font-mono"
                    placeholder="Describe the video you want to generate..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelVideoPromptEdit}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveVideoPrompt}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs p-3 bg-muted rounded-md leading-relaxed font-mono">
                    {post.videoPrompt || post.mediaPrompt}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingVideoPrompt(true)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          )}
        </details>

        {/* Post to X Button - Bottom */}
        {!isEditing && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            {post.status !== "posted" ? (
              <>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSchedulePost}
                    disabled={isScheduling || isScheduled || !post.content}
                    className="flex-1"
                  >
                    {isScheduling ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Scheduling...
                      </>
                    ) : isScheduled ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />✓ Scheduled
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Schedule Post
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handlePostToX}
                    disabled={isPosting || !post.content}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Post Now
                      </>
                    )}
                  </Button>
                </div>
                {isScheduled && (
                  <p className="text-xs text-center text-muted-foreground">
                    Will post automatically at {formatDate(post.scheduledTime)}
                  </p>
                )}
              </>
            ) : (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-300"
                >
                  ✓ Posted
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
