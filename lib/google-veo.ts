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
    // Skip Gemini enhancement to avoid model availability issues
    // Use the prompt directly
    const concept = prompt;

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
      concept: `FAILED TO GENERATE VIDEO. Original: ${prompt}`,
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
  // Get access token for Vertex AI
  const accessToken = await getVertexAIAccessToken();

  // List of models to try in order of preference
  // Try Veo 2.0, then Veo 1.0 (Preview)
  const models = [
    "veo-2.0-generate-001",
    "veo-2.0-generate-001-preview",
    "veo-001-preview",
    "veo-generate-001",
  ];

  let lastError: Error | null = null;

  for (const modelId of models) {
    try {
      console.log(`Attempting video generation with model: ${modelId}`);

      const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${modelId}:predict`;

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
        console.warn(
          `Model ${modelId} failed: ${response.status} - ${errorText}`
        );

        // If quota exceeded (429) or not found (404), throw to try next model
        if (response.status === 429 || response.status === 404) {
          throw new Error(`${response.status} - ${errorText}`);
        }
        // For other errors, also try next model as it might be model-specific
        throw new Error(
          `Vertex AI API error: ${response.status} - ${errorText}`
        );
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
      lastError = error as Error;
      // Continue to next model
    }
  }

  console.error("All video generation models failed. Last error:", lastError);

  // Fallback to concept display with error details
  return {
    videoUrl: "",
    concept: `VIDEO GENERATION FAILED.\n\nOriginal Prompt: ${prompt}\n\nError: ${
      lastError?.message || "Unknown error"
    }\n\n[Check Vertex AI Quotas in Google Cloud Console]`,
    thumbnailUrl: undefined,
  };
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
