const { GoogleAuth } = require("google-auth-library");
const path = require("path");
const fs = require("fs");

async function listPublisherModels() {
  try {
    // Get project ID and location
    const keyFilePath = path.join(process.cwd(), "service_account.json");
    if (!fs.existsSync(keyFilePath)) {
      console.error("service_account.json not found");
      return;
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    const projectId = serviceAccount.project_id;
    const location = process.env.VERTEX_AI_LOCATION || "us-central1";
    
    console.log(`Project ID: ${projectId}`);
    console.log(`Location: ${location}`);

    const auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const token = accessToken.token;

    // List publisher models
    // https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.publishers.models/list
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
    
    console.log(`Fetching models from: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    
    if (data.publisherModels) {
      console.log("\nFound Publisher Models:");
      const videoModels = data.publisherModels.filter(m => 
        m.name.includes("veo") || 
        m.name.includes("video") || 
        (m.predictSchemata && JSON.stringify(m.predictSchemata).includes("video"))
      );
      
      if (videoModels.length > 0) {
        videoModels.forEach(model => {
          console.log(`- Name: ${model.name}`);
          console.log(`  Resource Name: ${model.resourceName || model.name}`);
          console.log(`  Version: ${model.versionId}`);
        });
      } else {
        console.log("No video/veo models found in the filtered list. Listing first 10 models:");
        data.publisherModels.slice(0, 10).forEach(model => {
             console.log(`- ${model.name}`);
        });
      }
    } else {
      console.log("No publisher models found.");
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.cause) console.error(error.cause);
  }
}

listPublisherModels();
