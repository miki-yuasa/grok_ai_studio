# Pulse Strategy Schema Update

## Changes Summary

The strategy generation system has been optimized based on the improved "Pulse" system prompt. Here are the key changes:

### Updated Type Schema

**Before:**
```typescript
interface AdStrategy {
  productName: string;
  targetAudience: string;
  marketTrendSummary: string;
  posts: AdPost[];
}

interface AdPost {
  content: string;
  hashtags: string[];
  imagePrompt: string;
  videoPrompt: string;
  // ...
}
```

**After:**
```typescript
interface AdStrategy {
  strategySummary: string;      // 2-sentence campaign overview
  targetAudience: string;
  posts: AdPost[];
}

interface AdPost {
  content: string;              // Main tweet (hook, no links)
  replyContent: string;         // Reply tweet with CTA + link
  mediaPrompt: string;          // Unified prompt for any media type
  // ...
}
```

### Key Improvements

1. **Link Hygiene**: Links are now strictly separated into `replyContent` to maximize algorithm reach
2. **Unified Media Prompts**: Single `mediaPrompt` field works for both images and videos
3. **Clearer Strategy**: `strategySummary` provides a concise 2-sentence campaign overview
4. **Native Feel**: Main tweet content is optimized to be engaging and non-intrusive

### System Prompt Highlights

- **Structured Reasoning**: Forces detailed "why" explanations for each post
- **Trend Connections**: Explicitly connects current trends to product features
- **CTR Predictions**: Requires data-backed CTR estimates
- **Visual Specifications**: Demands high-quality, detailed media prompts

### UI Updates

- **AdCard Component**: Now displays main tweet and reply tweet separately
- **Visual Distinction**: Main tweet in slate background, reply in blue to show separation
- **Media Generation**: Uses the unified `mediaPrompt` field

## Migration Notes

If you have existing strategy data, you'll need to:
1. Rename `marketTrendSummary` → `strategySummary`
2. Remove `productName` (derived from URL)
3. Combine `imagePrompt`/`videoPrompt` → `mediaPrompt`
4. Add `replyContent` for each post

## Example Output

```json
{
  "strategySummary": "Leveraging AI productivity trends to position the product as essential for modern workflows. Campaign focuses on authentic user stories rather than hard selling.",
  "targetAudience": "Tech-savvy professionals aged 25-40, productivity enthusiasts",
  "posts": [
    {
      "id": "post_1",
      "scheduledTime": "2025-12-07T10:00:00Z",
      "content": "Nobody talks about the real cost of context switching. Lost 3 hours yesterday just finding where I left off. There has to be a better way.",
      "replyContent": "That's why I switched to [Product]. Cut my context switching time by 70%. Try it free → https://example.com",
      "mediaType": "image",
      "mediaPrompt": "Split-screen comparison: Left side shows cluttered desk with multiple monitors, papers scattered, person looking stressed. Right side shows clean minimalist setup with single focused screen, person smiling. Photorealistic, soft morning light, 8k, professional photography.",
      "predictedCTR": "3.2%",
      "rationale": "This post leverages the trending 'productivity pain points' discussion on X. By leading with a relatable problem rather than a solution, we create authentic engagement. The CTR estimate is based on similar vulnerability-first posts in the SaaS space which averaged 2.8-3.5% in Q4 2025.",
      "status": "draft"
    }
  ]
}
```

## Testing the New System

1. Generate a new strategy with the updated prompt
2. Verify the `replyContent` field contains the link
3. Check that `mediaPrompt` is detailed and specific
4. Confirm `rationale` explains the trend-to-feature connection
5. Test image/video generation with the unified prompt
