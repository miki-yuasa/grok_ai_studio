'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface InputFormProps {
  onStrategyGenerated: (strategy: any) => void;
}

export function InputForm({ onStrategyGenerated }: InputFormProps) {
  const [productUrl, setProductUrl] = useState('');
  const [competitorHandles, setCompetitorHandles] = useState('');
  const [trendContext, setTrendContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productUrl,
          competitorHandles: competitorHandles || undefined,
          trendContext: trendContext || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate strategy');
      }

      const strategy = await response.json();
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
          Provide details about your product and target market to generate a viral marketing strategy
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
            <Label htmlFor="competitorHandles">Competitor Handles (Optional)</Label>
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
            <Label htmlFor="trendContext">Current Trend Context (Optional)</Label>
            <Textarea
              id="trendContext"
              placeholder="Describe current trending topics, viral content patterns, or market dynamics..."
              value={trendContext}
              onChange={(e) => setTrendContext(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Add context about trending topics to help generate more relevant campaigns
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              'Generate Strategy'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
