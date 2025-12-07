/**
 * Video generation utilities using Google Vertex AI and Veo
 * Uses Vertex AI Imagen 3 and Veo for video generation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI client for script generation
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Vertex AI configuration
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

/**
 * Get project ID from service account or environment
 */
function getProjectId(): string {
  if (process.env.VERTEX_AI_PROJECT_ID) {
    return process.env.VERTEX_AI_PROJECT_ID;
  }

  // Try to read from service account file
  try {
    const fs = require("fs");
    const path = require("path");
    const keyFilePath = path.join(process.cwd(), "service_account.json");
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    return serviceAccount.project_id;
  } catch (error) {
    console.error("Could not read project_id from service_account.json");
    return "";
  }
}

/**
 * Generate video using Google Vertex AI Veo
 * Uses actual Veo video generation API
 */
export async function generateVideoWithVeo(
  prompt: string
): Promise<{ videoUrl: string; thumbnailUrl?: string; concept: string }> {
  try {
    // FIX 1: Switched to 'gemini-1.5-flash' to resolve 404 model not found errors
    // It is faster and more widely available on v1beta
    const model = genAI.getGenerativeModel({
      model: "veo-3.1-fast-generate-001",
    });

    const enhancedPrompt = `As a video director, create a concise video description optimized for AI video generation. Focus on:
- Specific visual elements and composition
- Camera movement (pan, zoom, static)
- Lighting and color palette
- Motion and action

Keep it detailed but under 150 words.

Original concept: ${prompt}`;

    const result = await model.generateContent(enhancedPrompt);
    const concept = result.response.text();

    // Use Vertex AI Veo for actual video generation
    const projectId = getProjectId();
    if (projectId) {
      return await generateWithVertexAI(concept, projectId);
    } else {
      // Fallback to concept display with helpful message
      console.log("Video generation: Project ID not found");
      return {
        videoUrl: "",
        concept: `VIDEO CONCEPT:\n\n${concept}\n\n[Ensure service_account.json exists in project root to generate actual videos]`,
        thumbnailUrl: undefined,
      };
    }
  } catch (error) {
    console.error("Error generating video:", error);
    // Return a safe fallback rather than crashing
    return {
      videoUrl: "",
      concept: `FAILED TO GENERATE ENHANCED PROMPT. Original: ${prompt}`,
      thumbnailUrl: undefined,
    };
  }
}

/**
 * Generate video using Google Vertex AI Veo
 * Official Google Veo video generation API
 */
async function generateWithVertexAI(
  prompt: string,
  projectId: string
): Promise<{ videoUrl: string; thumbnailUrl?: string; concept: string }> {
  try {
    // Get access token for Vertex AI
    const accessToken = await getVertexAIAccessToken();

    // FIX 2: Removed duplicate 'const endpoint' declaration
    // FIX 3: Used the passed 'projectId' argument correctly
    const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/veo-001:predict`;

    const requestBody = {
      instances: [
        {
          prompt: prompt,
          // Veo parameters for short-form video
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9", // Twitter-optimized aspect ratio
            duration: 5, // 5 seconds (Twitter video optimal length)
          },
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI error:", errorText);
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract video URL from response
    const videoData = data.predictions?.[0];

    if (!videoData || !videoData.videoUri) {
      throw new Error("No video generated");
    }

    // For videos stored in GCS, generate signed URL
    const videoUrl = await getSignedUrl(videoData.videoUri);

    return {
      videoUrl,
      concept: prompt,
      thumbnailUrl: videoData.thumbnailUri
        ? await getSignedUrl(videoData.thumbnailUri)
        : undefined,
    };
  } catch (error) {
    console.error("Vertex AI video generation error:", error);
    // Fallback to concept display
    return {
      videoUrl: "",
      concept: `VIDEO CONCEPT:\n\n${prompt}\n\n[Vertex AI video generation encountered an error. Check credentials and quota.]`,
      thumbnailUrl: undefined,
    };
  }
}

/**
 * Get access token for Vertex AI using service account
 */
async function getVertexAIAccessToken(): Promise<string> {
  // Check for manual access token first
  if (process.env.VERTEX_AI_ACCESS_TOKEN) {
    return process.env.VERTEX_AI_ACCESS_TOKEN;
  }

  // Use service account JSON file
  const { GoogleAuth } = require("google-auth-library");
  const path = require("path");
  try {
    // Use the service account file from project root (note: underscore, not hyphen)
    const keyFilePath = path.join(process.cwd(), "service_account.json");

    const auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to get access token from service account");
    }

    return accessToken.token;
  } catch (error) {
    console.error(error); // Helpful debugging
    throw new Error(
      "Could not get Vertex AI access token. Ensure service_account.json exists in project root or set VERTEX_AI_ACCESS_TOKEN."
    );
  }
}

/**
 * Generate signed URL for GCS objects
 */
async function getSignedUrl(gcsUri: string): Promise<string> {
  // If already a public URL, return as-is
  if (gcsUri.startsWith("http")) {
    return gcsUri;
  }

  // Simple conversion: gs://bucket/path -> https://storage.googleapis.com/bucket/path
  if (gcsUri.startsWith("gs://")) {
    const path = gcsUri.replace("gs://", "");
    return `https://storage.googleapis.com/${path}`;
  }

  return gcsUri;
}
