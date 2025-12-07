#!/usr/bin/env tsx

/**
 * Local Scheduler for Development
 * 
 * This script runs continuously and checks for scheduled posts that are due.
 * When a post's scheduledTime is reached, it automatically posts to X.
 * 
 * Usage:
 *   npm run scheduler
 * 
 * Features:
 * - Checks every 10 seconds for due posts
 * - Posts automatically when time is reached
 * - Logs all activity to console
 * - Simulates Vercel cron job behavior locally
 */

import { getDuePosts, updatePostStatus } from "../lib/db";
import { postTweet, uploadMedia } from "../lib/x-api";

const CHECK_INTERVAL = 10000; // Check every 10 seconds
let isChecking = false;

async function checkAndPostScheduledPosts() {
  // Prevent overlapping checks
  if (isChecking) {
    console.log("⏳ Previous check still running, skipping...");
    return;
  }

  isChecking = true;
  const now = new Date();
  
  try {
    console.log(`\n🔍 [${now.toLocaleTimeString()}] Checking for scheduled posts...`);
    
    const duePosts = await getDuePosts();
    
    if (duePosts.length === 0) {
      console.log("✅ No posts due at this time");
      isChecking = false;
      return;
    }

    console.log(`📝 Found ${duePosts.length} post(s) ready to be posted!`);

    for (const post of duePosts) {
      try {
        console.log(`\n📤 Posting: "${post.content.substring(0, 50)}..."`);
        console.log(`   Scheduled for: ${new Date(post.scheduledTime).toLocaleString()}`);

        let mediaIds: string[] | undefined;

        // Upload media if provided
        if (post.imageUrl) {
          try {
            console.log("   🖼️  Uploading image...");
            const mediaId = await uploadMedia(post.imageUrl, "image");
            mediaIds = [mediaId];
            console.log("   ✅ Image uploaded");
          } catch (error) {
            console.error("   ⚠️  Failed to upload image:", error);
            // Continue without media if upload fails
          }
        } else if (post.videoUrl) {
          try {
            console.log("   🎥 Uploading video...");
            const mediaId = await uploadMedia(post.videoUrl, "video");
            mediaIds = [mediaId];
            console.log("   ✅ Video uploaded");
          } catch (error) {
            console.error("   ⚠️  Failed to upload video:", error);
            // Continue without media if upload fails
          }
        }

        // Post the main tweet
        console.log("   📨 Posting main tweet...");
        const mainTweet = await postTweet(post.content, mediaIds);
        console.log(`   ✅ Main tweet posted! ID: ${mainTweet.id}`);

        // Post reply with CTA and link if provided
        if (post.replyContent) {
          try {
            console.log("   💬 Posting reply with CTA...");
            const reply = await postTweet(post.replyContent, undefined, mainTweet.id);
            console.log(`   ✅ Reply posted! ID: ${reply.id}`);
          } catch (error) {
            console.error("   ⚠️  Failed to post reply:", error);
            // Main tweet was posted, but reply failed
          }
        }

        // Update post status to "posted"
        await updatePostStatus(post.id, "posted", now.toISOString());
        console.log(`   ✨ Post ${post.id} marked as posted!`);

      } catch (error) {
        console.error(`   ❌ Failed to post ${post.id}:`, error);
        if (error instanceof Error) {
          console.error(`   Error details: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ [${new Date().toLocaleTimeString()}] Finished processing ${duePosts.length} post(s)`);

  } catch (error) {
    console.error("❌ Error in scheduler:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  } finally {
    isChecking = false;
  }
}

// Start the scheduler
console.log("🚀 Local Post Scheduler Started!");
console.log(`⏰ Checking for scheduled posts every ${CHECK_INTERVAL / 1000} seconds`);
console.log("📍 Press Ctrl+C to stop\n");

// Run immediately on start
checkAndPostScheduledPosts();

// Then run at intervals
setInterval(checkAndPostScheduledPosts, CHECK_INTERVAL);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Scheduler stopped. Goodbye!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Scheduler stopped. Goodbye!");
  process.exit(0);
});

