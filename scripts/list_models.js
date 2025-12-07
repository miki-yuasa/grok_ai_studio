const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local to get the API key
const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
  if (match && match[1]) {
    apiKey = match[1].trim();
    // Remove quotes if present
    if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
      apiKey = apiKey.slice(1, -1);
    }
  }
} catch (err) {
  console.error('Error reading .env.local:', err.message);
  process.exit(1);
}

if (!apiKey) {
  console.error('GOOGLE_API_KEY not found in .env.local');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('API Error:', json.error);
      } else if (json.models) {
        console.log('Available Models:');
        json.models.forEach(model => {
          if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
             console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
          }
        });
      } else {
        console.log('No models found or unexpected format:', json);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
});
