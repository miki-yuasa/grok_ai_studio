/**
 * Video generation utilities using Runway API and Google Gemini
 * Primary: Runway API (veo3.1_fast)
 * Fallback: Google Vertex AI Veo (if Runway fails)
 */

// Runway API key
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || "key_73a171aa9552b7cc44362f4f3edc38ce39e5149a613686ec6aa309afd6f04aee373fd359fd17eae9c61a4826d2350fbfd4784e1776be4a1cd02e1aec0445b2db";

// Google AI Studio API key (for Gemini prompt enhancement)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Vertex AI configuration (fallback)
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Log environment configuration at module load
console.log("⚙️ [VIDEO CONFIG] Environment variables check:");
console.log("⚙️ [VIDEO CONFIG] RUNWAY_API_KEY:", RUNWAY_API_KEY ? "SET" : "NOT SET");
console.log("⚙️ [VIDEO CONFIG] GOOGLE_API_KEY:", GOOGLE_API_KEY ? "SET" : "NOT SET");
console.log("⚙️ [VIDEO CONFIG] VERTEX_AI_PROJECT_ID:", process.env.VERTEX_AI_PROJECT_ID || "NOT SET");

/**
 * Get project ID from service account or environment (for Vertex AI fallback)
 */
function getProjectId(): string {
  if (process.env.VERTEX_AI_PROJECT_ID) {
    return process.env.VERTEX_AI_PROJECT_ID;
  }

  try {
    const fs = require("fs");
    const path = require("path");
    const keyFilePath = path.join(process.cwd(), "service_account.json");
    
    if (!fs.existsSync(keyFilePath)) {
      return "";
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    return serviceAccount.project_id || "";
  } catch (error) {
    console.error("🔑 [PROJECT ID] ERROR:", error);
    return "";
  }
}

/**
 * Enhance prompt with Gemini
 */
async function enhancePromptWithGemini(prompt: string): Promise<string> {
  const enhancedPrompt = `As a video director, create a concise video description optimized for AI video generation. Focus on:
- Specific visual elements and composition
- Camera movement (pan, zoom, static)
- Lighting and color palette
- Motion and action

Keep it detailed but under 150 words.

Original concept: ${prompt}`;

  if (GOOGLE_API_KEY) {
    const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    
    for (const modelName of geminiModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_API_KEY}`;
        console.log(`🎨 [GEMINI] Trying ${modelName} via Google AI Studio...`);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }]
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const concept = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (concept) {
            console.log(`🎨 [GEMINI] ✅ Enhanced prompt from ${modelName}, length: ${concept.length}`);
            return concept;
          }
        }
      } catch (error) {
        console.log(`🎨 [GEMINI] ${modelName} failed:`, (error as Error).message);
        continue;
      }
    }
  }

  console.log("🎨 [GEMINI] All attempts failed, using original prompt");
  return prompt;
}

/**
 * Generate video using Runway API (primary method)
 */
async function generateWithRunway(
  prompt: string
): Promise<{ videoUrl: string; thumbnailUrl?: string; concept: string }> {
  console.log("🎬 [RUNWAY] Starting generateWithRunway");
  console.log("🎬 [RUNWAY] Prompt:", prompt.substring(0, 100) + "...");
  
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY not set");
  }

  try {
    const endpoint = "https://api.dev.runwayml.com/v1/text_to_video";
    
    // Runway API requires:
    // - promptText (camelCase, not snake_case)
    // - duration must be 4, 6, or 8 seconds
    // - ratio format like "1280:720"
    // - promptText must be <= 1000 characters
    const truncatedPrompt = prompt.length > 1000 
      ? prompt.substring(0, 997) + "..." 
      : prompt;
    
    if (prompt.length > 1000) {
      console.log(`🎬 [RUNWAY] Warning: Prompt truncated from ${prompt.length} to 1000 characters`);
    }
    
    const requestBody = {
      model: "veo3.1_fast",
      promptText: truncatedPrompt,  // camelCase! Max 1000 chars
      duration: 4,         // Must be 4, 6, or 8 (using 4 to save credits)
      ratio: "1280:720",   // 16:9 aspect ratio
    };

    console.log("🎬 [RUNWAY] Request body:", JSON.stringify(requestBody, null, 2));
    console.log("🎬 [RUNWAY] Calling Runway API...");
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`🎬 [RUNWAY] Response status: ${response.status}`);
    console.log(`🎬 [RUNWAY] Response preview: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log("🎬 [RUNWAY] Response data:", JSON.stringify(data, null, 2));
    
    // Get task ID
    const taskId = data.id || data.task_id;
    if (!taskId) {
      throw new Error(`No task ID in Runway response: ${JSON.stringify(data)}`);
    }
    
    console.log(`🎬 [RUNWAY] Task created: ${taskId}, polling for completion...`);
    
    // Poll task status until complete
    const maxAttempts = 60; // Max 5 minutes
    const pollInterval = 5000; // 5 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusEndpoint = `https://api.dev.runwayml.com/v1/tasks/${taskId}`;
      const statusResponse = await fetch(statusEndpoint, {
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06",
        },
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Failed to check task status: ${statusResponse.status} - ${errorText}`);
      }
      
      const taskData = await statusResponse.json();
      console.log(`🎬 [RUNWAY] Task status (attempt ${attempt + 1}): ${taskData.status}`);
      
      if (taskData.status === "SUCCEEDED" || taskData.status === "COMPLETED") {
        const videoUrl = taskData.output?.video_url || 
                        taskData.output?.videoUrl || 
                        taskData.output?.[0] ||
                        taskData.video_url ||
                        taskData.videoUrl;
        
        if (videoUrl) {
          console.log("🎬 [RUNWAY] ✅ Video generated successfully!");
          return {
            videoUrl,
            concept: prompt,
            thumbnailUrl: taskData.output?.thumbnail_url || taskData.thumbnail_url,
          };
        }
      }
      
      if (taskData.status === "FAILED" || taskData.status === "ERROR") {
        throw new Error(`Task failed: ${taskData.error || JSON.stringify(taskData)}`);
      }
    }
    
    throw new Error(`Task polling timeout. Task ID: ${taskId}`);
  } catch (error) {
    console.error("🎬 [RUNWAY] ERROR:", error);
    throw error;
  }
}

/**
 * Main video generation function
 */
export async function generateVideoWithVeo(
  prompt: string
): Promise<{ videoUrl: string; thumbnailUrl?: string; concept: string }> {
  console.log("🎥 [GENERATE VIDEO] Starting generateVideoWithVeo");
  console.log("🎥 [GENERATE VIDEO] Input prompt:", prompt);
  
  try {
    // Enhance prompt with Gemini first
    console.log("🎥 [GENERATE VIDEO] Enhancing prompt with Gemini...");
    const enhancedPrompt = await enhancePromptWithGemini(prompt);
    
    // Try Runway first (primary method)
    if (RUNWAY_API_KEY) {
      console.log("🎥 [GENERATE VIDEO] Trying Runway API...");
      try {
        return await generateWithRunway(enhancedPrompt);
      } catch (error) {
        console.log("🎥 [GENERATE VIDEO] Runway failed, falling back to Vertex AI:", (error as Error).message);
      }
    }

    // Fallback to Vertex AI Veo
    const projectId = getProjectId();
    if (!projectId) {
      throw new Error("No video generation method available. Set RUNWAY_API_KEY or Vertex AI credentials.");
    }

    console.log("🎥 [GENERATE VIDEO] Using Vertex AI Veo (fallback)...");
    return await generateWithVertexAI(enhancedPrompt, projectId);
    
  } catch (error) {
    console.error("🎥 [GENERATE VIDEO] ERROR:", error);
    const errorMessage = (error as Error).message || "Unknown error";
    return {
      videoUrl: "",
      concept: `❌ FAILED TO GENERATE VIDEO\n\nError: ${errorMessage}\n\nOriginal prompt: ${prompt}`,
      thumbnailUrl: undefined,
    };
  }
}

/**
 * Generate video using Google Vertex AI Veo (fallback method)
 */
async function generateWithVertexAI(
  prompt: string,
  projectId: string
): Promise<{ videoUrl: string; thumbnailUrl?: string; concept: string }> {
  console.log("🚀 [VERTEX AI] Starting generateWithVertexAI");
  
  try {
    const accessToken = await getVertexAIAccessToken();
    
    if (VERTEX_AI_LOCATION === "global" || !VERTEX_AI_LOCATION) {
      throw new Error(`Invalid VERTEX_AI_LOCATION: ${VERTEX_AI_LOCATION}`);
    }
    
    const veoModels = [
      "veo-001-preview-0815",
      "veo-3.1-generate-preview",
      "veo-2.0-generate-001",
      "veo-3.0-generate-001",
    ];
    
    const requestBody = {
      instances: [{
        prompt: prompt,
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          duration: 5,
        },
      }],
    };

    let lastError: Error | null = null;
    let quotaErrors: string[] = [];
    
    for (const modelName of veoModels) {
      const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${modelName}:predict`;
      console.log(`🚀 [VERTEX AI] Trying model: ${modelName}`);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`🚀 [VERTEX AI] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          
          try {
            const errorData = JSON.parse(errorText);
            const errorMessage = errorData.error?.message || errorText;
            
            if (response.status === 404) {
              lastError = new Error(`Model ${modelName} not found`);
              continue;
            }
            
            if (response.status === 429 || errorMessage.includes("quota")) {
              console.log(`🚀 [VERTEX AI] QUOTA ERROR: ${errorMessage}`);
              quotaErrors.push(`${modelName}: Quota exceeded`);
              lastError = new Error(`Quota exceeded for ${modelName}`);
              continue;
            }
            
            throw new Error(errorMessage);
          } catch (e) {
            if (response.status === 404) continue;
            if (response.status === 429) {
              quotaErrors.push(`${modelName}: Quota exceeded`);
              continue;
            }
            throw new Error(errorText);
          }
        }

        const data = await response.json();
        const videoData = data.predictions?.[0];

        if (!videoData?.videoUri) {
          throw new Error("No video generated");
        }

        const videoUrl = await getSignedUrl(videoData.videoUri);
        const thumbnailUrl = videoData.thumbnailUri ? await getSignedUrl(videoData.thumbnailUri) : undefined;

        console.log(`🚀 [VERTEX AI] ✅ Success with ${modelName}!`);
        return {
          videoUrl,
          concept: prompt,
          thumbnailUrl,
        };
      } catch (error) {
        if ((error as Error).message.includes("404") || (error as Error).message.includes("not found")) {
          lastError = error as Error;
          continue;
        }
        throw error;
      }
    }
    
    if (quotaErrors.length === veoModels.length) {
      return {
        videoUrl: "",
        concept: `⚠️ QUOTA LIMIT REACHED\n\nAll Veo models hit quota limits.\n\n📋 VIDEO CONCEPT:\n\n${prompt}`,
        thumbnailUrl: undefined,
      };
    }
    
    throw lastError || new Error("All Veo models failed");
  } catch (error) {
    console.error("🚀 [VERTEX AI] ERROR:", error);
    return {
      videoUrl: "",
      concept: `Vertex AI error: ${(error as Error).message}\n\nVIDEO CONCEPT:\n\n${prompt}`,
      thumbnailUrl: undefined,
    };
  }
}

/**
 * Get access token for Vertex AI using service account
 */
async function getVertexAIAccessToken(): Promise<string> {
  if (process.env.VERTEX_AI_ACCESS_TOKEN) {
    return process.env.VERTEX_AI_ACCESS_TOKEN;
  }

  const { GoogleAuth } = require("google-auth-library");
  const path = require("path");
  const fs = require("fs");
  
  try {
    const keyFilePath = path.join(process.cwd(), "service_account.json");
    
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account file not found at ${keyFilePath}`);
    }

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
    console.error("🔐 [ACCESS TOKEN] ERROR:", error);
    throw new Error(
      "Could not get Vertex AI access token. Ensure service_account.json exists or set VERTEX_AI_ACCESS_TOKEN."
    );
  }
}

/**
 * Generate signed URL for GCS objects
 */
async function getSignedUrl(gcsUri: string): Promise<string> {
  if (gcsUri.startsWith("http")) {
    return gcsUri;
  }

  if (gcsUri.startsWith("gs://")) {
    const path = gcsUri.replace("gs://", "");
    return `https://storage.googleapis.com/${path}`;
  }

  return gcsUri;
}
