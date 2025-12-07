"use client";

import { useState } from "react";
import { AdPost } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Image, Video, Loader2, TrendingUp, Edit2, Save, X } from "lucide-react";

interface AdCardProps {
  post: AdPost;
  onMediaGenerated: (postId: string, mediaUrl: string) => void;
  onPostEdited: (postId: string, content: string, replyContent: string) => void;
}

export function AdCard({ post, onMediaGenerated, onPostEdited }: AdCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedReplyContent, setEditedReplyContent] = useState(post.replyContent);

  const handleGenerateMedia = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const endpoint =
        post.mediaType === "image"
          ? "/api/generate-image"
          : "/api/generate-video";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: post.mediaPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate media");
      }

      const data = await response.json();
      const mediaUrl = post.mediaType === "image" ? data.url : data.videoUrl;
      onMediaGenerated(post.id, mediaUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
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
    onPostEdited(post.id, editedContent, editedReplyContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(post.content);
    setEditedReplyContent(post.replyContent);
    setIsEditing(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardDescription>
                {formatDate(post.scheduledTime)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                Predicted CTR: {post.predictedCTR}
              </span>
            </div>
          </div>
          <Badge variant={post.mediaType === "image" ? "default" : "secondary"}>
            {post.mediaType === "image" ? (
              <>
                <Image className="h-3 w-3 mr-1" /> Image
              </>
            ) : (
              <>
                <Video className="h-3 w-3 mr-1" /> Video
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Edit/Save Controls */}
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
              >
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
            <p className="text-sm leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
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
            <p className="text-xs leading-relaxed bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              {post.replyContent}
            </p>
          )}
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Strategy Rationale</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {post.rationale}
          </p>
        </div>

        {/* Media Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Visual Asset</h4>
          {post.mediaUrl ? (
            <div className="rounded-md overflow-hidden border">
              {post.mediaType === "image" ? (
                <img
                  src={post.mediaUrl}
                  alt="Generated ad visual"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleGenerateMedia}
              disabled={isGenerating}
              className="w-full"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {post.mediaType}...
                </>
              ) : (
                <>
                  {post.mediaType === "image" ? (
                    <Image className="mr-2 h-4 w-4" />
                  ) : (
                    <Video className="mr-2 h-4 w-4" />
                  )}
                  Generate {post.mediaType}
                </>
              )}
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Prompt Preview */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View {post.mediaType} prompt
          </summary>
          <p className="mt-2 p-2 bg-muted rounded text-xs">
            {post.mediaPrompt}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
