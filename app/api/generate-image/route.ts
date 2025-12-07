import { NextRequest, NextResponse } from "next/server";
import { generateImageWithGrok } from "@/lib/grok";
import { ImageGenerationRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    const { prompt, quality = "high" } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate image using Grok Imagine
    const result = await generateImageWithGrok(prompt, quality);

    return NextResponse.json({
      url: result.url,
      revisedPrompt: result.revisedPrompt,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: (error as Error).message },
      { status: 500 }
    );
  }
}
