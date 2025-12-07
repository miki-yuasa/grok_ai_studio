import { NextRequest, NextResponse } from "next/server";
import { generateVideoWithVeo } from "@/lib/google-veo";
import { VideoGenerationRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  console.log("🎬 [VIDEO API] POST request received");
  try {
    const body: VideoGenerationRequest = await request.json();
    console.log(
      "🎬 [VIDEO API] Request body parsed:",
      JSON.stringify(body, null, 2)
    );
    const { prompt } = body;
    console.log("🎬 [VIDEO API] Extracted prompt:", prompt);

    if (!prompt) {
      console.error("🎬 [VIDEO API] ERROR: Prompt is missing");
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log(
      "🎬 [VIDEO API] Calling generateVideoWithVeo with prompt:",
      prompt
    );
    // Generate video concept using Google Veo
    const result = await generateVideoWithVeo(prompt);
    console.log("🎬 [VIDEO API] generateVideoWithVeo returned:", {
      hasVideoUrl: !!result.videoUrl,
      videoUrlLength: result.videoUrl?.length || 0,
      hasThumbnailUrl: !!result.thumbnailUrl,
      conceptLength: result.concept?.length || 0,
      conceptPreview: result.concept?.substring(0, 100) + "...",
    });

    const response = {
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      concept: result.concept,
    };
    console.log("🎬 [VIDEO API] Sending response:", {
      hasVideoUrl: !!response.videoUrl,
      hasThumbnailUrl: !!response.thumbnailUrl,
      hasConcept: !!response.concept,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("🎬 [VIDEO API] ERROR in POST handler:", error);
    console.error("🎬 [VIDEO API] Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
    });
    return NextResponse.json(
      { error: "Failed to generate video", details: (error as Error).message },
      { status: 500 }
    );
  }
}
