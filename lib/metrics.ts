/**
 * Campaign metrics calculation utilities
 * Based on quantitative analysis formulas for budget allocation and performance prediction
 */

import { AdStrategy, AdPost } from "./types";

/**
 * Parse percentage string to decimal number
 * e.g., "2.5%" -> 0.025
 */
function parsePercentage(percentStr: string): number {
  const match = percentStr.match(/([\d.]+)%?/);
  return match ? parseFloat(match[1]) / 100 : 0;
}

/**
 * Parse currency string to number
 * e.g., "$5.50" -> 5.50
 */
function parseCurrency(currencyStr: string): number {
  const match = currencyStr.match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Calculate per-post metrics using vector calculation
 * 
 * For each post i:
 * - Budget allocation: B_i = Total Budget / N posts (even split)
 * - Predicted Impressions: Imp_i = (B_i / CPM_i) × 1,000
 * - Predicted Traffic/Clicks: Clk_i = Imp_i × CTR_i
 * - Predicted Conversions: Conv_i = Clk_i × CVR_i
 */
export function calculatePostMetrics(
  post: AdPost,
  budgetAllocation: number
): AdPost {
  // Parse the estimated rates
  const cpm = parseCurrency(post.predictedCPM || "$5.00");
  const ctr = parsePercentage(post.predictedCTR || "2%");
  const cvr = parsePercentage(post.predictedCVR || "1%");

  // Calculate impressions: (Budget / CPM) × 1,000
  const impressions = Math.round((budgetAllocation / cpm) * 1000);

  // Calculate clicks: Impressions × CTR
  const clicks = Math.round(impressions * ctr);

  // Calculate conversions: Clicks × CVR
  const conversions = Math.round(clicks * cvr * 10) / 10; // Round to 1 decimal

  return {
    ...post,
    calculatedImpressions: impressions,
    calculatedClicks: clicks,
    calculatedConversions: conversions,
  };
}

/**
 * Calculate campaign-level aggregated metrics
 * 
 * Campaign totals:
 * - Total Traffic = Σ Clk_i
 * - Total Conversions = Σ Conv_i
 * - Total Impressions = Σ Imp_i
 * 
 * Campaign effective rates (weighted averages):
 * - Effective CTR = Total Traffic / Total Impressions
 * - Effective CVR = Total Conversions / Total Traffic
 */
export function calculateCampaignMetrics(strategy: AdStrategy): AdStrategy {
  const totalBudget = strategy.budget || 0;
  const numPosts = strategy.posts.length;

  if (numPosts === 0 || totalBudget === 0) {
    return strategy;
  }

  // Even split budget allocation
  const budgetPerPost = totalBudget / numPosts;

  // Calculate metrics for each post
  const postsWithMetrics = strategy.posts.map((post) =>
    calculatePostMetrics(post, budgetPerPost)
  );

  // Aggregate campaign totals
  const totalImpressions = postsWithMetrics.reduce(
    (sum, post) => sum + (post.calculatedImpressions || 0),
    0
  );

  const totalTraffic = postsWithMetrics.reduce(
    (sum, post) => sum + (post.calculatedClicks || 0),
    0
  );

  const totalConversions = postsWithMetrics.reduce(
    (sum, post) => sum + (post.calculatedConversions || 0),
    0
  );

  // Calculate effective rates (weighted averages)
  const effectiveCTR =
    totalImpressions > 0 ? totalTraffic / totalImpressions : 0;

  const effectiveCVR = totalTraffic > 0 ? totalConversions / totalTraffic : 0;

  return {
    ...strategy,
    posts: postsWithMetrics,
    totalImpressions,
    totalTraffic,
    totalConversions,
    effectiveCTR,
    effectiveCVR,
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format percentage
 */
export function formatPercentage(decimal: number, decimals: number = 2): string {
  return `${(decimal * 100).toFixed(decimals)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
