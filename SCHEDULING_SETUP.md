# Automatic Scheduling Setup Guide

## ✅ What's Implemented

1. **OAuth 1.0a Authentication**: Proper OAuth 1.0a signing for X API posting
2. **Database Layer**: Simple JSON-based storage for scheduled posts (can be upgraded to PostgreSQL/MongoDB)
3. **Cron Job**: Vercel Cron job that checks for due posts every minute
4. **Auto-Save**: Posts are automatically saved to database when generated/edited

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

This will install `oauth-1.0a` for proper OAuth 1.0a signing.

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# X API OAuth Credentials (Required for posting)
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret

# Optional: Bearer token for read-only operations
X_API_BEARER_TOKEN=your_bearer_token

# Cron Job Security (Required for Vercel Cron)
CRON_SECRET=your_random_secret_string
```

**To get X API credentials:**
1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Create an app
3. Generate OAuth 1.0a credentials
4. Add them to your `.env.local` file

### 3. Vercel Deployment

If deploying to Vercel:

1. **Add Environment Variables** in Vercel dashboard:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`
   - `CRON_SECRET` (generate a random string)

2. **Enable Cron Jobs**:
   - The `vercel.json` file is already configured
   - Vercel will automatically detect and enable the cron job
   - The cron runs every minute (`* * * * *`)

3. **Test the Cron Job**:
   - You can manually trigger it: `GET /api/cron/check-scheduled-posts`
   - Include header: `Authorization: Bearer YOUR_CRON_SECRET`

### 4. Local Development

For local development, you can manually trigger the cron job:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-scheduled-posts
```

Or create a simple script to run it periodically.

## 📊 How It Works

1. **Post Generation**: When a strategy is generated, all posts are saved to `data/scheduled-posts.json`

2. **Post Editing**: When you edit a post, it's automatically saved to the database

3. **Scheduled Posting**: Every minute, the cron job:
   - Checks for posts where `scheduledTime <= now()` and `status !== "posted"`
   - Posts each one to X (Twitter)
   - Updates status to "posted"

4. **Manual Posting**: You can still manually post using the "Post to X" button, which also updates the database

## 🔄 Upgrading to a Real Database

The current implementation uses JSON file storage. For production, you should use a proper database:

### Option 1: PostgreSQL with Prisma

1. Install Prisma:
```bash
yarn add prisma @prisma/client
yarn prisma init
```

2. Create schema in `prisma/schema.prisma`:
```prisma
model ScheduledPost {
  id            String   @id
  scheduledTime DateTime
  content       String
  replyContent  String?
  imageUrl      String?
  videoUrl      String?
  status        String
  createdAt     DateTime @default(now())
  postedAt      DateTime?
  // ... other fields
}
```

3. Update `lib/db.ts` to use Prisma instead of JSON files

### Option 2: MongoDB

1. Install MongoDB driver:
```bash
yarn add mongodb
```

2. Update `lib/db.ts` to use MongoDB

## 🧪 Testing

1. **Test OAuth**: Try manually posting a tweet using the "Post to X" button
2. **Test Scheduling**: 
   - Create a post with `scheduledTime` set to 1 minute in the future
   - Wait 1 minute
   - Check if it was automatically posted
3. **Test Cron**: Manually call the cron endpoint and verify it processes due posts

## 📝 Notes

- The cron job runs every minute. For more frequent checks, you'd need a different solution (e.g., a background worker)
- Posts are stored in `data/scheduled-posts.json` (gitignored)
- The cron job requires `CRON_SECRET` for security
- Media uploads use OAuth 1.0a for authentication

