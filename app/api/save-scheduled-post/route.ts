import { NextRequest, NextResponse } from "next/server";
import { saveScheduledPost } from "@/lib/db";
import { AdPost } from "@/lib/types";

/**
 * Save a scheduled post to the database
 * Called when user generates a strategy or edits a post
 */
export async function POST(request: NextRequest) {
  try {
    const body: AdPost & { strategyId?: string } = await request.json();

    // Validate required fields
    if (!body.id || !body.content || !body.scheduledTime) {
      return NextResponse.json(
        { error: "Missing required fields: id, content, scheduledTime" },
        { status: 400 }
      );
    }

    const scheduledPost = {
      ...body,
      createdAt: new Date().toISOString(),
    };

    await saveScheduledPost(scheduledPost);

    return NextResponse.json({
      success: true,
      message: "Post saved successfully",
    });
  } catch (error) {
    console.error("Error saving scheduled post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save post",
      },
      { status: 500 }
    );
  }
}

