/**
 * Core type definitions for Pulse - Grok Ads Studio
 */

export interface AdStrategy {
  strategySummary: string; // 2-sentence campaign overview
  targetAudience: string;
  posts: AdPost[];
  budget?: number; // Total campaign budget
  totalImpressions?: number; // Calculated total impressions
  totalTraffic?: number; // Calculated total clicks
  totalConversions?: number; // Calculated total conversions
  effectiveCTR?: number; // Campaign-level CTR
  effectiveCVR?: number; // Campaign-level CVR
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
  predictedCPM?: string; // e.g., "$5.00" - Estimated cost per 1000 impressions
  predictedCVR?: string; // e.g., "1.2%" - Estimated conversion rate
  rationale: string; // Detailed reasoning chain
  status: "draft" | "generated" | "posted";
  mediaUrl?: string; // Result from API (deprecated, use imageUrl/videoUrl)
  imageUrl?: string; // Generated image URL
  videoUrl?: string; // Generated video URL
  // Calculated metrics
  calculatedImpressions?: number;
  calculatedClicks?: number;
  calculatedConversions?: number;
}

export interface StrategyRequest {
  productUrl: string;
  budget: number; // Required budget in dollars
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
