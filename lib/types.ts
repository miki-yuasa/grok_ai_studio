/**
 * Core type definitions for Pulse - Grok Ads Studio
 */

export interface AdStrategy {
  strategySummary: string; // 2-sentence campaign overview
  targetAudience: string;
  posts: AdPost[];
}

export interface AdPost {
  id: string;
  scheduledTime: string; // ISO format
  content: string; // The main tweet text (engaging hook, no links)
  replyContent: string; // Follow-up tweet with CTA and link
  mediaType: "image" | "video";
  mediaPrompt: string; // Unified prompt for image or video generation (deprecated)
  imagePrompt?: string; // Specific prompt for image generation
  videoPrompt?: string; // Specific prompt for video generation
  predictedCTR: string; // e.g., "2.5%"
  rationale: string; // Detailed reasoning chain
  status: "draft" | "generated" | "posted";
  mediaUrl?: string; // Result from API (deprecated, use imageUrl/videoUrl)
  imageUrl?: string; // Generated image URL
  videoUrl?: string; // Generated video URL
}

export interface StrategyRequest {
  productUrl: string;
  competitorHandles?: string;
  trendContext?: string;
  targetMarket?: string;
  campaignDetails?: string;
  supplementaryImages?: string[];
}

export interface ImageGenerationRequest {
  prompt: string;
  quality?: "high" | "standard";
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  thumbnailUrl?: string;
}
