import { NextRequest, NextResponse } from "next/server";
import { postTweet, uploadMedia } from "@/lib/x-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, replyContent, imageUrl, videoUrl } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let mediaIds: string[] | undefined;

    // Upload media if provided
    if (imageUrl) {
      try {
        const mediaId = await uploadMedia(imageUrl, "image");
        mediaIds = [mediaId];
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Continue without media if upload fails
      }
    } else if (videoUrl) {
      try {
        const mediaId = await uploadMedia(videoUrl, "video");
        mediaIds = [mediaId];
      } catch (error) {
        console.error("Failed to upload video:", error);
        // Continue without media if upload fails
      }
    }

    // Post the main tweet
    const mainTweet = await postTweet(content, mediaIds);
    let replyTweetId: string | null = null;

    // Post reply with CTA and link if provided
    if (replyContent) {
      try {
        const reply = await postTweet(replyContent, undefined, mainTweet.id);
        replyTweetId = reply.id;
      } catch (error) {
        console.error("Failed to post reply:", error);
        // Main tweet was posted, but reply failed
      }
    }

    return NextResponse.json({
      success: true,
      mainTweetId: mainTweet.id,
      replyTweetId,
      message: "Tweet posted successfully",
    });
  } catch (error) {
    console.error("Error posting to X:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to post to X. Make sure X API credentials are configured.",
      },
      { status: 500 }
    );
  }
}

