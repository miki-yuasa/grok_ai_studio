# Pulse - Development Guide

## Architecture Overview

### Frontend (Next.js App Router)
- **Page**: `app/page.tsx` - Main dashboard with state management
- **Components**: Modular UI components in `components/dashboard/`
- **State**: React useState for managing strategy and media generation

### Backend (Next.js API Routes)
- **Strategy Generation**: `app/api/generate-strategy/route.ts`
- **Image Generation**: `app/api/generate-image/route.ts`
- **Video Generation**: `app/api/generate-video/route.ts`

### AI Integration
- **Grok Client**: OpenAI SDK with custom base URL
- **Grok Imagine**: Direct HTTP fetch to X.AI endpoint
- **Google Gemini**: Official Google Generative AI SDK

## Key Design Decisions

### 1. Strategy Generation
The strategy agent uses a carefully crafted system prompt that ensures:
- JSON output matching the `AdStrategy` interface
- Detailed reasoning for each post
- CTR predictions based on market analysis
- Native, helpful ad copy

### 2. Image Quality
Always use `quality: "high"` for Grok Imagine API calls to ensure professional-looking ad creatives.

### 3. Error Handling
- Graceful degradation if competitor analysis fails
- Clear error messages for API failures
- Loading states for all async operations

### 4. Type Safety
Full TypeScript coverage with strict interfaces ensures:
- Type-safe API contracts
- Compile-time error checking
- Better IDE autocomplete

## Testing Guide

### Manual Testing Checklist

1. **Strategy Generation**
   - [ ] Basic generation with just URL
   - [ ] Generation with competitor handles
   - [ ] Generation with trend context
   - [ ] Error handling for invalid URLs

2. **Image Generation**
   - [ ] Generate image from prompt
   - [ ] Verify high quality output
   - [ ] Error handling for API failures

3. **Video Generation**
   - [ ] Generate video concept
   - [ ] Review script quality
   - [ ] Error handling

4. **UI/UX**
   - [ ] Responsive design on mobile
   - [ ] Loading states are clear
   - [ ] Error messages are helpful

## Environment Setup

### Required Environment Variables
```env
XAI_API_KEY=xai-...       # From console.x.ai
GOOGLE_API_KEY=...         # From Google AI Studio
```

### Optional Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Extending the Application

### Adding New AI Providers

1. Create utility file in `lib/` (e.g., `lib/anthropic.ts`)
2. Add API route in `app/api/` 
3. Update types in `lib/types.ts`
4. Add UI controls in dashboard components

### Adding New Features

**Example: Export Campaign to X**
1. Add X API integration in `lib/twitter.ts`
2. Create `app/api/post-to-x/route.ts`
3. Add "Post to X" button in `AdCard.tsx`
4. Handle authentication flow

**Example: A/B Testing**
1. Extend `AdPost` interface with variants
2. Update strategy prompt to generate variants
3. Add UI to toggle between variants
4. Track performance metrics

## Performance Optimization

### Current Optimizations
- Server-side API calls reduce client bundle
- Streaming responses for long-running operations (future)
- Image optimization via Next.js Image component

### Future Improvements
- Add caching layer for repeated prompts
- Implement rate limiting for API calls
- Add Redis for session management
- Use Vercel Edge Functions for faster response

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API keys have proper rate limits
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics configured (PostHog, etc.)
- [ ] CORS configured if needed
- [ ] Database setup if adding persistence

## Troubleshooting

### Common Issues

**Issue**: "Failed to generate strategy"
- Check API key is valid
- Verify network connectivity
- Check API rate limits

**Issue**: "Failed to generate image"
- Ensure prompt is descriptive enough
- Check Grok Imagine API status
- Verify API key has image generation access

**Issue**: Type errors in TypeScript
- Run `yarn install` to update types
- Check `tsconfig.json` is properly configured
- Ensure all imports use correct paths

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Resources

- [Grok API Documentation](https://docs.x.ai/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [Google Generative AI SDK](https://ai.google.dev/)
