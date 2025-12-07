import { NextRequest, NextResponse } from "next/server";
import { getDuePosts, updatePostStatus } from "@/lib/db";
import { postTweet, uploadMedia } from "@/lib/x-api";

/**
 * Vercel Cron Job endpoint
 * Runs every minute to check for scheduled posts that are due
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-scheduled-posts",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify this is a cron request (Vercel adds a header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const duePosts = await getDuePosts();
    
    if (duePosts.length === 0) {
      return NextResponse.json({
        message: "No posts due to be posted",
        checked: new Date().toISOString(),
      });
    }

    const results = [];

    for (const post of duePosts) {
      try {
        let mediaIds: string[] | undefined;

        // Upload media if provided
        if (post.imageUrl) {
          try {
            const mediaId = await uploadMedia(post.imageUrl, "image");
            mediaIds = [mediaId];
          } catch (error) {
            console.error(`Failed to upload image for post ${post.id}:`, error);
            // Continue without media if upload fails
          }
        } else if (post.videoUrl) {
          try {
            const mediaId = await uploadMedia(post.videoUrl, "video");
            mediaIds = [mediaId];
          } catch (error) {
            console.error(`Failed to upload video for post ${post.id}:`, error);
            // Continue without media if upload fails
          }
        }

        // Post the main tweet
        const mainTweet = await postTweet(post.content, mediaIds);
        let replyTweetId: string | null = null;

        // Post reply with CTA and link if provided
        if (post.replyContent) {
          try {
            const reply = await postTweet(post.replyContent, undefined, mainTweet.id);
            replyTweetId = reply.id;
          } catch (error) {
            console.error(`Failed to post reply for post ${post.id}:`, error);
            // Main tweet was posted, but reply failed
          }
        }

        // Update post status to "posted"
        await updatePostStatus(post.id, "posted", new Date().toISOString());

        results.push({
          postId: post.id,
          success: true,
          mainTweetId: mainTweet.id,
          replyTweetId,
        });
      } catch (error) {
        console.error(`Failed to post ${post.id}:`, error);
        results.push({
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${duePosts.length} posts`,
      results,
      checked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

