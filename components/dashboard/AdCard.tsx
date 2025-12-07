'use client';

import { useState } from 'react';
import { AdPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Image, Video, Loader2, TrendingUp } from 'lucide-react';

interface AdCardProps {
  post: AdPost;
  onMediaGenerated: (postId: string, mediaUrl: string) => void;
}

export function AdCard({ post, onMediaGenerated }: AdCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateMedia = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const endpoint = post.mediaType === 'image' 
        ? '/api/generate-image'
        : '/api/generate-video';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: post.mediaPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate media');
      }

      const data = await response.json();
      const mediaUrl = post.mediaType === 'image' ? data.url : data.videoUrl;
      onMediaGenerated(post.id, mediaUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardDescription>{formatDate(post.scheduledTime)}</CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                Predicted CTR: {post.predictedCTR}
              </span>
            </div>
          </div>
          <Badge variant={post.mediaType === 'image' ? 'default' : 'secondary'}>
            {post.mediaType === 'image' ? (
              <><Image className="h-3 w-3 mr-1" /> Image</>
            ) : (
              <><Video className="h-3 w-3 mr-1" /> Video</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Tweet */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Main Tweet</h4>
          <p className="text-sm leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
            {post.content}
          </p>
        </div>

        {/* Reply Tweet with CTA */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reply Tweet (CTA + Link)</h4>
          <p className="text-xs leading-relaxed bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            {post.replyContent}
          </p>
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
              {post.mediaType === 'image' ? (
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
                  {post.mediaType === 'image' ? (
                    <Image className="mr-2 h-4 w-4" />
                  ) : (
                    <Video className="mr-2 h-4 w-4" />
                  )}
                  Generate {post.mediaType}
                </>
              )}
            </Button>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
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
