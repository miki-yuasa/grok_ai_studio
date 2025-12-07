import { NextRequest, NextResponse } from 'next/server';
import { generateVideoWithVeo } from '@/lib/google-veo';
import { VideoGenerationRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate video concept using Google Veo
    const result = await generateVideoWithVeo(prompt);

    return NextResponse.json({
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      concept: result.concept,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: 'Failed to generate video', details: (error as Error).message },
      { status: 500 }
    );
  }
}
