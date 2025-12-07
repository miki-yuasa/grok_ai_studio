# X  Posting Setup Guide

## What's Implemented ✅

1. **Manual Posting**: You can now manually post tweets to X by clicking the "Post to X" button on each ad card
2. **Post Status Tracking**: Posts show their status (draft → generated → posted)
3. **Media Support**: Posts can include images or videos
4. **Reply Threading**: Main tweet + reply with CTA and link are posted as a thread

## ✅ Automatic Scheduling is Now Implemented!

The system can now automatically post at scheduled times! Here's what was added:

### 1. OAuth 1.0a Authentication ✅
OAuth 1.0a is now fully implemented using the `oauth-1.0a` library. The system properly signs all requests to X API.

**Required Environment Variables:**
```env
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
```

**To get these:**
1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Create an app
3. Generate OAuth 1.0a credentials
4. Add them to your `.env` file

### 2. Scheduled Job System ✅
Vercel Cron Jobs are now configured:
- `vercel.json` is set up with cron configuration
- API route `/api/cron/check-scheduled-posts` checks for due posts
- Runs every minute to check for posts due

### 3. Database/Persistence ✅
Posts are now stored server-side:
- JSON-based storage in `data/scheduled-posts.json` (can be upgraded to PostgreSQL/MongoDB)
- Posts are automatically saved when generated/edited
- Database layer in `lib/db.ts` handles all storage operations

## Setup Required

1. **Install dependencies**: `yarn install` (installs `oauth-1.0a`)
2. **Configure environment variables** (see `SCHEDULING_SETUP.md`):
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`
   - `CRON_SECRET`
3. **Deploy to Vercel** (or set up cron job manually for other platforms)

## How It Works Now

1. **Posts are automatically saved** to database when generated/edited
2. **Cron job runs every minute** checking for due posts
3. **Due posts are automatically posted** to X 
4. **Status is updated** to "posted" after successful posting

See `SCHEDULING_SETUP.md` for detailed setup instructions.

## Example: Vercel Cron Setup

If using Vercel, create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-scheduled-posts",
    "schedule": "* * * * *"
  }]
}
```

Then create `app/api/cron/check-scheduled-posts/route.ts` that:
1. Queries database for posts where `scheduledTime <= now()` and `status = "generated"`
2. Posts each one using the X API
3. Updates status to "posted"

