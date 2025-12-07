# Video Generation Setup for Hackathon Demo

## Quick Setup with Vertex AI (Since You Have Access)

### Prerequisites
- ✅ Google Cloud Project with Vertex AI enabled
- ✅ Veo model access in your project
- ✅ Service account with Vertex AI permissions

### Option 1: Using Service Account (Recommended for Demo)

1. **Create/Download Service Account Key**
   ```bash
   # If you don't have one, create it:
   gcloud iam service-accounts create pulse-veo-demo \
     --display-name="Pulse Veo Demo Service Account"
   
   # Grant Vertex AI permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:pulse-veo-demo@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   # Download key
   gcloud iam service-accounts keys create ~/pulse-veo-key.json \
     --iam-account=pulse-veo-demo@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Configure `.env.local`**
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   VERTEX_AI_PROJECT_ID=your-project-id
   VERTEX_AI_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/pulse-veo-key.json
   ```

3. **Done!** Videos will generate using actual Veo API

### Option 2: Using gcloud CLI (Quickest for Local Demo)

If you're already authenticated with gcloud:

1. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Configure `.env.local`** (minimal setup)
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   VERTEX_AI_PROJECT_ID=your-project-id
   VERTEX_AI_LOCATION=us-central1
   # No GOOGLE_APPLICATION_CREDENTIALS needed!
   ```

3. **Done!** The app will use your gcloud credentials automatically

### What Videos Look Like

**With Replicate:**
- Real 3-5 second video clips
- Generated from text descriptions
- Takes ~10-30 seconds to generate
- Shows in the UI as playable video

**Without Replicate:**
- Detailed video concept/script
- Shows what the video would contain
- Instant (no generation wait)
- Perfect for quick demos

## Demo Tips

### For Judges:
1. **Show the concept first**: Even without video generation, the detailed concepts demonstrate AI reasoning
2. **Highlight the prompt engineering**: The video concepts are highly specific and actionable
3. **Explain the pipeline**: Show how Grok → Gemini → Video works together

### Quick Demo Flow:
1. Enter product URL
2. Generate strategy (auto-discovers competitors and trends)
3. Show generated posts with CTR predictions
4. Click "Generate video" on a post
5. While waiting, discuss the strategy rationale
6. Video appears in ~30 seconds

## Troubleshooting

### "Video generation failed"
- Check REPLICATE_API_TOKEN is correct
- Verify you have credits remaining
- Fall back to showing concept only

### Slow generation
- Videos take 10-30 seconds (this is normal)
- Consider pre-generating 1-2 videos before demo
- Or demo with images first, videos second

## Cost Estimates

**Replicate Free Tier:**
- $5 free credits
- ~$0.01-0.05 per video
- Enough for 100+ videos in demo

**For Production:**
- Consider caching generated videos
- Use CDN for video hosting
- Implement request queuing

## Alternative: Pre-generate Demo Videos

For a flawless demo, pre-generate a few videos:

```bash
# Generate 3 sample campaigns beforehand
yarn dev
# Use the UI to generate strategies
# Click "Generate video" on best posts
# Keep browser open until videos load
```

Then during demo, you can either:
- Show pre-generated videos instantly
- Generate new ones to show real-time capability

## Production Considerations

For post-hackathon:
- Integrate Google Veo (requires Vertex AI setup)
- Add video caching/storage
- Implement job queue for async generation
- Consider Runway, Stability AI, or other providers
