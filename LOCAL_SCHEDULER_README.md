# Local Post Scheduler

A background process that automatically posts scheduled tweets when their scheduled time is reached. This simulates Vercel's cron job behavior but runs locally during development.

## Setup

1. **Install dependencies** (includes `tsx` for running TypeScript):
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Make sure your X API credentials are configured** in `.env.local`:
   ```
   X_API_KEY=your_api_key
   X_API_SECRET=your_api_secret
   X_ACCESS_TOKEN=your_access_token
   X_ACCESS_TOKEN_SECRET=your_access_token_secret
   ```

## Usage

### Start the Scheduler

Open a **separate terminal** and run:

```bash
npm run scheduler
```

You should see:
```
🚀 Local Post Scheduler Started!
⏰ Checking for scheduled posts every 10 seconds
📍 Press Ctrl+C to stop
```

### What It Does

- ✅ Checks every **10 seconds** for posts that are due
- ✅ Automatically posts when `scheduledTime <= now`
- ✅ Uploads media (images/videos) before posting
- ✅ Posts reply with CTA as a threaded reply
- ✅ Updates post status to "posted" in database
- ✅ Logs all activity to console

### Testing Workflow

1. **Terminal 1**: Run your Next.js dev server
   ```bash
   npm run dev
   ```

2. **Terminal 2**: Run the local scheduler
   ```bash
   npm run scheduler
   ```

3. **Browser**: Generate a campaign with scheduling details like:
   - "10 minute campaign starting at 8:39pm on 12/17/2025"
   - "5 minute campaign starting NOW"

4. **Watch Terminal 2**: You'll see the scheduler automatically post tweets when their scheduled time arrives!

### Example Output

```
🔍 [8:39:00 PM] Checking for scheduled posts...
📝 Found 3 post(s) ready to be posted!

📤 Posting: "🚀 Breaking: New AI breakthrough changes everyth..."
   Scheduled for: 12/17/2025, 8:39:00 PM
   🖼️  Uploading image...
   ✅ Image uploaded
   📨 Posting main tweet...
   ✅ Main tweet posted! ID: 1734567890123456789
   💬 Posting reply with CTA...
   ✅ Reply posted! ID: 1734567890123456790
   ✨ Post post_1 marked as posted!

✅ [8:39:15 PM] Finished processing 3 post(s)
```

## Features

- **Prevents Overlapping**: Won't start a new check if previous one is still running
- **Error Handling**: Continues processing other posts if one fails
- **Graceful Shutdown**: Press Ctrl+C to stop cleanly
- **Detailed Logging**: See exactly what's happening with each post

## Troubleshooting

### "No posts due at this time"
- Check that you've saved posts to the database (they should appear in your UI)
- Verify the scheduled times are in the past or very close to now

### "X API OAuth credentials not configured"
- Make sure all 4 X API environment variables are set in `.env.local`
- Restart the scheduler after adding credentials

### Posts not appearing
- Make sure you're running `npm run dev` and have generated a campaign
- Check `data/scheduled-posts.json` to see if posts are saved

## Notes

- This scheduler runs **independently** from your Next.js app
- It directly reads from `data/scheduled-posts.json` (same as the cron job)
- Posts made by the scheduler will appear on X immediately
- The scheduler needs to be running continuously for automatic posting
- In production, Vercel cron jobs handle this automatically

