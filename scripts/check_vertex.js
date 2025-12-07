const { GoogleAuth } = require("google-auth-library");
const path = require("path");
const fs = require("fs");

async function checkVertexAI() {
  try {
    const keyFilePath = path.join(process.cwd(), "service_account.json");
    if (!fs.existsSync(keyFilePath)) {
      console.error("service_account.json not found");
      return;
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    const projectId = serviceAccount.project_id;
    const location = process.env.VERTEX_AI_LOCATION || "us-central1";
    
    console.log(`Project ID: ${projectId}`);
    
    const auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const token = accessToken.token;

    // 1. List Locations
    console.log("\n--- Checking Locations ---");
    const locEndpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations`;
    const locResp = await fetch(locEndpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (locResp.ok) {
        const locData = await locResp.json();
        console.log("Locations found:", locData.locations?.map(l => l.locationId).join(", "));
    } else {
        console.log("Failed to list locations:", await locResp.text());
    }

    // 2. List Publisher Models in global
    console.log(`\n--- Checking Publisher Models in global ---`);
    const modelEndpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models`;
    
    const modelResp = await fetch(modelEndpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (modelResp.ok) {
        const modelData = await modelResp.json();
        const models = modelData.publisherModels || [];
        console.log(`Found ${models.length} models.`);
        const veoModels = models.filter(m => m.name.toLowerCase().includes("veo"));
        if (veoModels.length > 0) {
            console.log("Veo Models:");
            veoModels.forEach(m => console.log(`- ${m.name} (${m.versionId})`));
        } else {
            console.log("No Veo models found. Listing first 5:");
            models.slice(0, 5).forEach(m => console.log(`- ${m.name}`));
        }
    } else {
        console.log("Failed to list models:", await modelResp.text());
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

checkVertexAI();
